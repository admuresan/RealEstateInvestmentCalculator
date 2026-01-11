/**
 * Chart component for displaying return comparison ratio over time.
 */
export class ReturnComparisonOverTimeChart {
    constructor(parent) {
        this.chartData = {
            labels: [],
            returnComparison: []
        };
        this.container = document.createElement('div');
        this.container.className = 'chart-container';
        const chartTitle = document.createElement('h2');
        chartTitle.textContent = 'Return Comparison Over Time';
        chartTitle.className = 'chart-title';
        this.container.appendChild(chartTitle);
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'returnComparisonOverTimeChart';
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
        } else {
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
        // Create zero line data (array of zeros matching labels length)
        const zeroLineData = this.chartData.labels.map(() => 0);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.chartData.labels,
                datasets: [
                    {
                        label: 'Return Comparison Ratio',
                        data: this.chartData.returnComparison,
                        borderColor: 'rgb(128, 128, 128)', // Default color (will be overridden by segment)
                        segment: {
                            borderColor: function(ctx) {
                                const currentValue = ctx.p1.parsed.y;
                                const nextValue = ctx.p2.parsed.y;
                                // If both points are above zero, use green
                                if (currentValue >= 0 && nextValue >= 0) {
                                    return 'rgb(40, 167, 69)'; // Green
                                }
                                // If both points are below zero, use red
                                if (currentValue < 0 && nextValue < 0) {
                                    return 'rgb(220, 53, 69)'; // Red
                                }
                                // If crossing zero, determine color based on which side has more weight
                                // Use green if the average is positive, red if negative
                                const avg = (currentValue + nextValue) / 2;
                                return avg >= 0 ? 'rgb(40, 167, 69)' : 'rgb(220, 53, 69)';
                            }
                        },
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.4,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Zero Line',
                        data: zeroLineData,
                        borderColor: 'rgba(0, 0, 0, 0.5)',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        order: 0 // Draw behind the main line
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
                                return context.dataset.label + ': ' + value.toFixed(4);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (Months)'
                        },
                        ticks: {
                            maxTicksLimit: 20
                        }
                    },
                    y: {
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
                            color: function(context) {
                                if (context.tick.value === 0) {
                                    return 'rgba(0, 0, 0, 0.5)'; // Darker line for y = 0
                                }
                                return 'rgba(0, 0, 0, 0.1)'; // Lighter lines for other grid lines
                            },
                            lineWidth: function(context) {
                                if (context.tick.value === 0) {
                                    return 2; // Thicker line for y = 0
                                }
                                return 1; // Normal thickness for other grid lines
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
        this.chartData.returnComparison = [];
        
        // Filter out month 0
        const filteredResults = results.filter(result => result.month !== 0);
        
        filteredResults.forEach((result) => {
            // Create label - use cumulative month number
            const label = `${result.month}`;
            this.chartData.labels.push(label);
            // Return Comparison = net_return / cumulative_expected_return
            const returnComparison = result.return_comparison || 0;
            this.chartData.returnComparison.push(returnComparison);
        });
        
        // Update chart if it exists
        if (this.chart) {
            // Create zero line data (array of zeros matching labels length)
            const zeroLineData = this.chartData.labels.map(() => 0);
            
            this.chart.data.labels = this.chartData.labels;
            this.chart.data.datasets[0].data = this.chartData.returnComparison;
            this.chart.data.datasets[1].data = zeroLineData;
            this.chart.update();
        } else {
            // Recreate chart if it doesn't exist
            this.createChart();
        }
    }
}

