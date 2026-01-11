/**
 * Chart component for displaying rental gains and rental income comparison over time.
 */
export class NetProfitRentalIncomeChart {
    constructor(parent) {
        this.chartData = {
            labels: [],
            netProfit: [],
            rentalIncome: [],
            totalExpenses: [],
            taxesDue: []
        };
        this.container = document.createElement('div');
        this.container.className = 'chart-container';
        const chartTitle = document.createElement('h2');
        chartTitle.textContent = 'Rental Gains vs Rental Income';
        chartTitle.className = 'chart-title';
        this.container.appendChild(chartTitle);
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'netProfitRentalIncomeChart';
        canvasContainer.appendChild(this.canvas);
        this.container.appendChild(canvasContainer);
        parent.appendChild(this.container);
        // Initialize empty chart
        this.initializeChart();
    }

    initializeChart() {
        // Check if Chart is available (loaded from CDN)
        if (typeof window.Chart === 'undefined') {
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
            if (window.Chart) {
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
        const Chart = window.Chart;
        if (!Chart) {
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
                        label: 'Rental Gains',
                        data: this.chartData.netProfit,
                        borderColor: 'rgb(40, 167, 69)',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Rental Income',
                        data: this.chartData.rentalIncome,
                        borderColor: 'rgb(0, 123, 255)',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Total Expenses',
                        data: this.chartData.totalExpenses,
                        borderColor: 'rgb(220, 53, 69)',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Taxes Due',
                        data: this.chartData.taxesDue,
                        borderColor: 'rgb(255, 193, 7)',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
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
        this.chartData.netProfit = [];
        this.chartData.rentalIncome = [];
        this.chartData.totalExpenses = [];
        this.chartData.taxesDue = [];

        results.forEach((result, index) => {
            // Skip month 0
            if (result.month === 0) {
                return;
            }
            // Create label - use year number
            const label = `Year ${result.year || Math.floor(result.month / 12) + 1}`;
            this.chartData.labels.push(label);
            // Rental Gains
            this.chartData.netProfit.push(result.rental_gains);
            // Rental Income
            this.chartData.rentalIncome.push(result.rental_income);
            // Total Expenses
            this.chartData.totalExpenses.push(result.total_expenses);
            // Taxes Due
            this.chartData.taxesDue.push(result.taxes_due);
        });

        // Update chart if it exists
        if (this.chart) {
            this.chart.data.labels = this.chartData.labels;
            this.chart.data.datasets[0].data = this.chartData.netProfit;
            this.chart.data.datasets[1].data = this.chartData.rentalIncome;
            this.chart.data.datasets[2].data = this.chartData.totalExpenses;
            this.chart.data.datasets[3].data = this.chartData.taxesDue;
            this.chart.update();
        }
        else {
            // Recreate chart if it doesn't exist
            this.createChart();
        }
    }
}

