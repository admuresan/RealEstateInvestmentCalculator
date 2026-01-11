/**
 * Main application entry point.
 */
import { Table } from './components/table/Table.js';
import { Sidebar } from './components/sidebar/Sidebar.js';
import { InputSidebar } from './components/sidebar/InputSidebar.js';
import { ColumnVisibility } from './components/table/ColumnVisibility.js';
import { InvestmentChart } from './components/chart/InvestmentChart.js';
import { ReturnComparisonChart } from './components/chart/ReturnComparisonChart.js';
import { NetProfitRentalIncomeChart } from './components/chart/NetProfitRentalIncomeChart.js';
import { ValidationBanner } from './components/ValidationBanner.js';
import { InvestmentSummary } from './components/InvestmentSummary.js';
import { calculateInvestment } from './utils/api.js';
class InvestmentCalculator {
    constructor() {
        this.numYears = 30;
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
        // Create overall performance container (at top)
        const performanceContainer = document.createElement('div');
        performanceContainer.className = 'performance-wrapper';
        middleContent.appendChild(performanceContainer);
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
        middleContent.appendChild(chartsContainer);
        // Create table container (in middle area)
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-wrapper';
        middleContent.appendChild(tableContainer);
        // Create summary container (below table)
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'summary-wrapper';
        middleContent.appendChild(summaryContainer);
        mainContent.appendChild(middleContent);
        // Create info sidebar container (right side - full height)
        const sidebarContainer = document.createElement('div');
        sidebarContainer.className = 'sidebar-wrapper';
        mainContent.appendChild(sidebarContainer);
        appContainer.appendChild(mainContent);
        // Initialize components
        this.validationBanner = new ValidationBanner(bannerContainer);
        this.chart = new InvestmentChart(chartContainer);
        this.returnChart = new ReturnComparisonChart(returnChartContainer);
        this.netProfitRentalChart = new NetProfitRentalIncomeChart(netProfitRentalChartContainer);
        this.inputSidebar = new InputSidebar(inputSidebarContainer);
        this.table = new Table(tableContainer);
        this.table.setInputGroups(this.inputSidebar.getInputGroups());
        this.summary = new InvestmentSummary(summaryContainer, performanceContainer);
        this.sidebar = new Sidebar(sidebarContainer);
        // Add column visibility control to sidebar
        const visibilityContainer = document.createElement('div');
        visibilityContainer.className = 'visibility-container';
        sidebarContainer.insertBefore(visibilityContainer, sidebarContainer.firstChild);
        this.columnVisibility = new ColumnVisibility(visibilityContainer, this.table.getColumns(), (visibleColumns) => {
            this.table.setColumnVisibility(visibleColumns);
        });
        // Set up callback so header icon clicks update checkboxes
        this.table.setVisibilityChangeCallback((visibleColumns) => {
            this.columnVisibility.setColumnVisibility(visibleColumns);
        });
        // Set up save callback for input sidebar
        this.inputSidebar.setSaveConfigurationCallback(() => {
            // Save is handled by InputSidebar.saveConfiguration()
        });
        // Load saved configuration (after callbacks are set up)
        this.inputSidebar.loadConfiguration();
        this.table.loadConfiguration();
        // Set up event listeners
        this.setupEventListeners();
        // Initial calculation
        this.performCalculation();
    }
    setupEventListeners() {
        // Listen for input changes
        this.inputSidebar.addInputChangeListener(() => {
            this.performCalculation();
        });
    }
    /**
     * Validate all input values and return array of error messages.
     * @returns {Array<string>} Array of validation error messages
     */
    validateInputs(values) {
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
        for (const [key, label] of Object.entries(fieldLabels)) {
            // Check both isInputEmpty and if value exists in values map
            const value = values.get(key);
            if (this.inputSidebar.isInputEmpty(key) || value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
                errors.push(`${label} is required`);
            }
        }

        // Additional validation for specific fields (only if not empty)
        const downpaymentPercent = values.get('downpayment_percentage');
        if (!this.inputSidebar.isInputEmpty('downpayment_percentage')) {
            if (downpaymentPercent < 0 || downpaymentPercent > 100) {
                errors.push('Downpayment Percentage must be between 0 and 100');
            }
        }

        const loanYears = values.get('loan_years');
        if (!this.inputSidebar.isInputEmpty('loan_years')) {
            if (loanYears <= 0 || !Number.isInteger(loanYears)) {
                errors.push('Loan Years must be a positive integer');
            }
        }

        const purchasePrice = values.get('purchase_price');
        if (!this.inputSidebar.isInputEmpty('purchase_price')) {
            if (purchasePrice <= 0) {
                errors.push('Purchase Price must be greater than 0');
            }
        }

        return errors;
    }

    async performCalculation() {
        const values = this.inputSidebar.getInputValues();
        const validationErrors = this.validateInputs(values);

        if (validationErrors.length > 0) {
            this.validationBanner.show(validationErrors);
            // Clear table and charts when validation fails
            this.table.updateData([]);
            this.chart.updateData([]);
            this.returnChart.updateData([]);
            this.netProfitRentalChart.updateData([]);
            this.summary.updateSummary([], values);
            return;
        }

        // Hide banner if validation passes
        this.validationBanner.hide();

        try {
            const params = {
                purchase_price: values.get('purchase_price'),
                downpayment_percentage: values.get('downpayment_percentage'),
                interest_rate: values.get('interest_rate'),
                loan_years: values.get('loan_years'),
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
            this.table.updateData(response.results);
            this.chart.updateData(response.results);
            this.returnChart.updateData(response.results);
            this.netProfitRentalChart.updateData(response.results);
            this.summary.updateSummary(response.results, values);
        }
        catch (error) {
            console.error('Calculation error:', error);
            const errorMessages = [];
            
            // First, check if backend returned specific errors array
            if (error.errors && Array.isArray(error.errors)) {
                errorMessages.push(...error.errors);
            }
            // Otherwise, extract from error message
            else if (error.message) {
                // Check if it's a validation error with multiple messages
                if (error.message.includes(',')) {
                    errorMessages.push(...error.message.split(',').map(msg => msg.trim()).filter(msg => msg));
                } else {
                    errorMessages.push(error.message);
                }
            }
            
            // If no specific error message, provide helpful default messages
            if (errorMessages.length === 0) {
                if (error.status === 400) {
                    errorMessages.push('Invalid input values. Please check that all fields contain valid numbers.');
                } else if (error.status === 500) {
                    errorMessages.push('Server error occurred. Please verify all input values are valid numbers and try again.');
                } else {
                    errorMessages.push('Error performing calculation. Please check your inputs and ensure all fields contain valid numbers.');
                }
            }
            
            // Remove duplicates
            const uniqueErrors = [...new Set(errorMessages.filter(msg => msg && msg.trim()))];
            
            this.validationBanner.show(uniqueErrors.length > 0 ? uniqueErrors : ['An unknown error occurred. Please check your inputs.']);
        }
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
