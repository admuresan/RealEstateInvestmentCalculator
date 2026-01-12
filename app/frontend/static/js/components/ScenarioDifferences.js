/**
 * Scenario Differences component - displays a tabbed interface for comparing scenarios.
 * Tab 1: Summary View - table with fields as rows, scenarios as columns
 * Tab 2: Comparison - boxes showing each scenario pair comparison
 */
export class ScenarioDifferences {
    constructor(parent, getScenarioDataCallback) {
        this.parent = parent;
        this.getScenarioDataCallback = getScenarioDataCallback;
        this.isExpanded = false;
        this.popupWindow = null;
        this.activeTabIndex = 0;
        
        // Field labels for display (only editable/configurable fields)
        this.fieldLabels = {
            purchase_price: 'Purchase Price',
            downpayment_percentage: 'Downpayment %',
            closing_costs: 'Closing Costs',
            payment_type: 'Payment Type',
            interest_rate: 'Interest Rate',
            loan_years: 'Loan Years',
            maintenance_base: 'Maintenance Base',
            maintenance_increase: 'Maintenance Increase',
            property_tax_base: 'Property Tax Base',
            property_tax_increase: 'Property Tax Increase',
            insurance: 'Insurance',
            utilities: 'Utilities',
            repairs: 'Repairs',
            rental_income_base: 'Rental Income Base',
            rental_increase: 'Rental Increase',
            marginal_tax_rate: 'Marginal Tax Rate',
            expected_return_rate: 'Expected Return Rate',
            real_estate_market_increase: 'Real Estate Market Increase',
            commission_percentage: 'Commission %'
        };
        
        // Fields to exclude from comparison (auto-calculated/read-only fields)
        this.excludedFields = new Set([
            'land_transfer_tax' // Auto-calculated from purchase_price
        ]);
        
        this.container = document.createElement('div');
        this.container.className = 'scenario-differences-container';
        this.container.style.cssText = `
            width: 100%;
            margin-bottom: 1rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        `;
        
        this.createHeader();
        this.createContent();
        
        parent.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.className = 'scenario-differences-header';
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            cursor: pointer;
            user-select: none;
        `;
        
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        const collapseIcon = document.createElement('span');
        collapseIcon.className = 'scenario-differences-collapse-icon';
        collapseIcon.textContent = '▼';
        collapseIcon.style.cssText = `
            transition: transform 0.3s ease;
            font-size: 0.875rem;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Scenario Differences';
        title.style.cssText = `
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
        `;
        
        titleContainer.appendChild(collapseIcon);
        titleContainer.appendChild(title);
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 0.5rem;
        `;
        
        const popOutButton = document.createElement('button');
        popOutButton.textContent = '⤢';
        popOutButton.title = 'Open in new window';
        popOutButton.style.cssText = `
            padding: 0.5rem;
            border: 1px solid #dee2e6;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: background 0.2s;
        `;
        popOutButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openInNewWindow();
        });
        popOutButton.addEventListener('mouseenter', () => {
            popOutButton.style.background = '#e9ecef';
        });
        popOutButton.addEventListener('mouseleave', () => {
            popOutButton.style.background = 'white';
        });
        
        buttonContainer.appendChild(popOutButton);
        
        header.appendChild(titleContainer);
        header.appendChild(buttonContainer);
        
        header.addEventListener('click', () => {
            this.toggle();
        });
        
        this.container.appendChild(header);
        this.header = header;
        this.collapseIcon = collapseIcon;
    }
    
    createContent() {
        const content = document.createElement('div');
        content.className = 'scenario-differences-content';
        content.style.cssText = `
            display: none;
            flex-direction: column;
            overflow: hidden;
        `;
        
        // Create tabs header
        this.createTabsHeader(content);
        
        // Create tabs content area
        this.tabsContent = document.createElement('div');
        this.tabsContent.className = 'scenario-differences-tabs-content';
        this.tabsContent.style.cssText = `
            flex: 1;
            overflow: auto;
            padding: 1rem;
        `;
        content.appendChild(this.tabsContent);
        
        this.container.appendChild(content);
        this.content = content;
    }
    
    createTabsHeader(parent) {
        const tabsHeader = document.createElement('div');
        tabsHeader.className = 'scenario-differences-tabs-header';
        tabsHeader.style.cssText = `
            display: flex;
            border-bottom: 1px solid #dee2e6;
            background: #f8f9fa;
        `;
        
        const tabs = ['Summary View', 'Comparison'];
        this.tabButtons = [];
        
        tabs.forEach((tabName, index) => {
            const tabButton = document.createElement('button');
            tabButton.textContent = tabName;
            tabButton.dataset.tabIndex = index;
            tabButton.style.cssText = `
                padding: 0.75rem 1.5rem;
                border: none;
                background: transparent;
                color: #666;
                border-bottom: 2px solid transparent;
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.2s ease;
            `;
            
            tabButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setActiveTab(index);
            });
            
            tabsHeader.appendChild(tabButton);
            this.tabButtons.push(tabButton);
        });
        
        parent.appendChild(tabsHeader);
        this.tabsHeader = tabsHeader;
        
        // Set first tab as active
        this.setActiveTab(0);
    }
    
    setActiveTab(index) {
        this.activeTabIndex = index;
        
        this.tabButtons.forEach((button, i) => {
            if (i === index) {
                button.style.cssText = `
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: transparent;
                    color: #667eea;
                    border-bottom: 2px solid #667eea;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                `;
            } else {
                button.style.cssText = `
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: transparent;
                    color: #666;
                    border-bottom: 2px solid transparent;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s ease;
                `;
            }
        });
        
        this.updateContent();
    }
    
    toggle() {
        this.isExpanded = !this.isExpanded;
        
        if (this.isExpanded) {
            this.content.style.display = 'flex';
            this.collapseIcon.style.transform = 'rotate(0deg)';
            this.updateContent();
        } else {
            this.content.style.display = 'none';
            this.collapseIcon.style.transform = 'rotate(-90deg)';
        }
    }
    
    updateContent() {
        if (!this.isExpanded) return;
        
        if (this.activeTabIndex === 0) {
            this.updateSummaryView();
        } else {
            this.updateComparisonView();
        }
    }
    
    formatValue(value, key) {
        if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
            return 'N/A';
        }
        
        if (key === 'payment_type') {
            return String(value);
        }
        
        if (typeof value === 'number') {
            // Format percentages
            if (key.includes('percentage') || key.includes('rate') || key.includes('increase')) {
                return `${value.toFixed(2)}%`;
            }
            // Format currency
            if (key.includes('price') || key.includes('costs') || key.includes('tax') || 
                key.includes('insurance') || key.includes('utilities') || key.includes('repairs') ||
                key.includes('rental') || key.includes('maintenance') || key.includes('property_tax')) {
                return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            // Format years
            if (key.includes('years')) {
                return `${value} years`;
            }
            // Default number formatting
            return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        return String(value);
    }
    
    compareScenarios(scenario1Values, scenario2Values) {
        const differences = [];
        
        // Compare only editable/configurable fields (exclude auto-calculated ones)
        for (const [key, label] of Object.entries(this.fieldLabels)) {
            // Skip excluded (auto-calculated) fields
            if (this.excludedFields.has(key)) {
                continue;
            }
            
            const val1 = scenario1Values.get(key);
            const val2 = scenario2Values.get(key);
            
            // Check if values are different
            // Handle null/undefined/NaN
            const val1Normalized = (val1 === null || val1 === undefined || (typeof val1 === 'number' && isNaN(val1))) ? null : val1;
            const val2Normalized = (val2 === null || val2 === undefined || (typeof val2 === 'number' && isNaN(val2))) ? null : val2;
            
            // Compare values
            if (val1Normalized !== val2Normalized) {
                differences.push({
                    key,
                    label,
                    value1: val1Normalized,
                    value2: val2Normalized
                });
            }
        }
        
        return differences;
    }
    
    updateSummaryView() {
        if (!this.getScenarioDataCallback) return;
        
        const scenarioData = this.getScenarioDataCallback();
        if (!scenarioData || scenarioData.length === 0) {
            this.tabsContent.innerHTML = '<p style="padding: 1rem; color: #666;">No scenarios available for comparison.</p>';
            return;
        }
        
        const numScenarios = scenarioData.length;
        const scenarioNames = [];
        for (let i = 0; i < numScenarios; i++) {
            scenarioNames.push(scenarioData[i].name || `Scenario ${i + 1}`);
        }
        
        // Create table
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
            background: white;
        `;
        
        // Create header row
        const headerRow = document.createElement('tr');
        const fieldHeader = document.createElement('th');
        fieldHeader.textContent = 'Field';
        fieldHeader.style.cssText = `
            padding: 0.75rem;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            font-weight: 600;
            text-align: left;
            position: sticky;
            left: 0;
            z-index: 10;
            min-width: 200px;
        `;
        headerRow.appendChild(fieldHeader);
        
        for (let i = 0; i < numScenarios; i++) {
            const th = document.createElement('th');
            th.textContent = scenarioNames[i];
            th.style.cssText = `
                padding: 0.75rem;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                font-weight: 600;
                text-align: center;
                min-width: 150px;
            `;
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);
        
        // Separate rows into those with changes and those without
        const rowsWithChanges = [];
        const rowsWithoutChanges = [];
        
        // For each field, create a row
        for (const [key, label] of Object.entries(this.fieldLabels)) {
            if (this.excludedFields.has(key)) {
                continue;
            }
            
            // Get all values for this field across scenarios
            const values = [];
            for (let i = 0; i < numScenarios; i++) {
                const inputValues = scenarioData[i]?.inputValues;
                if (inputValues) {
                    const val = inputValues.get(key);
                    const normalized = (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) ? null : val;
                    values.push(normalized);
                } else {
                    values.push(null);
                }
            }
            
            // Find majority value (most common value)
            const valueCounts = new Map();
            values.forEach(val => {
                const count = valueCounts.get(val) || 0;
                valueCounts.set(val, count + 1);
            });
            
            let majorityValue = null;
            let maxCount = 0;
            valueCounts.forEach((count, val) => {
                if (count > maxCount) {
                    maxCount = count;
                    majorityValue = val;
                }
            });
            
            // Check if all values are different (no majority)
            const allDifferent = maxCount === 1 && numScenarios > 1;
            const hasChanges = allDifferent || (maxCount < numScenarios && numScenarios > 1);
            
            const rowData = { key, label, values, majorityValue, allDifferent, hasChanges };
            
            if (hasChanges) {
                rowsWithChanges.push(rowData);
            } else {
                rowsWithoutChanges.push(rowData);
            }
        }
        
        // Add rows with changes first
        rowsWithChanges.forEach(rowData => {
            const row = this.createSummaryRow(rowData, numScenarios);
            table.appendChild(row);
        });
        
        // Add collapsible section for rows without changes
        if (rowsWithoutChanges.length > 0) {
            const collapseRow = document.createElement('tr');
            collapseRow.className = 'collapse-toggle-row';
            collapseRow.style.cssText = `
                cursor: pointer;
                background: #f8f9fa;
            `;
            collapseRow.dataset.expanded = 'false';
            
            const collapseCell = document.createElement('td');
            collapseCell.colSpan = numScenarios + 1;
            collapseCell.style.cssText = `
                padding: 0.75rem;
                border: 1px solid #dee2e6;
                text-align: center;
                font-weight: 600;
                color: #666;
                user-select: none;
            `;
            
            const collapseIcon = document.createElement('span');
            collapseIcon.textContent = '▶';
            collapseIcon.style.cssText = `
                margin-right: 0.5rem;
                display: inline-block;
                transition: transform 0.2s ease;
            `;
            
            const collapseText = document.createElement('span');
            collapseText.textContent = `${rowsWithoutChanges.length} field${rowsWithoutChanges.length > 1 ? 's' : ''} with no changes`;
            
            collapseCell.appendChild(collapseIcon);
            collapseCell.appendChild(collapseText);
            collapseRow.appendChild(collapseCell);
            
            // Create container for collapsed rows
            const collapsedRowsContainer = document.createElement('tbody');
            collapsedRowsContainer.className = 'collapsed-rows-container';
            collapsedRowsContainer.style.cssText = `
                display: none;
            `;
            
            rowsWithoutChanges.forEach(rowData => {
                const row = this.createSummaryRow(rowData, numScenarios);
                collapsedRowsContainer.appendChild(row);
            });
            
            // Toggle functionality
            collapseRow.addEventListener('click', () => {
                const isExpanded = collapseRow.dataset.expanded === 'true';
                collapseRow.dataset.expanded = !isExpanded;
                
                if (!isExpanded) {
                    collapsedRowsContainer.style.display = '';
                    collapseIcon.style.transform = 'rotate(90deg)';
                    collapseText.textContent = `${rowsWithoutChanges.length} field${rowsWithoutChanges.length > 1 ? 's' : ''} with no changes`;
                } else {
                    collapsedRowsContainer.style.display = 'none';
                    collapseIcon.style.transform = 'rotate(0deg)';
                    collapseText.textContent = `${rowsWithoutChanges.length} field${rowsWithoutChanges.length > 1 ? 's' : ''} with no changes`;
                }
            });
            
            table.appendChild(collapseRow);
            table.appendChild(collapsedRowsContainer);
        }
        
        // Clear and add table
        this.tabsContent.innerHTML = '';
        this.tabsContent.appendChild(table);
    }
    
    createSummaryRow(rowData, numScenarios) {
        const { key, label, values, majorityValue, allDifferent } = rowData;
        
        const row = document.createElement('tr');
        
        // Field name cell
        const fieldCell = document.createElement('td');
        fieldCell.textContent = label;
        fieldCell.style.cssText = `
            padding: 0.75rem;
            border: 1px solid #dee2e6;
            background: #f8f9fa;
            font-weight: 600;
            position: sticky;
            left: 0;
            z-index: 5;
        `;
        row.appendChild(fieldCell);
        
        // Create cells for each scenario
        for (let i = 0; i < numScenarios; i++) {
            const cell = document.createElement('td');
            const value = values[i];
            cell.textContent = this.formatValue(value, key);
            cell.style.cssText = `
                padding: 0.75rem;
                border: 1px solid #dee2e6;
                text-align: center;
            `;
            
            // Highlight if different from majority, or if all are different
            if (allDifferent || (value !== majorityValue && majorityValue !== null)) {
                cell.style.backgroundColor = '#e3f2fd';
                cell.style.border = '2px solid #2196f3';
                cell.style.borderRadius = '4px';
            }
            
            row.appendChild(cell);
        }
        
        // If all different, highlight the entire row
        if (allDifferent) {
            row.style.backgroundColor = '#e3f2fd';
        }
        
        return row;
    }
    
    updateComparisonView() {
        if (!this.getScenarioDataCallback) return;
        
        const scenarioData = this.getScenarioDataCallback();
        if (!scenarioData || scenarioData.length === 0) {
            this.tabsContent.innerHTML = '<p style="padding: 1rem; color: #666;">No scenarios available for comparison.</p>';
            return;
        }
        
        const numScenarios = scenarioData.length;
        const scenarioNames = [];
        for (let i = 0; i < numScenarios; i++) {
            scenarioNames.push(scenarioData[i].name || `Scenario ${i + 1}`);
        }
        
        // Create grid container for comparison boxes
        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1rem;
            width: 100%;
        `;
        
        // Create comparison boxes for all pairs (square layout, not triangular)
        for (let i = 0; i < numScenarios; i++) {
            for (let j = 0; j < numScenarios; j++) {
                if (i === j) continue; // Skip same scenario comparisons
                
                const scenario1 = scenarioData[i];
                const scenario2 = scenarioData[j];
                
                if (!scenario1 || !scenario2 || !scenario1.inputValues || !scenario2.inputValues) {
                    continue;
                }
                
                const differences = this.compareScenarios(scenario1.inputValues, scenario2.inputValues);
                
                // Create comparison box
                const box = document.createElement('div');
                box.style.cssText = `
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                `;
                
                // Box header
                const header = document.createElement('div');
                header.style.cssText = `
                    font-weight: 600;
                    font-size: 1rem;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #667eea;
                    color: #333;
                `;
                header.textContent = `${scenarioNames[i]} vs ${scenarioNames[j]}`;
                box.appendChild(header);
                
                // Differences content
                if (differences.length === 0) {
                    const noDiff = document.createElement('div');
                    noDiff.textContent = 'No differences';
                    noDiff.style.cssText = `
                        color: #28a745;
                        font-style: italic;
                        padding: 0.5rem;
                    `;
                    box.appendChild(noDiff);
                } else {
                    const diffList = document.createElement('div');
                    diffList.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                    `;
                    
                    differences.forEach(diff => {
                        const diffItem = document.createElement('div');
                        diffItem.style.cssText = `
                            padding: 0.75rem;
                            background: #e3f2fd;
                            border-left: 3px solid #2196f3;
                            border-radius: 4px;
                        `;
                        
                        const label = document.createElement('div');
                        label.textContent = diff.label;
                        label.style.cssText = `
                            font-weight: 600;
                            margin-bottom: 0.5rem;
                            color: #1976d2;
                            font-size: 0.875rem;
                        `;
                        
                        const values = document.createElement('div');
                        values.style.cssText = `
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            font-size: 0.875rem;
                            color: #333;
                        `;
                        
                        const val1 = document.createElement('span');
                        val1.textContent = this.formatValue(diff.value1, diff.key);
                        val1.style.cssText = `
                            padding: 0.25rem 0.5rem;
                            background: #fff;
                            border-radius: 3px;
                            border: 1px solid #dee2e6;
                        `;
                        
                        const arrow = document.createElement('span');
                        arrow.textContent = '→';
                        arrow.style.cssText = `
                            color: #1976d2;
                            font-weight: bold;
                        `;
                        
                        const val2 = document.createElement('span');
                        val2.textContent = this.formatValue(diff.value2, diff.key);
                        val2.style.cssText = `
                            padding: 0.25rem 0.5rem;
                            background: #fff;
                            border-radius: 3px;
                            border: 1px solid #dee2e6;
                        `;
                        
                        values.appendChild(val1);
                        values.appendChild(arrow);
                        values.appendChild(val2);
                        
                        diffItem.appendChild(label);
                        diffItem.appendChild(values);
                        diffList.appendChild(diffItem);
                    });
                    
                    box.appendChild(diffList);
                }
                
                gridContainer.appendChild(box);
            }
        }
        
        // Clear and add grid
        this.tabsContent.innerHTML = '';
        this.tabsContent.appendChild(gridContainer);
    }
    
    openInNewWindow() {
        // Close existing popup if open
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.close();
        }
        
        // Create new window
        const width = 1200;
        const height = 800;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        
        this.popupWindow = window.open('', 'ScenarioDifferences', 
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
        
        if (!this.popupWindow) {
            alert('Please allow pop-ups for this site to open the scenario differences in a new window.');
            return;
        }
        
        // Write HTML content
        this.popupWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Scenario Differences</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        padding: 1rem;
                        background: #f5f5f5;
                    }
                    h1 {
                        margin-bottom: 1rem;
                        color: #333;
                    }
                    .tabs-header {
                        display: flex;
                        border-bottom: 1px solid #dee2e6;
                        background: #f8f9fa;
                        margin-bottom: 1rem;
                    }
                    .tab-button {
                        padding: 0.75rem 1.5rem;
                        border: none;
                        background: transparent;
                        color: #666;
                        border-bottom: 2px solid transparent;
                        cursor: pointer;
                        font-size: 0.875rem;
                        transition: all 0.2s ease;
                    }
                    .tab-button.active {
                        color: #667eea;
                        border-bottom: 2px solid #667eea;
                        font-weight: 600;
                    }
                    .tab-content {
                        display: none;
                    }
                    .tab-content.active {
                        display: block;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        background: white;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    th {
                        padding: 0.75rem;
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        font-weight: 600;
                        text-align: left;
                    }
                    th:first-child {
                        position: sticky;
                        left: 0;
                        z-index: 10;
                    }
                    td {
                        padding: 0.75rem;
                        border: 1px solid #dee2e6;
                        text-align: center;
                    }
                    td:first-child {
                        position: sticky;
                        left: 0;
                        z-index: 5;
                        background: #f8f9fa;
                        font-weight: 600;
                        text-align: left;
                    }
                    .comparison-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                        gap: 1rem;
                    }
                    .comparison-box {
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 8px;
                        padding: 1rem;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                </style>
            </head>
            <body>
                <h1>Scenario Differences</h1>
                <div class="tabs-header">
                    <button class="tab-button active" onclick="switchTab(0)">Summary View</button>
                    <button class="tab-button" onclick="switchTab(1)">Comparison</button>
                </div>
                <div id="summary-content" class="tab-content active"></div>
                <div id="comparison-content" class="tab-content"></div>
                <script>
                    function switchTab(index) {
                        document.querySelectorAll('.tab-button').forEach((btn, i) => {
                            btn.classList.toggle('active', i === index);
                        });
                        document.getElementById('summary-content').classList.toggle('active', index === 0);
                        document.getElementById('comparison-content').classList.toggle('active', index === 1);
                    }
                </script>
            </body>
            </html>
        `);
        
        this.popupWindow.document.close();
        
        // Wait for window to load, then populate content
        this.popupWindow.addEventListener('load', () => {
            this.updatePopupContent();
        });
        
        // Update content immediately (window might already be loaded)
        setTimeout(() => {
            this.updatePopupContent();
        }, 100);
    }
    
    updatePopupContent() {
        if (!this.popupWindow || this.popupWindow.closed) return;
        
        const scenarioData = this.getScenarioDataCallback();
        if (!scenarioData || scenarioData.length === 0) {
            this.popupWindow.document.getElementById('summary-content').innerHTML = 
                '<p style="padding: 1rem; color: #666;">No scenarios available for comparison.</p>';
            return;
        }
        
        // Update summary view
        this.updatePopupSummaryView();
        
        // Update comparison view
        this.updatePopupComparisonView();
    }
    
    updatePopupSummaryView() {
        const scenarioData = this.getScenarioDataCallback();
        const numScenarios = scenarioData.length;
        const scenarioNames = [];
        for (let i = 0; i < numScenarios; i++) {
            scenarioNames.push(scenarioData[i].name || `Scenario ${i + 1}`);
        }
        
        let tableHTML = '<table><tr><th>Field</th>';
        for (let i = 0; i < numScenarios; i++) {
            tableHTML += `<th>${scenarioNames[i]}</th>`;
        }
        tableHTML += '</tr>';
        
        // Separate rows into those with changes and those without
        const rowsWithChanges = [];
        const rowsWithoutChanges = [];
        
        for (const [key, label] of Object.entries(this.fieldLabels)) {
            if (this.excludedFields.has(key)) continue;
            
            const values = [];
            for (let i = 0; i < numScenarios; i++) {
                const inputValues = scenarioData[i]?.inputValues;
                if (inputValues) {
                    const val = inputValues.get(key);
                    const normalized = (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) ? null : val;
                    values.push(normalized);
                } else {
                    values.push(null);
                }
            }
            
            const valueCounts = new Map();
            values.forEach(val => {
                const count = valueCounts.get(val) || 0;
                valueCounts.set(val, count + 1);
            });
            
            let majorityValue = null;
            let maxCount = 0;
            valueCounts.forEach((count, val) => {
                if (count > maxCount) {
                    maxCount = count;
                    majorityValue = val;
                }
            });
            
            const allDifferent = maxCount === 1 && numScenarios > 1;
            const hasChanges = allDifferent || (maxCount < numScenarios && numScenarios > 1);
            
            const rowData = { key, label, values, majorityValue, allDifferent, hasChanges };
            
            if (hasChanges) {
                rowsWithChanges.push(rowData);
            } else {
                rowsWithoutChanges.push(rowData);
            }
        }
        
        // Add rows with changes first
        rowsWithChanges.forEach(rowData => {
            const { label, values, majorityValue, allDifferent } = rowData;
            const rowStyle = allDifferent ? 'background-color: #e3f2fd;' : '';
            tableHTML += `<tr style="${rowStyle}"><td>${label}</td>`;
            for (let i = 0; i < numScenarios; i++) {
                const value = values[i];
                const cellStyle = (allDifferent || (value !== majorityValue && majorityValue !== null)) 
                    ? 'background-color: #e3f2fd; border: 2px solid #2196f3; border-radius: 4px;' : '';
                tableHTML += `<td style="${cellStyle}">${this.formatValue(value, rowData.key)}</td>`;
            }
            tableHTML += '</tr>';
        });
        
        // Add collapsible section for rows without changes
        if (rowsWithoutChanges.length > 0) {
            const collapseId = 'collapse-' + Date.now();
            tableHTML += `
                <tr class="collapse-toggle-row" style="cursor: pointer; background: #f8f9fa;" onclick="toggleCollapse('${collapseId}')">
                    <td colspan="${numScenarios + 1}" style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: center; font-weight: 600; color: #666; user-select: none;">
                        <span id="${collapseId}-icon" style="margin-right: 0.5rem; display: inline-block; transition: transform 0.2s ease;">▶</span>
                        <span id="${collapseId}-text">${rowsWithoutChanges.length} field${rowsWithoutChanges.length > 1 ? 's' : ''} with no changes</span>
                    </td>
                </tr>
                <tbody id="${collapseId}-rows" style="display: none;">
            `;
            
            rowsWithoutChanges.forEach(rowData => {
                const { label, values, majorityValue, allDifferent } = rowData;
                const rowStyle = allDifferent ? 'background-color: #e3f2fd;' : '';
                tableHTML += `<tr style="${rowStyle}"><td>${label}</td>`;
                for (let i = 0; i < numScenarios; i++) {
                    const value = values[i];
                    const cellStyle = (allDifferent || (value !== majorityValue && majorityValue !== null)) 
                        ? 'background-color: #e3f2fd; border: 2px solid #2196f3; border-radius: 4px;' : '';
                    tableHTML += `<td style="${cellStyle}">${this.formatValue(value, rowData.key)}</td>`;
                }
                tableHTML += '</tr>';
            });
            
            tableHTML += '</tbody>';
        }
        
        tableHTML += '</table>';
        
        // Add toggle function to popup window
        if (!this.popupWindow.document.getElementById('toggle-script')) {
            const script = this.popupWindow.document.createElement('script');
            script.id = 'toggle-script';
            script.textContent = `
                function toggleCollapse(id) {
                    const rows = document.getElementById(id + '-rows');
                    const icon = document.getElementById(id + '-icon');
                    const text = document.getElementById(id + '-text');
                    const isExpanded = rows.style.display !== 'none';
                    
                    if (isExpanded) {
                        rows.style.display = 'none';
                        icon.style.transform = 'rotate(0deg)';
                        const count = rows.querySelectorAll('tr').length;
                        text.textContent = count + ' field' + (count > 1 ? 's' : '') + ' with no changes';
                    } else {
                        rows.style.display = '';
                        icon.style.transform = 'rotate(90deg)';
                        const count = rows.querySelectorAll('tr').length;
                        text.textContent = count + ' field' + (count > 1 ? 's' : '') + ' with no changes';
                    }
                }
            `;
            this.popupWindow.document.head.appendChild(script);
        }
        
        this.popupWindow.document.getElementById('summary-content').innerHTML = tableHTML;
    }
    
    updatePopupComparisonView() {
        const scenarioData = this.getScenarioDataCallback();
        const numScenarios = scenarioData.length;
        const scenarioNames = [];
        for (let i = 0; i < numScenarios; i++) {
            scenarioNames.push(scenarioData[i].name || `Scenario ${i + 1}`);
        }
        
        let gridHTML = '<div class="comparison-grid">';
        
        for (let i = 0; i < numScenarios; i++) {
            for (let j = 0; j < numScenarios; j++) {
                if (i === j) continue;
                
                const scenario1 = scenarioData[i];
                const scenario2 = scenarioData[j];
                
                if (!scenario1 || !scenario2 || !scenario1.inputValues || !scenario2.inputValues) {
                    continue;
                }
                
                const differences = this.compareScenarios(scenario1.inputValues, scenario2.inputValues);
                
                gridHTML += `<div class="comparison-box">`;
                gridHTML += `<div style="font-weight: 600; font-size: 1rem; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #667eea; color: #333;">${scenarioNames[i]} vs ${scenarioNames[j]}</div>`;
                
                if (differences.length === 0) {
                    gridHTML += `<div style="color: #28a745; font-style: italic; padding: 0.5rem;">No differences</div>`;
                } else {
                    differences.forEach(diff => {
                        gridHTML += `
                            <div style="padding: 0.75rem; background: #e3f2fd; border-left: 3px solid #2196f3; border-radius: 4px; margin-bottom: 0.75rem;">
                                <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1976d2; font-size: 0.875rem;">${diff.label}</div>
                                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #333;">
                                    <span style="padding: 0.25rem 0.5rem; background: #fff; border-radius: 3px; border: 1px solid #dee2e6;">${this.formatValue(diff.value1, diff.key)}</span>
                                    <span style="color: #1976d2; font-weight: bold;">→</span>
                                    <span style="padding: 0.25rem 0.5rem; background: #fff; border-radius: 3px; border: 1px solid #dee2e6;">${this.formatValue(diff.value2, diff.key)}</span>
                                </div>
                            </div>
                        `;
                    });
                }
                
                gridHTML += `</div>`;
            }
        }
        
        gridHTML += '</div>';
        this.popupWindow.document.getElementById('comparison-content').innerHTML = gridHTML;
    }
    
    refresh() {
        if (this.isExpanded) {
            this.updateContent();
        }
        if (this.popupWindow && !this.popupWindow.closed) {
            this.updatePopupContent();
        }
    }
}
