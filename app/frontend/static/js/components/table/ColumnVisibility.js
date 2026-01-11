/**
 * Column visibility control component.
 */
export class ColumnVisibility {
    constructor(parent, columns, onChange) {
        this.checkboxes = new Map();
        this.columns = columns;
        this.onChangeCallback = onChange;
        this.container = document.createElement('div');
        this.container.className = 'column-visibility';
        const header = document.createElement('h3');
        header.textContent = 'Show/Hide Columns';
        header.className = 'visibility-header';
        this.container.appendChild(header);
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'visibility-checkboxes';
        columns.forEach(column => {
            const label = document.createElement('label');
            label.className = 'visibility-label';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true; // All columns visible by default
            checkbox.className = 'visibility-checkbox';
            checkbox.dataset.column = column;
            const span = document.createElement('span');
            span.textContent = this.formatColumnName(column);
            span.className = 'visibility-label-text';
            label.appendChild(checkbox);
            label.appendChild(span);
            checkboxContainer.appendChild(label);
            this.checkboxes.set(column, checkbox);
            checkbox.addEventListener('change', () => this.handleChange());
        });
        this.container.appendChild(checkboxContainer);
        parent.appendChild(this.container);
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
    handleChange() {
        const visibleColumns = new Set();
        this.checkboxes.forEach((checkbox, column) => {
            if (checkbox.checked) {
                visibleColumns.add(column);
            }
        });
        this.onChangeCallback(visibleColumns);
    }
    getVisibleColumns() {
        const visibleColumns = new Set();
        this.checkboxes.forEach((checkbox, column) => {
            if (checkbox.checked) {
                visibleColumns.add(column);
            }
        });
        return visibleColumns;
    }
    setColumnVisibility(visibleColumns) {
        this.checkboxes.forEach((checkbox, column) => {
            checkbox.checked = visibleColumns.has(column);
        });
    }
}
