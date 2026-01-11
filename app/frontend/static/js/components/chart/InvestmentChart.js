/**
 * Chart component for displaying investment metrics over time.
 */
export class InvestmentChart {
    constructor(parent) {
        this.chartData = {
            labels: [],
            owing: [],
            paid: [],
            interestPaid: [],
            homeValue: []
        };
        this.container = document.createElement('div');
        this.container.className = 'chart-container';
        const chartTitle = document.createElement('h2');
        chartTitle.textContent = 'Investment Overview';
        chartTitle.className = 'chart-title';
        this.container.appendChild(chartTitle);
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'investmentChart';
        canvasContainer.appendChild(this.canvas);
        this.container.appendChild(canvasContainer);
        parent.appendChild(this.container);
        // Initialize empty chart
        this.initializeChart();
    }
    initializeChart() {
        // Check if Chart is available (loaded from CDN)
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded. Loading from CDN...');
            this.loadChartJS().then(() => {
                this.createChart();
            });
        }
        else {
            this.createChart();
        }
    }
    loadChartJS() {
        return new Promise((resolve, reject) => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Chart.js'));
            document.head.appendChild(script);
        });
    }
    createChart() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not available');
            return;
        }
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.chartData.labels,
                datasets: [
                    {
                        label: 'Amount Owing',
                        data: this.chartData.owing,
                        borderColor: 'rgb(220, 53, 69)',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Amount Paid',
                        data: this.chartData.paid,
                        borderColor: 'rgb(40, 167, 69)',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Interest Paid',
                        data: this.chartData.interestPaid,
                        borderColor: 'rgb(255, 193, 7)',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Home Value',
                        data: this.chartData.homeValue,
                        borderColor: 'rgb(0, 123, 255)',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                const value = context.parsed.y;
                                return context.dataset.label + ': $' + value.toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                });
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (Years)'
                        },
                        ticks: {
                            maxTicksLimit: 20
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        },
                        ticks: {
                            callback: function (value) {
                                return '$' + value.toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                });
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
    updateData(results) {
        // Clear previous data
        this.chartData.labels = [];
        this.chartData.owing = [];
        this.chartData.paid = [];
        this.chartData.interestPaid = [];
        this.chartData.homeValue = [];
        // Calculate cumulative amounts
        let cumulativePrincipalPaid = 0;
        let cumulativeInterestPaid = 0;
        results.forEach((result, index) => {
            // Create label - use year number
            const label = `Year ${result.year || Math.floor(result.month / 12) + 1}`;
            this.chartData.labels.push(label);
            // Amount owing = principal remaining
            this.chartData.owing.push(result.principal_remaining);
            // Amount paid = cumulative total paid (principal + interest)
            cumulativePrincipalPaid += result.principal_paid;
            cumulativeInterestPaid += result.interest_paid;
            const totalPaid = cumulativePrincipalPaid + cumulativeInterestPaid;
            this.chartData.paid.push(totalPaid);
            // Interest paid = cumulative interest paid
            this.chartData.interestPaid.push(cumulativeInterestPaid);
            // Home value = current market value
            this.chartData.homeValue.push(result.home_value);
        });
        // Update chart if it exists
        if (this.chart) {
            this.chart.data.labels = this.chartData.labels;
            this.chart.data.datasets[0].data = this.chartData.owing;
            this.chart.data.datasets[1].data = this.chartData.paid;
            this.chart.data.datasets[2].data = this.chartData.interestPaid;
            this.chart.data.datasets[3].data = this.chartData.homeValue;
            this.chart.update();
        }
        else {
            // Recreate chart if it doesn't exist
            this.createChart();
        }
    }
}
