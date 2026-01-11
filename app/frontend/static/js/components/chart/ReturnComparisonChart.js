/**
 * Chart component for displaying return comparison metrics.
 */
export class ReturnComparisonChart {
    constructor(parent) {
        this.chartData = {
            labels: [],
            returnIfInvested: [],
            returnOnPurchase: [],
            returnComparison: []
        };
        this.container = document.createElement('div');
        this.container.className = 'chart-container';
        const chartTitle = document.createElement('h2');
        chartTitle.textContent = 'Return Comparison';
        chartTitle.className = 'chart-title';
        this.container.appendChild(chartTitle);
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'returnComparisonChart';
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
        // Create break even line data for return comparison ratio (matching returnComparison length) at y = 1
        const zeroLineData = this.chartData.returnComparison.map(() => 1);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.chartData.labels,
                datasets: [
                    {
                        label: 'Return if Invested',
                        data: this.chartData.returnIfInvested,
                        borderColor: 'rgb(102, 126, 234)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Return on Purchase',
                        data: this.chartData.returnOnPurchase,
                        borderColor: 'rgb(118, 75, 162)',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Return Comparison Ratio',
                        data: this.chartData.returnComparison,
                        borderColor: function(context) {
                            // This function is for the legend color - use green as default
                            return 'rgb(40, 167, 69)';
                        },
                        segment: {
                            borderColor: function(ctx) {
                                // Check if parsed values exist - use p0 and p1 for segment endpoints
                                if (!ctx.p0 || !ctx.p0.parsed || ctx.p0.parsed.y === null || ctx.p0.parsed.y === undefined ||
                                    !ctx.p1 || !ctx.p1.parsed || ctx.p1.parsed.y === null || ctx.p1.parsed.y === undefined) {
                                    return 'rgb(128, 128, 128)'; // Default gray for null/undefined
                                }
                                const currentValue = ctx.p0.parsed.y;
                                const nextValue = ctx.p1.parsed.y;
                                // Green for values >= 1 (above break even line)
                                if (currentValue >= 1 && nextValue >= 1) {
                                    return 'rgb(40, 167, 69)'; // Green
                                }
                                // Red for values < 1 (below break even line)
                                if (currentValue < 1 && nextValue < 1) {
                                    return 'rgb(220, 53, 69)'; // Red
                                }
                                // When crossing break even (1), use the average to determine color
                                const avg = (currentValue + nextValue) / 2;
                                return avg >= 1 ? 'rgb(40, 167, 69)' : 'rgb(220, 53, 69)';
                            }
                        },
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Break Even Line',
                        data: zeroLineData,
                        borderColor: 'rgba(0, 0, 0, 0.5)',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        yAxisID: 'y1',
                        order: 0
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
                                const datasetLabel = context.dataset.label;
                                if (datasetLabel === 'Return Comparison Ratio') {
                                    return datasetLabel + ': ' + value.toFixed(4);
                                } else if (datasetLabel === 'Zero Line') {
                                    return null; // Don't show zero line in tooltip
                                } else {
                                    return datasetLabel + ': $' + value.toLocaleString('en-US', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    });
                                }
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
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Return ($)'
                        },
                        ticks: {
                            callback: function (value) {
                                return '$' + value.toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                });
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Ratio (Net Return / Cumulative Expected Return)'
                        },
                        ticks: {
                            callback: function (value) {
                                return value.toFixed(2);
                            }
                        },
                        grid: {
                            drawOnChartArea: false // Only draw grid for left axis
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
        this.chartData.returnIfInvested = [];
        this.chartData.returnOnPurchase = [];
        this.chartData.returnComparison = [];
        
        // Filter out month 0 for all data
        const filteredResults = results.filter(result => result.month !== 0);
        
        filteredResults.forEach((result) => {
            // Create label - use year number
            const label = `Year ${result.year || Math.floor(result.month / 12) + 1}`;
            this.chartData.labels.push(label);
            // Return if Invested = cumulative_expected_return (not the difference)
            this.chartData.returnIfInvested.push(result.cumulative_expected_return);
            // Return on Purchase = net_return
            this.chartData.returnOnPurchase.push(result.net_return);
            // Return Comparison Ratio
            const returnComparison = result.return_comparison || 0;
            this.chartData.returnComparison.push(returnComparison);
        });
        
        // Update chart if it exists
        if (this.chart) {
            // Create zero line data for return comparison ratio
            const zeroLineData = this.chartData.returnComparison.map(() => 0);
            
            this.chart.data.labels = this.chartData.labels;
            this.chart.data.datasets[0].data = this.chartData.returnIfInvested;
            this.chart.data.datasets[1].data = this.chartData.returnOnPurchase;
            this.chart.data.datasets[2].data = this.chartData.returnComparison;
            // Create break even line data at y = 1
            const breakEvenLineData = this.chartData.returnComparison.map(() => 1);
            this.chart.data.datasets[3].data = breakEvenLineData;
            this.chart.update();
        }
        else {
            // Recreate chart if it doesn't exist
            this.createChart();
        }
    }
}

