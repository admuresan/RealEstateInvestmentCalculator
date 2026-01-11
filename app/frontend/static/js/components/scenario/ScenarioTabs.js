/**
 * Scenario tabs component for managing multiple input scenarios.
 */
import { InputSidebar } from '../sidebar/InputSidebar.js';
import { CopyScenarioModal } from '../CopyScenarioModal.js';

export class ScenarioTabs {
    constructor(parent) {
        this.parent = parent;
        this.tabs = [];
        this.activeTabIndex = 0;
        this.copyModal = new CopyScenarioModal();
        this.onScenarioChangeCallback = null;
        this.onScenariosLoadedCallback = null;
        this.onScenarioDeletedCallback = null;
        this.isLoading = true; // Start with loading flag true to prevent saves during initialization
        this.loadingStartTime = null;
        
        this.container = document.createElement('div');
        this.container.className = 'scenario-tabs-container';
        
        // Create shared InputSidebar header
        this.createSharedHeader();
        
        // Create tabs header (below the shared header)
        this.createTabsHeader();
        
        // Create tabs content area
        this.tabsContent = document.createElement('div');
        this.tabsContent.className = 'scenario-tabs-content';
        this.tabsContent.style.cssText = `
            flex: 1;
            overflow: hidden;
            position: relative;
        `;
        this.container.appendChild(this.tabsContent);
        
        parent.appendChild(this.container);
        
        // Load sidebar collapse state
        requestAnimationFrame(() => {
            this.loadSidebarCollapseState();
        });
        
        // Load scenarios - this will create all tabs (don't create initial tab here to avoid overwriting saved count)
        requestAnimationFrame(() => {
            this.loadScenarios();
        });
    }

    getDefaultInputValues() {
        // Return default values for a new scenario - realistic estimates for a typical investment property
        return new Map([
            ['purchase_price', 400000],           // $400k property
            ['downpayment_percentage', 20],       // 20% down payment
            ['interest_rate', 5.5],               // 5.5% mortgage rate
            ['loan_years', 30],                   // 30-year mortgage
            ['maintenance_base', 300],            // $300/month maintenance
            ['maintenance_increase', 3],          // 3% annual increase
            ['property_tax_base', 4800],          // $4,800/year property tax (1.2% of value)
            ['property_tax_increase', 2.5],       // 2.5% annual increase
            ['insurance', 1800],                  // $1,800/year insurance
            ['utilities', 200],                   // $200/month utilities
            ['repairs', 3000],                    // $3,000/year repairs
            ['rental_income_base', 2500],         // $2,500/month rental income
            ['rental_increase', 3],               // 3% annual increase
            ['marginal_tax_rate', 30],            // 30% marginal tax rate
            ['expected_return_rate', 7],          // 7% expected return on alternative investments
            ['real_estate_market_increase', 3.5], // 3.5% annual property value appreciation
            ['commission_percentage', 5]          // 5% commission on sale
        ]);
    }

    loadScenarios() {
        // Set loading flag to prevent saving during load
        this.isLoading = true;
        this.loadingStartTime = Date.now();
        
        try {
            // Check if there are any saved scenarios
            const savedScenarioCount = localStorage.getItem('calculator_scenario_count');
            const hasSavedData = savedScenarioCount !== null;
            
            let scenarioCount = 1;
            let activeIndex = 0;
            let shouldCreateDefaults = false;
            
            if (hasSavedData) {
                // Load scenario count
                scenarioCount = parseInt(savedScenarioCount, 10) || 1;
                
                // Load active scenario index
                const savedActiveIndex = localStorage.getItem('calculator_active_scenario');
                activeIndex = savedActiveIndex ? parseInt(savedActiveIndex, 10) : 0;
            } else {
                // No saved data - create default scenario with standard values
                shouldCreateDefaults = true;
                scenarioCount = 1;
                activeIndex = 0;
            }
            
            // No need to remove initial tab - we don't create one in constructor anymore
            
            // Load inputs for first scenario (but don't set values yet)
            const scenarioKey0 = `calculator_inputs_scenario_0`;
            const savedInputs0 = localStorage.getItem(scenarioKey0);
            let defaultValues = null;
            let savedInputs0Parsed = null;
            
            if (shouldCreateDefaults) {
                // Use default values for first scenario
                defaultValues = this.getDefaultInputValues();
            } else if (savedInputs0) {
                try {
                    savedInputs0Parsed = JSON.parse(savedInputs0);
                } catch (e) {
                    console.warn(`Failed to parse inputs for scenario 0:`, e);
                    // If parsing fails, use defaults
                    defaultValues = this.getDefaultInputValues();
                }
            }
            
            // Create all tabs from saved data (including first one)
            for (let i = 0; i < scenarioCount; i++) {
                if (i === 0 && defaultValues && !hasSavedData) {
                    // Create first tab with default values (only if no saved data)
                    this.addTab('Scenario 1', defaultValues);
                } else {
                    // Create tab without values (will be set later)
                    this.addTab(`Scenario ${i + 1}`, null);
                }
            }
            
            // Notify that scenarios are loaded BEFORE setting values
            // This ensures display tabs are created before calculations are triggered
            setTimeout(() => {
                // Update delete button visibility after all scenarios are loaded
                this.updateDeleteButtonsVisibility();
                
                if (activeIndex >= 0 && activeIndex < this.tabs.length) {
                    this.setActiveTab(activeIndex);
                }
                // Notify that scenarios are loaded - this will create display tabs
                if (this.onScenariosLoadedCallback) {
                    this.onScenariosLoadedCallback();
                }
                
                // Now set values AFTER display tabs are created
                setTimeout(() => {
                    // Set values for first scenario (if not already set with defaults)
                    const tab0 = this.tabs[0];
                    if (tab0 && tab0.inputSidebar) {
                        if (defaultValues && !hasSavedData) {
                            // Default values were already set when creating the tab
                            // Enable saving and save to ensure it's persisted
                            this.isLoading = false;
                            this.saveScenarios();
                            this.isLoading = true; // Keep loading flag on until all scenarios are loaded
                        } else if (savedInputs0Parsed) {
                            // Set saved values for scenario 0
                            Object.entries(savedInputs0Parsed).forEach(([key, value]) => {
                                const inputGroup = tab0.inputSidebar.getInputGroups().get(key);
                                if (inputGroup) {
                                    inputGroup.setValue(value);
                                }
                            });
                        }
                    }
                    
                    // Load values for additional scenarios
                    for (let i = 1; i < scenarioCount; i++) {
                        const scenarioKey = `calculator_inputs_scenario_${i}`;
                        const savedInputs = localStorage.getItem(scenarioKey);
                        
                        if (savedInputs) {
                            try {
                                const parsed = JSON.parse(savedInputs);
                                const tab = this.tabs[i];
                                if (tab && tab.inputSidebar) {
                                    Object.entries(parsed).forEach(([key, value]) => {
                                        const inputGroup = tab.inputSidebar.getInputGroups().get(key);
                                        if (inputGroup) {
                                            inputGroup.setValue(value);
                                        }
                                    });
                                }
                            } catch (e) {
                                console.warn(`Failed to parse inputs for scenario ${i}:`, e);
                            }
                        }
                    }
                    
                    // All scenarios loaded, enable saving again
                    this.isLoading = false;
                    // Save to ensure everything is persisted correctly
                    this.saveScenarios();
                }, 100);
            }, 150);
        } catch (error) {
            console.warn('Failed to load scenarios:', error);
            // If loading fails, ensure at least one tab exists with defaults
            if (this.tabs.length === 0) {
                const defaults = this.getDefaultInputValues();
                this.addTab('Scenario 1', defaults);
            }
            
            // Enable saving after error
            this.isLoading = false;
            
            // Notify that scenarios are loaded BEFORE setting values
            // This ensures display tabs are created before calculations are triggered
            setTimeout(() => {
                // Update delete button visibility after all scenarios are loaded
                this.updateDeleteButtonsVisibility();
                
                // Notify that scenarios are loaded - this will create display tabs
                if (this.onScenariosLoadedCallback) {
                    this.onScenariosLoadedCallback();
                }
                
                // Now set default values AFTER display tabs are created
                setTimeout(() => {
                    const tab = this.tabs[0];
                    if (tab && tab.inputSidebar) {
                        const defaults = this.getDefaultInputValues();
                        defaults.forEach((value, key) => {
                            const inputGroup = tab.inputSidebar.getInputGroups().get(key);
                            if (inputGroup) {
                                inputGroup.setValue(value);
                            }
                        });
                        this.saveScenarios();
                    }
                }, 100);
            }, 150);
        }
    }

    saveScenarios() {
        // Don't save during loading to prevent overwriting saved data
        // But add a timeout safeguard - if isLoading is stuck, allow saves after 5 seconds
        if (this.isLoading) {
            const now = Date.now();
            if (!this.loadingStartTime) {
                this.loadingStartTime = now;
            }
            // If loading has been going on for more than 5 seconds, allow saves anyway
            if (now - this.loadingStartTime > 5000) {
                console.warn('saveScenarios: isLoading flag stuck, allowing save anyway');
                this.isLoading = false;
                this.loadingStartTime = null;
            } else {
                return;
            }
        } else {
            // Reset loading start time when not loading
            this.loadingStartTime = null;
        }
        
        try {
            // Save scenario count
            localStorage.setItem('calculator_scenario_count', this.tabs.length.toString());
            
            // Save active scenario index
            localStorage.setItem('calculator_active_scenario', this.activeTabIndex.toString());
            
            // Save inputs for each scenario
            this.tabs.forEach((tab, index) => {
                const scenarioKey = `calculator_inputs_scenario_${index}`;
                const inputValues = tab.inputSidebar.getInputValues();
                
                // Convert Map to object for storage
                const valuesObj = {};
                inputValues.forEach((value, key) => {
                    // Save all values including 0 (which is a valid value)
                    // Only skip undefined, null, and NaN
                    if (value !== undefined && value !== null) {
                        if (typeof value === 'number') {
                            // Save 0 as 0, convert NaN to null
                            valuesObj[key] = isNaN(value) ? null : value;
                        } else {
                            valuesObj[key] = value;
                        }
                    }
                });
                
                // Always save, even if empty (to preserve scenario structure)
                localStorage.setItem(scenarioKey, JSON.stringify(valuesObj));
            });
            
            // Clean up any old scenario entries beyond the current count
            for (let i = this.tabs.length; i < 20; i++) {
                localStorage.removeItem(`calculator_inputs_scenario_${i}`);
            }
        } catch (error) {
            console.error('Failed to save scenarios:', error);
        }
    }

    createSharedHeader() {
        // Create shared header (similar to InputSidebar header)
        this.sharedHeader = document.createElement('div');
        this.sharedHeader.className = 'sidebar-toggle-header';
        
        const title = document.createElement('h2');
        title.textContent = 'Inputs';
        title.className = 'sidebar-title';
        this.sharedHeader.appendChild(title);
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle-btn';
        toggleButton.innerHTML = '◀';
        toggleButton.title = 'Hide sidebar';
        toggleButton.setAttribute('aria-label', 'Toggle sidebar visibility');
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });
        
        this.sharedHeader.appendChild(toggleButton);
        this.container.appendChild(this.sharedHeader);
        this.toggleButton = toggleButton;
        
        // Create floating expand button (hidden by default)
        const floatingButton = document.createElement('button');
        floatingButton.className = 'sidebar-floating-btn sidebar-floating-btn-left';
        floatingButton.innerHTML = '▶';
        floatingButton.title = 'Show inputs sidebar';
        floatingButton.setAttribute('aria-label', 'Show inputs sidebar');
        floatingButton.style.display = 'none';
        floatingButton.addEventListener('click', () => {
            this.toggleSidebar();
        });
        document.body.appendChild(floatingButton);
        this.floatingButton = floatingButton;
    }

    toggleSidebar() {
        const isCollapsed = this.parent.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand sidebar
            this.parent.classList.remove('collapsed');
            this.toggleButton.innerHTML = '◀';
            this.toggleButton.title = 'Hide sidebar';
            if (this.floatingButton) {
                this.floatingButton.style.display = 'none';
            }
        } else {
            // Collapse sidebar
            this.parent.classList.add('collapsed');
            this.toggleButton.innerHTML = '▶';
            this.toggleButton.title = 'Show sidebar';
            if (this.floatingButton) {
                this.floatingButton.style.display = 'flex';
            }
        }
        
        // Save state
        this.saveSidebarCollapseState();
    }

    saveSidebarCollapseState() {
        try {
            const isCollapsed = this.parent.classList.contains('collapsed');
            localStorage.setItem('input_sidebar_collapsed', JSON.stringify(isCollapsed));
        } catch (error) {
            console.warn('Failed to save sidebar collapse state:', error);
        }
    }

    loadSidebarCollapseState() {
        try {
            const savedState = localStorage.getItem('input_sidebar_collapsed');
            if (savedState) {
                const isCollapsed = JSON.parse(savedState);
                if (isCollapsed) {
                    this.parent.classList.add('collapsed');
                    this.toggleButton.innerHTML = '▶';
                    this.toggleButton.title = 'Show sidebar';
                    if (this.floatingButton) {
                        this.floatingButton.style.display = 'flex';
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load sidebar collapse state:', error);
        }
    }

    createTabsHeader() {
        this.tabsHeader = document.createElement('div');
        this.tabsHeader.className = 'scenario-tabs-header';
        this.tabsHeader.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            border-bottom: 2px solid #e0e0e0;
            padding: 0 8px;
            background: #f8f9fa;
        `;
        
        this.tabsList = document.createElement('div');
        this.tabsList.className = 'scenario-tabs-list';
        this.tabsList.style.cssText = `
            display: flex;
            flex: 1;
            gap: 4px;
            overflow-x: auto;
        `;
        this.tabsHeader.appendChild(this.tabsList);
        
        // Add button
        this.addButton = document.createElement('button');
        this.addButton.innerHTML = '+';
        this.addButton.className = 'scenario-tab-add-btn';
        this.addButton.title = 'Add new scenario';
        this.addButton.style.cssText = `
            padding: 4px 6px;
            border: none;
            background: #667eea;
            color: white;
            border-radius: 2px;
            cursor: pointer;
            font-size: 9px;
            font-weight: bold;
            flex-shrink: 0;
            transition: background 0.2s ease;
        `;
        this.addButton.addEventListener('mouseenter', () => {
            this.addButton.style.backgroundColor = '#5568d3';
        });
        this.addButton.addEventListener('mouseleave', () => {
            this.addButton.style.backgroundColor = '#667eea';
        });
        this.addButton.addEventListener('click', () => this.handleAddTab());
        this.tabsHeader.appendChild(this.addButton);
        
        this.container.appendChild(this.tabsHeader);
    }

    async handleAddTab() {
        // Get scenario names for modal
        const scenarioNames = this.tabs.map((tab, index) => `Scenario ${index + 1}`);
        
        // Show modal to select which tab to copy from
        const selected = await this.copyModal.selectScenario(scenarioNames);
        
        if (selected !== null) {
            if (selected === 'default') {
                // Create scenario from default values
                const defaultValues = this.getDefaultInputValues();
                await this.addTab(`Scenario ${this.tabs.length + 1}`, defaultValues);
                // Save after scenario is created
                this.saveScenarios();
            } else if (selected === 'blank') {
                // Create blank scenario
                await this.addTab(`Scenario ${this.tabs.length + 1}`, null);
                // Save after scenario is created (addTab already saves, but ensure it's saved)
                this.saveScenarios();
            } else if (typeof selected === 'number' && selected >= 0 && selected < this.tabs.length) {
                // Copy values from selected tab
                const sourceTab = this.tabs[selected];
                const sourceValues = sourceTab.inputSidebar.getInputValues();
                await this.addTab(`Scenario ${this.tabs.length + 1}`, sourceValues);
                // Save after scenario is created
                this.saveScenarios();
            }
        }
    }

    addTab(name, copyValues = null) {
        const tabIndex = this.tabs.length;
        
        // Create tab button container
        const tabButtonContainer = document.createElement('div');
        tabButtonContainer.className = 'scenario-tab-button-container';
        tabButtonContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            position: relative;
        `;
        
        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'scenario-tab-button';
        tabButton.textContent = name;
        tabButton.dataset.tabIndex = tabIndex;
        tabButton.style.cssText = `
            padding: 8px 16px;
            border: none;
            background: transparent;
            color: #666;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            font-size: 14px;
            white-space: nowrap;
            transition: all 0.2s ease;
        `;
        
        tabButton.addEventListener('click', () => {
            this.setActiveTab(tabIndex);
        });
        
        // Create delete button (only show if more than one scenario)
        const deleteButton = document.createElement('button');
        deleteButton.className = 'scenario-tab-delete-btn';
        deleteButton.innerHTML = '×';
        deleteButton.title = 'Delete scenario';
        deleteButton.style.cssText = `
            padding: 2px 6px;
            border: none;
            background: transparent;
            color: #999;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            border-radius: 3px;
            transition: all 0.2s ease;
            opacity: 0.6;
            flex-shrink: 0;
        `;
        
        deleteButton.addEventListener('mouseenter', () => {
            deleteButton.style.backgroundColor = '#fee';
            deleteButton.style.color = '#c33';
            deleteButton.style.opacity = '1';
        });
        
        deleteButton.addEventListener('mouseleave', () => {
            deleteButton.style.backgroundColor = 'transparent';
            deleteButton.style.color = '#999';
            deleteButton.style.opacity = '0.6';
        });
        
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent tab activation
            this.deleteTab(tabIndex);
        });
        
        tabButtonContainer.appendChild(tabButton);
        tabButtonContainer.appendChild(deleteButton);
        this.tabsList.appendChild(tabButtonContainer);
        
        // Create tab content
        const tabContent = document.createElement('div');
        tabContent.className = 'scenario-tab-content';
        tabContent.style.display = 'none';
        
        // Create wrapper for InputSidebar content (without header)
        const sidebarContentWrapper = document.createElement('div');
        sidebarContentWrapper.className = 'input-sidebar-content-wrapper';
        tabContent.appendChild(sidebarContentWrapper);
        
        // Create InputSidebar instance without header
        const inputSidebar = new InputSidebar(sidebarContentWrapper, false);
        
        // Set up save callback for this input sidebar
        // Use setTimeout to ensure input groups are fully initialized
        setTimeout(() => {
            inputSidebar.setSaveConfigurationCallback(() => {
                // Only save if not currently loading
                if (!this.isLoading) {
                    this.saveScenarios();
                }
            });
        }, 0);
        
        this.tabsContent.appendChild(tabContent);
        
        // Store tab info
        const tabInfo = {
            index: tabIndex,
            name,
            button: tabButton,
            buttonContainer: tabButtonContainer,
            deleteButton: deleteButton,
            content: tabContent,
            inputSidebar,
            sidebarContentWrapper
        };
        
        this.tabs.push(tabInfo);
        
        // Update delete button visibility after tab is added to array
        this.updateDeleteButtonsVisibility();
        
        // Set as active if it's the first tab
        if (tabIndex === 0) {
            this.setActiveTab(0);
        }
        
        // If copying values, set them and return a promise
        if (copyValues) {
            return new Promise((resolve) => {
                // Use setTimeout to ensure input groups are initialized
                setTimeout(() => {
                    // Set all values
                    copyValues.forEach((value, key) => {
                        const inputGroup = inputSidebar.getInputGroups().get(key);
                        if (inputGroup) {
                            inputGroup.setValue(value);
                        }
                    });
                    
                    // Wait for values to be fully set in DOM and events to propagate
                    setTimeout(() => {
                        // Force a save to ensure values are persisted
                        // The setValue method triggers change events, which should trigger
                        // the input change listeners that save and calculate
                        // But we also save here explicitly to ensure it's saved
                        this.saveScenarios();
                        resolve(tabInfo);
                    }, 200);
                }, 200);
            });
        }
        
        // For blank scenarios, save immediately after creation
        this.saveScenarios();
        return Promise.resolve(tabInfo);
    }

    setActiveTab(index) {
        if (index < 0 || index >= this.tabs.length) return;
        
        // Save current scenario before switching
        this.saveScenarios();
        
        // Update active state
        this.activeTabIndex = index;
        
        // Update buttons
        this.tabs.forEach((tab, i) => {
            if (i === index) {
                tab.button.style.cssText = `
                    padding: 8px 16px;
                    border: none;
                    background: transparent;
                    color: #667eea;
                    border-bottom: 2px solid #667eea;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                `;
                tab.content.style.display = 'flex';
            } else {
                tab.button.style.cssText = `
                    padding: 8px 16px;
                    border: none;
                    background: transparent;
                    color: #666;
                    border-bottom: 2px solid transparent;
                    cursor: pointer;
                    font-size: 14px;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                `;
                tab.content.style.display = 'none';
            }
        });
        
        // Save active scenario index
        this.saveScenarios();
        
        // Notify callback
        if (this.onScenarioChangeCallback) {
            this.onScenarioChangeCallback(index);
        }
    }

    deleteTab(index) {
        // Prevent deletion if only one scenario exists
        if (this.tabs.length <= 1) {
            alert('Cannot delete the last scenario. At least one scenario must exist.');
            return;
        }
        
        if (index < 0 || index >= this.tabs.length) return;
        
        const tabToDelete = this.tabs[index];
        
        // Remove from DOM
        if (tabToDelete.buttonContainer && tabToDelete.buttonContainer.parentNode) {
            tabToDelete.buttonContainer.parentNode.removeChild(tabToDelete.buttonContainer);
        }
        if (tabToDelete.content && tabToDelete.content.parentNode) {
            tabToDelete.content.parentNode.removeChild(tabToDelete.content);
        }
        
        // Remove from array
        this.tabs.splice(index, 1);
        
        // Remove from localStorage
        localStorage.removeItem(`calculator_inputs_scenario_${index}`);
        
        // Renumber remaining scenarios and update localStorage keys
        this.renumberScenarios();
        
        // Update active tab if necessary
        if (this.activeTabIndex >= this.tabs.length) {
            this.activeTabIndex = this.tabs.length - 1;
        } else if (this.activeTabIndex > index) {
            this.activeTabIndex--;
        }
        
        // Update delete button visibility
        this.updateDeleteButtonsVisibility();
        
        // Save updated scenario count and renumber localStorage
        this.saveScenarios();
        
        // Set active tab (this will update UI)
        this.setActiveTab(this.activeTabIndex);
        
        // Notify callback
        if (this.onScenarioDeletedCallback) {
            this.onScenarioDeletedCallback(index);
        }
    }

    renumberScenarios() {
        // First, save all current scenario data to temporary keys
        const tempData = [];
        this.tabs.forEach((tab, oldIndex) => {
            const scenarioKey = `calculator_inputs_scenario_${oldIndex}`;
            const savedData = localStorage.getItem(scenarioKey);
            if (savedData) {
                tempData.push(savedData);
            } else {
                // If no saved data, get current values from the tab
                const inputValues = tab.inputSidebar.getInputValues();
                const valuesObj = {};
                inputValues.forEach((value, key) => {
                    if (value !== undefined && value !== null) {
                        valuesObj[key] = (typeof value === 'number' && isNaN(value)) ? null : value;
                    }
                });
                tempData.push(JSON.stringify(valuesObj));
            }
        });
        
        // Clear all scenario keys
        for (let i = 0; i < 20; i++) {
            localStorage.removeItem(`calculator_inputs_scenario_${i}`);
        }
        
        // Save data back with new indices
        tempData.forEach((data, newIndex) => {
            localStorage.setItem(`calculator_inputs_scenario_${newIndex}`, data);
        });
        
        // Renumber all tabs
        this.tabs.forEach((tab, newIndex) => {
            tab.index = newIndex;
            tab.name = `Scenario ${newIndex + 1}`;
            tab.button.textContent = tab.name;
            tab.button.dataset.tabIndex = newIndex;
        });
    }

    updateDeleteButtonsVisibility() {
        // Show/hide delete buttons based on number of scenarios
        const canDelete = this.tabs.length > 1;
        this.tabs.forEach(tab => {
            if (tab.deleteButton) {
                tab.deleteButton.style.display = canDelete ? 'block' : 'none';
            }
        });
    }

    getActiveTab() {
        return this.tabs[this.activeTabIndex] || null;
    }

    getActiveInputSidebar() {
        const activeTab = this.getActiveTab();
        return activeTab ? activeTab.inputSidebar : null;
    }

    getAllInputSidebars() {
        return this.tabs.map(tab => tab.inputSidebar);
    }

    getScenarioCount() {
        return this.tabs.length;
    }

    setOnScenarioChange(callback) {
        this.onScenarioChangeCallback = callback;
    }

    getInputValuesForScenario(index) {
        if (index >= 0 && index < this.tabs.length) {
            return this.tabs[index].inputSidebar.getInputValues();
        }
        return null;
    }

    getTab(index) {
        return this.tabs[index] || null;
    }

    setOnScenariosLoaded(callback) {
        this.onScenariosLoadedCallback = callback;
    }

    setOnScenarioDeleted(callback) {
        this.onScenarioDeletedCallback = callback;
    }
}

