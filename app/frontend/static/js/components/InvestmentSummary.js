/**
 * Investment summary component that displays key insights for investors.
 */
export class InvestmentSummary {
    constructor(container, performanceContainer) {
        this.container = container;
        this.container.className = 'investment-summary';
        this.performanceContainer = performanceContainer;
        
        // Create summary content structure
        this.createStructure();
    }

    createStructure() {
        // Clear any existing content
        this.container.innerHTML = '';
        if (this.performanceContainer) {
            this.performanceContainer.innerHTML = '';
        }

        // Title
        const title = document.createElement('h3');
        title.className = 'summary-title';
        title.textContent = 'Investment Summary & Key Insights';
        this.container.appendChild(title);

        // Summary content container
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'summary-content';
        this.container.appendChild(this.contentContainer);

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
        this.contentContainer.innerHTML = '<p class="summary-placeholder">Complete the form and run calculations to see investment insights.</p>';
        if (this.performanceContent) {
            this.performanceContent.innerHTML = '';
        }
    }

    updateSummary(results, inputValues) {
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
        
        // Build Overall Performance HTML (for top container)
        const performanceHTML = `
            <div class="summary-section">
                <h4 class="summary-section-title">📊 Overall Performance</h4>
                <div class="summary-metrics">
                    <div class="summary-metric">
                        <span class="metric-label">Total Return:</span>
                        <span class="metric-value ${totalReturn >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(totalReturn)}
                        </span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Return Percentage:</span>
                        <span class="metric-value ${returnPercent >= 0 ? 'positive' : 'negative'}">
                            ${returnPercent.toFixed(2)}%
                        </span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Expected Return:</span>
                        <span class="metric-value ${cumulativeExpectedReturn >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(cumulativeExpectedReturn)}
                        </span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Return Comparison:</span>
                        <span class="metric-value ${returnComparison < 1 ? 'negative' : returnComparison > 1 ? 'positive' : ''}">
                            ${returnComparison.toFixed(4)}x
                        </span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">Total Investment:</span>
                        <span class="metric-value">${this.formatCurrency(totalInvestment)}</span>
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
        this.contentContainer.innerHTML = summaryHTML;
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

