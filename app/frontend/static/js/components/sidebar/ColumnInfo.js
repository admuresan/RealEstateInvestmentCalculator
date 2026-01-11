/**
 * Column information component for sidebar explanations.
 */
export const COLUMN_DEFINITIONS = [
    {
        name: 'Principal Remaining',
        description: 'The remaining balance on the mortgage loan after payments.',
        formula: 'Previous Principal - Principal Paid This Year',
        aggregationNote: 'Summary shows the final month value of the year.'
    },
    {
        name: 'Mortgage Payments',
        description: 'Total annual mortgage payments (principal + interest).',
        formula: 'Monthly Payment × 12 (calculated using standard amortization formula)',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Principal Paid',
        description: 'Amount of principal paid down during the year.',
        formula: 'Calculated from monthly amortization schedule',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Interest Paid',
        description: 'Total interest paid on the mortgage during the year.',
        formula: 'Calculated from monthly amortization schedule',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Maintenance Fees',
        description: 'Annual maintenance costs for the property.',
        formula: 'Base Amount × (1 + Yearly Increase Rate)^Year',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Property Tax',
        description: 'Annual property tax payments.',
        formula: 'Base Amount × (1 + Yearly Increase Rate)^Year',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Insurance Paid',
        description: 'Annual insurance premiums.',
        formula: 'Fixed annual amount',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Utilities',
        description: 'Annual utility costs.',
        formula: 'Fixed annual amount',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Repairs',
        description: 'Annual repair and maintenance costs.',
        formula: 'Fixed annual amount',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Total Expenses',
        description: 'Sum of all expenses including mortgage payments.',
        formula: 'Mortgage Payments + Maintenance + Property Tax + Insurance + Utilities + Repairs',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Deductible Expenses',
        description: 'Expenses that can be deducted from rental income for tax purposes.',
        formula: 'Interest Paid + Maintenance + Property Tax + Insurance + Utilities + Repairs',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Rental Income',
        description: 'Annual rental income from the property.',
        formula: 'Monthly Rental × 12 × (1 + Yearly Increase Rate)^Year',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Taxable Income',
        description: 'Income subject to taxation after deductions.',
        formula: 'Rental Income - Deductible Expenses',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Taxes Due',
        description: 'Taxes owed on taxable income.',
        formula: 'Taxable Income × Marginal Tax Rate (if positive)',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Net Profit',
        description: 'Profit after all expenses and taxes.',
        formula: 'Rental Income - Total Expenses - Taxes Due',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Expected Return',
        description: 'Expected return based on cumulative investment and previous cumulative expected return.',
        formula: '(Cumulative Investment + Previous Cumulative Expected Return) × Monthly Return Rate',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Cumulative Investment',
        description: 'Total amount invested including downpayment and cumulative net profit.',
        formula: 'Downpayment + Sum of All Net Profits Up To This Year',
        aggregationNote: 'Summary shows the sum across all months in the year.'
    },
    {
        name: 'Cumulative Expected Return',
        description: 'Sum of expected return values up to and including the current row.',
        formula: 'Previous Cumulative Expected Return + Expected Return',
        aggregationNote: 'Summary shows the final month value of the year. Formula display shows the final month calculation as a template.'
    },
    {
        name: 'Home Value',
        description: 'Current market value of the property based on real estate market appreciation.',
        formula: 'Purchase Price × (1 + Monthly Market Increase Rate)^Months',
        aggregationNote: 'Summary shows the final month value of the year.'
    },
    {
        name: 'Capital Gains Tax',
        description: 'Tax on capital gains from property sale in Ontario, Canada. Capital gain = Sale Price - Purchase Price - Selling Costs. For individuals, 50% of capital gains are taxable (first $250k) and taxed at marginal tax rate. This calculator uses 50% inclusion rate for all gains.',
        formula: '(Sale Price - Purchase Price - Selling Costs) × 0.5 × Marginal Tax Rate',
        aggregationNote: 'Summary shows the final month value of the year.'
    },
    {
        name: 'Sales Fees',
        description: 'Real estate commission fees based on home value.',
        formula: 'Home Value × Commission Percentage',
        aggregationNote: 'Summary shows the final month value of the year.'
    },
    {
        name: 'Sale Income',
        description: 'Net proceeds from selling the property immediately (after deducting sales fees and capital gains tax).',
        formula: 'Home Value - Sales Fees - Capital Gains Tax',
        aggregationNote: 'Summary shows the final month value of the year.'
    },
    {
        name: 'Sale Net',
        description: 'Sale income minus principal owing on the mortgage.',
        formula: 'Sale Income - Principal Remaining',
        aggregationNote: 'Summary shows the final month value of the year.'
    },
    {
        name: 'Net Return',
        description: 'Sale net minus cumulative investment made into the property.',
        formula: 'Sale Net - Cumulative Investment',
        aggregationNote: 'Summary shows the final month value of the year.'
    },
    {
        name: 'Return %',
        description: 'Return percentage based on cumulative investment.',
        formula: '(Net Return / Cumulative Investment) × 100',
        aggregationNote: 'Summary shows the final month value of the year.'
    },
    {
        name: 'Return Comparison',
        description: 'Ratio comparing net return to cumulative expected return.',
        formula: 'Net Return / Cumulative Expected Return',
        aggregationNote: 'Summary shows the final month value of the year.'
    }
];
