/**
 * Investment summary component that displays key insights for investors.
 */
import { FormulaModal } from './FormulaModal.js';
import { COLUMN_DEFINITIONS } from './sidebar/ColumnInfo.js';

export class InvestmentSummary {
    constructor(container, performanceContainer) {
        this.container = container;
        if (this.container) {
            this.container.className = 'investment-summary';
        }
        this.performanceContainer = performanceContainer;
        
        // Initialize formula modal
        this.formulaModal = new FormulaModal();
        this.columnDefinitions = COLUMN_DEFINITIONS;
        
        // Create summary content structure
        this.createStructure();
    }

    createStructure() {
        // Clear any existing content
        if (this.container) {
            this.container.innerHTML = '';
        }
        if (this.performanceContainer) {
            this.performanceContainer.innerHTML = '';
        }

        // Title
        if (this.container) {
            const title = document.createElement('h3');
            title.className = 'summary-title';
            title.textContent = 'Investment Summary & Key Insights';
            this.container.appendChild(title);

            // Summary content container
            this.contentContainer = document.createElement('div');
            this.contentContainer.className = 'summary-content';
            this.container.appendChild(this.contentContainer);
        } else {
            this.contentContainer = null;
        }

        // Performance content container (at top)
        if (this.performanceContainer) {
            this.performanceContent = document.createElement('div');
            this.performanceContent.className = 'performance-content';
            this.performanceContainer.appendChild(this.performanceContent);
        }

        // Initially show placeholder
        this.showPlaceholder();
    }

    showPlaceholder() {
        if (this.contentContainer) {
            this.contentContainer.innerHTML = '<p class="summary-placeholder">Complete the form and run calculations to see investment insights.</p>';
        }
        if (this.performanceContent) {
            this.performanceContent.innerHTML = '';
        }
    }

    updateSummary(results, inputValues, scenarioNumber = null) {
        if (!results || results.length === 0) {
            this.showPlaceholder();
            return;
        }

        // Get the final result (last month of the last year)
        const finalResult = results[results.length - 1];
        const firstResult = results.find(r => r.month === 0) || results[0];
        
        // Calculate key metrics
        const purchasePrice = inputValues.get('purchase_price') || 0;
        const downpaymentPercent = inputValues.get('downpayment_percentage') || 0;
        const downpayment = purchasePrice * (downpaymentPercent / 100);
        const closingCosts = inputValues.get('closing_costs') || 0;
        const landTransferTax = inputValues.get('land_transfer_tax') || 0;
        const totalInitialInvestment = downpayment + closingCosts + landTransferTax;
        
        // Use backend-calculated values (new calculation method)
        // Cumulative Investment = Total Initial Investment + max(0, -Cumulative Rental Gains)
        // Net Return = (Sale Net - Total Initial Investment) + max(0, Cumulative Rental Gains)
        const totalInvestment = finalResult.cumulative_investment || totalInitialInvestment;
        const netReturn = finalResult.net_return || 0;
        const totalReturn = netReturn;
        const returnPercent = finalResult.return_percent || 0;
        const returnComparison = finalResult.return_comparison || 0;
        const expectedReturnRate = inputValues.get('expected_return_rate') || 0;
        const cumulativeExpectedReturn = finalResult.cumulative_expected_return || 0;
        const homeValue = finalResult.home_value || purchasePrice;
        const numYears = Math.max(1, Math.floor(results.length / 12));

        // Calculate expected return net (cumulative expected return - total investment)
        const expectedReturnNet = cumulativeExpectedReturn - totalInvestment;
        const expectedReturnPercent = totalInvestment > 0 ? ((expectedReturnNet / totalInvestment) * 100) : 0;
        
        // Calculate rental gains summary (sum of all rental gains across all months)
        let netProfitSummary = 0;
        results.forEach(result => {
            netProfitSummary += (result.rental_gains || 0);
        });
        
        // Build Overall Performance HTML (for top container)
        // If scenarioNumber is provided, this is a single scenario row
        // Otherwise, it's the full performance section
        const performanceHTML = `
            <div class="summary-section">
                <h4 class="summary-section-title">📊 Overall Performance</h4>
                <div class="summary-metrics">
                    <div class="summary-metric">
                        <span class="metric-label">Total Investment:</span>
                        <span class="metric-value">${this.formatCurrency(totalInvestment)}</span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Home Sale Price:</span>
                        <span class="metric-value">${this.formatCurrency(homeValue)}</span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Total Rental Gains:</span>
                        <span class="metric-value ${netProfitSummary >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(netProfitSummary)}
                        </span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Return if Sold:</span>
                        <span class="metric-value ${totalReturn >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(totalReturn)}
                        </span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Return %:</span>
                        <span class="metric-value ${returnPercent >= 0 ? 'positive' : 'negative'}">
                            ${returnPercent.toFixed(2)}%
                        </span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Expected Investment Return:</span>
                        <span class="metric-value ${cumulativeExpectedReturn >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(cumulativeExpectedReturn)}
                        </span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Comparison:</span>
                        <span class="metric-value ${returnComparison < 1 ? 'negative' : returnComparison > 1 ? 'positive' : ''}">
                            ${returnComparison.toFixed(4)}x
                        </span>
                    </div>
                </div>
            </div>
        `;

        // Build summary HTML (for bottom container - Key Insights + Important Considerations)
        const summaryHTML = `
            <div class="summary-section">
                <h4 class="summary-section-title">💡 Key Insights</h4>
                <ul class="summary-insights">
                    ${this.generateInsights(finalResult, totalReturn, returnPercent, returnComparison, expectedReturnRate, cumulativeExpectedReturn, homeValue, purchasePrice, numYears, totalInitialInvestment, downpayment)}
                </ul>
            </div>

            <div class="summary-section">
                <h4 class="summary-section-title">⚠️ Important Considerations</h4>
                <ul class="summary-considerations">
                    <li><strong>Market Assumptions:</strong> This analysis assumes consistent rental income growth, property value appreciation, and expense increases. Real-world results may vary significantly.</li>
                    <li><strong>Tax Implications:</strong> Tax calculations are estimates based on your marginal tax rate. Consult a tax professional for accurate tax planning.</li>
                    <li><strong>Liquidity:</strong> Real estate is an illiquid investment. Consider your need for accessible funds before committing capital.</li>
                    <li><strong>Risk Factors:</strong> Property values can decline, tenants may default, and unexpected repairs can significantly impact returns.</li>
                    <li><strong>Alternative Investments:</strong> Compare this return (${returnPercent.toFixed(2)}%) against your expected return rate (${(expectedReturnRate).toFixed(2)}%) for alternative investments to make an informed decision.</li>
                </ul>
            </div>
        `;

        // Update both containers
        if (this.performanceContent) {
            this.performanceContent.innerHTML = performanceHTML;
            // Add formula modal click handlers to metric values
            this.attachFormulaHandlers(this.performanceContent, results, inputValues);
        }
        if (this.contentContainer) {
            this.contentContainer.innerHTML = summaryHTML;
        }
    }

    /**
     * Calculate metrics for a specific year interval
     */
    calculateMetricsForYear(results, inputValues, targetYear) {
        // Find the result at the target year (12 months per year)
        // Use the last month of the target year (month = targetYear * 12 - 1)
        // Year 5 would be months 48-59, so last month is 59 = 5 * 12 - 1
        const targetMonth = targetYear * 12 - 1;
        const yearResult = results.find(r => r.month === targetMonth) || 
                          results[Math.min(targetMonth, results.length - 1)];
        
        if (!yearResult) return null;
        
        // Use backend-calculated values (new calculation method)
        const totalInvestment = yearResult.cumulative_investment || 0;
        const netReturn = yearResult.net_return || 0;
        const totalReturn = netReturn;
        const returnPercent = yearResult.return_percent || 0;
        const returnComparison = yearResult.return_comparison || 0;
        const cumulativeExpectedReturn = yearResult.cumulative_expected_return || 0;
        const homeValue = yearResult.home_value || purchasePrice;
        
        // Calculate rental gains summary for this year (sum of all 12 months in that year)
        // This is the summary row value - sum net_profit for months in this year
        // Year 5 = months 48-59 (12 months), Year 10 = months 108-119, etc.
        const yearStartMonth = (targetYear - 1) * 12; // Year 5 starts at month 48 (4*12)
        const yearEndMonth = targetYear * 12 - 1; // Year 5 ends at month 59 (5*12-1)
        let netProfitSummary = 0;
        for (let month = yearStartMonth; month <= yearEndMonth && month < results.length; month++) {
            const monthResult = results.find(r => r.month === month);
            if (monthResult) {
                netProfitSummary += (monthResult.rental_gains || 0);
            }
        }
        
        return {
            year: targetYear,
            totalReturn,
            returnPercent,
            cumulativeExpectedReturn,
            returnComparison,
            totalInvestment,
            netProfit: netProfitSummary,
            homeValue: homeValue
        };
    }

    /**
     * Generate 5-year interval data for a metric
     */
    generateIntervalData(results, inputValues, metricType) {
        const numYears = Math.max(1, Math.floor(results.length / 12));
        const intervals = [];
        
        for (let year = 5; year <= numYears; year += 5) {
            const metrics = this.calculateMetricsForYear(results, inputValues, year);
            if (metrics) {
                intervals.push(metrics);
            }
        }
        
        return intervals;
    }

    /**
     * Build 5-year interval data table for a scenario
     */
    buildIntervalDataTable(results, inputValues) {
        const intervals = this.generateIntervalData(results, inputValues, 'all');
        
        if (!intervals || intervals.length === 0) {
            return '<div class="no-interval-data">No 5-year interval data available</div>';
        }
        
        // Build table header
        const tableHTML = `
            <table class="interval-data-table">
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>Total Investment</th>
                        <th>Home Sale Price</th>
                        <th>Rental Gains</th>
                        <th>Return if Sold</th>
                        <th>Return %</th>
                        <th>Expected Investment Return</th>
                        <th>Comparison</th>
                    </tr>
                </thead>
                <tbody>
                    ${intervals.map(interval => `
                        <tr>
                            <td class="interval-year">Year ${interval.year}</td>
                            <td class="metric-value">
                                ${this.formatCurrency(interval.totalInvestment)}
                            </td>
                            <td class="metric-value">
                                ${this.formatCurrency(interval.homeValue)}
                            </td>
                            <td class="metric-value ${interval.netProfit >= 0 ? 'positive' : 'negative'}">
                                ${this.formatCurrency(interval.netProfit)}
                            </td>
                            <td class="metric-value ${interval.totalReturn >= 0 ? 'positive' : 'negative'}">
                                ${this.formatCurrency(interval.totalReturn)}
                            </td>
                            <td class="metric-value ${interval.returnPercent >= 0 ? 'positive' : 'negative'}">
                                ${interval.returnPercent.toFixed(2)}%
                            </td>
                            <td class="metric-value ${interval.cumulativeExpectedReturn >= 0 ? 'positive' : 'negative'}">
                                ${this.formatCurrency(interval.cumulativeExpectedReturn)}
                            </td>
                            <td class="metric-value ${interval.returnComparison < 1 ? 'negative' : interval.returnComparison > 1 ? 'positive' : ''}">
                                ${interval.returnComparison.toFixed(4)}x
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        return tableHTML;
    }

    /**
     * Update performance section with multiple scenario rows
     */
    updateMultipleScenarios(scenariosData) {
        if (!this.performanceContent) return;
        
        if (!scenariosData || scenariosData.length === 0) {
            this.performanceContent.innerHTML = '';
            return;
        }

        // Build performance rows for each scenario
        const rowsHTML = scenariosData.map((scenario, index) => {
            const { results, inputValues } = scenario;
            if (!results || results.length === 0) return '';
            
            const finalResult = results[results.length - 1];
            const purchasePrice = inputValues.get('purchase_price') || 0;
            // Use backend-calculated values (new calculation method)
            const totalInvestment = finalResult.cumulative_investment || 0;
            const netReturn = finalResult.net_return || 0;
            const totalReturn = netReturn;
            const returnPercent = finalResult.return_percent || 0;
            const returnComparison = finalResult.return_comparison || 0;
            const cumulativeExpectedReturn = finalResult.cumulative_expected_return || 0;
            const homeValue = finalResult.home_value || purchasePrice;
            
            // Calculate rental gains summary (sum of all rental gains across all months)
            let netProfitSummary = 0;
            results.forEach(result => {
                netProfitSummary += (result.rental_gains || 0);
            });
            
            return `
                <div class="expandable-scenario-row" data-scenario-index="${index}">
                    <div class="scenario-performance-row">
                        <div class="scenario-number expandable-scenario-header">
                            <span class="scenario-name">Scenario ${index + 1}</span>
                            <span class="expand-icon">▼</span>
                        </div>
                        <div class="scenario-metrics">
                            <div class="summary-metric">
                                <span class="metric-label">Total Investment:</span>
                                <span class="metric-value">${this.formatCurrency(totalInvestment)}</span>
                            </div>
                            <div class="summary-metric">
                                <span class="metric-label">Home Sale Price:</span>
                                <span class="metric-value">${this.formatCurrency(homeValue)}</span>
                            </div>
                            <div class="summary-metric">
                                <span class="metric-label">Total Rental Gains:</span>
                                <span class="metric-value ${netProfitSummary >= 0 ? 'positive' : 'negative'}">
                                    ${this.formatCurrency(netProfitSummary)}
                                </span>
                            </div>
                            <div class="summary-metric">
                                <span class="metric-label">Return if Sold:</span>
                                <span class="metric-value ${totalReturn >= 0 ? 'positive' : 'negative'}">
                                    ${this.formatCurrency(totalReturn)}
                                </span>
                            </div>
                            <div class="summary-metric">
                                <span class="metric-label">Return %:</span>
                                <span class="metric-value ${returnPercent >= 0 ? 'positive' : 'negative'}">
                                    ${returnPercent.toFixed(2)}%
                                </span>
                            </div>
                            <div class="summary-metric">
                                <span class="metric-label">Expected Investment Return:</span>
                                <span class="metric-value ${cumulativeExpectedReturn >= 0 ? 'positive' : 'negative'}">
                                    ${this.formatCurrency(cumulativeExpectedReturn)}
                                </span>
                            </div>
                            <div class="summary-metric">
                                <span class="metric-label">Comparison:</span>
                                <span class="metric-value ${returnComparison < 1 ? 'negative' : returnComparison > 1 ? 'positive' : ''}">
                                    ${returnComparison.toFixed(4)}x
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="scenario-interval-content">
                        <h5 class="interval-content-title">5-Year Interval Breakdown</h5>
                        ${this.buildIntervalDataTable(results, inputValues)}
                    </div>
                </div>
            `;
        }).join('');

        const performanceHTML = `
            <div class="summary-section">
                <h4 class="summary-section-title">📊 Overall Performance</h4>
                <div class="scenarios-performance-container">
                    ${rowsHTML}
                </div>
            </div>
        `;

        this.performanceContent.innerHTML = performanceHTML;
        
        // Add click event listeners to expandable scenario headers
        const expandableHeaders = this.performanceContent.querySelectorAll('.expandable-scenario-header');
        expandableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const expandableScenario = header.closest('.expandable-scenario-row');
                if (expandableScenario) {
                    expandableScenario.classList.toggle('expanded');
                }
            });
        });
        
        // Add formula modal click handlers to metric values in each scenario row
        scenariosData.forEach((scenario, index) => {
            const { results, inputValues } = scenario;
            const scenarioRow = this.performanceContent.querySelector(`[data-scenario-index="${index}"]`);
            if (scenarioRow) {
                // Handle collapsed mode (scenario-performance-row)
                const collapsedRow = scenarioRow.querySelector('.scenario-performance-row');
                if (collapsedRow) {
                    this.attachFormulaHandlers(collapsedRow, results, inputValues);
                }
                
                // Handle expanded mode (interval table)
                const intervalTable = scenarioRow.querySelector('.interval-data-table');
                if (intervalTable) {
                    this.attachIntervalTableFormulaHandlers(intervalTable, results, inputValues);
                }
            }
        });
    }

    generateInsights(finalResult, totalReturn, returnPercent, returnComparison, expectedReturnRate, cumulativeExpectedReturn, homeValue, purchasePrice, numYears, totalInitialInvestment, downpayment) {
        const insights = [];

        // Return comparison insight
        if (returnComparison > 1) {
            insights.push(`<li><strong>Outperforming Alternative Investments:</strong> This property investment would generate ${((returnComparison - 1) * 100).toFixed(1)}% more return than investing the same capital at your expected return rate (${(expectedReturnRate).toFixed(2)}%).</li>`);
        } else if (returnComparison < 1) {
            insights.push(`<li><strong>Underperforming Alternative Investments:</strong> This property investment would generate ${((1 - returnComparison) * 100).toFixed(1)}% less return than investing the same capital at your expected return rate (${(expectedReturnRate ).toFixed(2)}%).</li>`)
        } else {
            insights.push(`<li><strong>Similar Performance:</strong> This property investment performs similarly to your expected return rate for alternative investments.</li>`);
        }

        // Property appreciation insight
        const appreciation = homeValue - purchasePrice;
        const appreciationPercent = (appreciation / purchasePrice) * 100;
        if (appreciationPercent > 0) {
            insights.push(`<li><strong>Property Appreciation:</strong> The property value has appreciated by ${this.formatCurrency(appreciation)} (${appreciationPercent.toFixed(2)}%) over ${numYears} years, contributing significantly to your total return.</li>`);
        }

        // Cash flow insight
        const avgNetProfit = finalResult.rental_gains || 0;
        if (avgNetProfit > 0) {
            insights.push(`<li><strong>Positive Cash Flow:</strong> The property generates positive monthly cash flow, providing ongoing income throughout the investment period.</li>`);
        } else if (avgNetProfit < 0) {
            insights.push(`<li><strong>Negative Cash Flow:</strong> The property requires additional monthly investment to cover expenses. Total return relies primarily on property appreciation.</li>`);
        }

        // Leverage insight
        const initialLoanAmount = purchasePrice - downpayment;
        if (initialLoanAmount > 0 && finalResult.principal_remaining !== undefined) {
            const remainingLoan = finalResult.principal_remaining || 0;
            const principalPaid = initialLoanAmount - remainingLoan;
            insights.push(`<li><strong>Leverage Impact:</strong> Using mortgage financing (initial loan: ${this.formatCurrency(initialLoanAmount)}) amplifies your returns. Your initial investment of ${this.formatCurrency(totalInitialInvestment)} (including downpayment, closing costs, and land transfer tax) has generated ${this.formatCurrency(totalReturn)} in returns.</li>`);
        }

        // Tax benefits insight
        if (finalResult.deductible_expenses > 0) {
            insights.push(`<li><strong>Tax Benefits:</strong> Deductible expenses (interest, maintenance, property tax, etc.) reduce your taxable income, providing tax advantages over the investment period.</li>`);
        }

        return insights.join('');
    }

    formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return '$0.00';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    /**
     * Map metric label to column name for formula display
     */
    getColumnNameForMetric(metricLabel) {
        const metricToColumnMap = {
            'Total Investment': 'Cumulative Investment',
            'Home Sale Price': 'Home Value',
            'Total Rental Gains': 'Cumulative Rental Gains',
            'Return if Sold': 'Net Return',
            'Return %': 'Return %',
            'Expected Investment Return': 'Cumulative Expected Return',
            'Comparison': 'Return Comparison'
        };
        return metricToColumnMap[metricLabel] || null;
    }

    /**
     * Show formula modal for a metric
     */
    showFormulaForMetric(metricLabel, data, inputValues, results = null) {
        const columnName = this.getColumnNameForMetric(metricLabel);
        if (!columnName || !this.formulaModal) return;

        const columnDef = this.columnDefinitions.find(def => def.name === columnName);
        if (!columnDef) return;

        // For "Total Rental Gains", we need to show Cumulative Rental Gains formula
        // but note that it's the sum across all months
        let formula = columnDef.formula;
        let title = columnName;
        let yearDataForModal = null; // Default to null for final value display
        
        if (metricLabel === 'Total Rental Gains') {
            const numMonths = results ? results.length : 0;
            formula = columnDef.formula + ` (summed across ${numMonths} months)`;
            title = `${columnName} (Total - Sum of All Months)`;
            // For Total Rental Gains, pass all results so it can show the cumulative calculation
            yearDataForModal = results;
        } else {
            title = `${columnName} (Final Value)`;
            // For other metrics (like Cumulative Expected Return), pass null to show as final value, not year summary
            // The data object already contains the final month's values
            yearDataForModal = null;
        }

        this.formulaModal.show(
            columnName,
            formula,
            data,
            inputValues,
            yearDataForModal
        );

        // Update title if needed
        if (this.formulaModal.titleElement && metricLabel === 'Total Rental Gains') {
            this.formulaModal.titleElement.textContent = title;
        }
    }

    /**
     * Attach formula modal handlers to metric values in a container
     */
    attachFormulaHandlers(container, results, inputValues) {
        if (!container || !this.formulaModal) return;

        const finalResult = results && results.length > 0 ? results[results.length - 1] : null;
        if (!finalResult) return;

        // Find all metric-value spans
        const metricValues = container.querySelectorAll('.metric-value');
        metricValues.forEach(metricValue => {
            // Find the corresponding metric label
            const metricContainer = metricValue.closest('.summary-metric');
            if (!metricContainer) return;

            const metricLabel = metricContainer.querySelector('.metric-label');
            if (!metricLabel) return;

            const labelText = metricLabel.textContent.replace(':', '').trim();
            
            // Add right-click handler
            metricValue.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showFormulaForMetric(labelText, finalResult, inputValues, results);
            });

            // Add cursor and title
            metricValue.style.cursor = 'context-menu';
            metricValue.title = 'Right-click to see formula';
        });
    }

    /**
     * Attach formula modal handlers to interval table cells
     */
    attachIntervalTableFormulaHandlers(table, results, inputValues) {
        if (!table || !this.formulaModal) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td.metric-value');
            cells.forEach((cell, index) => {
                // Skip first cell (Year)
                if (index === 0) return;

                // Map column index to metric label
                const columnLabels = [
                    'Total Investment',
                    'Home Sale Price',
                    'Total Rental Gains',
                    'Return if Sold',
                    'Return %',
                    'Expected Investment Return',
                    'Comparison'
                ];

                const metricLabel = columnLabels[index - 1];
                if (!metricLabel) return;

                // Get the year from the first cell
                const yearCell = row.querySelector('.interval-year');
                if (!yearCell) return;

                const yearMatch = yearCell.textContent.match(/Year (\d+)/);
                if (!yearMatch) return;

                const targetYear = parseInt(yearMatch[1], 10);
                const yearMetrics = this.calculateMetricsForYear(results, inputValues, targetYear);
                
                if (!yearMetrics) return;

                // Create a data object similar to finalResult for this year
                const yearData = {
                    cumulative_investment: yearMetrics.totalInvestment,
                    home_value: yearMetrics.homeValue,
                    cumulative_rental_gains: yearMetrics.netProfit, // This is the sum for the year
                    net_return: yearMetrics.totalReturn,
                    return_percent: yearMetrics.returnPercent,
                    cumulative_expected_return: yearMetrics.cumulativeExpectedReturn,
                    return_comparison: yearMetrics.returnComparison
                };

                // Add right-click handler
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // For year intervals, we need to get the last month of that year
                    const targetMonth = targetYear * 12 - 1;
                    const yearResult = results.find(r => r.month === targetMonth) || 
                                      results[Math.min(targetMonth, results.length - 1)];
                    
                    if (yearResult) {
                        // For interval table, "Total Rental Gains" is the sum for that year only
                        // So we need special handling
                        if (metricLabel === 'Total Rental Gains') {
                            // Show Rental Gains formula (not Cumulative) with year-specific note
                            const columnDef = this.columnDefinitions.find(def => def.name === 'Rental Gains');
                            if (columnDef) {
                                const yearStartMonth = (targetYear - 1) * 12;
                                const yearEndMonth = targetYear * 12 - 1;
                                const yearResults = results.filter(r => 
                                    r.month >= yearStartMonth && r.month <= yearEndMonth
                                );
                                
                                // Use the last month of the year for data, but pass all year results
                                this.formulaModal.show(
                                    'Rental Gains',
                                    columnDef.formula + ` (summed across 12 months for Year ${targetYear})`,
                                    yearResult,
                                    inputValues,
                                    yearResults
                                );
                                
                                // Update title
                                if (this.formulaModal.titleElement) {
                                    this.formulaModal.titleElement.textContent = `Rental Gains (Year ${targetYear} - Sum of 12 Months)`;
                                }
                            }
                        } else {
                            // For other metrics, use the standard method but with year-specific title
                            const yearStartMonth = (targetYear - 1) * 12;
                            const yearEndMonth = targetYear * 12 - 1;
                            const yearResults = results.filter(r => 
                                r.month >= yearStartMonth && r.month <= yearEndMonth
                            );
                            
                            const columnName = this.getColumnNameForMetric(metricLabel);
                            if (columnName) {
                                const columnDef = this.columnDefinitions.find(def => def.name === columnName);
                                if (columnDef) {
                                    this.formulaModal.show(
                                        columnName,
                                        columnDef.formula + ` (Year ${targetYear} - Final Month Value)`,
                                        yearResult,
                                        inputValues,
                                        yearResults
                                    );
                                    
                                    // Update title to include year
                                    if (this.formulaModal.titleElement) {
                                        this.formulaModal.titleElement.textContent = `${columnName} (Year ${targetYear} - Final Month)`;
                                    }
                                }
                            }
                        }
                    }
                });

                // Add cursor and title
                cell.style.cursor = 'context-menu';
                cell.title = 'Right-click to see formula';
            });
        });
    }
}

