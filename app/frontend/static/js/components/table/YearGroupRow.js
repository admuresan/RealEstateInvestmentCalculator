/**
 * Year group row component for collapsing/expanding months within a year.
 */
export class YearGroupRow {
    constructor(parent, year, columns, yearData, formulaModal, columnDefinitions, inputValues) {
        this.isExpanded = false;
        this.monthRows = [];
        this.cells = new Map();
        this.columns = columns;
        this.yearData = yearData;
        this.formulaModal = formulaModal;
        this.columnDefinitions = columnDefinitions;
        this.inputValues = inputValues;
        this.row = document.createElement('tr');
        this.row.className = 'year-group-row';
        this.row.style.cursor = 'pointer';
        this.row.style.backgroundColor = '#f5f5f5';
        this.row.style.fontWeight = '500';
        // Create cells for each column
        columns.forEach((column, index) => {
            const cell = document.createElement('td');
            cell.style.padding = '0.75rem';
            cell.style.border = '1px solid #dee2e6';
            cell.style.textAlign = column === 'month' ? 'left' : 'right';
            // Add right-click listener for formula display (except month column)
            if (column !== 'month' && formulaModal) {
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showFormula(column, e);
                });
                cell.style.cursor = 'context-menu';
                cell.title = 'Right-click to see formula';
            }
            if (column === 'month') {
                // Month column shows year with toggle icon
                const yearContent = document.createElement('div');
                yearContent.style.display = 'flex';
                yearContent.style.alignItems = 'center';
                yearContent.style.gap = '0.5rem';
                this.toggleIcon = document.createElement('span');
                this.toggleIcon.textContent = '▶';
                this.toggleIcon.style.transition = 'transform 0.2s';
                this.toggleIcon.style.display = 'inline-block';
                const yearText = document.createElement('span');
                yearText.textContent = `Year ${year}`;
                yearContent.appendChild(this.toggleIcon);
                yearContent.appendChild(yearText);
                cell.appendChild(yearContent);
                this.yearCell = cell;
            }
            else {
                // Other columns will show summaries when collapsed
                cell.textContent = '';
            }
            this.cells.set(column, cell);
            this.row.appendChild(cell);
        });
        // Calculate and display year summaries (initially collapsed)
        this.updateSummaryDisplay();
        this.row.addEventListener('click', () => this.toggle());
        parent.appendChild(this.row);
    }
    toggle() {
        this.isExpanded = !this.isExpanded;
        this.monthRows.forEach(row => {
            row.style.display = this.isExpanded ? '' : 'none';
        });
        this.toggleIcon.style.transform = this.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
        // Always show summary values, whether expanded or collapsed
        this.updateSummaryDisplay();
    }
    updateSummaryDisplay() {
        if (this.yearData.length === 0)
            return;
        // Calculate year summaries
        const summary = {};
        const lastMonth = this.yearData[this.yearData.length - 1];
        const firstMonth = this.yearData[0];
        
        // Sum columns (most columns)
        const sumColumns = [
            'mortgage_payments', 'principal_paid', 'interest_paid',
            'maintenance_fees', 'property_tax', 'insurance_paid',
            'utilities', 'repairs', 'total_expenses', 'deductible_expenses',
            'rental_income', 'taxable_income', 'taxes_due', 'rental_gains',
            'expected_return'
        ];
        sumColumns.forEach(col => {
            summary[col] = this.yearData.reduce((sum, month) => sum + (month[col] || 0), 0);
        });
        
        // Principal Remaining: final month of the year
        summary['principal_remaining'] = lastMonth.principal_remaining;
        
        // Last value columns (cumulative values, sale metrics)
        summary['cumulative_rental_gains'] = lastMonth.cumulative_rental_gains;
        summary['cumulative_investment'] = lastMonth.cumulative_investment;
        summary['cumulative_expected_return'] = lastMonth.cumulative_expected_return;
        summary['home_value'] = lastMonth.home_value;
        summary['capital_gains_tax'] = lastMonth.capital_gains_tax;
        summary['sales_fees'] = lastMonth.sales_fees;
        summary['sale_income'] = lastMonth.sale_income;
        summary['sale_net'] = lastMonth.sale_net;
        summary['net_return'] = lastMonth.net_return;
        summary['return_percent'] = lastMonth.return_percent;
        summary['return_comparison'] = lastMonth.return_comparison;
        // Display summaries
        this.columns.forEach(column => {
            if (column !== 'month' && summary[column] !== undefined) {
                const cell = this.cells.get(column);
                if (cell) {
                    if (column === 'return_percent') {
                        cell.textContent = this.formatPercent(summary[column]);
                    }
                    else if (column === 'return_comparison') {
                        cell.textContent = this.formatRatio(summary[column]);
                    }
                    else {
                        cell.textContent = this.formatCurrency(summary[column]);
                    }
                }
            }
        });
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
    showFormula(column, event) {
        if (!this.yearData || this.yearData.length === 0 || !this.formulaModal) return;
        
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
            'rental_gains': 'Rental Gains',
            'cumulative_rental_gains': 'Cumulative Rental Gains',
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
        
        // Find column definition
        const displayName = keyToNameMap[column] || column;
        const columnDef = this.columnDefinitions.find(def => {
            return def.name === displayName;
        });
        
        if (!columnDef) {
            return;
        }
        
        // Determine if this is a sum column or last value column
        const sumColumns = [
            'mortgage_payments', 'principal_paid', 'interest_paid',
            'maintenance_fees', 'property_tax', 'insurance_paid',
            'utilities', 'repairs', 'total_expenses', 'deductible_expenses',
            'rental_income', 'taxable_income', 'taxes_due', 'rental_gains',
            'expected_return'
        ];
        
        const isSumColumn = sumColumns.includes(column);
        const lastMonthData = this.yearData[this.yearData.length - 1];
        const firstMonthData = this.yearData[0];
        
        // Create summary data object - use last month's data as base
        const summaryData = { ...lastMonthData };
        
        // For sum columns, calculate the sum
        if (isSumColumn) {
            summaryData[column] = this.yearData.reduce((sum, month) => sum + (month[column] || 0), 0);
        }
        
        // Special handling for Principal Remaining - need first month's principal for formula
        if (column === 'principal_remaining') {
            summaryData.first_month_principal_remaining = firstMonthData.principal_remaining;
            summaryData.total_principal_paid = this.yearData.reduce((sum, month) => sum + (month.principal_paid || 0), 0);
        }
        
        // Add year info to the data
        summaryData.year = this.yearData[0].year;
        summaryData.month = lastMonthData.month;
        summaryData.months_in_year = this.yearData.length;
        
        // Show formula with summary context
        // Pass column display name (not full title) so calculateBreakdown can map it correctly
        const title = isSumColumn 
            ? `${columnDef.name} (Year ${summaryData.year} Summary - Sum of ${summaryData.months_in_year} months)`
            : `${columnDef.name} (Year ${summaryData.year} Summary - Final Month)`;
        
        // Call show with column name first (calculateBreakdown needs just the column name)
        this.formulaModal.show(
            columnDef.name, // Pass just the column name, not the full title
            columnDef.formula + (isSumColumn ? ` (summed across ${summaryData.months_in_year} months)` : ' (final month value)'),
            summaryData,
            this.inputValues,
            this.yearData // Always pass year data so we can calculate properly
        );
        
        // Update the title element with the full descriptive title
        if (this.formulaModal.titleElement) {
            this.formulaModal.titleElement.textContent = title;
        }
    }
    addMonthRow(row) {
        this.monthRows.push(row);
        // Initially collapsed
        row.style.display = 'none';
    }
    getRowElement() {
        return this.row;
    }
    setExpanded(expanded) {
        if (this.isExpanded !== expanded) {
            this.toggle();
        }
    }
}
