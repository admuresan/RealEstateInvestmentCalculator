/**
 * Main application entry point.
 */
import { Table } from './components/table/Table.js';
import { Sidebar } from './components/sidebar/Sidebar.js';
import { ColumnVisibility } from './components/table/ColumnVisibility.js';
import { InvestmentChart } from './components/chart/InvestmentChart.js';
import { ReturnComparisonChart } from './components/chart/ReturnComparisonChart.js';
import { NetProfitRentalIncomeChart } from './components/chart/NetProfitRentalIncomeChart.js';
import { CrossScenarioChart } from './components/chart/CrossScenarioChart.js';
import { ValidationBanner } from './components/ValidationBanner.js';
import { InvestmentSummary } from './components/InvestmentSummary.js';
import { ScenarioTabs } from './components/scenario/ScenarioTabs.js';
import { DisplayTabs } from './components/scenario/DisplayTabs.js';
import { LoadingOverlay } from './components/LoadingOverlay.js';
import { ScenarioDifferences } from './components/ScenarioDifferences.js';
import { calculateInvestment } from './utils/api.js';

class InvestmentCalculator {
    constructor() {
        this.numYears = 30;
        this.scenarioData = new Map(); // Map of scenario index to { results, inputValues }
        this.calculationInProgress = false;
        this.pendingCalculations = 0;
        
        // Initialize loading overlay first
        this.loadingOverlay = new LoadingOverlay();
        this.loadingOverlay.show('Initializing...', 'Setting up the calculator');
        
        const appContainer = document.getElementById('app');
        if (!appContainer) {
            throw new Error('App container not found');
        }
        
        // Create validation banner container (before main content)
        const bannerContainer = document.createElement('div');
        bannerContainer.className = 'validation-banner-container';
        appContainer.appendChild(bannerContainer);
        
        // Create main layout - sidebars full height, chart and table in middle
        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        
        // Create input sidebar container (left side - full height)
        const inputSidebarContainer = document.createElement('div');
        inputSidebarContainer.className = 'input-sidebar-wrapper';
        mainContent.appendChild(inputSidebarContainer);
        
        // Create middle content area (charts + table)
        const middleContent = document.createElement('div');
        middleContent.className = 'middle-content-wrapper';
        
        // Create scenario differences container (at the very top)
        const scenarioDifferencesContainer = document.createElement('div');
        scenarioDifferencesContainer.className = 'scenario-differences-wrapper';
        middleContent.appendChild(scenarioDifferencesContainer);
        
        // Create overall performance container (at top)
        const performanceContainer = document.createElement('div');
        performanceContainer.className = 'performance-wrapper';
        middleContent.appendChild(performanceContainer);
        
        // Create cross-scenario chart container (above display tabs)
        const crossScenarioChartContainer = document.createElement('div');
        crossScenarioChartContainer.className = 'cross-scenario-chart-wrapper';
        crossScenarioChartContainer.style.cssText = `
            height: 600px;
            min-height: 600px;
            max-height: 600px;
            margin-bottom: 1rem;
            overflow: hidden;
        `;
        middleContent.appendChild(crossScenarioChartContainer);
        
        // Create display tabs container for charts, table, and insights
        const displayTabsContainer = document.createElement('div');
        displayTabsContainer.className = 'display-tabs-wrapper';
        displayTabsContainer.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        `;
        middleContent.appendChild(displayTabsContainer);
        
        mainContent.appendChild(middleContent);
        
        // Create info sidebar container (right side - full height)
        const sidebarContainer = document.createElement('div');
        sidebarContainer.className = 'sidebar-wrapper';
        mainContent.appendChild(sidebarContainer);
        
        appContainer.appendChild(mainContent);
        
        // Initialize components
        this.validationBanner = new ValidationBanner(bannerContainer);
        
        // Initialize scenario tabs for input sidebar
        this.scenarioTabs = new ScenarioTabs(inputSidebarContainer);
        this.scenarioTabs.setOnScenarioChange((index) => {
            this.handleScenarioChange(index);
        });
        this.scenarioTabs.setOnScenariosLoaded(() => {
            this.initializeDisplayTabs();
            // Set up input change listeners for all loaded scenarios
            this.setupInputChangeListeners();
        });
        this.scenarioTabs.setOnScenarioDeleted((deletedIndex) => {
            this.handleScenarioDeleted(deletedIndex);
        });
        
        // Initialize display tabs
        this.displayTabs = new DisplayTabs(displayTabsContainer, (container, tabIndex) => {
            return this.createDisplayTabContent(container, tabIndex);
        });
        
        // Set up callback to update column visibility checkboxes when switching tabs
        this.displayTabs.setOnTabActivatedCallback((visibleColumns) => {
            if (this.columnVisibility) {
                this.columnVisibility.setColumnVisibility(visibleColumns);
            }
        });
        
        // Initialize scenario differences component
        this.scenarioDifferences = new ScenarioDifferences(scenarioDifferencesContainer, () => {
            return this.getScenarioDataArray();
        });
        
        // Initialize summary for performance section (shared across all scenarios)
        this.summary = new InvestmentSummary(null, performanceContainer);
        
        // Initialize cross-scenario chart
        this.crossScenarioChart = new CrossScenarioChart(crossScenarioChartContainer);
        
        // Initialize sidebar
        this.sidebar = new Sidebar(sidebarContainer);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Wait for scenarios to load, then create display tabs
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.loadingOverlay.updateMessage('Loading scenarios...', 'Preparing your data');
                this.initializeDisplayTabs();
                // Update cross-scenario chart with scenario list
                this.updateCrossScenarioChart();
                // Initial calculation for all scenarios
                this.performCalculationForAllScenarios();
            }, 200);
        });
    }

    initializeDisplayTabs() {
        // Create display tabs for all loaded scenarios
        const scenarioCount = this.scenarioTabs.getScenarioCount();
        for (let i = 0; i < scenarioCount; i++) {
            // Check if display tab already exists
            const existingTab = this.displayTabs.getTab(i);
            if (!existingTab) {
                this.displayTabs.addTab(`Scenario ${i + 1}`);
            }
        }
    }

    createDisplayTabContent(container, tabIndex) {
        // Create charts container (2x2 grid)
        const chartsContainer = document.createElement('div');
        chartsContainer.className = 'charts-container';
        
        // Create first chart container (Investment Overview)
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-wrapper';
        chartsContainer.appendChild(chartContainer);
        
        // Create second chart container (Return Comparison)
        const returnChartContainer = document.createElement('div');
        returnChartContainer.className = 'chart-wrapper';
        chartsContainer.appendChild(returnChartContainer);
        
        // Create third chart container (Net Profit vs Rental Income)
        const netProfitRentalChartContainer = document.createElement('div');
        netProfitRentalChartContainer.className = 'chart-wrapper';
        chartsContainer.appendChild(netProfitRentalChartContainer);
        
        container.appendChild(chartsContainer);
        
        // Create table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-wrapper';
        container.appendChild(tableContainer);
        
        // Create summary container
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'summary-wrapper';
        container.appendChild(summaryContainer);
        
        // Initialize components for this tab
        const chart = new InvestmentChart(chartContainer);
        const returnChart = new ReturnComparisonChart(returnChartContainer);
        const netProfitRentalChart = new NetProfitRentalIncomeChart(netProfitRentalChartContainer);
        const table = new Table(tableContainer, null, tabIndex);
        
        // Get input sidebar for this scenario to set up table
        // Use setTimeout to ensure scenario tab is created first
        setTimeout(() => {
            const inputSidebar = this.scenarioTabs.getTab(tabIndex)?.inputSidebar;
            if (inputSidebar) {
                table.setInputGroups(inputSidebar.getInputGroups());
            }
        }, 0);
        
        const summary = new InvestmentSummary(summaryContainer, null);
        
        // Add column visibility control to sidebar (only for first tab)
        if (tabIndex === 0) {
            const visibilityContainer = document.createElement('div');
            visibilityContainer.className = 'visibility-container';
            // Insert into sidebar wrapper before the column info container
            this.sidebar.wrapper.insertBefore(visibilityContainer, this.sidebar.columnInfoContainer);
            this.columnVisibility = new ColumnVisibility(visibilityContainer, table.getColumns(), (visibleColumns) => {
                // Update visibility only for the active display tab
                const activeTab = this.displayTabs.getActiveTab();
                if (activeTab && activeTab.contentComponents && activeTab.contentComponents.table) {
                    activeTab.contentComponents.table.setColumnVisibility(visibleColumns);
                }
            });
            
            // Set up callback so header icon clicks update checkboxes
            table.setVisibilityChangeCallback((visibleColumns) => {
                if (this.columnVisibility) {
                    this.columnVisibility.setColumnVisibility(visibleColumns);
                }
            });
            
            // Update checkboxes to reflect loaded column visibility state
            // Use setTimeout to ensure table has finished loading configuration
            setTimeout(() => {
                if (this.columnVisibility && table.visibleColumns) {
                    this.columnVisibility.setColumnVisibility(table.visibleColumns);
                }
            }, 100);
        }
        
        return {
            chart,
            returnChart,
            netProfitRentalChart,
            table,
            summary,
            inputValues: null,
            data: null
        };
    }

    setupInputChangeListeners() {
        // Listen for input changes in all scenario tabs
        this.scenarioTabs.getAllInputSidebars().forEach((inputSidebar, index) => {
            inputSidebar.addInputChangeListener(() => {
                // Save scenarios when inputs change
                this.scenarioTabs.saveScenarios();
                // Update scenario differences
                if (this.scenarioDifferences) {
                    this.scenarioDifferences.refresh();
                }
                this.performCalculationForScenario(index);
            });
        });
    }

    setupEventListeners() {
        // Set up input change listeners for all scenario tabs
        this.setupInputChangeListeners();
        
        // Update scenario differences when scenarios are loaded
        if (this.scenarioDifferences) {
            this.scenarioDifferences.refresh();
        }
        
        // Override handleAddTab to also create display tab
        const originalHandleAddTab = this.scenarioTabs.handleAddTab.bind(this.scenarioTabs);
        this.scenarioTabs.handleAddTab = async () => {
            // Get the current scenario count before showing modal
            const scenarioCountBefore = this.scenarioTabs.getScenarioCount();
            
            // Don't show loading overlay yet - wait for user to select an option from the modal
            await originalHandleAddTab();
            
            // Check if a new tab was actually created (user didn't cancel)
            const scenarioCountAfter = this.scenarioTabs.getScenarioCount();
            if (scenarioCountAfter > scenarioCountBefore) {
                // A new tab was created, now show loading overlay and set it up
                this.loadingOverlay.show('Adding scenario...', 'Setting up new scenario');
                const newTabIndex = scenarioCountAfter - 1;
                
                // Add corresponding display tab
                this.displayTabs.addTab(`Scenario ${newTabIndex + 1}`);
                
                // Set up input change listener for new tab
                const tab = this.scenarioTabs.getTab(newTabIndex);
                const displayTab = this.displayTabs.getTab(newTabIndex);
                if (tab && displayTab && displayTab.contentComponents) {
                    // Set up table input groups
                    if (displayTab.contentComponents.table) {
                        displayTab.contentComponents.table.setInputGroups(tab.inputSidebar.getInputGroups());
                    }
                    
                    // Wait for values to be set in addTab before setting up listeners
                    // This prevents calculations from being triggered during initial value setting
                    setTimeout(() => {
                        // Set up input change listener AFTER values are set
                        // This ensures calculations only run when user makes changes, not during initial setup
                        tab.inputSidebar.addInputChangeListener(() => {
                            // Save scenarios when inputs change
                            this.scenarioTabs.saveScenarios();
                            // Update scenario differences
                            if (this.scenarioDifferences) {
                                this.scenarioDifferences.refresh();
                            }
                            // Perform calculation for this scenario
                            this.performCalculationForScenario(newTabIndex);
                        });
                        
                        // Wait for values to be fully set and display tab to be fully initialized
                        // Then trigger calculation now that setup is complete
                        setTimeout(() => {
                            // Force save to ensure values are persisted
                            this.scenarioTabs.saveScenarios();
                            // Update cross-scenario chart with new scenario
                            this.updateCrossScenarioChart();
                            // Now trigger calculation after everything is set up
                            this.performCalculationForScenario(newTabIndex);
                            this.loadingOverlay.hide();
                        }, 100);
                    }, 450);
                } else {
                    // Update cross-scenario chart even if tab isn't ready yet
                    this.updateCrossScenarioChart();
                    this.loadingOverlay.hide();
                }
            }
            // If user cancelled, no new tab was created, so do nothing (no loading overlay was shown)
        };
    }

    handleScenarioChange(index) {
        // Don't switch display tabs - keep them independent
        // Only validate the newly active scenario and show/hide validation banner
        this.validateAndShowBannerForScenario(index);
    }

    validateAndShowBannerForScenario(scenarioIndex) {
        const tab = this.scenarioTabs.getTab(scenarioIndex);
        if (!tab) return;
        
        const inputSidebar = tab.inputSidebar;
        const values = inputSidebar.getInputValues();
        const validationErrors = this.validateInputs(values, inputSidebar);
        
        if (validationErrors.length > 0) {
            this.validationBanner.show(validationErrors);
        } else {
            this.validationBanner.hide();
        }
    }

    handleScenarioDeleted(deletedIndex) {
        this.loadingOverlay.show('Updating scenarios...', 'Removing scenario and recalculating');
        
        // Remove corresponding display tab
        this.displayTabs.removeTab(deletedIndex);
        
        // Remove scenario data from map
        // Need to shift all indices after deleted one
        const newScenarioData = new Map();
        this.scenarioData.forEach((data, oldIndex) => {
            if (oldIndex < deletedIndex) {
                newScenarioData.set(oldIndex, data);
            } else if (oldIndex > deletedIndex) {
                newScenarioData.set(oldIndex - 1, data);
            }
            // Skip the deleted index
        });
        this.scenarioData = newScenarioData;
        
        // Update cross-scenario chart
        this.updateCrossScenarioChart();
        
        // Update scenario differences
        if (this.scenarioDifferences) {
            this.scenarioDifferences.refresh();
        }
        
        // Recalculate all remaining scenarios
        this.performCalculationForAllScenarios();
    }

    validateInputs(values, inputSidebar) {
        const errors = [];
        const fieldLabels = {
            purchase_price: 'Purchase Price',
            downpayment_percentage: 'Downpayment Percentage',
            interest_rate: 'Interest Rate',
            loan_years: 'Loan Years',
            maintenance_base: 'Maintenance - Monthly Base',
            maintenance_increase: 'Maintenance - Yearly Increase',
            property_tax_base: 'Property Tax - Annual Base',
            property_tax_increase: 'Property Tax - Yearly Increase',
            insurance: 'Annual Insurance',
            utilities: 'Monthly Utilities',
            repairs: 'Annual Repairs',
            rental_income_base: 'Monthly Rental',
            rental_increase: 'Rental - Yearly Increase',
            marginal_tax_rate: 'Marginal Tax Rate',
            expected_return_rate: 'Expected Return Rate',
            real_estate_market_increase: 'Real Estate Market Increase',
            commission_percentage: 'Commission Percentage'
        };

        // Check each required field for empty or invalid values
        // Note: 0 is a valid value for many fields (like maintenance_base, utilities, etc.)
        for (const [key, label] of Object.entries(fieldLabels)) {
            const value = values.get(key);
            // Only flag as error if the value is null, undefined, or NaN
            // 0 is a valid value and should not be flagged
            if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
                errors.push(`${label} is required`);
            }
        }

        // Additional validation for specific fields (only if not empty)
        const downpaymentPercent = values.get('downpayment_percentage');
        if (!inputSidebar.isInputEmpty('downpayment_percentage')) {
            if (downpaymentPercent < 0 || downpaymentPercent > 100) {
                errors.push('Downpayment Percentage must be between 0 and 100');
            }
        }

        const loanYears = values.get('loan_years');
        if (!inputSidebar.isInputEmpty('loan_years')) {
            if (loanYears <= 0 || !Number.isInteger(loanYears)) {
                errors.push('Loan Years must be a positive integer');
            }
        }

        const purchasePrice = values.get('purchase_price');
        if (!inputSidebar.isInputEmpty('purchase_price')) {
            if (purchasePrice <= 0) {
                errors.push('Purchase Price must be greater than 0');
            }
        }

        return errors;
    }

    async performCalculationForScenario(scenarioIndex) {
        const tab = this.scenarioTabs.getTab(scenarioIndex);
        if (!tab) {
            // Tab not found, don't show loading overlay
            return;
        }
        
        // Show loading overlay if not already showing
        if (!this.loadingOverlay.isShowing()) {
            this.loadingOverlay.show('Calculating...', 'Processing your investment scenario');
        } else {
            this.loadingOverlay.updateMessage('Calculating...', `Processing scenario ${scenarioIndex + 1}`);
        }
        this.calculationInProgress = true;
        this.pendingCalculations++;
        
        const inputSidebar = tab.inputSidebar;
        const values = inputSidebar.getInputValues();
        const validationErrors = this.validateInputs(values, inputSidebar);

        const displayTab = this.displayTabs.getTab(scenarioIndex);
        if (!displayTab) {
            console.warn(`Display tab ${scenarioIndex} not found, skipping calculation`);
            // Decrement pending calculations and hide overlay if needed
            this.pendingCalculations = Math.max(0, this.pendingCalculations - 1);
            if (this.pendingCalculations === 0) {
                this.calculationInProgress = false;
                setTimeout(() => {
                    if (this.pendingCalculations === 0 && !this.calculationInProgress) {
                        this.loadingOverlay.hide();
                    }
                }, 300);
            }
            return;
        }
        
        // Ensure display tab content components are initialized
        if (!displayTab.contentComponents) {
            console.warn(`Display tab ${scenarioIndex} content components not initialized, skipping calculation`);
            // Decrement pending calculations and hide overlay if needed
            this.pendingCalculations = Math.max(0, this.pendingCalculations - 1);
            if (this.pendingCalculations === 0) {
                this.calculationInProgress = false;
                setTimeout(() => {
                    if (this.pendingCalculations === 0 && !this.calculationInProgress) {
                        this.loadingOverlay.hide();
                    }
                }, 300);
            }
            return;
        }

        if (validationErrors.length > 0) {
            // Show validation errors only for active scenario
            if (scenarioIndex === this.scenarioTabs.activeTabIndex) {
                this.validationBanner.show(validationErrors);
            }
            
            // Don't clear or update display tabs for invalid scenarios - leave them as is
            // Only remove from scenarioData so it doesn't appear in performance section
            this.scenarioData.delete(scenarioIndex);
            this.updatePerformanceSection();
            
            // Decrement pending calculations and hide overlay if needed
            this.pendingCalculations = Math.max(0, this.pendingCalculations - 1);
            if (this.pendingCalculations === 0) {
                this.calculationInProgress = false;
                setTimeout(() => {
                    if (this.pendingCalculations === 0 && !this.calculationInProgress) {
                        this.loadingOverlay.hide();
                    }
                }, 300);
            }
            return;
        }

        // Hide banner if validation passes (only if this is the active scenario)
        if (scenarioIndex === this.scenarioTabs.activeTabIndex) {
            this.validationBanner.hide();
        }

        try {
            const params = {
                purchase_price: values.get('purchase_price'),
                downpayment_percentage: values.get('downpayment_percentage'),
                closing_costs: values.get('closing_costs') ?? 0,
                land_transfer_tax: values.get('land_transfer_tax') ?? 0,
                interest_rate: values.get('interest_rate'),
                loan_years: values.get('loan_years'),
                payment_type: values.get('payment_type') || 'Principal and Interest',
                maintenance_base: values.get('maintenance_base'),
                maintenance_increase: values.get('maintenance_increase'),
                property_tax_base: values.get('property_tax_base'),
                property_tax_increase: values.get('property_tax_increase'),
                insurance: values.get('insurance'),
                utilities: values.get('utilities'),
                repairs: values.get('repairs'),
                rental_income_base: values.get('rental_income_base'),
                rental_increase: values.get('rental_increase'),
                marginal_tax_rate: values.get('marginal_tax_rate'),
                expected_return_rate: values.get('expected_return_rate'),
                real_estate_market_increase: values.get('real_estate_market_increase'),
                commission_percentage: values.get('commission_percentage'),
                num_years: this.numYears
            };
            
            const response = await calculateInvestment(params);
            
            // Store scenario data
            this.scenarioData.set(scenarioIndex, {
                results: response.results,
                inputValues: values
            });
            
            // Update display tab
            this.displayTabs.updateTabData(scenarioIndex, response.results);
            this.displayTabs.setInputValuesForTab(scenarioIndex, values);
            
            // Always ensure the active display tab renders, even if it's not this scenario
            // This ensures content is visible when data arrives
            const activeTabIndex = this.displayTabs.activeTabIndex;
            if (scenarioIndex === activeTabIndex) {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        this.displayTabs.renderTabContent(scenarioIndex);
                    }, 150);
                });
            }
            
            // Also ensure the tab content is visible if it's the active tab
            const displayTab = this.displayTabs.getTab(activeTabIndex);
            if (displayTab && displayTab.content) {
                if (displayTab.content.style.display === 'none') {
                    displayTab.content.style.display = 'flex';
                }
            }
            
            // Update performance section (shows all scenarios)
            this.updatePerformanceSection();
            
            // Update cross-scenario chart
            this.updateCrossScenarioChart();
            
            // Update scenario differences
            if (this.scenarioDifferences) {
                this.scenarioDifferences.refresh();
            }
        }
        catch (error) {
            console.error('Calculation error:', error);
            const errorMessages = [];
            
            if (error.errors && Array.isArray(error.errors)) {
                errorMessages.push(...error.errors);
            }
            else if (error.message) {
                if (error.message.includes(',')) {
                    errorMessages.push(...error.message.split(',').map(msg => msg.trim()).filter(msg => msg));
                } else {
                    errorMessages.push(error.message);
                }
            }
            
            if (errorMessages.length === 0) {
                if (error.status === 400) {
                    errorMessages.push('Invalid input values. Please check that all fields contain valid numbers.');
                } else if (error.status === 500) {
                    errorMessages.push('Server error occurred. Please verify all input values are valid numbers and try again.');
                } else {
                    errorMessages.push('Error performing calculation. Please check your inputs and ensure all fields contain valid numbers.');
                }
            }
            
            const uniqueErrors = [...new Set(errorMessages.filter(msg => msg && msg.trim()))];
            
            if (scenarioIndex === this.scenarioTabs.activeTabIndex) {
                this.validationBanner.show(uniqueErrors.length > 0 ? uniqueErrors : ['An unknown error occurred. Please check your inputs.']);
            }
        }
        finally {
            // Decrement pending calculations counter
            this.pendingCalculations = Math.max(0, this.pendingCalculations - 1);
            
            // Hide loading overlay if all calculations are complete
            if (this.pendingCalculations === 0) {
                this.calculationInProgress = false;
                // Small delay to ensure UI updates are complete
                setTimeout(() => {
                    if (this.pendingCalculations === 0 && !this.calculationInProgress) {
                        this.loadingOverlay.hide();
                    }
                }, 300);
            }
        }
    }

    async performCalculationForAllScenarios() {
        const scenarioCount = this.scenarioTabs.getScenarioCount();
        
        if (scenarioCount === 0) {
            // No scenarios to calculate, hide loading overlay
            this.loadingOverlay.hide();
            return;
        }
        
        // Show loading overlay
        this.loadingOverlay.updateMessage('Calculating scenarios...', `Processing ${scenarioCount} scenario${scenarioCount > 1 ? 's' : ''}`);
        
        // Ensure display tabs match scenario tabs
        this.displayTabs.updateTabCount(scenarioCount);
        
        // Perform calculation for each scenario
        for (let i = 0; i < scenarioCount; i++) {
            this.loadingOverlay.updateMessage('Calculating scenarios...', `Processing scenario ${i + 1} of ${scenarioCount}`);
            await this.performCalculationForScenario(i);
        }
        
        // Ensure validation banner is shown/hidden correctly for active scenario
        this.validateAndShowBannerForScenario(this.scenarioTabs.activeTabIndex);
        
        // Final check to hide loading overlay
        setTimeout(() => {
            if (this.pendingCalculations === 0) {
                this.calculationInProgress = false;
                this.loadingOverlay.hide();
            }
        }, 500);
    }

    updatePerformanceSection() {
        // Collect all scenario data
        const scenariosData = [];
        for (let i = 0; i < this.scenarioTabs.getScenarioCount(); i++) {
            const data = this.scenarioData.get(i);
            if (data) {
                scenariosData.push(data);
            }
        }
        
        // Update performance section with all scenarios
        this.summary.updateMultipleScenarios(scenariosData);
        
        // Update cross-scenario chart
        this.updateCrossScenarioChart();
    }
    
    updateCrossScenarioChart() {
        if (!this.crossScenarioChart) return;
        
        const scenarioCount = this.scenarioTabs.getScenarioCount();
        const scenarioNames = new Map();
        
        // Get scenario names
        for (let i = 0; i < scenarioCount; i++) {
            const tab = this.scenarioTabs.getTab(i);
            const name = tab ? tab.name || `Scenario ${i + 1}` : `Scenario ${i + 1}`;
            scenarioNames.set(i, name);
        }
        
        // Update scenario list
        this.crossScenarioChart.updateScenarioList(scenarioCount, scenarioNames);
        
        // Update scenario data
        this.crossScenarioChart.updateScenarioData(this.scenarioData);
    }
    
    getScenarioDataArray() {
        // Get all scenario data as an array for the scenario differences component
        const scenarioCount = this.scenarioTabs.getScenarioCount();
        const scenariosArray = [];
        
        for (let i = 0; i < scenarioCount; i++) {
            const tab = this.scenarioTabs.getTab(i);
            if (tab && tab.inputSidebar) {
                const inputValues = tab.inputSidebar.getInputValues();
                const name = tab.name || `Scenario ${i + 1}`;
                scenariosArray.push({
                    name: name,
                    inputValues: inputValues,
                    results: this.scenarioData.get(i)?.results || null
                });
            }
        }
        
        return scenariosArray;
    }

    getTab(scenarioIndex) {
        return this.scenarioTabs.getTab(scenarioIndex);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new InvestmentCalculator();
    });
}
else {
    new InvestmentCalculator();
}
