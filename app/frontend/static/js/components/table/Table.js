/**
 * Main table component for displaying investment calculations.
 */
import { TableRow } from './TableRow.js';
import { YearGroupRow } from './YearGroupRow.js';
import { FormulaModal } from '../FormulaModal.js';
import { COLUMN_DEFINITIONS } from '../sidebar/ColumnInfo.js';
export class Table {
    constructor(parent, inputGroups, tabIndex = 0) {
        this.rows = [];
        this.yearGroups = [];
        this.inputGroups = new Map();
        this.visibleColumns = new Set();
        this.isLoadingConfiguration = false;
        this.formulaModal = new FormulaModal();
        this.columnDefinitions = COLUMN_DEFINITIONS;
        this.tabIndex = tabIndex;
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
            'rental_gains',
            'cumulative_rental_gains',
            'cumulative_investment',
            'expected_return',
            'cumulative_expected_return',
            'home_value',
            'sales_fees',
            'capital_gains_tax',
            'sale_income',
            'sale_net',
            'net_return',
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
        
        // Store reference to parent wrapper for resize functionality
        this.wrapper = parent;
        
        // Initialize resize functionality
        this.initializeResize();
        
        // Sync horizontal scrolling between header and body
        this.bodyContainer.addEventListener('scroll', () => {
            this.headerContainer.scrollLeft = this.bodyContainer.scrollLeft;
        });
        this.headerContainer.addEventListener('scroll', () => {
            this.bodyContainer.scrollLeft = this.headerContainer.scrollLeft;
        });
        
        // Initialize all columns as visible
        this.columns.forEach(col => this.visibleColumns.add(col));
        
        // Load configuration for this tab immediately (synchronously for column visibility)
        // Input values can be loaded later, but column visibility needs to be set before any data updates
        this.loadColumnVisibility();
        
        // Load input values asynchronously (they don't affect column visibility)
        requestAnimationFrame(() => {
            this.loadInputValues();
            // Update body container height after initial setup
            setTimeout(() => {
                this.updateBodyContainerHeight();
            }, 100);
        });
    }
    initializeResize() {
        // Load saved height from localStorage
        const savedHeight = localStorage.getItem(`table_height_tab_${this.tabIndex}`);
        if (savedHeight) {
            const height = parseInt(savedHeight, 10);
            if (height && height >= 200) { // Minimum height of 200px
                this.wrapper.style.height = `${height}px`;
                this.wrapper.style.maxHeight = `${height}px`;
                this.updateBodyContainerHeight();
            }
        }
        
        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'table-resize-handle';
        resizeHandle.title = 'Drag to resize table height';
        this.wrapper.appendChild(resizeHandle);
        
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = this.wrapper.offsetHeight;
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            const newHeight = Math.max(200, startHeight + deltaY); // Minimum height of 200px
            
            this.wrapper.style.height = `${newHeight}px`;
            this.wrapper.style.maxHeight = `${newHeight}px`;
            this.updateBodyContainerHeight();
        };
        
        const handleMouseUp = () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                // Save height to localStorage
                const height = this.wrapper.offsetHeight;
                localStorage.setItem(`table_height_tab_${this.tabIndex}`, height.toString());
            }
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    updateBodyContainerHeight() {
        // Update body container max-height based on wrapper height
        const wrapperHeight = this.wrapper.offsetHeight;
        const headerHeight = this.headerContainer.offsetHeight;
        const padding = 56; // Approximate padding (1rem top + 0.5rem bottom + some margin)
        const newMaxHeight = Math.max(100, wrapperHeight - headerHeight - padding);
        this.bodyContainer.style.maxHeight = `${newMaxHeight}px`;
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
                    // Only listen to 'change' and 'blur' events to avoid recalculation while typing
                    inputElement.addEventListener('change', saveHandler);
                    inputElement.addEventListener('blur', saveHandler);
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
            // Save column visibility per tab
            const visibleColumnsArray = Array.from(this.visibleColumns);
            localStorage.setItem(`calculator_visible_columns_tab_${this.tabIndex}`, JSON.stringify(visibleColumnsArray));
        }
        catch (error) {
            console.warn('Failed to save configuration:', error);
        }
    }
    loadColumnVisibility() {
        try {
            // Load column visibility for this tab
            let savedColumns = localStorage.getItem(`calculator_visible_columns_tab_${this.tabIndex}`);
            // Fall back to old global key for backward compatibility (only for first tab)
            if (!savedColumns && this.tabIndex === 0) {
                savedColumns = localStorage.getItem('calculator_visible_columns');
            }
            if (savedColumns) {
                const visibleColumnsArray = JSON.parse(savedColumns);
                const visibleColumnsSet = new Set(visibleColumnsArray);
                // Only apply if all columns in the set are valid
                const allValid = visibleColumnsArray.every(col => this.columns.includes(col));
                if (allValid && visibleColumnsSet.size > 0) {
                    // Temporarily disable saving while setting visibility (skip save since we're loading)
                    this.setColumnVisibility(visibleColumnsSet, true);
                    // Notify callback to update checkboxes
                    if (this.visibilityChangeCallback) {
                        this.visibilityChangeCallback(visibleColumnsSet);
                    }
                }
            }
        }
        catch (error) {
            console.warn('Failed to load column visibility:', error);
        }
    }
    loadInputValues() {
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
                // The setValue on downpayment_percentage will handle this, but trigger input event to be sure
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
        }
        catch (error) {
            console.warn('Failed to load input values:', error);
        }
        finally {
            this.isLoadingConfiguration = false;
        }
    }
    loadConfiguration() {
        // Load both column visibility and input values
        this.loadColumnVisibility();
        this.loadInputValues();
    }
    setColumnVisibility(visibleColumns, skipSave = false) {
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
        // Save column visibility (unless explicitly skipped)
        if (!skipSave) {
            this.saveConfiguration();
        }
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
        
        // Map column keys to display names
        const keyToNameMap = {
            'rental_gains': 'Rental Gains',
            'cumulative_rental_gains': 'Cumulative Rental Gains',
            'principal_remaining': 'Principal Remaining',
            'mortgage_payments': 'Mortgage Payments',
            'principal_paid': 'Principal Paid',
            'interest_paid': 'Interest Paid',
            'maintenance_fees': 'Maintenance Fees',
            'property_tax': 'Property Tax',
            'insurance_paid': 'Insurance Paid',
            'utilities': 'Utilities',
            'repairs': 'Repairs',
            'total_expenses': 'Total Expenses',
            'deductible_expenses': 'Deductible Expenses',
            'rental_income': 'Rental Income',
            'taxable_income': 'Taxable Income',
            'taxes_due': 'Taxes Due',
            'cumulative_investment': 'Cumulative Investment',
            'expected_return': 'Expected Return',
            'cumulative_expected_return': 'Cumulative Expected Return',
            'home_value': 'Home Value',
            'capital_gains_tax': 'Capital Gains Tax',
            'sales_fees': 'Sales Fees',
            'sale_income': 'Sale Income',
            'sale_net': 'Sale Net',
            'net_return': 'Net Return',
            'return_percent': 'Return %',
            'return_comparison': 'Return Comparison'
        };
        
        // Return mapped name if available, otherwise auto-format
        if (keyToNameMap[column]) {
            return keyToNameMap[column];
        }
        
        // Fallback to auto-formatting
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
            const row = new TableRow(this.tbody, this.columns, this.formulaModal, this.columnDefinitions, inputValues, this);
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
                const row = new TableRow(this.tbody, this.columns, this.formulaModal, this.columnDefinitions, inputValues, this);
                row.updateData(result);
                this.rows.push(row);
                yearGroup.addMonthRow(row.getRowElement());
            });
        });
        // Reapply column visibility after updating data (skip save to avoid overwriting saved state)
        this.setColumnVisibility(this.visibleColumns, true);
        
        // Update body container height after data update
        this.updateBodyContainerHeight();
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
            // Only listen to 'change' and 'blur' events to avoid recalculation while typing
            inputGroup.addEventListener('change', handler);
            inputGroup.addEventListener('blur', handler);
        });
    }
}
