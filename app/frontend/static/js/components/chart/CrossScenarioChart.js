/**
 * Cross-scenario chart component for comparing data across multiple scenarios.
 * Features:
 * - Left and right y-axes with selectable columns
 * - Scenario selection checkboxes
 * - Scrollable column checkboxes on both sides
 */
export class CrossScenarioChart {
    constructor(parent) {
        this.allColumns = [
            'principal_remaining',
            'mortgage_payments',
            'principal_paid',
            'interest_paid',
            'maintenance_fees',
            'property_tax',
            'insurance_paid',
            'utilities',
            'repairs',
            'total_expenses',
            'deductible_expenses',
            'rental_income',
            'taxable_income',
            'taxes_due',
            'rental_gains',
            'cumulative_investment',
            'expected_return',
            'cumulative_expected_return',
            'home_value',
            'sales_fees',
            'capital_gains_tax',
            'sale_income',
            'sale_net',
            'net_return',
            'return_percent',
            'return_comparison'
        ];
        
        this.selectedLeftColumns = new Set();
        this.selectedRightColumns = new Set();
        this.selectedScenarios = new Set();
        this.scenarioData = new Map(); // Map of scenario index to { results, inputValues }
        this.scenarioNames = new Map(); // Map of scenario index to name
        
        // Load saved selections from localStorage
        this.loadSelections();
        
        this.container = document.createElement('div');
        this.container.className = 'cross-scenario-chart-container';
        this.container.style.cssText = `
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            max-height: 100%;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        `;
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Cross-Scenario Comparison';
        title.className = 'cross-scenario-chart-title';
        title.style.cssText = `
            padding: 1rem;
            margin: 0;
            border-bottom: 1px solid #e0e0e0;
            background: #f8f9fa;
            font-size: 1.2rem;
            font-weight: 600;
        `;
        this.container.appendChild(title);
        
        // Create main content area (chart + sidebars)
        const mainContent = document.createElement('div');
        mainContent.className = 'cross-scenario-main-content';
        mainContent.style.cssText = `
            display: flex;
            flex-direction: row;
            flex: 1;
            min-height: 0;
            overflow: hidden;
        `;
        
        // Create unified sidebar (column checkboxes with left/right options)
        this.leftSidebar = this.createUnifiedColumnSidebar();
        mainContent.appendChild(this.leftSidebar);
        
        // Create chart area
        const chartArea = document.createElement('div');
        chartArea.className = 'cross-scenario-chart-area';
        chartArea.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            padding: 1rem;
            padding-bottom: 1rem;
            min-height: 0;
            overflow: hidden;
        `;
        
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'cross-scenario-canvas-container';
        canvasContainer.style.cssText = `
            flex: 1;
            position: relative;
            min-height: 300px;
            margin-bottom: 1rem;
            min-width: 0;
        `;
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'crossScenarioChart';
        canvasContainer.appendChild(this.canvas);
        chartArea.appendChild(canvasContainer);
        
        mainContent.appendChild(chartArea);
        
        // Create legend sidebar (table-based legend)
        this.legendSidebar = this.createLegendSidebar();
        mainContent.appendChild(this.legendSidebar);
        
        this.container.appendChild(mainContent);
        
        // Create bottom scenario checkboxes
        const scenarioContainer = document.createElement('div');
        scenarioContainer.className = 'cross-scenario-scenario-container';
        scenarioContainer.style.cssText = `
            padding: 1rem;
            border-top: 1px solid #e0e0e0;
            background: #f8f9fa;
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
            flex-shrink: 0;
            max-height: 120px;
            overflow-y: auto;
            position: relative;
            z-index: 10;
        `;
        
        const scenarioLabel = document.createElement('span');
        scenarioLabel.textContent = 'Scenarios:';
        scenarioLabel.style.cssText = `
            font-weight: 600;
            margin-right: 0.5rem;
        `;
        scenarioContainer.appendChild(scenarioLabel);
        
        this.scenarioCheckboxesContainer = document.createElement('div');
        this.scenarioCheckboxesContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            flex: 1;
        `;
        scenarioContainer.appendChild(this.scenarioCheckboxesContainer);
        
        this.container.appendChild(scenarioContainer);
        
        parent.appendChild(this.container);
        
        // Initialize chart
        this.initializeChart();
    }
    
    createUnifiedColumnSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'cross-scenario-sidebar cross-scenario-sidebar-unified';
        sidebar.style.cssText = `
            width: 250px;
            display: flex;
            flex-direction: column;
            border-right: 1px solid #e0e0e0;
            background: #f8f9fa;
            overflow: hidden;
        `;
        
        const sidebarTitle = document.createElement('div');
        sidebarTitle.textContent = 'Y-Axis Selection';
        sidebarTitle.style.cssText = `
            padding: 0.75rem;
            font-weight: 600;
            border-bottom: 1px solid #e0e0e0;
            background: white;
        `;
        sidebar.appendChild(sidebarTitle);
        
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'cross-scenario-column-list-unified';
        scrollContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 0.5rem;
        `;
        
        // Create checkboxes for each column with left/right options
        this.allColumns.forEach(column => {
            const columnContainer = document.createElement('div');
            columnContainer.style.cssText = `
                padding: 0.5rem;
                border-radius: 4px;
                transition: background 0.2s;
                margin-bottom: 0.25rem;
            `;
            columnContainer.addEventListener('mouseenter', () => {
                columnContainer.style.background = '#e9ecef';
            });
            columnContainer.addEventListener('mouseleave', () => {
                columnContainer.style.background = 'transparent';
            });
            
            // Column name label
            const columnLabel = document.createElement('div');
            columnLabel.textContent = this.formatColumnName(column);
            columnLabel.style.cssText = `
                font-size: 0.9rem;
                font-weight: 500;
                margin-bottom: 0.25rem;
                user-select: none;
            `;
            columnContainer.appendChild(columnLabel);
            
            // Checkbox container for left and right
            const checkboxRow = document.createElement('div');
            checkboxRow.style.cssText = `
                display: flex;
                gap: 1rem;
                padding-left: 0.5rem;
            `;
            
            // Left Y-axis checkbox
            const leftLabel = document.createElement('label');
            leftLabel.style.cssText = `
                display: flex;
                align-items: center;
                cursor: pointer;
                font-size: 0.85rem;
                user-select: none;
            `;
            const leftCheckbox = document.createElement('input');
            leftCheckbox.type = 'checkbox';
            leftCheckbox.value = column;
            leftCheckbox.dataset.side = 'left';
            leftCheckbox.checked = this.selectedLeftColumns.has(column);
            leftCheckbox.style.cssText = `
                margin-right: 0.25rem;
                cursor: pointer;
            `;
            leftCheckbox.addEventListener('change', () => {
                this.handleColumnToggle('left', column, leftCheckbox.checked);
            });
            const leftLabelText = document.createElement('span');
            leftLabelText.textContent = 'Left';
            leftLabel.appendChild(leftCheckbox);
            leftLabel.appendChild(leftLabelText);
            checkboxRow.appendChild(leftLabel);
            
            // Right Y-axis checkbox
            const rightLabel = document.createElement('label');
            rightLabel.style.cssText = `
                display: flex;
                align-items: center;
                cursor: pointer;
                font-size: 0.85rem;
                user-select: none;
            `;
            const rightCheckbox = document.createElement('input');
            rightCheckbox.type = 'checkbox';
            rightCheckbox.value = column;
            rightCheckbox.dataset.side = 'right';
            rightCheckbox.checked = this.selectedRightColumns.has(column);
            rightCheckbox.style.cssText = `
                margin-right: 0.25rem;
                cursor: pointer;
            `;
            rightCheckbox.addEventListener('change', () => {
                this.handleColumnToggle('right', column, rightCheckbox.checked);
            });
            const rightLabelText = document.createElement('span');
            rightLabelText.textContent = 'Right';
            rightLabel.appendChild(rightCheckbox);
            rightLabel.appendChild(rightLabelText);
            checkboxRow.appendChild(rightLabel);
            
            columnContainer.appendChild(checkboxRow);
            scrollContainer.appendChild(columnContainer);
        });
        
        sidebar.appendChild(scrollContainer);
        return sidebar;
    }
    
    createLegendSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'cross-scenario-legend-sidebar';
        sidebar.style.cssText = `
            width: 375px;
            display: flex;
            flex-direction: column;
            border-left: 1px solid #e0e0e0;
            background: #f8f9fa;
            overflow: hidden;
        `;
        
        const sidebarTitle = document.createElement('div');
        sidebarTitle.textContent = 'Legend';
        sidebarTitle.style.cssText = `
            padding: 0.75rem;
            font-weight: 600;
            border-bottom: 1px solid #e0e0e0;
            background: white;
        `;
        sidebar.appendChild(sidebarTitle);
        
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'cross-scenario-legend-container';
        scrollContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            overflow-x: auto;
            padding: 0.5rem;
        `;
        
        this.legendTable = document.createElement('table');
        this.legendTable.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        `;
        scrollContainer.appendChild(this.legendTable);
        sidebar.appendChild(scrollContainer);
        
        return sidebar;
    }
    
    updateLegendTable() {
        if (!this.legendTable || !this.chart) return;
        
        // Clear existing table
        this.legendTable.innerHTML = '';
        
        // Get all selected columns (from both left and right)
        const allSelectedColumns = new Set([...this.selectedLeftColumns, ...this.selectedRightColumns]);
        if (allSelectedColumns.size === 0 || this.selectedScenarios.size === 0) {
            return;
        }
        
        // Get sorted scenario indices
        const sortedScenarios = Array.from(this.selectedScenarios).sort((a, b) => a - b);
        
        // Create header row
        const headerRow = document.createElement('tr');
        const emptyHeader = document.createElement('th');
        emptyHeader.style.cssText = `
            padding: 0.5rem;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #dee2e6;
            background: white;
            position: sticky;
            top: 0;
            z-index: 5;
        `;
        headerRow.appendChild(emptyHeader);
        
        sortedScenarios.forEach(scenarioIndex => {
            const scenarioName = this.scenarioNames.get(scenarioIndex) || `Scenario ${scenarioIndex + 1}`;
            const th = document.createElement('th');
            th.textContent = scenarioName;
            th.style.cssText = `
                padding: 0.5rem;
                text-align: center;
                font-weight: 600;
                border-bottom: 2px solid #dee2e6;
                background: white;
                position: sticky;
                top: 0;
                z-index: 5;
                font-size: 0.8rem;
            `;
            headerRow.appendChild(th);
        });
        this.legendTable.appendChild(headerRow);
        
        // Create rows for each column
        const sortedColumns = Array.from(allSelectedColumns).sort();
        sortedColumns.forEach(column => {
            const row = document.createElement('tr');
            
            // Column name cell
            const columnCell = document.createElement('td');
            columnCell.textContent = this.formatColumnName(column);
            columnCell.style.cssText = `
                padding: 0.5rem;
                text-align: left;
                font-weight: 500;
                border-bottom: 1px solid #e9ecef;
                background: white;
                white-space: nowrap;
            `;
            row.appendChild(columnCell);
            
            // Color cells for each scenario
            sortedScenarios.forEach(scenarioIndex => {
                const colorCell = document.createElement('td');
                colorCell.style.cssText = `
                    padding: 0.5rem;
                    text-align: center;
                    border-bottom: 1px solid #e9ecef;
                    background: white;
                `;
                
                // Find the dataset for this column and scenario
                const datasetLabel = `${this.scenarioNames.get(scenarioIndex) || `Scenario ${scenarioIndex + 1}`} - ${this.formatColumnName(column)}`;
                const dataset = this.chart.data.datasets.find(ds => ds.label === datasetLabel);
                
                if (dataset) {
                    const colorBox = document.createElement('div');
                    colorBox.style.cssText = `
                        width: 30px;
                        height: 20px;
                        background-color: ${dataset.borderColor};
                        border: 1px solid #dee2e6;
                        border-radius: 3px;
                        margin: 0 auto;
                    `;
                    colorCell.appendChild(colorBox);
                } else {
                    colorCell.textContent = '-';
                    colorCell.style.color = '#999';
                }
                
                row.appendChild(colorCell);
            });
            
            this.legendTable.appendChild(row);
        });
    }
    
    formatColumnName(column) {
        return column.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    handleColumnToggle(side, column, checked) {
        if (side === 'left') {
            if (checked) {
                this.selectedLeftColumns.add(column);
                // Remove from right if it's there
                this.selectedRightColumns.delete(column);
                // Update right checkbox
                const rightCheckbox = this.leftSidebar.querySelector(`input[value="${column}"][data-side="right"]`);
                if (rightCheckbox) {
                    rightCheckbox.checked = false;
                }
            } else {
                this.selectedLeftColumns.delete(column);
            }
        } else {
            if (checked) {
                this.selectedRightColumns.add(column);
                // Remove from left if it's there
                this.selectedLeftColumns.delete(column);
                // Update left checkbox
                const leftCheckbox = this.leftSidebar.querySelector(`input[value="${column}"][data-side="left"]`);
                if (leftCheckbox) {
                    leftCheckbox.checked = false;
                }
            } else {
                this.selectedRightColumns.delete(column);
            }
        }
        this.saveSelections();
        this.updateChart();
    }
    
    handleScenarioToggle(scenarioIndex, checked) {
        if (checked) {
            this.selectedScenarios.add(scenarioIndex);
        } else {
            this.selectedScenarios.delete(scenarioIndex);
        }
        this.saveSelections();
        this.updateChart();
    }
    
    updateScenarioList(scenarioCount, scenarioNames) {
        // Clear existing checkboxes
        this.scenarioCheckboxesContainer.innerHTML = '';
        
        // Validate saved scenario selections - remove invalid indices
        const validScenarios = new Set();
        this.selectedScenarios.forEach(index => {
            if (index >= 0 && index < scenarioCount) {
                validScenarios.add(index);
            }
        });
        this.selectedScenarios = validScenarios;
        
        // Update scenario names
        this.scenarioNames.clear();
        for (let i = 0; i < scenarioCount; i++) {
            const name = scenarioNames.get(i) || `Scenario ${i + 1}`;
            this.scenarioNames.set(i, name);
            
            // Create checkbox
            const checkboxContainer = document.createElement('label');
            checkboxContainer.style.cssText = `
                display: flex;
                align-items: center;
                padding: 0.5rem;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s;
                white-space: nowrap;
            `;
            checkboxContainer.addEventListener('mouseenter', () => {
                checkboxContainer.style.background = '#e9ecef';
            });
            checkboxContainer.addEventListener('mouseleave', () => {
                checkboxContainer.style.background = 'transparent';
            });
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = i;
            checkbox.checked = this.selectedScenarios.has(i);
            checkbox.style.cssText = `
                margin-right: 0.5rem;
                cursor: pointer;
            `;
            
            checkbox.addEventListener('change', () => {
                this.handleScenarioToggle(i, checkbox.checked);
            });
            
            const labelText = document.createElement('span');
            labelText.textContent = name;
            labelText.style.cssText = `
                font-size: 0.9rem;
                user-select: none;
            `;
            
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(labelText);
            this.scenarioCheckboxesContainer.appendChild(checkboxContainer);
        }
        
        // Select all scenarios by default if none are selected (and no saved selections)
        if (this.selectedScenarios.size === 0 && scenarioCount > 0) {
            for (let i = 0; i < scenarioCount; i++) {
                this.selectedScenarios.add(i);
                const checkbox = this.scenarioCheckboxesContainer.querySelector(`input[value="${i}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            }
            // Save default selection
            this.saveSelections();
        } else {
            // Save validated selections
            this.saveSelections();
        }
        
        this.updateChart();
        // Legend will be updated by updateChart -> updateLegendTable
    }
    
    saveSelections() {
        try {
            const selections = {
                leftColumns: Array.from(this.selectedLeftColumns),
                rightColumns: Array.from(this.selectedRightColumns),
                scenarios: Array.from(this.selectedScenarios)
            };
            localStorage.setItem('crossScenarioChartSelections', JSON.stringify(selections));
        } catch (error) {
            console.warn('Failed to save cross-scenario chart selections:', error);
        }
    }
    
    loadSelections() {
        try {
            const saved = localStorage.getItem('crossScenarioChartSelections');
            if (saved) {
                const selections = JSON.parse(saved);
                if (selections.leftColumns && Array.isArray(selections.leftColumns)) {
                    this.selectedLeftColumns = new Set(selections.leftColumns.filter(col => 
                        this.allColumns.includes(col)
                    ));
                }
                if (selections.rightColumns && Array.isArray(selections.rightColumns)) {
                    this.selectedRightColumns = new Set(selections.rightColumns.filter(col => 
                        this.allColumns.includes(col)
                    ));
                }
                if (selections.scenarios && Array.isArray(selections.scenarios)) {
                    // Store scenario indices, but they'll be validated when scenarios are loaded
                    this.selectedScenarios = new Set(selections.scenarios.map(s => parseInt(s)).filter(s => !isNaN(s)));
                }
            }
        } catch (error) {
            console.warn('Failed to load cross-scenario chart selections:', error);
        }
    }
    
    updateScenarioData(scenarioData) {
        this.scenarioData = scenarioData;
        this.updateChart();
    }
    
    initializeChart() {
        if (typeof window.Chart === 'undefined' && typeof Chart === 'undefined') {
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
            if (typeof window.Chart !== 'undefined' || typeof Chart !== 'undefined') {
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
        const ChartLib = window.Chart || Chart;
        if (typeof ChartLib === 'undefined') {
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
        
        // Generate separate color palettes for left and right axes
        // Expanded palette to ensure distinct colors for each scenario-column combination
        const leftAxisColors = [
            'rgb(220, 53, 69)',   // Red
            'rgb(40, 167, 69)',   // Green
            'rgb(0, 123, 255)',   // Blue
            'rgb(255, 193, 7)',   // Yellow
            'rgb(23, 162, 184)',  // Cyan
            'rgb(108, 117, 125)', // Gray
            'rgb(255, 87, 34)',   // Orange
            'rgb(156, 39, 176)',  // Purple
            'rgb(0, 188, 212)',   // Light Blue
            'rgb(76, 175, 80)',   // Light Green
            'rgb(233, 30, 99)',   // Pink
            'rgb(63, 81, 181)',   // Indigo
            'rgb(121, 85, 72)',   // Brown
            'rgb(96, 125, 139)',  // Blue Gray
            'rgb(255, 152, 0)',   // Deep Orange
            'rgb(139, 195, 74)',  // Light Green
            'rgb(205, 220, 57)',  // Lime
            'rgb(255, 235, 59)',  // Amber
            'rgb(244, 67, 54)',   // Red
            'rgb(33, 150, 243)'   // Blue
        ];
        
        const rightAxisColors = [
            'rgb(255, 99, 132)',  // Pink
            'rgb(54, 162, 235)',  // Light Blue
            'rgb(255, 206, 86)',  // Light Yellow
            'rgb(75, 192, 192)',  // Teal
            'rgb(153, 102, 255)', // Purple
            'rgb(255, 159, 64)',  // Orange
            'rgb(199, 199, 199)', // Light Gray
            'rgb(83, 102, 255)',  // Indigo
            'rgb(255, 99, 255)',  // Magenta
            'rgb(99, 255, 132)',  // Light Green
            'rgb(255, 20, 147)',  // Deep Pink
            'rgb(0, 191, 255)',   // Deep Sky Blue
            'rgb(255, 140, 0)',   // Dark Orange
            'rgb(50, 205, 50)',   // Lime Green
            'rgb(186, 85, 211)',  // Medium Orchid
            'rgb(255, 69, 0)',    // Red Orange
            'rgb(30, 144, 255)',  // Dodger Blue
            'rgb(255, 215, 0)',   // Gold
            'rgb(220, 20, 60)',   // Crimson
            'rgb(0, 206, 209)'    // Dark Turquoise
        ];
        
        const datasets = [];
        const allYears = new Set();
        
        // Collect all unique years from all selected scenarios
        this.selectedScenarios.forEach(scenarioIndex => {
            const data = this.scenarioData.get(scenarioIndex);
            if (data && data.results) {
                data.results.forEach(result => {
                    // Skip month 0
                    if (result.month === 0) return;
                    const year = result.year || Math.floor(result.month / 12) + 1;
                    allYears.add(year);
                });
            }
        });
        
        const sortedYears = Array.from(allYears).sort((a, b) => a - b);
        const sortedLabels = sortedYears.map(year => `Year ${year}`);
        
        // Create datasets for left y-axis columns
        let leftDatasetIndex = 0;
        this.selectedLeftColumns.forEach((column) => {
            this.selectedScenarios.forEach((scenarioIndex) => {
                const data = this.scenarioData.get(scenarioIndex);
                if (!data || !data.results) return;
                
                const scenarioName = this.scenarioNames.get(scenarioIndex) || `Scenario ${scenarioIndex + 1}`;
                // Use a combination of scenario and column to ensure unique colors
                const colorIndex = leftDatasetIndex % leftAxisColors.length;
                const baseColor = leftAxisColors[colorIndex];
                leftDatasetIndex++;
                
                // Group results by year and use the last month of each year
                const yearData = new Map();
                data.results.forEach(result => {
                    if (result.month === 0) return;
                    const year = result.year || Math.floor(result.month / 12) + 1;
                    // Keep the last month's data for each year
                    if (!yearData.has(year) || result.month > yearData.get(year).month) {
                        yearData.set(year, result);
                    }
                });
                
                // Create data points for this column and scenario
                const dataPoints = sortedYears.map(year => {
                    const result = yearData.get(year);
                    return result ? (result[column] !== undefined ? result[column] : null) : null;
                });
                
                datasets.push({
                    label: `${scenarioName} - ${this.formatColumnName(column)}`,
                    data: dataPoints,
                    borderColor: baseColor,
                    backgroundColor: baseColor.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                    yAxisID: 'y',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4
                });
            });
        });
        
        // Create datasets for right y-axis columns
        let rightDatasetIndex = 0;
        this.selectedRightColumns.forEach((column) => {
            this.selectedScenarios.forEach((scenarioIndex) => {
                const data = this.scenarioData.get(scenarioIndex);
                if (!data || !data.results) return;
                
                const scenarioName = this.scenarioNames.get(scenarioIndex) || `Scenario ${scenarioIndex + 1}`;
                // Use a combination of scenario and column to ensure unique colors
                const colorIndex = rightDatasetIndex % rightAxisColors.length;
                const baseColor = rightAxisColors[colorIndex];
                rightDatasetIndex++;
                
                // Group results by year and use the last month of each year
                const yearData = new Map();
                data.results.forEach(result => {
                    if (result.month === 0) return;
                    const year = result.year || Math.floor(result.month / 12) + 1;
                    // Keep the last month's data for each year
                    if (!yearData.has(year) || result.month > yearData.get(year).month) {
                        yearData.set(year, result);
                    }
                });
                
                // Create data points for this column and scenario
                const dataPoints = sortedYears.map(year => {
                    const result = yearData.get(year);
                    return result ? (result[column] !== undefined ? result[column] : null) : null;
                });
                
                datasets.push({
                    label: `${scenarioName} - ${this.formatColumnName(column)}`,
                    data: dataPoints,
                    borderColor: baseColor,
                    backgroundColor: baseColor.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                    yAxisID: 'y1',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4
                });
            });
        });
        
        this.chart = new ChartLib(ctx, {
            type: 'line',
            data: {
                labels: sortedLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 50
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                const value = context.parsed.y;
                                if (value === null) return null;
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
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Left Y-Axis ($)'
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
                            text: 'Right Y-Axis ($)'
                        },
                        grid: {
                            drawOnChartArea: false
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
        
        // Update legend table after chart is created
        // Use setTimeout to ensure chart is fully rendered
        setTimeout(() => {
            this.updateLegendTable();
        }, 100);
    }
    
    updateChart() {
        if (!this.chart) {
            this.createChart();
            return;
        }
        
        // Regenerate datasets with separate color palettes
        // Expanded palette to ensure distinct colors for each scenario-column combination
        const leftAxisColors = [
            'rgb(220, 53, 69)',   // Red
            'rgb(40, 167, 69)',   // Green
            'rgb(0, 123, 255)',   // Blue
            'rgb(255, 193, 7)',   // Yellow
            'rgb(23, 162, 184)',  // Cyan
            'rgb(108, 117, 125)', // Gray
            'rgb(255, 87, 34)',   // Orange
            'rgb(156, 39, 176)',  // Purple
            'rgb(0, 188, 212)',   // Light Blue
            'rgb(76, 175, 80)',   // Light Green
            'rgb(233, 30, 99)',   // Pink
            'rgb(63, 81, 181)',   // Indigo
            'rgb(121, 85, 72)',   // Brown
            'rgb(96, 125, 139)',  // Blue Gray
            'rgb(255, 152, 0)',   // Deep Orange
            'rgb(139, 195, 74)',  // Light Green
            'rgb(205, 220, 57)',  // Lime
            'rgb(255, 235, 59)',  // Amber
            'rgb(244, 67, 54)',   // Red
            'rgb(33, 150, 243)'   // Blue
        ];
        
        const rightAxisColors = [
            'rgb(255, 99, 132)',  // Pink
            'rgb(54, 162, 235)',  // Light Blue
            'rgb(255, 206, 86)',  // Light Yellow
            'rgb(75, 192, 192)',  // Teal
            'rgb(153, 102, 255)', // Purple
            'rgb(255, 159, 64)',  // Orange
            'rgb(199, 199, 199)', // Light Gray
            'rgb(83, 102, 255)',  // Indigo
            'rgb(255, 99, 255)',  // Magenta
            'rgb(99, 255, 132)',  // Light Green
            'rgb(255, 20, 147)',  // Deep Pink
            'rgb(0, 191, 255)',   // Deep Sky Blue
            'rgb(255, 140, 0)',   // Dark Orange
            'rgb(50, 205, 50)',   // Lime Green
            'rgb(186, 85, 211)',  // Medium Orchid
            'rgb(255, 69, 0)',    // Red Orange
            'rgb(30, 144, 255)',  // Dodger Blue
            'rgb(255, 215, 0)',   // Gold
            'rgb(220, 20, 60)',   // Crimson
            'rgb(0, 206, 209)'    // Dark Turquoise
        ];
        
        const datasets = [];
        const allYears = new Set();
        
        // Collect all unique years from all selected scenarios
        this.selectedScenarios.forEach(scenarioIndex => {
            const data = this.scenarioData.get(scenarioIndex);
            if (data && data.results) {
                data.results.forEach(result => {
                    // Skip month 0
                    if (result.month === 0) return;
                    const year = result.year || Math.floor(result.month / 12) + 1;
                    allYears.add(year);
                });
            }
        });
        
        const sortedYears = Array.from(allYears).sort((a, b) => a - b);
        const sortedLabels = sortedYears.map(year => `Year ${year}`);
        
        // Create datasets for left y-axis columns
        let leftDatasetIndex = 0;
        this.selectedLeftColumns.forEach((column) => {
            this.selectedScenarios.forEach((scenarioIndex) => {
                const data = this.scenarioData.get(scenarioIndex);
                if (!data || !data.results) return;
                
                const scenarioName = this.scenarioNames.get(scenarioIndex) || `Scenario ${scenarioIndex + 1}`;
                // Use a combination of scenario and column to ensure unique colors
                const colorIndex = leftDatasetIndex % leftAxisColors.length;
                const baseColor = leftAxisColors[colorIndex];
                leftDatasetIndex++;
                
                // Group results by year and use the last month of each year
                const yearData = new Map();
                data.results.forEach(result => {
                    if (result.month === 0) return;
                    const year = result.year || Math.floor(result.month / 12) + 1;
                    // Keep the last month's data for each year
                    if (!yearData.has(year) || result.month > yearData.get(year).month) {
                        yearData.set(year, result);
                    }
                });
                
                // Create data points for this column and scenario
                const dataPoints = sortedYears.map(year => {
                    const result = yearData.get(year);
                    return result ? (result[column] !== undefined ? result[column] : null) : null;
                });
                
                datasets.push({
                    label: `${scenarioName} - ${this.formatColumnName(column)}`,
                    data: dataPoints,
                    borderColor: baseColor,
                    backgroundColor: baseColor.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                    yAxisID: 'y',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4
                });
            });
        });
        
        // Create datasets for right y-axis columns
        let rightDatasetIndex = 0;
        this.selectedRightColumns.forEach((column) => {
            this.selectedScenarios.forEach((scenarioIndex) => {
                const data = this.scenarioData.get(scenarioIndex);
                if (!data || !data.results) return;
                
                const scenarioName = this.scenarioNames.get(scenarioIndex) || `Scenario ${scenarioIndex + 1}`;
                // Use a combination of scenario and column to ensure unique colors
                const colorIndex = rightDatasetIndex % rightAxisColors.length;
                const baseColor = rightAxisColors[colorIndex];
                rightDatasetIndex++;
                
                // Group results by year and use the last month of each year
                const yearData = new Map();
                data.results.forEach(result => {
                    if (result.month === 0) return;
                    const year = result.year || Math.floor(result.month / 12) + 1;
                    // Keep the last month's data for each year
                    if (!yearData.has(year) || result.month > yearData.get(year).month) {
                        yearData.set(year, result);
                    }
                });
                
                // Create data points for this column and scenario
                const dataPoints = sortedYears.map(year => {
                    const result = yearData.get(year);
                    return result ? (result[column] !== undefined ? result[column] : null) : null;
                });
                
                datasets.push({
                    label: `${scenarioName} - ${this.formatColumnName(column)}`,
                    data: dataPoints,
                    borderColor: baseColor,
                    backgroundColor: baseColor.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                    yAxisID: 'y1',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4
                });
            });
        });
        
        this.chart.data.labels = sortedLabels;
        this.chart.data.datasets = datasets;
        this.chart.update('none');
        
        // Update legend table after chart is updated
        // Use setTimeout to ensure chart is fully rendered
        setTimeout(() => {
            this.updateLegendTable();
        }, 100);
    }
}

