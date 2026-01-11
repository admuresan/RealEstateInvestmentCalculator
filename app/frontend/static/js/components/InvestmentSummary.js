/**
 * Investment summary component that displays key insights for investors.
 */
export class InvestmentSummary {
    constructor(container, performanceContainer) {
        this.container = container;
        if (this.container) {
            this.container.className = 'investment-summary';
        }
        this.performanceContainer = performanceContainer;
        
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
        
        // Calculate total investment: downpayment + sum of all negative net profits
        // Positive profits are returns, not investments
        // Negative profits are additional cash invested into the property
        let totalInvestment = downpayment;
        results.forEach(result => {
            if (result.net_profit < 0) {
                totalInvestment += Math.abs(result.net_profit); // Add negative profits as investment
            }
        });
        
        // Recalculate metrics using correct totalInvestment
        // Backend calculates: sale_net = sale_gross - cumulative_investment
        // We need to recalculate using actual totalInvestment (downpayment + negative net profits)
        const saleGross = finalResult.sale_gross || 0;
        const saleNet = saleGross - totalInvestment;
        const totalReturn = saleNet;
        const returnPercent = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
        const returnComparison = finalResult.return_comparison || 0;
        const expectedReturnRate = inputValues.get('expected_return_rate') || 0;
        const cumulativeExpectedReturn = finalResult.cumulative_expected_return || 0;
        const homeValue = finalResult.home_value || purchasePrice;
        const numYears = Math.max(1, Math.floor(results.length / 12));

        // Calculate expected return net (cumulative expected return - total investment)
        const expectedReturnNet = cumulativeExpectedReturn - totalInvestment;
        const expectedReturnPercent = totalInvestment > 0 ? ((expectedReturnNet / totalInvestment) * 100) : 0;
        
        // Calculate net profit summary for the last year (sum of all 12 months of the last year)
        // This is the summary row value for the last year
        const lastYearStartMonth = (numYears - 1) * 12;
        const lastYearEndMonth = Math.min(numYears * 12 - 1, results.length - 1);
        let netProfitSummary = 0;
        for (let month = lastYearStartMonth; month <= lastYearEndMonth; month++) {
            const monthResult = results.find(r => r.month === month);
            if (monthResult) {
                netProfitSummary += (monthResult.net_profit || 0);
            }
        }
        
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
                        <span class="metric-label">Net Profit:</span>
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
                    ${this.generateInsights(finalResult, totalReturn, returnPercent, returnComparison, expectedReturnRate, cumulativeExpectedReturn, homeValue, purchasePrice, numYears, downpayment)}
                </ul>
            </div>

            <div class="summary-section">
                <h4 class="summary-section-title">⚠️ Important Considerations</h4>
                <ul class="summary-considerations">
                    <li><strong>Market Assumptions:</strong> This analysis assumes consistent rental income growth, property value appreciation, and expense increases. Real-world results may vary significantly.</li>
                    <li><strong>Tax Implications:</strong> Tax calculations are estimates based on your marginal tax rate. Consult a tax professional for accurate tax planning.</li>
                    <li><strong>Liquidity:</strong> Real estate is an illiquid investment. Consider your need for accessible funds before committing capital.</li>
                    <li><strong>Risk Factors:</strong> Property values can decline, tenants may default, and unexpected repairs can significantly impact returns.</li>
                    <li><strong>Alternative Investments:</strong> Compare this return (${returnPercent.toFixed(2)}%) against your expected return rate (${(expectedReturnRate * 100).toFixed(2)}%) for alternative investments to make an informed decision.</li>
                </ul>
            </div>
        `;

        // Update both containers
        if (this.performanceContent) {
            this.performanceContent.innerHTML = performanceHTML;
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
        
        const purchasePrice = inputValues.get('purchase_price') || 0;
        const downpaymentPercent = inputValues.get('downpayment_percentage') || 0;
        const downpayment = purchasePrice * (downpaymentPercent / 100);
        
        // Calculate total investment up to this year
        // Total investment = downpayment + sum of all negative net profits up to this point
        let totalInvestment = downpayment;
        results.forEach(result => {
            if (result.month <= targetMonth && result.net_profit < 0) {
                totalInvestment += Math.abs(result.net_profit);
            }
        });
        
        // Use sale_net from backend which is already calculated as sale_gross - cumulative_investment
        // But we need to recalculate using our totalInvestment calculation for consistency
        const saleGross = yearResult.sale_gross || 0;
        const saleNet = saleGross - totalInvestment;
        const totalReturn = saleNet;
        const returnPercent = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
        const returnComparison = yearResult.return_comparison || 0;
        const cumulativeExpectedReturn = yearResult.cumulative_expected_return || 0;
        
        // Calculate net profit summary for this year (sum of all 12 months in that year)
        // This is the summary row value - sum net_profit for months in this year
        // Year 5 = months 48-59 (12 months), Year 10 = months 108-119, etc.
        const yearStartMonth = (targetYear - 1) * 12; // Year 5 starts at month 48 (4*12)
        const yearEndMonth = targetYear * 12 - 1; // Year 5 ends at month 59 (5*12-1)
        let netProfitSummary = 0;
        for (let month = yearStartMonth; month <= yearEndMonth && month < results.length; month++) {
            const monthResult = results.find(r => r.month === month);
            if (monthResult) {
                netProfitSummary += (monthResult.net_profit || 0);
            }
        }
        
        return {
            year: targetYear,
            totalReturn,
            returnPercent,
            cumulativeExpectedReturn,
            returnComparison,
            totalInvestment,
            netProfit: netProfitSummary
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
                        <th>Net Profit</th>
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
            const downpaymentPercent = inputValues.get('downpayment_percentage') || 0;
            const downpayment = purchasePrice * (downpaymentPercent / 100);
            
            let totalInvestment = downpayment;
            results.forEach(result => {
                if (result.net_profit < 0) {
                    totalInvestment += Math.abs(result.net_profit);
                }
            });
            
            const saleGross = finalResult.sale_gross || 0;
            const saleNet = saleGross - totalInvestment;
            const totalReturn = saleNet;
            const returnPercent = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
            const returnComparison = finalResult.return_comparison || 0;
            const cumulativeExpectedReturn = finalResult.cumulative_expected_return || 0;
            
            // Calculate net profit summary for the last year (sum of all 12 months of the last year)
            // This is the summary row value for the last year
            const numYears = Math.max(1, Math.floor(results.length / 12));
            const lastYearStartMonth = (numYears - 1) * 12;
            const lastYearEndMonth = Math.min(numYears * 12 - 1, results.length - 1);
            let netProfitSummary = 0;
            for (let month = lastYearStartMonth; month <= lastYearEndMonth; month++) {
                const monthResult = results.find(r => r.month === month);
                if (monthResult) {
                    netProfitSummary += (monthResult.net_profit || 0);
                }
            }
            
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
                                <span class="metric-label">Net Profit:</span>
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
    }

    generateInsights(finalResult, totalReturn, returnPercent, returnComparison, expectedReturnRate, cumulativeExpectedReturn, homeValue, purchasePrice, numYears, downpayment) {
        const insights = [];

        // Return comparison insight
        if (returnComparison > 1) {
            insights.push(`<li><strong>Outperforming Alternative Investments:</strong> This property investment would generate ${((returnComparison - 1) * 100).toFixed(1)}% more return than investing the same capital at your expected return rate (${(expectedReturnRate * 100).toFixed(2)}%).</li>`);
        } else if (returnComparison < 1) {
            insights.push(`<li><strong>Underperforming Alternative Investments:</strong> This property investment would generate ${((1 - returnComparison) * 100).toFixed(1)}% less return than investing the same capital at your expected return rate (${(expectedReturnRate * 100).toFixed(2)}%).</li>`);
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
        const avgNetProfit = finalResult.net_profit || 0;
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
            insights.push(`<li><strong>Leverage Impact:</strong> Using mortgage financing (initial loan: ${this.formatCurrency(initialLoanAmount)}) amplifies your returns. Your initial downpayment of ${this.formatCurrency(downpayment)} has generated ${this.formatCurrency(totalReturn)} in returns.</li>`);
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
}

