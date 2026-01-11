/**
 * Main table component for displaying investment calculations.
 */
import { TableRow } from './TableRow.js';
import { YearGroupRow } from './YearGroupRow.js';
import { FormulaModal } from '../FormulaModal.js';
import { COLUMN_DEFINITIONS } from '../sidebar/ColumnInfo.js';
export class Table {
    constructor(parent, inputGroups) {
        this.rows = [];
        this.yearGroups = [];
        this.inputGroups = new Map();
        this.visibleColumns = new Set();
        this.isLoadingConfiguration = false;
        this.formulaModal = new FormulaModal();
        this.columnDefinitions = COLUMN_DEFINITIONS;
        this.columns = [
            'month',
            'principal_remaining',
            'mortgage_payments',
            'principal_paid',
            'interest_paid',
            'maintenance_fees',
            'property_tax',
            'insurance_paid',
            'utilities',
            'repairs',
            'total_expenses',
            'deductible_expenses',
            'rental_income',
            'taxable_income',
            'taxes_due',
            'net_profit',
            'cumulative_investment',
            'expected_return',
            'cumulative_expected_return',
            'home_value',
            'sales_fees',
            'capital_gains_tax',
            'sale_income',
            'sale_gross',
            'sale_net',
            'return_percent',
            'return_comparison'
        ];
        if (inputGroups) {
            this.inputGroups = inputGroups;
        }
        this.container = document.createElement('div');
        this.container.className = 'table-container';
        
        // Create header container (fixed, outside scroll)
        this.headerContainer = document.createElement('div');
        this.headerContainer.className = 'table-header-container';
        this.headerTable = document.createElement('table');
        this.headerTable.className = 'investment-table investment-table-header';
        this.thead = document.createElement('thead');
        this.headerRow = document.createElement('tr');
        this.headerRow.className = 'header-row';
        // Create column headers only (no input row)
        this.columns.forEach(column => {
            const th = document.createElement('th');
            th.className = `header-${column}`;
            // Create header content container
            const headerContent = document.createElement('div');
            headerContent.style.display = 'flex';
            headerContent.style.alignItems = 'flex-start';
            headerContent.style.justifyContent = 'space-between';
            headerContent.style.gap = '0.5rem';
            headerContent.style.flexWrap = 'wrap';
            // Column name
            const columnName = document.createElement('span');
            columnName.textContent = this.formatColumnName(column);
            columnName.style.flex = '1';
            columnName.style.minWidth = '0';
            columnName.style.wordWrap = 'break-word';
            columnName.style.overflowWrap = 'break-word';
            headerContent.appendChild(columnName);
            // Hide/show icon
            const icon = document.createElement('span');
            icon.className = 'column-toggle-icon';
            icon.textContent = '👁️';
            icon.style.cursor = 'pointer';
            icon.style.fontSize = '0.9rem';
            icon.style.opacity = '0.8';
            icon.style.transition = 'opacity 0.2s';
            icon.style.flexShrink = '0';
            icon.style.alignSelf = 'flex-start';
            icon.title = 'Click to hide/show column';
            icon.addEventListener('mouseenter', () => {
                icon.style.opacity = '1';
            });
            icon.addEventListener('mouseleave', () => {
                icon.style.opacity = '0.8';
            });
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleColumnVisibility(column);
            });
            headerContent.appendChild(icon);
            th.appendChild(headerContent);
            this.headerRow.appendChild(th);
        });
        this.thead.appendChild(this.headerRow);
        this.headerTable.appendChild(this.thead);
        this.headerContainer.appendChild(this.headerTable);
        this.container.appendChild(this.headerContainer);
        
        // Create scrollable body container
        this.bodyContainer = document.createElement('div');
        this.bodyContainer.className = 'table-body-container';
        this.table = document.createElement('table');
        this.table.className = 'investment-table investment-table-body';
        // Create body
        this.tbody = document.createElement('tbody');
        this.tbody.className = 'table-body';
        this.table.appendChild(this.tbody);
        this.bodyContainer.appendChild(this.table);
        this.container.appendChild(this.bodyContainer);
        
        parent.appendChild(this.container);
        
        // Sync horizontal scrolling between header and body
        this.bodyContainer.addEventListener('scroll', () => {
            this.headerContainer.scrollLeft = this.bodyContainer.scrollLeft;
        });
        this.headerContainer.addEventListener('scroll', () => {
            this.bodyContainer.scrollLeft = this.headerContainer.scrollLeft;
        });
        
        // Initialize all columns as visible
        this.columns.forEach(col => this.visibleColumns.add(col));
    }
    setInputGroups(inputGroups) {
        this.inputGroups = inputGroups;
        // Attach save listeners to all inputs
        this.attachSaveListeners();
    }
    attachSaveListeners() {
        // Attach save listeners directly to all input elements
        this.inputGroups.forEach((inputGroup, key) => {
            try {
                const inputElement = inputGroup.getInputElement();
                if (inputElement) {
                    // Remove any existing listeners to avoid duplicates
                    const saveHandler = () => {
                        // Small delay to ensure value is updated
                        setTimeout(() => this.saveConfiguration(), 0);
                    };
                    inputElement.addEventListener('input', saveHandler);
                    inputElement.addEventListener('change', saveHandler);
                }
            }
            catch (error) {
                console.warn(`Failed to attach save listener to ${key}:`, error);
            }
        });
    }
    saveConfiguration() {
        // Don't save while loading configuration
        if (this.isLoadingConfiguration) {
            return;
        }
        try {
            // Save input values
            const inputValues = {};
            this.inputGroups.forEach((inputGroup, key) => {
                const value = inputGroup.getValue();
                if (value !== undefined && !isNaN(value)) {
                    inputValues[key] = value;
                }
            });
            localStorage.setItem('calculator_inputs', JSON.stringify(inputValues));
            // Save column visibility
            const visibleColumnsArray = Array.from(this.visibleColumns);
            localStorage.setItem('calculator_visible_columns', JSON.stringify(visibleColumnsArray));
        }
        catch (error) {
            console.warn('Failed to save configuration:', error);
        }
    }
    loadConfiguration() {
        this.isLoadingConfiguration = true;
        try {
            // Load input values
            const savedInputs = localStorage.getItem('calculator_inputs');
            if (savedInputs) {
                const inputValues = JSON.parse(savedInputs);
                // Set values - setValue on downpayment_percentage will trigger display update
                this.inputGroups.forEach((inputGroup, key) => {
                    if (inputValues[key] !== undefined) {
                        inputGroup.setValue(inputValues[key]);
                    }
                });
                // Ensure downpayment display is updated after loading purchase_price
                // The setValue on downpayment_percentage should handle this, but trigger input event to be sure
                if (inputValues['purchase_price'] !== undefined || inputValues['downpayment_percentage'] !== undefined) {
                    const purchasePriceInput = this.inputGroups.get('purchase_price');
                    const downpaymentInput = this.inputGroups.get('downpayment_percentage');
                    if (purchasePriceInput && downpaymentInput) {
                        // Small delay to ensure DOM is ready, then trigger update
                        setTimeout(() => {
                            purchasePriceInput.getInputElement().dispatchEvent(new Event('input', { bubbles: true }));
                            downpaymentInput.getInputElement().dispatchEvent(new Event('input', { bubbles: true }));
                        }, 0);
                    }
                }
            }
            // Load column visibility
            const savedColumns = localStorage.getItem('calculator_visible_columns');
            if (savedColumns) {
                const visibleColumnsArray = JSON.parse(savedColumns);
                const visibleColumnsSet = new Set(visibleColumnsArray);
                // Only apply if all columns in the set are valid
                const allValid = visibleColumnsArray.every(col => this.columns.includes(col));
                if (allValid && visibleColumnsSet.size > 0) {
                    // Temporarily disable saving while setting visibility
                    this.setColumnVisibility(visibleColumnsSet);
                    // Notify callback to update checkboxes
                    if (this.visibilityChangeCallback) {
                        this.visibilityChangeCallback(visibleColumnsSet);
                    }
                }
            }
        }
        catch (error) {
            console.warn('Failed to load configuration:', error);
        }
        finally {
            this.isLoadingConfiguration = false;
        }
    }
    setColumnVisibility(visibleColumns) {
        this.visibleColumns = visibleColumns;
        // Update header visibility
        this.headerRow.querySelectorAll('th').forEach((th, index) => {
            const column = this.columns[index];
            if (column && !visibleColumns.has(column)) {
                th.style.display = 'none';
            }
            else if (column) {
                th.style.display = '';
            }
        });
        // No input row to update visibility for
        // Update data rows visibility
        this.rows.forEach(row => {
            const rowElement = row.getRowElement();
            rowElement.querySelectorAll('td').forEach((td, index) => {
                const column = this.columns[index];
                if (column && !visibleColumns.has(column)) {
                    td.style.display = 'none';
                }
                else if (column) {
                    td.style.display = '';
                }
            });
        });
        // Update year group rows visibility
        this.yearGroups.forEach(yearGroup => {
            const yearRow = yearGroup.getRowElement();
            yearRow.querySelectorAll('td').forEach((td, index) => {
                const column = this.columns[index];
                if (column && !visibleColumns.has(column)) {
                    td.style.display = 'none';
                }
                else if (column) {
                    td.style.display = '';
                }
            });
        });
        // Save column visibility
        this.saveConfiguration();
    }
    setVisibilityChangeCallback(callback) {
        this.visibilityChangeCallback = callback;
    }
    toggleColumnVisibility(column) {
        if (this.visibleColumns.has(column)) {
            this.visibleColumns.delete(column);
        }
        else {
            this.visibleColumns.add(column);
        }
        this.setColumnVisibility(this.visibleColumns);
        // Notify callback to update checkboxes
        if (this.visibilityChangeCallback) {
            this.visibilityChangeCallback(new Set(this.visibleColumns));
        }
    }
    getColumns() {
        return [...this.columns];
    }
    formatColumnName(column) {
        if (column === 'month') {
            return 'Month';
        }
        return column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    updateData(results) {
        // Clear existing rows and year groups
        this.rows.forEach(row => row.getRowElement().remove());
        this.yearGroups.forEach(group => group.getRowElement().remove());
        this.rows = [];
        this.yearGroups = [];
        // Group results by year
        const yearGroups = new Map();
        let month0Result = null;
        results.forEach(result => {
            if (result.month === 0) {
                month0Result = result;
            }
            else {
                const year = result.year;
                if (!yearGroups.has(year)) {
                    yearGroups.set(year, []);
                }
                yearGroups.get(year).push(result);
            }
        });
        // Get input values for formula calculations
        const inputValues = this.getInputValues();
        
        // Add month 0 row first (always visible)
        if (month0Result) {
            const row = new TableRow(this.tbody, this.columns, this.formulaModal, this.columnDefinitions, inputValues);
            row.updateData(month0Result);
            this.rows.push(row);
        }
        // Create year groups and month rows
        const sortedYears = Array.from(yearGroups.keys()).sort((a, b) => a - b);
        sortedYears.forEach(year => {
            const yearResults = yearGroups.get(year);
            // Create year group row with year data for summaries
            const yearGroup = new YearGroupRow(this.tbody, year, this.columns, yearResults, this.formulaModal, this.columnDefinitions, inputValues);
            this.yearGroups.push(yearGroup);
            // Create month rows for this year
            yearResults.forEach(result => {
                const row = new TableRow(this.tbody, this.columns, this.formulaModal, this.columnDefinitions, inputValues);
                row.updateData(result);
                this.rows.push(row);
                yearGroup.addMonthRow(row.getRowElement());
            });
        });
        // Reapply column visibility after updating data
        this.setColumnVisibility(this.visibleColumns);
    }
    getInputValues() {
        const values = new Map();
        this.inputGroups.forEach((inputGroup, key) => {
            values.set(key, inputGroup.getValue());
        });
        return values;
    }
    addInputChangeListener(handler) {
        // Save is already handled by attachSaveListeners, just call the handler
        this.inputGroups.forEach(inputGroup => {
            inputGroup.addEventListener('input', handler);
            inputGroup.addEventListener('change', handler);
        });
    }
}
