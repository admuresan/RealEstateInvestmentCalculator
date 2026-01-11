/**
 * Display tabs component for managing charts, table, and insights tabs.
 */
export class DisplayTabs {
    constructor(parent, createContentCallback) {
        this.parent = parent;
        this.createContentCallback = createContentCallback;
        this.tabs = [];
        this.activeTabIndex = 0;
        
        this.container = document.createElement('div');
        this.container.className = 'display-tabs-container';
        this.container.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
        `;
        
        // Create tabs header
        this.createTabsHeader();
        
        // Create tabs content area
        this.tabsContent = document.createElement('div');
        this.tabsContent.className = 'display-tabs-content';
        this.tabsContent.style.cssText = `
            flex: 1;
            overflow: hidden;
            position: relative;
        `;
        this.container.appendChild(this.tabsContent);
        
        parent.appendChild(this.container);
    }

    createTabsHeader() {
        this.tabsHeader = document.createElement('div');
        this.tabsHeader.className = 'display-tabs-header';
        this.tabsHeader.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            border-bottom: 2px solid #e0e0e0;
            padding: 0 8px;
            background: #f8f9fa;
        `;
        
        this.tabsList = document.createElement('div');
        this.tabsList.className = 'display-tabs-list';
        this.tabsList.style.cssText = `
            display: flex;
            flex: 1;
            gap: 4px;
            overflow-x: auto;
        `;
        this.tabsHeader.appendChild(this.tabsList);
        
        this.container.appendChild(this.tabsHeader);
    }

    addTab(name) {
        const tabIndex = this.tabs.length;
        
        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'display-tab-button';
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
        
        this.tabsList.appendChild(tabButton);
        
        // Create tab content
        const tabContent = document.createElement('div');
        tabContent.className = 'display-tab-content';
        tabContent.style.cssText = `
            display: none;
            height: 100%;
            width: 100%;
            position: absolute;
            top: 0;
            left: 0;
            visibility: hidden;
            opacity: 0;
        `;
        
        // Create content using callback
        const content = this.createContentCallback(tabContent, tabIndex);
        
        this.tabsContent.appendChild(tabContent);
        
        // Store tab info
        const tabInfo = {
            index: tabIndex,
            name,
            button: tabButton,
            content: tabContent,
            contentComponents: content
        };
        
        this.tabs.push(tabInfo);
        
        // Set as active if it's the first tab
        if (tabIndex === 0) {
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                this.setActiveTab(0);
            }, 0);
        }
        
        return tabInfo;
    }

    setActiveTab(index) {
        if (index < 0 || index >= this.tabs.length) return;
        
        // Update active state
        this.activeTabIndex = index;
        
        // Update buttons and content
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
                tab.content.style.visibility = 'visible';
                tab.content.style.opacity = '1';
                
                // Trigger chart resize/update when tab becomes visible
                // Use requestAnimationFrame and setTimeout to ensure DOM has updated
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        this.renderTabContent(index);
                    }, 100);
                });
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
                tab.content.style.visibility = 'hidden';
                tab.content.style.opacity = '0';
            }
        });
    }

    renderTabContent(index) {
        const tab = this.tabs[index];
        if (!tab || !tab.contentComponents) return;
        
        // Ensure tab content is visible before rendering charts
        if (tab.content.style.display === 'none') {
            tab.content.style.display = 'flex';
        }
        
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
            // Resize and update charts if they exist
            if (tab.contentComponents.chart) {
                if (tab.contentComponents.chart.chart) {
                    tab.contentComponents.chart.chart.resize();
                }
                if (tab.contentComponents.data) {
                    tab.contentComponents.chart.updateData(tab.contentComponents.data);
                } else if (!tab.contentComponents.chart.chart) {
                    // Initialize chart if it doesn't exist yet
                    tab.contentComponents.chart.initializeChart();
                }
            }
            if (tab.contentComponents.returnChart) {
                if (tab.contentComponents.returnChart.chart) {
                    tab.contentComponents.returnChart.chart.resize();
                }
                if (tab.contentComponents.data) {
                    tab.contentComponents.returnChart.updateData(tab.contentComponents.data);
                } else if (!tab.contentComponents.returnChart.chart) {
                    // Initialize chart if it doesn't exist yet
                    tab.contentComponents.returnChart.initializeChart();
                }
            }
            if (tab.contentComponents.netProfitRentalChart) {
                if (tab.contentComponents.netProfitRentalChart.chart) {
                    tab.contentComponents.netProfitRentalChart.chart.resize();
                }
                if (tab.contentComponents.data) {
                    tab.contentComponents.netProfitRentalChart.updateData(tab.contentComponents.data);
                } else if (!tab.contentComponents.netProfitRentalChart.chart) {
                    // Initialize chart if it doesn't exist yet
                    tab.contentComponents.netProfitRentalChart.initializeChart();
                }
            }
        });
    }

    getActiveTab() {
        return this.tabs[this.activeTabIndex] || null;
    }

    getTab(index) {
        return this.tabs[index] || null;
    }

    removeTab(index) {
        if (index < 0 || index >= this.tabs.length) return;
        
        const tabToRemove = this.tabs[index];
        
        // Remove from DOM
        if (tabToRemove.button && tabToRemove.button.parentNode) {
            tabToRemove.button.parentNode.removeChild(tabToRemove.button);
        }
        if (tabToRemove.content && tabToRemove.content.parentNode) {
            tabToRemove.content.parentNode.removeChild(tabToRemove.content);
        }
        
        // Remove from array
        this.tabs.splice(index, 1);
        
        // Renumber remaining tabs
        this.tabs.forEach((tab, newIndex) => {
            tab.index = newIndex;
            tab.name = `Scenario ${newIndex + 1}`;
            tab.button.textContent = tab.name;
            tab.button.dataset.tabIndex = newIndex;
        });
        
        // Update active tab if necessary
        if (this.activeTabIndex >= this.tabs.length) {
            this.activeTabIndex = this.tabs.length - 1;
        } else if (this.activeTabIndex > index) {
            this.activeTabIndex--;
        }
        
        // Set active tab (this will update UI)
        if (this.tabs.length > 0) {
            this.setActiveTab(this.activeTabIndex);
        }
    }

    updateTabCount(count) {
        // Remove excess tabs
        while (this.tabs.length > count) {
            const tab = this.tabs.pop();
            tab.button.remove();
            tab.content.remove();
        }
        
        // Add missing tabs
        while (this.tabs.length < count) {
            const tabIndex = this.tabs.length;
            this.addTab(`Scenario ${tabIndex + 1}`);
        }
    }

    updateTabData(index, data) {
        const tab = this.tabs[index];
        if (!tab || !tab.contentComponents) return;
        
        // Store data
        tab.contentComponents.data = data;
        
        // Temporarily show the tab content if it's hidden to allow Chart.js to render properly
        const wasHidden = tab.content.style.display === 'none';
        const isActive = this.activeTabIndex === index;
        
        if (wasHidden) {
            tab.content.style.display = 'flex';
            tab.content.style.visibility = 'visible';
            tab.content.style.opacity = '1';
        }
        
        // Use requestAnimationFrame to ensure DOM is updated before updating charts
        requestAnimationFrame(() => {
            // Update chart data
            if (tab.contentComponents.chart) {
                tab.contentComponents.chart.updateData(data);
            }
            if (tab.contentComponents.returnChart) {
                tab.contentComponents.returnChart.updateData(data);
            }
            if (tab.contentComponents.netProfitRentalChart) {
                tab.contentComponents.netProfitRentalChart.updateData(data);
            }
            
            // Update table data
            if (tab.contentComponents.table) {
                tab.contentComponents.table.updateData(data);
            }
            
            // Update summary data
            if (tab.contentComponents.summary) {
                const inputValues = tab.contentComponents.inputValues || new Map();
                tab.contentComponents.summary.updateSummary(data, inputValues);
            }
            
            // If this is the active tab, ensure charts are properly rendered
            if (isActive) {
                setTimeout(() => {
                    this.renderTabContent(index);
                }, 100);
            }
            
            // Restore original visibility state after a brief delay to allow charts to render
            if (wasHidden && !isActive) {
                setTimeout(() => {
                    // Only hide if this tab is not the active one
                    if (this.activeTabIndex !== index) {
                        tab.content.style.display = 'none';
                        tab.content.style.visibility = 'hidden';
                        tab.content.style.opacity = '0';
                    }
                }, 200);
            }
        });
    }

    setInputValuesForTab(index, inputValues) {
        const tab = this.tabs[index];
        if (tab && tab.contentComponents) {
            tab.contentComponents.inputValues = inputValues;
            if (tab.contentComponents.summary && tab.contentComponents.data) {
                tab.contentComponents.summary.updateSummary(
                    tab.contentComponents.data,
                    inputValues
                );
            }
        }
    }
}

