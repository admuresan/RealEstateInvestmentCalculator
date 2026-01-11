/**
 * Table row component for displaying a single month's data.
 */
export class TableRow {
    constructor(parent, columns, formulaModal, columnDefinitions, inputValues) {
        this.cells = new Map();
        this.row = document.createElement('tr');
        this.row.className = 'data-row';
        this.formulaModal = formulaModal;
        this.columnDefinitions = columnDefinitions;
        this.inputValues = inputValues;
        this.rowData = null;
        columns.forEach(column => {
            const cell = document.createElement('td');
            cell.className = `cell-${column}`;
            cell.textContent = '0.00';
            // Add right-click listener for formula display
            if (column !== 'month') {
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showFormula(column, e);
                });
                // Add visual feedback
                cell.style.cursor = 'context-menu';
                cell.title = 'Right-click to see formula';
            }
            this.cells.set(column, cell);
            this.row.appendChild(cell);
        });
        parent.appendChild(this.row);
    }
    showFormula(column, event) {
        if (!this.rowData || !this.formulaModal) return;
        
        // Map column keys to display names
        const keyToNameMap = {
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
            'net_profit': 'Net Profit',
            'cumulative_investment': 'Cumulative Investment',
            'expected_return': 'Expected Return',
            'cumulative_expected_return': 'Cumulative Expected Return',
            'home_value': 'Home Value',
            'capital_gains_tax': 'Capital Gains Tax',
            'sales_fees': 'Sales Fees',
            'sale_income': 'Sale Income',
            'sale_gross': 'Sale Gross',
            'sale_net': 'Sale Net',
            'return_percent': 'Return %',
            'return_comparison': 'Return Comparison'
        };
        
        // Find column definition
        const displayName = keyToNameMap[column] || column;
        const columnDef = this.columnDefinitions.find(def => {
            return def.name === displayName;
        });
        
        if (columnDef) {
            this.formulaModal.show(
                columnDef.name,
                columnDef.formula,
                this.rowData,
                this.inputValues
            );
        } else {
            // Fallback: show basic info even if no definition found
            this.formulaModal.show(
                displayName,
                'No formula available',
                this.rowData,
                this.inputValues
            );
        }
    }
    updateData(data) {
        this.rowData = data;
        const monthCell = this.cells.get('month');
        if (monthCell) {
            if (data.month === 0) {
                monthCell.textContent = 'Month 0';
            }
            else {
                const monthNumber = ((data.month - 1) % 12) + 1;
                monthCell.textContent = `${monthNumber}`;
            }
        }
        this.cells.get('principal_remaining').textContent = this.formatCurrency(data.principal_remaining);
        this.cells.get('mortgage_payments').textContent = this.formatCurrency(data.mortgage_payments);
        this.cells.get('principal_paid').textContent = this.formatCurrency(data.principal_paid);
        this.cells.get('interest_paid').textContent = this.formatCurrency(data.interest_paid);
        this.cells.get('maintenance_fees').textContent = this.formatCurrency(data.maintenance_fees);
        this.cells.get('property_tax').textContent = this.formatCurrency(data.property_tax);
        this.cells.get('insurance_paid').textContent = this.formatCurrency(data.insurance_paid);
        this.cells.get('utilities').textContent = this.formatCurrency(data.utilities);
        this.cells.get('repairs').textContent = this.formatCurrency(data.repairs);
        this.cells.get('total_expenses').textContent = this.formatCurrency(data.total_expenses);
        this.cells.get('deductible_expenses').textContent = this.formatCurrency(data.deductible_expenses);
        this.cells.get('rental_income').textContent = this.formatCurrency(data.rental_income);
        this.cells.get('taxable_income').textContent = this.formatCurrency(data.taxable_income);
        this.cells.get('taxes_due').textContent = this.formatCurrency(data.taxes_due);
        this.cells.get('net_profit').textContent = this.formatCurrency(data.net_profit);
        this.cells.get('cumulative_investment').textContent = this.formatCurrency(data.cumulative_investment);
        this.cells.get('expected_return').textContent = this.formatCurrency(data.expected_return);
        this.cells.get('cumulative_expected_return').textContent = this.formatCurrency(data.cumulative_expected_return);
        this.cells.get('home_value').textContent = this.formatCurrency(data.home_value);
        this.cells.get('capital_gains_tax').textContent = this.formatCurrency(data.capital_gains_tax);
        this.cells.get('sales_fees').textContent = this.formatCurrency(data.sales_fees);
        this.cells.get('sale_income').textContent = this.formatCurrency(data.sale_income);
        this.cells.get('sale_gross').textContent = this.formatCurrency(data.sale_gross);
        this.cells.get('sale_net').textContent = this.formatCurrency(data.sale_net);
        this.cells.get('return_percent').textContent = this.formatPercent(data.return_percent);
        this.cells.get('return_comparison').textContent = this.formatRatio(data.return_comparison);
    }
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
    formatPercent(value) {
        return `${value.toFixed(2)}%`;
    }
    formatRatio(value) {
        return value.toFixed(4);
    }
    getRowElement() {
        return this.row;
    }
}
