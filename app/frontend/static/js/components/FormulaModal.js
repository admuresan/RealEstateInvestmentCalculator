/**
 * Formula modal component that displays formula breakdown with actual values and annotations.
 */
export class FormulaModal {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.labelColorMap = new Map(); // Maps label to color
        this.resizeObserver = null; // Store observer for cleanup
        this.colorPalette = [
            { bg: '#fff3cd', border: '#ffc107', text: '#856404' }, // Yellow (default)
            { bg: '#d1ecf1', border: '#0dcaf0', text: '#055160' }, // Cyan
            { bg: '#d4edda', border: '#28a745', text: '#155724' }, // Green
            { bg: '#f8d7da', border: '#dc3545', text: '#721c24' }, // Red
            { bg: '#e2e3e5', border: '#6c757d', text: '#383d41' }, // Gray
            { bg: '#cfe2ff', border: '#0d6efd', text: '#084298' }, // Blue
            { bg: '#f5c6cb', border: '#e83e8c', text: '#721c24' }, // Pink
            { bg: '#d6f5d6', border: '#20c997', text: '#0f5132' }, // Teal
            { bg: '#ffeaa7', border: '#fdcb6e', text: '#856404' }, // Light Yellow
            { bg: '#dfe6e9', border: '#636e72', text: '#2d3436' }, // Dark Gray
        ];
        // Expansion state tracking
        this.currentColumnName = null;
        this.currentData = null;
        this.currentInputValues = null;
        this.currentYearData = null;
        this.expansionHistory = []; // Stack of previous formula states
        this.currentFormulaContainer = null;
        this.currentFormulaContent = null;
        this.currentSvg = null;
        this.currentBreakdown = null;
        // Original state (before any expansions)
        this.originalColumnName = null;
        this.originalData = null;
        this.originalInputValues = null;
        this.originalYearData = null;
        this.originalBreakdown = null;
        // Mapping from labels to column keys for expansion
        this.labelToColumnKey = {
            'Sale Income': 'sale_income',
            'Sale Net': 'sale_net',
            'Home Value': 'home_value',
            'Sales Fees': 'sales_fees',
            'Capital Gains Tax': 'capital_gains_tax',
            'Principal Remaining': 'principal_remaining',
            'Net Return': 'net_return',
            'Cumulative Investment': 'cumulative_investment',
            'Total Expenses': 'total_expenses',
            'Deductible Expenses': 'deductible_expenses',
            'Taxable Income': 'taxable_income',
            'Taxes Due': 'taxes_due',
            'Rental Gains': 'rental_gains',
            'Cumulative Rental Gains': 'cumulative_rental_gains',
            'Rental Income': 'rental_income',
            'Mortgage Payments': 'mortgage_payments',
            'Principal Paid': 'principal_paid',
            'Interest Paid': 'interest_paid',
            'Maintenance': 'maintenance_fees',
            'Property Tax': 'property_tax',
            'Insurance': 'insurance_paid',
            'Utilities': 'utilities',
            'Repairs': 'repairs',
            'Expected Return': 'expected_return',
            'Cumulative Expected Return': 'cumulative_expected_return',
            'Previous Cumulative Expected Return': 'cumulative_expected_return',
            'Current Rental Gains': 'rental_gains',
            'Previous Cumulative Rental Gains': 'cumulative_rental_gains',
            'Cumulative Losses': 'cumulative_rental_gains',
            'Monthly Payment': 'mortgage_payments'
        };
        this.createModal();
    }
    
    getColorForLabel(label) {
        if (!label) return this.colorPalette[0]; // Default yellow
        
        // If label already has a color, return it
        if (this.labelColorMap.has(label)) {
            return this.labelColorMap.get(label);
        }
        
        // Assign next available color
        const colorIndex = this.labelColorMap.size % this.colorPalette.length;
        const color = this.colorPalette[colorIndex];
        this.labelColorMap.set(label, color);
        return color;
    }

    createModal() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'formula-modal-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
        `;

        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'formula-modal';
        this.modal.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 95vw;
            width: 95vw;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: relative;
        `;

        // Reset button (initially hidden, shown when there are expansions)
        this.resetButton = document.createElement('button');
        this.resetButton.textContent = '↻ Reset';
        this.resetButton.style.cssText = `
            position: absolute;
            top: 12px;
            right: 50px;
            background: #6c757d;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            display: none;
            z-index: 10001;
        `;
        this.resetButton.addEventListener('mouseenter', () => {
            this.resetButton.style.backgroundColor = '#5a6268';
        });
        this.resetButton.addEventListener('mouseleave', () => {
            this.resetButton.style.backgroundColor = '#6c757d';
        });
        this.resetButton.addEventListener('click', () => this.resetToOriginal());
        this.modal.appendChild(this.resetButton);

        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #666;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        `;
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.backgroundColor = '#f0f0f0';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.backgroundColor = 'transparent';
        });
        closeButton.addEventListener('click', () => this.hide());
        this.modal.appendChild(closeButton);

        // Title container with back button
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        `;
        
        // Back button (initially hidden)
        this.backButton = document.createElement('button');
        this.backButton.textContent = '← Back';
        this.backButton.style.cssText = `
            background: #6c757d;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            display: none;
        `;
        this.backButton.addEventListener('mouseenter', () => {
            this.backButton.style.backgroundColor = '#5a6268';
        });
        this.backButton.addEventListener('mouseleave', () => {
            this.backButton.style.backgroundColor = '#6c757d';
        });
        this.backButton.addEventListener('click', () => this.goBack());
        titleContainer.appendChild(this.backButton);
        
        // Title
        this.titleElement = document.createElement('h3');
        this.titleElement.style.cssText = `
            margin: 0;
            font-size: 22px;
            color: #333;
            font-weight: 600;
        `;
        titleContainer.appendChild(this.titleElement);
        this.modal.appendChild(titleContainer);

        // Formula display section with annotations
        this.formulaSection = document.createElement('div');
        this.formulaSection.style.cssText = `
            margin-bottom: 20px;
            position: relative;
        `;
        this.modal.appendChild(this.formulaSection);

        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    show(columnName, formula, data, inputValues, yearData = null, isExpansion = false) {
        // If this is not an expansion, reset history and store original state
        if (!isExpansion) {
            this.expansionHistory = [];
            this.backButton.style.display = 'none';
            this.resetButton.style.display = 'none';
            
            // Store original state
            this.originalColumnName = columnName;
            this.originalData = data;
            this.originalInputValues = inputValues;
            this.originalYearData = yearData;
        } else {
            this.backButton.style.display = 'block';
            this.resetButton.style.display = 'block';
        }
        
        // Store current state
        this.currentColumnName = columnName;
        this.currentData = data;
        this.currentInputValues = inputValues;
        this.currentYearData = yearData;
        
        this.titleElement.textContent = columnName;
        
        // Reset color mapping for new formula
        this.labelColorMap.clear();
        
        // Get formula breakdown
        const breakdown = this.calculateBreakdown(columnName, data, inputValues, yearData);
        this.currentBreakdown = breakdown;
        
        // Store original breakdown if this is the first time showing
        if (!isExpansion) {
            this.originalBreakdown = breakdown;
        }
        
        // Clear and rebuild formula section
        this.formulaSection.innerHTML = '';
        
        // Create formula display container
        const formulaContainer = document.createElement('div');
        formulaContainer.style.cssText = `
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 120px 24px 40px 24px;
            position: relative;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
        `;
        this.currentFormulaContainer = formulaContainer;
        
        // Create SVG for drawing annotation lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: visible;
        `;
        formulaContainer.appendChild(svg);
        this.currentSvg = svg;
        
        // Create formula content container - Step 1: Center formula on one line
        const formulaContent = document.createElement('div');
        formulaContent.style.cssText = `
            position: relative;
            z-index: 2;
            font-size: 14px;
            line-height: 1.5;
            white-space: nowrap;
            overflow: visible;
            display: inline-block;
            text-align: center;
            width: 100%;
        `;
        this.currentFormulaContent = formulaContent;
        
        // Build formula with annotated values
        const formulaParts = this.buildAnnotatedFormula(breakdown, formulaContent, svg, formulaContainer, data, inputValues, yearData);
        
        formulaContainer.appendChild(formulaContent);
        this.formulaSection.appendChild(formulaContainer);
        
        // Ensure formula fits on one line
        const ensureFormulaFits = () => {
            const containerWidth = formulaContainer.getBoundingClientRect().width - 48;
            const contentWidth = formulaContent.scrollWidth;
            
            if (contentWidth > containerWidth) {
                const currentSize = parseFloat(formulaContent.style.fontSize) || 14;
                const newSize = Math.max(10, currentSize * (containerWidth / contentWidth) * 0.95);
                formulaContent.style.fontSize = `${newSize}px`;
            }
        };
        
        // Setup resize observer to recalculate when container size changes
        this.resizeObserver = new ResizeObserver(() => {
            ensureFormulaFits();
            this.calculateAndDrawAnnotations(formulaParts, breakdown, svg, formulaContainer);
        });
        this.resizeObserver.observe(formulaContainer);
        
        // Initial calculation after value boxes are rendered
        setTimeout(() => {
            ensureFormulaFits();
            this.calculateAndDrawAnnotations(formulaParts, breakdown, svg, formulaContainer);
        }, 50);
        
        // Add result display
        const resultContainer = document.createElement('div');
        resultContainer.style.cssText = `
            margin-top: 24px;
            padding-top: 24px;
            border-top: 2px solid #e9ecef;
            text-align: center;
        `;
        
        const resultLabel = document.createElement('div');
        resultLabel.style.cssText = `
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 500;
        `;
        resultLabel.textContent = 'Result';
        resultContainer.appendChild(resultLabel);
        
        const resultValue = document.createElement('div');
        resultValue.style.cssText = `
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            font-family: 'Courier New', monospace;
        `;
        resultValue.textContent = breakdown.result;
        resultContainer.appendChild(resultValue);
        
        this.formulaSection.appendChild(resultContainer);
        
        // Add note if available
        if (breakdown.note) {
            const noteContainer = document.createElement('div');
            noteContainer.style.cssText = `
                margin-top: 16px;
                padding: 12px;
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 4px;
                font-size: 13px;
                color: #856404;
                font-style: italic;
            `;
            noteContainer.textContent = breakdown.note;
            this.formulaSection.appendChild(noteContainer);
        }

        this.overlay.style.display = 'flex';
    }

    buildAnnotatedFormula(breakdown, container, svg, parentContainer, data = null, inputValues = null, yearData = null) {
        const parts = [];
        const formatCurrency = (value) => {
            if (value === null || value === undefined || isNaN(value)) {
                return '$0.00';
            }
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        };

        const formatPercent = (value) => {
            if (value === null || value === undefined || isNaN(value)) {
                return '0.00%';
            }
            return `${(value * 100).toFixed(2)}%`;
        };

        // Create formula expression based on breakdown type
        if (breakdown.expression) {
            // Use provided expression structure
            breakdown.expression.forEach((part, index) => {
                const span = document.createElement('span');
                span.style.cssText = `
                    display: inline-block;
                    margin: 0 4px;
                    position: relative;
                `;
                
                if (part.type === 'value') {
                    // Get color for this label (same label = same color)
                    const colorScheme = this.getColorForLabel(part.label);
                    
                    // Check if this value can be expanded
                    // A value is expandable if:
                    // 1. It has a corresponding column key in our mapping
                    // 2. The data object has that property (meaning it's a computed column value)
                    // 3. The source indicates it's from a column (not an input)
                    const columnKey = this.labelToColumnKey[part.label];
                    const hasColumnKey = columnKey && data && data.hasOwnProperty(columnKey);
                    const isFromColumn = part.source && (part.source.includes('column') || part.source.includes('Column'));
                    const canExpand = hasColumnKey && isFromColumn;
                    
                    const valueSpan = document.createElement('span');
                    valueSpan.className = `formula-value-${index}`;
                    valueSpan.textContent = part.value;
                    valueSpan.style.cssText = `
                        background: ${colorScheme.bg};
                        border: 2px solid ${colorScheme.border};
                        border-radius: 3px;
                        padding: 4px 8px;
                        font-family: 'Courier New', monospace;
                        font-weight: 600;
                        color: ${colorScheme.text};
                        cursor: ${canExpand ? 'pointer' : 'help'};
                        position: relative;
                        display: inline-block;
                        text-align: center;
                        white-space: nowrap;
                        box-sizing: border-box;
                        vertical-align: middle;
                        font-size: 13px;
                    `;
                    
                    // Store color scheme in part for later use
                    part.colorScheme = colorScheme;
                    
                    // Add annotation tooltip
                    const tooltip = document.createElement('div');
                    tooltip.className = `formula-tooltip-${index}`;
                    tooltip.textContent = part.label + (canExpand ? ' (Right-click to expand)' : '');
                    tooltip.style.cssText = `
                        position: absolute;
                        bottom: 100%;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #333;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 4px;
                        font-size: 12px;
                        white-space: nowrap;
                        margin-bottom: 8px;
                        opacity: 0;
                        pointer-events: none;
                        transition: opacity 0.2s;
                        z-index: 1000;
                    `;
                    
                    // Add arrow
                    const arrow = document.createElement('div');
                    arrow.style.cssText = `
                        position: absolute;
                        top: 100%;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 0;
                        height: 0;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 6px solid #333;
                    `;
                    tooltip.appendChild(arrow);
                    
                    valueSpan.appendChild(tooltip);
                    
                    valueSpan.addEventListener('mouseenter', () => {
                        tooltip.style.opacity = '1';
                        if (canExpand) {
                            valueSpan.style.borderColor = '#007bff';
                            valueSpan.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
                        }
                    });
                    valueSpan.addEventListener('mouseleave', () => {
                        tooltip.style.opacity = '0';
                        if (canExpand) {
                            valueSpan.style.borderColor = colorScheme.border;
                            valueSpan.style.boxShadow = 'none';
                        }
                    });
                    
                    // Add right-click handler for expansion
                    if (canExpand) {
                        valueSpan.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            this.expandValue(part.label, columnKey, data, inputValues, yearData);
                        });
                    }
                    
                    span.appendChild(valueSpan);
                    parts.push({
                        element: valueSpan,
                        label: part.label,
                        source: part.source,
                        index: index,
                        colorScheme: colorScheme,
                        columnKey: columnKey,
                        canExpand: canExpand
                    });
                } else if (part.type === 'operator') {
                    const opSpan = document.createElement('span');
                    opSpan.textContent = part.value;
                    opSpan.style.cssText = `
                        font-size: 18px;
                        font-weight: bold;
                        color: #495057;
                        margin: 0 4px;
                        vertical-align: middle;
                        display: inline-block;
                    `;
                    span.appendChild(opSpan);
                } else if (part.type === 'equals') {
                    const eqSpan = document.createElement('span');
                    eqSpan.textContent = '=';
                    eqSpan.style.cssText = `
                        font-size: 18px;
                        font-weight: bold;
                        color: #495057;
                        margin: 0 6px;
                        vertical-align: middle;
                        display: inline-block;
                    `;
                    span.appendChild(eqSpan);
                } else {
                    span.textContent = part.value;
                    span.style.cssText = `
                        font-family: 'Courier New', monospace;
                        color: #495057;
                        vertical-align: middle;
                        display: inline-block;
                    `;
                }
                
                container.appendChild(span);
            });
        } else {
            // Fallback: simple display
            const simpleText = document.createElement('div');
            simpleText.textContent = breakdown.result;
            simpleText.style.cssText = `
                font-family: 'Courier New', monospace;
                font-size: 20px;
                color: #495057;
            `;
            container.appendChild(simpleText);
        }

        return parts;
    }

    calculateAndDrawAnnotations(parts, breakdown, svg, container) {
        // Completely new implementation from scratch
        // Get current value box positions from DOM (relative to container)
        const containerRect = container.getBoundingClientRect();
        const valueBoxes = [];
        
        parts.forEach((part, index) => {
            if (!part.element) return;
            const rect = part.element.getBoundingClientRect();
            valueBoxes.push({
                index: index,
                part: part,
                centerX: rect.left - containerRect.left + rect.width / 2, // Relative to container
                top: rect.top - containerRect.top, // Relative to container
                bottom: rect.bottom - containerRect.top, // Relative to container
                width: rect.width,
                height: rect.height
            });
        });
        
        // Calculate annotation box sizes based on text content
        const getAnnotationBoxSize = (label, source) => {
            const labelWidth = label ? label.length * 8 : 0;
            const sourceWidth = source ? source.length * 7 : 0;
            const width = Math.max(100, Math.max(labelWidth, sourceWidth) + 16);
            const height = source ? 50 : 32;
            return { width, height };
        };
        
        // Calculate annotation box positions - alternating above/below
        const minLineLength = 30;
        const minSpacing = 10;
        const overlapThreshold = 5;
        
        const annotationBoxes = [];
        valueBoxes.forEach((valueBox, index) => {
            const part = valueBox.part;
            if (!part.label) return;
            
            const boxSize = getAnnotationBoxSize(part.label, part.source);
            const isAbove = index % 2 === 0; // Alternate: even = above, odd = below
            
            // Calculate Y position relative to value box
            let boxY;
            if (isAbove) {
                boxY = valueBox.top - minLineLength - boxSize.height - minSpacing;
            } else {
                boxY = valueBox.bottom + minLineLength + minSpacing;
            }
            
            // Center horizontally on value box initially
            const boxX = valueBox.centerX - boxSize.width / 2;
            
            annotationBoxes.push({
                part: part,
                valueCenterX: valueBox.centerX, // Line connects here
                valueTop: valueBox.top,
                valueBottom: valueBox.bottom,
                boxX: boxX,
                boxY: boxY,
                boxWidth: boxSize.width,
                boxHeight: boxSize.height,
                isAbove: isAbove
            });
        });
        
        // Resolve overlaps - shift boxes horizontally while keeping line at valueCenterX
        const resolveOverlaps = (boxes) => {
            boxes.sort((a, b) => a.valueCenterX - b.valueCenterX);
            
            for (let i = 0; i < boxes.length; i++) {
                const box1 = boxes[i];
                for (let j = i + 1; j < boxes.length; j++) {
                    const box2 = boxes[j];
                    const box1Right = box1.boxX + box1.boxWidth;
                    const box2Left = box2.boxX;
                    
                    if (box1Right + overlapThreshold > box2Left) {
                        const overlap = (box1Right + overlapThreshold) - box2Left;
                        const shift = overlap / 2;
                        box1.boxX -= shift;
                        box2.boxX += shift;
                    }
                }
            }
        };
        
        const boxesAbove = annotationBoxes.filter(b => b.isAbove);
        const boxesBelow = annotationBoxes.filter(b => !b.isAbove);
        resolveOverlaps(boxesAbove);
        resolveOverlaps(boxesBelow);
        
        // Draw everything
        svg.innerHTML = '';
        
        annotationBoxes.forEach((boxInfo) => {
            const part = boxInfo.part;
            const colorScheme = part.colorScheme || this.getColorForLabel(part.label);
            
            // Calculate line endpoints - line touches both boxes
            let lineStartY, lineEndY;
            if (boxInfo.isAbove) {
                // Line from bottom of annotation box to top of value box
                lineStartY = boxInfo.boxY + boxInfo.boxHeight; // Bottom of annotation box
                lineEndY = boxInfo.valueTop; // Top of value box
            } else {
                // Line from bottom of value box to top of annotation box
                lineStartY = boxInfo.valueBottom; // Bottom of value box
                lineEndY = boxInfo.boxY; // Top of annotation box
            }
            
            // Draw connecting line - always connects to center of value box
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', boxInfo.valueCenterX);
            line.setAttribute('y1', lineStartY);
            line.setAttribute('x2', boxInfo.valueCenterX);
            line.setAttribute('y2', lineEndY);
            line.setAttribute('stroke', colorScheme.border);
            line.setAttribute('stroke-width', '1.5');
            line.setAttribute('stroke-dasharray', '3,3');
            svg.appendChild(line);
            
            // Draw annotation box with same color as value box
            const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            textBg.setAttribute('x', boxInfo.boxX);
            textBg.setAttribute('y', boxInfo.boxY);
            textBg.setAttribute('width', boxInfo.boxWidth);
            textBg.setAttribute('height', boxInfo.boxHeight);
            textBg.setAttribute('rx', '3');
            textBg.setAttribute('fill', colorScheme.bg);
            textBg.setAttribute('stroke', colorScheme.border);
            textBg.setAttribute('stroke-width', '1.5');
            svg.appendChild(textBg);
            
            // Draw label text
            const textY = boxInfo.boxY + (part.source ? 18 : 20);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', boxInfo.boxX + boxInfo.boxWidth / 2);
            text.setAttribute('y', textY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '14');
            text.setAttribute('fill', colorScheme.text);
            text.setAttribute('font-weight', '500');
            text.textContent = part.label || '';
            svg.appendChild(text);
            
            // Draw source text if available
            if (part.source) {
                const sourceText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                sourceText.setAttribute('x', boxInfo.boxX + boxInfo.boxWidth / 2);
                sourceText.setAttribute('y', boxInfo.boxY + 36);
                sourceText.setAttribute('text-anchor', 'middle');
                sourceText.setAttribute('font-size', '12');
                sourceText.setAttribute('fill', '#6c757d');
                sourceText.setAttribute('font-style', 'italic');
                sourceText.textContent = part.source;
                svg.appendChild(sourceText);
            }
        });
        
        // Update SVG and container size
        let minY = 0;
        let maxY = containerRect.height;
        
        annotationBoxes.forEach((boxInfo) => {
            if (boxInfo.isAbove) {
                minY = Math.min(minY, boxInfo.boxY);
            } else {
                maxY = Math.max(maxY, boxInfo.boxY + boxInfo.boxHeight);
            }
        });
        
        svg.setAttribute('width', containerRect.width);
        svg.setAttribute('height', maxY - minY);
        
        // Update container padding
        const topPadding = Math.max(80, Math.abs(minY) + 10);
        const bottomPadding = Math.max(80, maxY - containerRect.height + 10);
        container.style.paddingTop = `${topPadding}px`;
        container.style.paddingBottom = `${bottomPadding}px`;
    }

    hide() {
        this.overlay.style.display = 'none';
        // Cleanup resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        // Reset expansion state
        this.expansionHistory = [];
        this.backButton.style.display = 'none';
        this.resetButton.style.display = 'none';
    }

    isVisible() {
        return this.overlay.style.display === 'flex';
    }

    expandValue(label, columnKey, data, inputValues, yearData) {
        // Save current state to history
        this.expansionHistory.push({
            columnName: this.currentColumnName,
            data: this.currentData,
            inputValues: this.currentInputValues,
            yearData: this.currentYearData,
            breakdown: this.currentBreakdown
        });
        
        // Show reset button when expanding
        this.resetButton.style.display = 'block';
        
        // Get the column display name
        const keyToNameMap = {
            'principal_remaining': 'Principal Remaining',
            'mortgage_payments': 'Mortgage Payments',
            'principal_paid': 'Principal Paid',
            'interest_paid': 'Interest Paid',
            'maintenance_fees': 'Maintenance Fees',
            'property_tax': 'Property Tax',
            'insurance_paid': 'Insurance Paid',
            'utilities': 'Utilities',
            'repairs': 'Repairs',
            'total_expenses': 'Total Expenses',
            'deductible_expenses': 'Deductible Expenses',
            'rental_income': 'Rental Income',
            'taxable_income': 'Taxable Income',
            'taxes_due': 'Taxes Due',
            'rental_gains': 'Rental Gains',
            'cumulative_rental_gains': 'Cumulative Rental Gains',
            'cumulative_investment': 'Cumulative Investment',
            'expected_return': 'Expected Return',
            'cumulative_expected_return': 'Cumulative Expected Return',
            'home_value': 'Home Value',
            'capital_gains_tax': 'Capital Gains Tax',
            'sales_fees': 'Sales Fees',
            'sale_income': 'Sale Income',
            'sale_net': 'Sale Net',
            'net_return': 'Net Return',
            'return_percent': 'Return %',
            'return_comparison': 'Return Comparison'
        };
        
        const columnDisplayName = keyToNameMap[columnKey] || label;
        
        // Get the expanded breakdown
        const expandedBreakdown = this.calculateBreakdown(columnDisplayName, data, inputValues, yearData);
        
        // Now we need to replace the value in the current formula with its expansion
        // We'll rebuild the formula with the expanded value
        const originalBreakdown = this.currentBreakdown;
        const expandedExpression = this.buildExpandedExpression(
            originalBreakdown.expression,
            label,
            expandedBreakdown.expression
        );
        
        // Create new breakdown with expanded expression
        const newBreakdown = {
            expression: expandedExpression,
            result: originalBreakdown.result,
            note: originalBreakdown.note
        };
        
        // Update current state
        this.currentBreakdown = newBreakdown;
        
        // Rebuild the formula display
        this.currentFormulaContent.innerHTML = '';
        this.currentSvg.innerHTML = '';
        this.labelColorMap.clear();
        
        const formulaParts = this.buildAnnotatedFormula(
            newBreakdown,
            this.currentFormulaContent,
            this.currentSvg,
            this.currentFormulaContainer,
            data,
            inputValues,
            yearData
        );
        
        // Recalculate annotations and resize
        setTimeout(() => {
            // Ensure formula fits
            const containerWidth = this.currentFormulaContainer.getBoundingClientRect().width - 48;
            const contentWidth = this.currentFormulaContent.scrollWidth;
            
            if (contentWidth > containerWidth) {
                const currentSize = parseFloat(this.currentFormulaContent.style.fontSize) || 14;
                const newSize = Math.max(10, currentSize * (containerWidth / contentWidth) * 0.95);
                this.currentFormulaContent.style.fontSize = `${newSize}px`;
            }
            
            this.calculateAndDrawAnnotations(formulaParts, newBreakdown, this.currentSvg, this.currentFormulaContainer);
        }, 50);
    }

    buildExpandedExpression(originalExpression, labelToExpand, expansionExpression) {
        const newExpression = [];
        let foundValue = false;
        
        for (let i = 0; i < originalExpression.length; i++) {
            const part = originalExpression[i];
            
            if (part.type === 'value' && part.label === labelToExpand && !foundValue) {
                // Replace this value with its expansion, wrapped in parentheses
                foundValue = true;
                newExpression.push({ type: 'text', value: '(' });
                
                // Add the expansion expression (everything before the equals sign)
                for (let j = 0; j < expansionExpression.length; j++) {
                    const expPart = expansionExpression[j];
                    // Stop at equals sign
                    if (expPart.type === 'equals') {
                        break;
                    }
                    newExpression.push(expPart);
                }
                
                newExpression.push({ type: 'text', value: ')' });
            } else {
                newExpression.push(part);
            }
        }
        
        return newExpression;
    }

    goBack() {
        if (this.expansionHistory.length === 0) {
            this.backButton.style.display = 'none';
            return;
        }
        
        // Restore previous state
        const previousState = this.expansionHistory.pop();
        
        // Update current state
        this.currentColumnName = previousState.columnName;
        this.currentData = previousState.data;
        this.currentInputValues = previousState.inputValues;
        this.currentYearData = previousState.yearData;
        this.currentBreakdown = previousState.breakdown;
        
        // Update title
        this.titleElement.textContent = previousState.columnName;
        
        // Hide back button if no more history
        if (this.expansionHistory.length === 0) {
            this.backButton.style.display = 'none';
        }
        
        // Rebuild the formula display
        this.currentFormulaContent.innerHTML = '';
        this.currentSvg.innerHTML = '';
        this.labelColorMap.clear();
        
        const formulaParts = this.buildAnnotatedFormula(
            previousState.breakdown,
            this.currentFormulaContent,
            this.currentSvg,
            this.currentFormulaContainer,
            previousState.data,
            previousState.inputValues,
            previousState.yearData
        );
        
        // Recalculate annotations and resize
        setTimeout(() => {
            // Ensure formula fits
            const containerWidth = this.currentFormulaContainer.getBoundingClientRect().width - 48;
            const contentWidth = this.currentFormulaContent.scrollWidth;
            
            if (contentWidth > containerWidth) {
                const currentSize = parseFloat(this.currentFormulaContent.style.fontSize) || 14;
                const newSize = Math.max(10, currentSize * (containerWidth / contentWidth) * 0.95);
                this.currentFormulaContent.style.fontSize = `${newSize}px`;
            }
            
            this.calculateAndDrawAnnotations(formulaParts, previousState.breakdown, this.currentSvg, this.currentFormulaContainer);
        }, 50);
        
        // Hide reset button if we're back to original
        if (this.expansionHistory.length === 0) {
            this.resetButton.style.display = 'none';
        }
    }

    resetToOriginal() {
        if (!this.originalBreakdown) {
            return;
        }
        
        // Clear expansion history
        this.expansionHistory = [];
        
        // Restore original state
        this.currentColumnName = this.originalColumnName;
        this.currentData = this.originalData;
        this.currentInputValues = this.originalInputValues;
        this.currentYearData = this.originalYearData;
        this.currentBreakdown = this.originalBreakdown;
        
        // Update title
        this.titleElement.textContent = this.originalColumnName;
        
        // Hide navigation buttons
        this.backButton.style.display = 'none';
        this.resetButton.style.display = 'none';
        
        // Clear and rebuild entire formula section (including result display)
        this.formulaSection.innerHTML = '';
        this.labelColorMap.clear();
        
        // Rebuild formula container
        const formulaContainer = document.createElement('div');
        formulaContainer.style.cssText = `
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 120px 24px 40px 24px;
            position: relative;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
        `;
        this.currentFormulaContainer = formulaContainer;
        
        // Create SVG for drawing annotation lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: visible;
        `;
        formulaContainer.appendChild(svg);
        this.currentSvg = svg;
        
        // Create formula content container
        const formulaContent = document.createElement('div');
        formulaContent.style.cssText = `
            position: relative;
            z-index: 2;
            font-size: 14px;
            line-height: 1.5;
            white-space: nowrap;
            overflow: visible;
            display: inline-block;
            text-align: center;
            width: 100%;
        `;
        this.currentFormulaContent = formulaContent;
        
        // Build formula with annotated values
        const formulaParts = this.buildAnnotatedFormula(
            this.originalBreakdown,
            formulaContent,
            svg,
            formulaContainer,
            this.originalData,
            this.originalInputValues,
            this.originalYearData
        );
        
        formulaContainer.appendChild(formulaContent);
        this.formulaSection.appendChild(formulaContainer);
        
        // Ensure formula fits on one line
        const ensureFormulaFits = () => {
            const containerWidth = formulaContainer.getBoundingClientRect().width - 48;
            const contentWidth = formulaContent.scrollWidth;
            
            if (contentWidth > containerWidth) {
                const currentSize = parseFloat(formulaContent.style.fontSize) || 14;
                const newSize = Math.max(10, currentSize * (containerWidth / contentWidth) * 0.95);
                formulaContent.style.fontSize = `${newSize}px`;
            }
        };
        
        // Setup resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.resizeObserver = new ResizeObserver(() => {
            ensureFormulaFits();
            this.calculateAndDrawAnnotations(formulaParts, this.originalBreakdown, svg, formulaContainer);
        });
        this.resizeObserver.observe(formulaContainer);
        
        // Initial calculation after value boxes are rendered
        setTimeout(() => {
            ensureFormulaFits();
            this.calculateAndDrawAnnotations(formulaParts, this.originalBreakdown, svg, formulaContainer);
        }, 50);
        
        // Add result display
        const resultContainer = document.createElement('div');
        resultContainer.style.cssText = `
            margin-top: 24px;
            padding-top: 24px;
            border-top: 2px solid #e9ecef;
            text-align: center;
        `;
        
        const resultLabel = document.createElement('div');
        resultLabel.style.cssText = `
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 500;
        `;
        resultLabel.textContent = 'Result';
        resultContainer.appendChild(resultLabel);
        
        const resultValue = document.createElement('div');
        resultValue.style.cssText = `
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            font-family: 'Courier New', monospace;
        `;
        resultValue.textContent = this.originalBreakdown.result;
        resultContainer.appendChild(resultValue);
        
        this.formulaSection.appendChild(resultContainer);
        
        // Add note if available
        if (this.originalBreakdown.note) {
            const noteContainer = document.createElement('div');
            noteContainer.style.cssText = `
                margin-top: 16px;
                padding: 12px;
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 4px;
                font-size: 13px;
                color: #856404;
                font-style: italic;
            `;
            noteContainer.textContent = this.originalBreakdown.note;
            this.formulaSection.appendChild(noteContainer);
        }
    }

    calculateBreakdown(columnName, data, inputValues, yearData = null) {
        const formatCurrency = (value) => {
            if (value === null || value === undefined || isNaN(value)) {
                return '$0.00';
            }
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        };

        const formatPercent = (value) => {
            if (value === null || value === undefined || isNaN(value)) {
                return '0.00%';
            }
            return `${(value * 100).toFixed(2)}%`;
        };

        // Get column key
        let columnKey = columnName.toLowerCase().replace(/\s+/g, '_');
        const nameToKeyMap = {
            'principal_remaining': 'principal_remaining',
            'mortgage_payments': 'mortgage_payments',
            'principal_paid': 'principal_paid',
            'interest_paid': 'interest_paid',
            'maintenance_fees': 'maintenance_fees',
            'property_tax': 'property_tax',
            'insurance_paid': 'insurance_paid',
            'utilities': 'utilities',
            'repairs': 'repairs',
            'total_expenses': 'total_expenses',
            'deductible_expenses': 'deductible_expenses',
            'rental_income': 'rental_income',
            'taxable_income': 'taxable_income',
            'taxes_due': 'taxes_due',
            'rental_gains': 'rental_gains',
            'cumulative_rental_gains': 'cumulative_rental_gains',
            'cumulative_investment': 'cumulative_investment',
            'expected_return': 'expected_return',
            'cumulative_expected_return': 'cumulative_expected_return',
            'home_value': 'home_value',
            'capital_gains_tax': 'capital_gains_tax',
            'sales_fees': 'sales_fees',
            'sale_income': 'sale_income',
            'sale_net': 'sale_net',
            'net_return': 'net_return',
            'return_percent': 'return_percent',
            'return_%': 'return_percent',
            'return_comparison': 'return_comparison'
        };
        columnKey = nameToKeyMap[columnKey] || columnKey;

        const breakdown = {
            expression: [],
            result: ''
        };

        // Get previous month's data for calculations that need it
        // For summary rows, get the first month of the year (which has the starting principal)
        const getPreviousMonthData = () => {
            if (yearData && yearData.length > 0) {
                // For summary rows, use the first month of the year
                return yearData[0];
            }
            // For regular rows, we'd need to access previous month from table data
            // But we don't have that here, so calculate from current data
            return null;
        };

        switch (columnKey) {
            case 'mortgage_payments': {
                // Mortgage payment uses amortization formula or interest-only
                // P = Principal * (r * (1 + r)^n) / ((1 + r)^n - 1) for principal and interest
                // P = Principal * r for interest-only
                const purchasePrice = inputValues.get('purchase_price') || 0;
                const downpaymentPercent = (inputValues.get('downpayment_percentage') || 0) / 100;
                const loanPrincipal = purchasePrice * (1 - downpaymentPercent);
                const annualRate = (inputValues.get('interest_rate') || 0) / 100;
                const loanYears = inputValues.get('loan_years') || 30;
                const paymentType = inputValues.get('payment_type') || 'Principal and Interest';
                const monthlyRate = annualRate / 12;
                const numPayments = loanYears * 12;
                
                // Calculate monthly payment
                let monthlyPayment;
                const isInterestOnly = paymentType === 'Interest Only';
                
                if (isInterestOnly) {
                    // Interest-only: payment is just the monthly interest
                    monthlyPayment = loanPrincipal * monthlyRate;
                } else if (annualRate === 0) {
                    monthlyPayment = loanPrincipal / numPayments;
                } else {
                    const numerator = monthlyRate * Math.pow(1 + monthlyRate, numPayments);
                    const denominator = Math.pow(1 + monthlyRate, numPayments) - 1;
                    monthlyPayment = loanPrincipal * (numerator / denominator);
                }
                
                // For summary rows, multiply by number of months
                const paymentAmount = yearData && yearData.length > 0 
                    ? monthlyPayment * yearData.length 
                    : monthlyPayment;
                
                // Calculate intermediate values for display
                const onePlusRate = 1 + monthlyRate;
                const onePlusRateToN = Math.pow(onePlusRate, numPayments);
                const numeratorValue = monthlyRate * onePlusRateToN;
                const denominatorValue = onePlusRateToN - 1;
                const amortizationFactor = numeratorValue / denominatorValue;
                
                if (isInterestOnly) {
                    // Interest-only payment formula
                    if (yearData && yearData.length > 0) {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(loanPrincipal), label: 'Loan Principal', source: `Purchase Price (${formatCurrency(purchasePrice)}) - Downpayment (${formatPercent(downpaymentPercent)})` },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Rate (r)', source: `Annual Rate (${formatPercent(annualRate)}) ÷ 12` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyPayment) },
                            { type: 'text', value: ' (monthly, interest only)' },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Year ${data.year || yearData[0].year}` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(paymentAmount) }
                        ];
                    } else {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(loanPrincipal), label: 'Loan Principal', source: `Purchase Price (${formatCurrency(purchasePrice)}) - Downpayment (${formatPercent(downpaymentPercent)})` },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Rate (r)', source: `Annual Rate (${formatPercent(annualRate)}) ÷ 12` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyPayment) },
                            { type: 'text', value: ' (interest only)' }
                        ];
                    }
                } else if (annualRate === 0) {
                    // Zero interest case
                    if (yearData && yearData.length > 0) {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(loanPrincipal), label: 'Loan Principal', source: `Purchase Price (${formatCurrency(purchasePrice)}) - Downpayment (${formatPercent(downpaymentPercent)})` },
                            { type: 'operator', value: '÷' },
                            { type: 'value', value: `${numPayments}`, label: 'Number of Payments', source: `Loan Years (${loanYears}) × 12` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyPayment) },
                            { type: 'text', value: ' (monthly)' },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Year ${data.year || yearData[0].year}` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(paymentAmount) }
                        ];
                    } else {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(loanPrincipal), label: 'Loan Principal', source: `Purchase Price (${formatCurrency(purchasePrice)}) - Downpayment (${formatPercent(downpaymentPercent)})` },
                            { type: 'operator', value: '÷' },
                            { type: 'value', value: `${numPayments}`, label: 'Number of Payments', source: `Loan Years (${loanYears}) × 12` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyPayment) }
                        ];
                    }
                } else {
                    // Full amortization formula expanded
                    if (yearData && yearData.length > 0) {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(loanPrincipal), label: 'Loan Principal', source: `Purchase Price (${formatCurrency(purchasePrice)}) - Downpayment (${formatPercent(downpaymentPercent)})` },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(' },
                            { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Rate (r)', source: `Annual Rate (${formatPercent(annualRate)}) ÷ 12` },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Rate (r)', source: `Annual Rate (${formatPercent(annualRate)}) ÷ 12` },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${numPayments}`, label: 'Number of Payments (n)', source: `Loan Years (${loanYears}) × 12` },
                            { type: 'text', value: ') ÷ (' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Rate (r)', source: `Annual Rate (${formatPercent(annualRate)}) ÷ 12` },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${numPayments}`, label: 'Number of Payments (n)', source: `Loan Years (${loanYears}) × 12` },
                            { type: 'text', value: ' - 1)' },
                            { type: 'text', value: ')' },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyPayment) },
                            { type: 'text', value: ' (monthly)' },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Year ${data.year || yearData[0].year}` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(paymentAmount) }
                        ];
                    } else {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(loanPrincipal), label: 'Loan Principal', source: `Purchase Price (${formatCurrency(purchasePrice)}) - Downpayment (${formatPercent(downpaymentPercent)})` },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(' },
                            { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Rate (r)', source: `Annual Rate (${formatPercent(annualRate)}) ÷ 12` },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Rate (r)', source: `Annual Rate (${formatPercent(annualRate)}) ÷ 12` },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${numPayments}`, label: 'Number of Payments (n)', source: `Loan Years (${loanYears}) × 12` },
                            { type: 'text', value: ') ÷ (' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Rate (r)', source: `Annual Rate (${formatPercent(annualRate)}) ÷ 12` },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${numPayments}`, label: 'Number of Payments (n)', source: `Loan Years (${loanYears}) × 12` },
                            { type: 'text', value: ' - 1)' },
                            { type: 'text', value: ')' },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyPayment) }
                        ];
                    }
                }
                
                breakdown.result = formatCurrency(paymentAmount);
                break;
            }

            case 'principal_paid': {
                // Principal Paid = Monthly Payment - Interest Paid
                // Interest Paid = Principal Remaining × Monthly Rate
                const monthlyPayment = data.mortgage_payments || 0;
                const monthlyPaymentAmount = yearData && yearData.length > 0 
                    ? monthlyPayment / yearData.length 
                    : monthlyPayment;
                
                let principalRemaining;
                let monthlyRate;
                let interestPaid;
                let principalPaid;
                let sourceLabel;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show formula for final month (illustrative)
                    const lastMonth = yearData[yearData.length - 1];
                    const lastMonthPayment = lastMonth.mortgage_payments || 0;
                    principalRemaining = (lastMonth.principal_remaining || 0) + (lastMonth.principal_paid || 0);
                    const annualRate = (inputValues.get('interest_rate') || 0) / 100;
                    monthlyRate = annualRate / 12;
                    interestPaid = principalRemaining * monthlyRate;
                    principalPaid = lastMonthPayment - interestPaid;
                    
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(lastMonthPayment), label: 'Monthly Payment', source: 'Mortgage Payments column (final month)' },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(interestPaid), label: 'Interest Paid', source: 'Interest Paid column (final month)' },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(principalPaid) }
                    ];
                    breakdown.note = `Note: This formula shows the calculation for the final month of the year for illustrative purposes. The summary value is the sum of principal paid across all ${yearData.length} months.`;
                } else {
                    // Regular row
                    principalRemaining = (data.principal_remaining || 0) + (data.principal_paid || 0);
                    const annualRate = (inputValues.get('interest_rate') || 0) / 100;
                    monthlyRate = annualRate / 12;
                    interestPaid = principalRemaining * monthlyRate;
                    principalPaid = monthlyPaymentAmount - interestPaid;
                    
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(monthlyPaymentAmount), label: 'Monthly Payment', source: 'Mortgage Payments column' },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(interestPaid), label: 'Interest Paid', source: 'Interest Paid column' },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(principalPaid) }
                    ];
                }
                breakdown.result = formatCurrency(data.principal_paid || principalPaid);
                break;
            }

            case 'interest_paid': {
                // Interest Paid = Principal Remaining × Monthly Rate
                let principalRemaining;
                let monthlyRate;
                let interestPaid;
                let sourceLabel;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show formula for final month (illustrative)
                    const lastMonth = yearData[yearData.length - 1];
                    principalRemaining = (lastMonth.principal_remaining || 0) + (lastMonth.principal_paid || 0);
                    const annualRate = (inputValues.get('interest_rate') || 0) / 100;
                    monthlyRate = annualRate / 12;
                    interestPaid = principalRemaining * monthlyRate;
                    
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(principalRemaining), label: 'Principal Remaining', source: 'Principal Remaining column (final month, start of month)' },
                        { type: 'operator', value: '×' },
                        { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Interest Rate', source: `Interest Rate (${formatPercent(annualRate)}) ÷ 12` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(interestPaid) }
                    ];
                    breakdown.note = `Note: This formula shows the calculation for the final month of the year for illustrative purposes. The summary value is the sum of interest paid across all ${yearData.length} months.`;
                } else {
                    // Regular row
                    principalRemaining = (data.principal_remaining || 0) + (data.principal_paid || 0);
                    const annualRate = (inputValues.get('interest_rate') || 0) / 100;
                    monthlyRate = annualRate / 12;
                    interestPaid = principalRemaining * monthlyRate;
                    
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(principalRemaining), label: 'Principal Remaining', source: 'Principal Remaining column' },
                        { type: 'operator', value: '×' },
                        { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Interest Rate', source: `Interest Rate (${formatPercent(annualRate)}) ÷ 12` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(interestPaid) }
                    ];
                }
                breakdown.result = formatCurrency(data.interest_paid || interestPaid);
                break;
            }

            case 'principal_remaining': {
                // For summary rows: first month principal - total principal paid in year
                // For regular rows: previous principal - principal paid this month
                let prevPrincipal;
                let principalPaid;
                let sourceLabel;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: first month's principal remaining (at start of year)
                    const firstMonth = yearData[0];
                    const firstMonthPrincipalRemaining = firstMonth.principal_remaining || 0;
                    const firstMonthPrincipalPaid = firstMonth.principal_paid || 0;
                    prevPrincipal = firstMonthPrincipalRemaining + firstMonthPrincipalPaid;
                    
                    // Total principal paid during the year
                    principalPaid = yearData.reduce((sum, month) => sum + (month.principal_paid || 0), 0);
                    sourceLabel = `Principal Remaining column (start of Year ${data.year || firstMonth.year})`;
                } else {
                    // Regular row: calculate from current data
                    principalPaid = data.principal_paid || 0;
                    prevPrincipal = (data.principal_remaining || 0) + principalPaid;
                    sourceLabel = `Start of Month ${data.month || 0}`;
                }
                
                // Fallback if we can't calculate properly
                if ((prevPrincipal === null || prevPrincipal === undefined) && prevPrincipal !== 0) {
                    const purchasePrice = inputValues.get('purchase_price') || 0;
                    const downpaymentPercent = (inputValues.get('downpayment_percentage') || 0) / 100;
                    prevPrincipal = purchasePrice * (1 - downpaymentPercent);
                    sourceLabel = 'Initial Loan Amount';
                }
                
                breakdown.expression = [
                    { type: 'value', value: formatCurrency(prevPrincipal), label: 'Principal at Start of Year', source: sourceLabel },
                    { type: 'operator', value: '−' },
                    { type: 'value', value: formatCurrency(principalPaid), label: 'Total Principal Paid This Year', source: yearData ? `Principal Paid column (sum of ${yearData.length} months)` : 'Principal Paid column' },
                    { type: 'equals', value: '=' },
                    { type: 'text', value: formatCurrency(data.principal_remaining) }
                ];
                breakdown.result = formatCurrency(data.principal_remaining);
                break;
            }

            case 'sales_fees': {
                const homeValue = data.home_value || 0;
                const commissionRate = (inputValues.get('commission_percentage') || 0) / 100;
                breakdown.expression = [
                    { type: 'value', value: formatCurrency(homeValue), label: 'Home Value', source: 'Home Value column' },
                    { type: 'operator', value: '×' },
                    { type: 'value', value: formatPercent(commissionRate), label: 'Commission Rate', source: 'Input: Commission Percentage' },
                    { type: 'equals', value: '=' },
                    { type: 'text', value: formatCurrency(data.sales_fees) }
                ];
                breakdown.result = formatCurrency(data.sales_fees);
                break;
            }

            case 'sale_income': {
                const homeValue = data.home_value || 0;
                const salesFees = data.sales_fees || 0;
                const capitalGainsTax = data.capital_gains_tax || 0;
                breakdown.expression = [
                    { type: 'value', value: formatCurrency(homeValue), label: 'Home Value', source: 'Home Value column' },
                    { type: 'operator', value: '−' },
                    { type: 'value', value: formatCurrency(salesFees), label: 'Sales Fees', source: 'Sales Fees column' },
                    { type: 'operator', value: '−' },
                    { type: 'value', value: formatCurrency(capitalGainsTax), label: 'Capital Gains Tax', source: 'Capital Gains Tax column' },
                    { type: 'equals', value: '=' },
                    { type: 'text', value: formatCurrency(data.sale_income) }
                ];
                breakdown.result = formatCurrency(data.sale_income);
                break;
            }

            case 'sale_net': {
                const saleIncome = data.sale_income || 0;
                const principalRemaining = data.principal_remaining || 0;
                breakdown.expression = [
                    { type: 'value', value: formatCurrency(saleIncome), label: 'Sale Income', source: 'Sale Income column' },
                    { type: 'operator', value: '−' },
                    { type: 'value', value: formatCurrency(principalRemaining), label: 'Principal Remaining', source: 'Principal Remaining column' },
                    { type: 'equals', value: '=' },
                    { type: 'text', value: formatCurrency(data.sale_net) }
                ];
                breakdown.result = formatCurrency(data.sale_net);
                break;
            }

            case 'net_return': {
                // New calculation: Net Return = (Sale Net - Downpayment) + max(0, Cumulative Rental Gains)
                const saleNet = data.sale_net || 0;
                const purchasePrice = inputValues.get('purchase_price') || 0;
                const downpaymentPercent = (inputValues.get('downpayment_percentage') || 0) / 100;
                const downpayment = purchasePrice * downpaymentPercent;
                
                // Use cumulative rental gains directly from the data
                const cumulativeNetProfit = data.cumulative_rental_gains || 0;
                const profitFromSale = saleNet - downpayment;
                const profitsReceived = Math.max(0, cumulativeNetProfit);
                const netReturn = data.net_return || 0;
                
                if (cumulativeNetProfit > 0) {
                    // Show full breakdown with positive cumulative rental gains
                    breakdown.expression = [
                        { type: 'text', value: '(' },
                        { type: 'value', value: formatCurrency(saleNet), label: 'Sale Net', source: 'Sale Net column' },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(downpayment), label: 'Downpayment', source: 'Initial Investment' },
                        { type: 'text', value: ')' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(profitsReceived), label: 'Cumulative Rental Gains', source: `Cumulative Rental Gains column: ${formatCurrency(cumulativeNetProfit)} (positive = gains received)` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(netReturn) }
                    ];
                } else {
                    // Show breakdown without adding gains (cumulative rental gains is negative or zero)
                    breakdown.expression = [
                        { type: 'text', value: '(' },
                        { type: 'value', value: formatCurrency(saleNet), label: 'Sale Net', source: 'Sale Net column' },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(downpayment), label: 'Downpayment', source: 'Initial Investment' },
                        { type: 'text', value: ')' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(0), label: 'Cumulative Rental Gains (if positive)', source: `Cumulative Rental Gains column: ${formatCurrency(cumulativeNetProfit)} (negative or zero, so 0 added)` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(netReturn) }
                    ];
                }
                breakdown.result = formatCurrency(netReturn);
                break;
            }

            case 'maintenance_fees': {
                // Maintenance = Base × (1 + Increase Rate)^Year
                const maintBase = inputValues.get('maintenance_base') || 0;
                const maintIncrease = (inputValues.get('maintenance_increase') || 0) / 100;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show sum of all monthly maintenance fees
                    const firstMonth = yearData[0];
                    const lastMonth = yearData[yearData.length - 1];
                    const firstMonthNum = firstMonth.month || 0;
                    const year = Math.floor(firstMonthNum / 12);
                    
                    // Calculate monthly maintenance for this year (for formula display)
                    // Formula shows "number of increases" which is year - 1
                    // But backend calculation uses year, so we use data.maintenance_fees for result
                    const onePlusIncrease = 1 + maintIncrease;
                    const increaseFactor = year === 0 ? 1 : Math.pow(onePlusIncrease, year);
                    const monthlyMaintenance = maintBase * increaseFactor;
                    const totalMaintenance = monthlyMaintenance * yearData.length;
                    
                    if (year === 0) {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(maintBase), label: 'Base Maintenance', source: 'Input: Monthly Base' },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Months in Year ${data.year || year + 1}` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(data.maintenance_fees) }
                        ];
                    } else {
                        breakdown.expression = [
                            { type: 'text', value: '(' },
                            { type: 'value', value: formatCurrency(maintBase), label: 'Base Maintenance', source: 'Input: Monthly Base' },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(maintIncrease), label: 'Yearly Increase Rate', source: 'Input: Increase %' },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${year - 1}`, label: 'Number of Increases', source: `Year ${year + 1} (Year 1 has no increase)` },
                            { type: 'text', value: ')' },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Months in Year ${data.year || year + 1}` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(data.maintenance_fees) }
                        ];
                    }
                } else {
                    // Regular row
                    const month = data.month || 0;
                    const year = Math.floor(month / 12);
                    const onePlusIncrease = 1 + maintIncrease;
                    const increaseFactor = year === 0 ? 1 : Math.pow(onePlusIncrease, year);
                    const monthlyMaintenance = maintBase * increaseFactor;
                    
                    if (year === 0) {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(maintBase), label: 'Base Maintenance', source: 'Input: Monthly Base' },
                            { type: 'text', value: ' (Year 1 - no increase)' }
                        ];
                    } else {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(maintBase), label: 'Base Maintenance', source: 'Input: Monthly Base' },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(maintIncrease), label: 'Yearly Increase Rate', source: 'Input: Increase %' },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${year - 1}`, label: 'Number of Increases', source: `Year ${year} (Year 1 has no increase)` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyMaintenance) }
                        ];
                    }
                }
                breakdown.result = formatCurrency(data.maintenance_fees);
                break;
            }

            case 'property_tax': {
                // Property Tax = (Base × (1 + Increase Rate)^Year) ÷ 12
                const propTaxBase = inputValues.get('property_tax_base') || 0;
                const propTaxIncrease = (inputValues.get('property_tax_increase') || 0) / 100;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: calculate sum of monthly property taxes
                    // Each month uses: (Base × (1 + Increase Rate)^Year) ÷ 12
                    const firstMonth = yearData[0];
                    const lastMonth = yearData[yearData.length - 1];
                    const firstMonthNum = firstMonth.month || 0;
                    const lastMonthNum = lastMonth.month || 0;
                    const year = Math.floor(firstMonthNum / 12);
                    
                    // Calculate annual tax for this year
                    // Formula shows "number of increases" which is year - 1 (Year 1 has 0 increases)
                    // But calculation uses year to match backend: base * (1 + rate)^year
                    const onePlusIncrease = 1 + propTaxIncrease;
                    const increaseFactor = year === 0 ? 1 : Math.pow(onePlusIncrease, year);
                    const annualTax = propTaxBase * increaseFactor;
                    const monthlyTax = annualTax / 12;
                    const totalTax = monthlyTax * yearData.length;
                    
                    if (year === 0) {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(propTaxBase), label: 'Base Annual Property Tax', source: 'Input: Annual Base' },
                            { type: 'operator', value: '÷' },
                            { type: 'value', value: '12', label: '12', source: 'Months per Year' },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Months in Year ${data.year || year + 1}` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(data.property_tax) }
                        ];
                    } else {
                        breakdown.expression = [
                            { type: 'text', value: '(' },
                            { type: 'value', value: formatCurrency(propTaxBase), label: 'Base Annual Tax', source: 'Input: Annual Base' },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(propTaxIncrease), label: 'Yearly Increase Rate', source: 'Input: Increase %' },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${year - 1}`, label: 'Number of Increases', source: `Year ${year + 1} (Year 1 has no increase)` },
                            { type: 'text', value: ')' },
                            { type: 'operator', value: '÷' },
                            { type: 'value', value: '12', label: '12', source: 'Months per Year' },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Months in Year ${data.year || year + 1}` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(data.property_tax) }
                        ];
                    }
                } else {
                    // Regular row
                    const month = data.month || 0;
                    const year = Math.floor(month / 12);
                    const onePlusIncrease = 1 + propTaxIncrease;
                    const increaseFactor = year === 0 ? 1 : Math.pow(onePlusIncrease, year);
                    const annualTax = propTaxBase * increaseFactor;
                    const monthlyTax = annualTax / 12;
                    
                    if (year === 0) {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(propTaxBase), label: 'Base Annual Property Tax', source: 'Input: Annual Base' },
                            { type: 'operator', value: '÷' },
                            { type: 'value', value: '12', label: '12', source: 'Months per Year' },
                            { type: 'text', value: ' (Year 1 - no increase)' },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyTax) }
                        ];
                    } else {
                        breakdown.expression = [
                            { type: 'text', value: '(' },
                            { type: 'value', value: formatCurrency(propTaxBase), label: 'Base Annual Tax', source: 'Input: Annual Base' },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(propTaxIncrease), label: 'Yearly Increase Rate', source: 'Input: Increase %' },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${year - 1}`, label: 'Number of Increases', source: `Year ${year + 1} (Year 1 has no increase)` },
                            { type: 'text', value: ')' },
                            { type: 'operator', value: '÷' },
                            { type: 'value', value: '12', label: '12', source: 'Months per Year' },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyTax) }
                        ];
                    }
                }
                breakdown.result = formatCurrency(data.property_tax);
                break;
            }

            case 'rental_income': {
                // Rental Income = Base × (1 + Increase Rate)^Year
                const rentalBase = inputValues.get('rental_income_base') || 0;
                const rentalIncrease = (inputValues.get('rental_increase') || 0) / 100;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show monthly formula then multiply by 12
                    const lastMonth = yearData[yearData.length - 1];
                    const month = lastMonth.month || 0;
                    const year = Math.floor(month / 12);
                    const onePlusIncrease = 1 + rentalIncrease;
                    const increaseFactor = year === 0 ? 1 : Math.pow(onePlusIncrease, year);
                    const monthlyRental = rentalBase * increaseFactor;
                    const totalRental = monthlyRental * yearData.length;
                    
                    if (year === 0) {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(rentalBase), label: 'Base Monthly Rental', source: 'Input: Monthly Base' },
                            { type: 'text', value: ' (Year 1 - no increase)' },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Months in Year ${data.year || yearData[0].year}` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(totalRental) }
                        ];
                    } else {
                        breakdown.expression = [
                            { type: 'text', value: '(' },
                            { type: 'value', value: formatCurrency(rentalBase), label: 'Base Monthly Rental', source: 'Input: Monthly Base' },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(rentalIncrease), label: 'Yearly Increase Rate', source: 'Input: Increase %' },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${year - 1}`, label: 'Number of Increases', source: `Year ${year} (Year 1 has no increase)` },
                            { type: 'text', value: ')' },
                            { type: 'operator', value: '×' },
                            { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Months in Year ${data.year || yearData[0].year}` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(totalRental) }
                        ];
                    }
                } else {
                    // Regular row
                    const month = data.month || 0;
                    const year = Math.floor(month / 12);
                    const onePlusIncrease = 1 + rentalIncrease;
                    const increaseFactor = year === 0 ? 1 : Math.pow(onePlusIncrease, year);
                    const monthlyRental = rentalBase * increaseFactor;
                    
                    if (year === 0) {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(rentalBase), label: 'Base Monthly Rental', source: 'Input: Monthly Base' },
                            { type: 'text', value: ' (Year 1 - no increase)' }
                        ];
                    } else {
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(rentalBase), label: 'Base Monthly Rental', source: 'Input: Monthly Base' },
                            { type: 'operator', value: '×' },
                            { type: 'text', value: '(1 + ' },
                            { type: 'value', value: formatPercent(rentalIncrease), label: 'Yearly Increase Rate', source: 'Input: Increase %' },
                            { type: 'text', value: ')^' },
                            { type: 'value', value: `${year - 1}`, label: 'Number of Increases', source: `Year ${year} (Year 1 has no increase)` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(monthlyRental) }
                        ];
                    }
                }
                breakdown.result = formatCurrency(data.rental_income);
                break;
            }

            case 'total_expenses': {
                let mortgage, maintenance, propertyTax, insurance, utilities, repairs;
                
                // Get increase info for annotations
                const month = data.month || 0;
                const year = Math.floor(month / 12);
                const maintIncrease = (inputValues.get('maintenance_increase') || 0) / 100;
                const propTaxIncrease = (inputValues.get('property_tax_increase') || 0) / 100;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: sum all expense components across all months
                    mortgage = yearData.reduce((sum, month) => sum + (month.mortgage_payments || 0), 0);
                    maintenance = yearData.reduce((sum, month) => sum + (month.maintenance_fees || 0), 0);
                    propertyTax = yearData.reduce((sum, month) => sum + (month.property_tax || 0), 0);
                    insurance = yearData.reduce((sum, month) => sum + (month.insurance_paid || 0), 0);
                    utilities = yearData.reduce((sum, month) => sum + (month.utilities || 0), 0);
                    repairs = yearData.reduce((sum, month) => sum + (month.repairs || 0), 0);
                } else {
                    // Regular row
                    mortgage = data.mortgage_payments || 0;
                    maintenance = data.maintenance_fees || 0;
                    propertyTax = data.property_tax || 0;
                    insurance = data.insurance_paid || 0;
                    utilities = data.utilities || 0;
                    repairs = data.repairs || 0;
                }
                
                breakdown.expression = [
                    { type: 'value', value: formatCurrency(mortgage), label: 'Mortgage Payments', source: yearData ? `Mortgage Payments column (sum of ${yearData.length} months)` : 'Mortgage Payments column' },
                    { type: 'operator', value: '+' },
                    { type: 'value', value: formatCurrency(maintenance), label: 'Maintenance', source: yearData ? `Maintenance Fees column (sum of ${yearData.length} months)` : 'Maintenance Fees column' },
                    { type: 'operator', value: '+' },
                    { type: 'value', value: formatCurrency(propertyTax), label: 'Property Tax', source: yearData ? `Property Tax column (sum of ${yearData.length} months)` : 'Property Tax column' },
                    { type: 'operator', value: '+' },
                    { type: 'value', value: formatCurrency(insurance), label: 'Insurance', source: yearData ? `Insurance Paid column (sum of ${yearData.length} months)` : 'Insurance Paid column' },
                    { type: 'operator', value: '+' },
                    { type: 'value', value: formatCurrency(utilities), label: 'Utilities', source: yearData ? `Utilities column (sum of ${yearData.length} months)` : 'Utilities column' },
                    { type: 'operator', value: '+' },
                    { type: 'value', value: formatCurrency(repairs), label: 'Repairs', source: yearData ? `Repairs column (sum of ${yearData.length} months)` : 'Repairs column' },
                    { type: 'equals', value: '=' },
                    { type: 'text', value: formatCurrency(data.total_expenses) }
                ];
                breakdown.result = formatCurrency(data.total_expenses);
                break;
            }

            case 'deductible_expenses': {
                // Deductible Expenses = Interest Paid + Maintenance + Property Tax + Insurance + Utilities + Repairs
                const interestPaid = data.interest_paid || 0;
                const maintenance = data.maintenance_fees || 0;
                const propertyTax = data.property_tax || 0;
                const insurance = data.insurance_paid || 0;
                const utilities = data.utilities || 0;
                const repairs = data.repairs || 0;
                
                // Get increase info for annotations
                const month = data.month || 0;
                const year = Math.floor(month / 12);
                const maintIncrease = (inputValues.get('maintenance_increase') || 0) / 100;
                const propTaxIncrease = (inputValues.get('property_tax_increase') || 0) / 100;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: sum all deductible expenses
                    const monthlyInterest = yearData.reduce((sum, month) => sum + (month.interest_paid || 0), 0);
                    const monthlyMaintenance = yearData.reduce((sum, month) => sum + (month.maintenance_fees || 0), 0);
                    const monthlyPropertyTax = yearData.reduce((sum, month) => sum + (month.property_tax || 0), 0);
                    const monthlyInsurance = yearData.reduce((sum, month) => sum + (month.insurance_paid || 0), 0);
                    const monthlyUtilities = yearData.reduce((sum, month) => sum + (month.utilities || 0), 0);
                    const monthlyRepairs = yearData.reduce((sum, month) => sum + (month.repairs || 0), 0);
                    
                    const firstMonth = yearData[0];
                    const firstYear = Math.floor((firstMonth.month || 0) / 12);
                    
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(monthlyInterest), label: 'Interest Paid', source: `Interest Paid column (sum of ${yearData.length} months)` },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(monthlyMaintenance), label: 'Maintenance', source: `Maintenance Fees column (sum of ${yearData.length} months)` },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(monthlyPropertyTax), label: 'Property Tax', source: `Property Tax column (sum of ${yearData.length} months)` },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(monthlyInsurance), label: 'Insurance', source: `Insurance Paid column (sum of ${yearData.length} months)` },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(monthlyUtilities), label: 'Utilities', source: `Utilities column (sum of ${yearData.length} months)` },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(monthlyRepairs), label: 'Repairs', source: `Repairs column (sum of ${yearData.length} months)` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(data.deductible_expenses) }
                    ];
                } else {
                    // Regular row
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(interestPaid), label: 'Interest Paid', source: 'Interest Paid column' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(maintenance), label: 'Maintenance', source: 'Maintenance Fees column' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(propertyTax), label: 'Property Tax', source: 'Property Tax column' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(insurance), label: 'Insurance', source: 'Insurance Paid column' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(utilities), label: 'Utilities', source: 'Utilities column' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(repairs), label: 'Repairs', source: 'Repairs column' },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(data.deductible_expenses) }
                    ];
                }
                breakdown.result = formatCurrency(data.deductible_expenses);
                break;
            }

            case 'taxable_income': {
                let rentalIncome, deductibleExpenses, taxableIncome;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: sum values across all months in the year
                    rentalIncome = yearData.reduce((sum, month) => sum + (month.rental_income || 0), 0);
                    deductibleExpenses = yearData.reduce((sum, month) => sum + (month.deductible_expenses || 0), 0);
                    taxableIncome = data.taxable_income || 0; // Already summed by YearGroupRow
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(rentalIncome), label: 'Rental Income', source: `Rental Income column (sum of ${yearData.length} months)` },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(deductibleExpenses), label: 'Deductible Expenses', source: `Deductible Expenses column (sum of ${yearData.length} months)` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(taxableIncome) }
                    ];
                } else {
                    // Regular row: use single month values
                    rentalIncome = data.rental_income || 0;
                    deductibleExpenses = data.deductible_expenses || 0;
                    taxableIncome = data.taxable_income || 0;
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(rentalIncome), label: 'Rental Income', source: 'Rental Income column' },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(deductibleExpenses), label: 'Deductible Expenses', source: 'Deductible Expenses column' },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(taxableIncome) }
                    ];
                }
                breakdown.result = formatCurrency(taxableIncome);
                break;
            }

            case 'taxes_due': {
                let taxableIncome, taxesDue;
                const taxRate = (inputValues.get('marginal_tax_rate') || 0) / 100;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: use summed taxable income
                    taxableIncome = yearData.reduce((sum, month) => sum + (month.taxable_income || 0), 0);
                    taxesDue = data.taxes_due || 0; // Already summed by YearGroupRow
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(taxableIncome), label: 'Taxable Income', source: `Taxable Income column (sum of ${yearData.length} months)` },
                        { type: 'operator', value: '×' },
                        { type: 'value', value: formatPercent(taxRate), label: 'Marginal Tax Rate', source: 'Input: Marginal Tax Rate' },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(taxesDue) }
                    ];
                } else {
                    // Regular row: use single month values
                    taxableIncome = data.taxable_income || 0;
                    taxesDue = data.taxes_due || 0;
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(taxableIncome), label: 'Taxable Income', source: 'Taxable Income column' },
                        { type: 'operator', value: '×' },
                        { type: 'value', value: formatPercent(taxRate), label: 'Marginal Tax Rate', source: 'Input: Marginal Tax Rate' },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(taxesDue) }
                    ];
                }
                breakdown.result = formatCurrency(taxesDue);
                break;
            }

            case 'rental_gains': {
                let rentalIncome, totalExpenses, taxesDue, netProfit;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: sum values across all months in the year
                    rentalIncome = yearData.reduce((sum, month) => sum + (month.rental_income || 0), 0);
                    totalExpenses = yearData.reduce((sum, month) => sum + (month.total_expenses || 0), 0);
                    taxesDue = yearData.reduce((sum, month) => sum + (month.taxes_due || 0), 0);
                    netProfit = data.rental_gains || 0; // Already summed by YearGroupRow
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(rentalIncome), label: 'Rental Income', source: `Rental Income column (sum of ${yearData.length} months)` },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(totalExpenses), label: 'Total Expenses', source: `Total Expenses column (sum of ${yearData.length} months)` },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(taxesDue), label: 'Taxes Due', source: `Taxes Due column (sum of ${yearData.length} months)` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(netProfit) }
                    ];
                } else {
                    // Regular row: use single month values
                    rentalIncome = data.rental_income || 0;
                    totalExpenses = data.total_expenses || 0;
                    taxesDue = data.taxes_due || 0;
                    netProfit = data.rental_gains || 0;
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(rentalIncome), label: 'Rental Income', source: 'Rental Income column' },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(totalExpenses), label: 'Total Expenses', source: 'Total Expenses column' },
                        { type: 'operator', value: '−' },
                        { type: 'value', value: formatCurrency(taxesDue), label: 'Taxes Due', source: 'Taxes Due column' },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(netProfit) }
                    ];
                }
                breakdown.result = formatCurrency(netProfit);
                break;
            }

            case 'cumulative_rental_gains': {
                // Cumulative Rental Gains = Previous Cumulative Rental Gains + Current Month Rental Gains
                const currentCumulativeNetProfit = data.cumulative_rental_gains !== undefined ? data.cumulative_rental_gains : 0;
                const currentNetProfit = data.rental_gains !== undefined ? data.rental_gains : 0;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show the same formula as the last month of that year
                    const lastMonth = yearData[yearData.length - 1];
                    const lastMonthCumulativeNetProfit = lastMonth.cumulative_rental_gains !== undefined ? lastMonth.cumulative_rental_gains : 0;
                    const lastMonthNetProfit = lastMonth.rental_gains !== undefined ? lastMonth.rental_gains : 0;
                    const previousCumulativeNetProfit = lastMonthCumulativeNetProfit - lastMonthNetProfit;
                    
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(previousCumulativeNetProfit), label: 'Previous Cumulative Rental Gains', source: `Cumulative Rental Gains column (Month ${(lastMonth.month || 0) - 1})` },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(lastMonthNetProfit), label: 'Current Rental Gains', source: `Rental Gains column (Month ${lastMonth.month || 0})` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(lastMonthCumulativeNetProfit) }
                    ];
                    // Use the last month's cumulative for the result in summary rows
                    breakdown.result = formatCurrency(lastMonthCumulativeNetProfit);
                } else {
                    // Regular row
                    if (data.month === 0) {
                        // Month 0: starts at 0
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(0), label: 'Starting Value', source: 'Month 0 (Initial State)' }
                        ];
                    } else {
                        // Subsequent months: previous cumulative + current rental gains
                        const previousCumulativeNetProfit = currentCumulativeNetProfit - currentNetProfit;
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(previousCumulativeNetProfit), label: 'Previous Cumulative Rental Gains', source: `Cumulative Rental Gains column (Month ${(data.month || 0) - 1})` },
                            { type: 'operator', value: '+' },
                            { type: 'value', value: formatCurrency(currentNetProfit), label: 'Current Rental Gains', source: `Rental Gains column (Month ${data.month || 0})` },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(currentCumulativeNetProfit) }
                        ];
                    }
                    breakdown.result = formatCurrency(currentCumulativeNetProfit);
                }
                
                break;
            }

            case 'cumulative_investment': {
                // New calculation: Cumulative Investment = Downpayment + max(0, -Cumulative Rental Gains)
                // If cumulative rental gains is negative (losses), add to investment
                // If cumulative rental gains is positive, investment stays at downpayment
                const purchasePrice = inputValues.get('purchase_price') || 0;
                const downpaymentPercent = (inputValues.get('downpayment_percentage') || 0) / 100;
                const downpayment = purchasePrice * downpaymentPercent;
                const currentCumulative = data.cumulative_investment || 0;
                
                // Use cumulative rental gains directly from the data
                const cumulativeNetProfit = data.cumulative_rental_gains || 0;
                const losses = Math.max(0, -cumulativeNetProfit);
                
                if (data.month === 0) {
                    // Month 0: just downpayment
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(downpayment), label: 'Downpayment', source: `Purchase Price (${formatCurrency(purchasePrice)}) × Downpayment % (${formatPercent(downpaymentPercent)})` }
                    ];
                } else if (yearData && yearData.length > 0 && losses > 0) {
                    // Summary row with losses
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(downpayment), label: 'Downpayment', source: 'Initial Investment' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(losses), label: 'Cumulative Losses', source: `Cumulative Rental Gains column: ${formatCurrency(cumulativeNetProfit)} (negative = losses)` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(currentCumulative) }
                    ];
                } else if (losses > 0) {
                    // Single row with losses
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(downpayment), label: 'Downpayment', source: 'Initial Investment' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(losses), label: 'Cumulative Losses', source: `Cumulative Rental Gains column: ${formatCurrency(cumulativeNetProfit)} (negative = losses)` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(currentCumulative) }
                    ];
                } else {
                    // No losses, investment equals downpayment
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(downpayment), label: 'Downpayment', source: 'Initial Investment (no losses to add)' }
                    ];
                }
                
                breakdown.result = formatCurrency(currentCumulative);
                break;
            }

            case 'insurance_paid': {
                // Insurance = Annual Insurance ÷ 12
                const annualInsurance = inputValues.get('insurance') || 0;
                const monthlyInsurance = annualInsurance / 12;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show user input (annual insurance)
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(annualInsurance), label: 'Annual Insurance', source: 'Input: Annual Insurance' }
                    ];
                    breakdown.result = formatCurrency(data.insurance_paid);
                } else {
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(annualInsurance), label: 'Annual Insurance', source: 'Input: Annual Insurance' },
                        { type: 'operator', value: '÷' },
                        { type: 'value', value: '12', label: '12', source: 'Months per Year' },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(monthlyInsurance) }
                    ];
                    breakdown.result = formatCurrency(monthlyInsurance);
                }
                break;
            }

            case 'utilities': {
                // Utilities = Monthly Utilities (already monthly)
                const monthlyUtilities = inputValues.get('utilities') || 0;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show monthly formula * 12
                    const totalUtilities = monthlyUtilities * yearData.length;
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(monthlyUtilities), label: 'Monthly Utilities', source: 'Input: Monthly Utilities' },
                        { type: 'operator', value: '×' },
                        { type: 'value', value: `${yearData.length}`, label: 'Number of Months', source: `Months in Year ${data.year || yearData[0].year}` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(totalUtilities) }
                    ];
                    breakdown.result = formatCurrency(totalUtilities);
                } else {
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(monthlyUtilities), label: 'Monthly Utilities', source: 'Input: Monthly Utilities' }
                    ];
                    breakdown.result = formatCurrency(monthlyUtilities);
                }
                break;
            }

            case 'repairs': {
                // Repairs = Annual Repairs ÷ 12
                const annualRepairs = inputValues.get('repairs') || 0;
                const monthlyRepairs = annualRepairs / 12;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show user input (annual repairs)
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(annualRepairs), label: 'Annual Repairs', source: 'Input: Annual Repairs' }
                    ];
                    breakdown.result = formatCurrency(data.repairs);
                } else {
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(annualRepairs), label: 'Annual Repairs', source: 'Input: Annual Repairs' },
                        { type: 'operator', value: '÷' },
                        { type: 'value', value: '12', label: '12', source: 'Months per Year' },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(monthlyRepairs) }
                    ];
                    breakdown.result = formatCurrency(monthlyRepairs);
                }
                break;
            }

            case 'expected_return': {
                // Expected Return = (Cumulative Investment + Previous Cumulative Expected Return) × Return Rate
                const cumulativeInvestment = data.cumulative_investment || 0;
                const expectedReturnRate = (inputValues.get('expected_return_rate') || 0) / 100;
                const monthlyRate = expectedReturnRate / 12;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show formula from the last month as template
                    const lastMonth = yearData[yearData.length - 1];
                    const lastMonthCumulativeInvestment = lastMonth.cumulative_investment || 0;
                    const lastMonthCumulativeExpectedReturn = lastMonth.cumulative_expected_return || 0;
                    const lastMonthNetProfit = lastMonth.rental_gains || 0;
                    
                    // Calculate previous cumulative expected return for the last month
                    let lastMonthPreviousCumulativeExpectedReturn;
                    if ((lastMonth.month || 0) === 1) {
                        const purchasePrice = inputValues.get('purchase_price') || 0;
                        const downpaymentPercent = (inputValues.get('downpayment_percentage') || 0) / 100;
                        const downpayment = purchasePrice * downpaymentPercent;
                        lastMonthPreviousCumulativeExpectedReturn = downpayment;
                    } else {
                        lastMonthPreviousCumulativeExpectedReturn = lastMonthCumulativeExpectedReturn / (1 + monthlyRate) + lastMonthNetProfit;
                    }
                    
                    const lastMonthExpectedReturn = (lastMonthCumulativeInvestment + lastMonthPreviousCumulativeExpectedReturn) * monthlyRate;
                    const totalExpectedReturn = yearData.reduce((sum, month) => sum + (month.expected_return || 0), 0);
                    
                    breakdown.expression = [
                        { type: 'text', value: '(' },
                        { type: 'value', value: formatCurrency(lastMonthCumulativeInvestment), label: 'Cumulative Investment', source: 'Cumulative Investment column (final month)' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(lastMonthPreviousCumulativeExpectedReturn), label: 'Previous Cumulative Expected Return', source: (lastMonth.month || 0) === 1 ? 'Downpayment' : `Cumulative Expected Return column (Month ${(lastMonth.month || 0) - 1})` },
                        { type: 'text', value: ') × ' },
                        { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Expected Return Rate', source: `Annual Rate (${formatPercent(expectedReturnRate)}) ÷ 12` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(lastMonthExpectedReturn) }
                    ];
                    breakdown.note = `Note: This formula shows the calculation for the final month of the year for illustrative purposes. The summary value is the sum of expected return across all ${yearData.length} months.`;
                    breakdown.result = formatCurrency(totalExpectedReturn);
                } else {
                    // Regular row: calculate using current cumulative investment and previous cumulative expected return
                    const currentCumulativeExpectedReturn = data.cumulative_expected_return || 0;
                    const netProfit = data.rental_gains || 0;
                    
                    // Calculate previous cumulative expected return by reversing the formula:
                    // current = (previous - net_profit) * (1 + rate)
                    // previous = current / (1 + rate) + net_profit
                    let previousCumulativeExpectedReturn;
                    if (data.month === 0) {
                        previousCumulativeExpectedReturn = 0;
                    } else if (data.month === 1) {
                        const purchasePrice = inputValues.get('purchase_price') || 0;
                        const downpaymentPercent = (inputValues.get('downpayment_percentage') || 0) / 100;
                        const downpayment = purchasePrice * downpaymentPercent;
                        previousCumulativeExpectedReturn = downpayment;
                    } else {
                        previousCumulativeExpectedReturn = currentCumulativeExpectedReturn / (1 + monthlyRate) + netProfit;
                    }
                    
                    const expectedReturn = (cumulativeInvestment + previousCumulativeExpectedReturn) * monthlyRate;
                    
                    breakdown.expression = [
                        { type: 'text', value: '(' },
                        { type: 'value', value: formatCurrency(cumulativeInvestment), label: 'Cumulative Investment', source: 'Cumulative Investment column' },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(previousCumulativeExpectedReturn), label: 'Previous Cumulative Expected Return', source: data.month === 1 ? 'Downpayment' : `Cumulative Expected Return column (Month ${(data.month || 0) - 1})` },
                        { type: 'text', value: ') × ' },
                        { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Expected Return Rate', source: `Annual Rate (${formatPercent(expectedReturnRate)}) ÷ 12` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(expectedReturn) }
                    ];
                    breakdown.result = formatCurrency(expectedReturn);
                }
                break;
            }

            case 'cumulative_expected_return': {
                // Cumulative Expected Return = Sum of Expected Return values up to and including current row
                const purchasePrice = inputValues.get('purchase_price') || 0;
                const downpaymentPercent = (inputValues.get('downpayment_percentage') || 0) / 100;
                const downpayment = purchasePrice * downpaymentPercent;
                const currentCumulative = data.cumulative_expected_return || 0;
                const currentExpectedReturn = data.expected_return || 0;
                
                if (yearData && yearData.length > 0) {
                    // Summary row: show previous year summary + current year summary expected return
                    const firstMonth = yearData[0];
                    const currentYear = data.year || firstMonth.year;
                    const previousYearCumulative = (firstMonth.cumulative_expected_return || 0) - (firstMonth.expected_return || 0);
                    const currentYearExpectedReturn = yearData.reduce((sum, month) => sum + (month.expected_return || 0), 0); // Sum of expected return for the year
                    
                    breakdown.expression = [
                        { type: 'value', value: formatCurrency(previousYearCumulative), label: 'Previous Year Summary Cumulative Expected Return', source: `Cumulative Expected Return column (Year ${currentYear - 1} Summary)` },
                        { type: 'operator', value: '+' },
                        { type: 'value', value: formatCurrency(currentYearExpectedReturn), label: 'Current Year Summary Expected Return', source: `Expected Return column (Year ${currentYear} Summary, sum of ${yearData.length} months)` },
                        { type: 'equals', value: '=' },
                        { type: 'text', value: formatCurrency(currentCumulative) }
                    ];
                    breakdown.note = `Note: This formula shows the calculation using the previous year's summary cumulative expected return plus the current year's summary expected return. The summary value is the final month value of the year.`;
                } else {
                    // Regular row
                    if (data.month === 0) {
                        breakdown.expression = [
                            { type: 'text', value: '0 (No expected return in month 0)' }
                        ];
                    } else {
                        const previousCumulative = currentCumulative - currentExpectedReturn;
                        breakdown.expression = [
                            { type: 'value', value: formatCurrency(previousCumulative), label: 'Previous Cumulative Expected Return', source: `Cumulative Expected Return column (Month ${(data.month || 0) - 1})` },
                            { type: 'operator', value: '+' },
                            { type: 'value', value: formatCurrency(currentExpectedReturn), label: 'Expected Return', source: 'Expected Return column' },
                            { type: 'equals', value: '=' },
                            { type: 'text', value: formatCurrency(currentCumulative) }
                        ];
                    }
                }
                breakdown.result = formatCurrency(currentCumulative);
                break;
            }

            case 'home_value': {
                // Home Value = Purchase Price × (1 + Monthly Market Increase Rate)^Months
                const purchasePrice = inputValues.get('purchase_price') || 0;
                const marketIncrease = (inputValues.get('real_estate_market_increase') || 0) / 100;
                const months = data.month || 0;
                const monthlyRate = marketIncrease / 12;
                const onePlusRate = 1 + monthlyRate;
                const appreciationFactor = Math.pow(onePlusRate, months);
                const homeValue = purchasePrice * appreciationFactor;
                
                breakdown.expression = [
                    { type: 'value', value: formatCurrency(purchasePrice), label: 'Purchase Price', source: 'Input' },
                    { type: 'operator', value: '×' },
                    { type: 'text', value: '(1 + ' },
                    { type: 'value', value: formatPercent(monthlyRate), label: 'Monthly Market Rate', source: `Annual Rate (${formatPercent(marketIncrease)}) ÷ 12` },
                    { type: 'text', value: ')^' },
                    { type: 'value', value: `${months}`, label: 'Months', source: `Months since purchase` },
                    { type: 'equals', value: '=' },
                    { type: 'text', value: formatCurrency(homeValue) }
                ];
                
                breakdown.result = formatCurrency(data.home_value);
                break;
            }

            case 'capital_gains_tax': {
                // Capital Gains Tax = (Sale Price - Purchase Price - Selling Costs) × 0.5 × Marginal Tax Rate
                const salePrice = data.home_value || 0;
                const purchasePrice = inputValues.get('purchase_price') || 0;
                const sellingCosts = data.sales_fees || 0;
                const capitalGain = salePrice - purchasePrice - sellingCosts;
                const taxableGain = capitalGain * 0.5;
                const marginalRate = (inputValues.get('marginal_tax_rate') || 0) / 100;
                const capitalGainsTax = taxableGain * marginalRate;
                
                breakdown.expression = [
                    { type: 'text', value: '(' },
                    { type: 'value', value: formatCurrency(salePrice), label: 'Sale Price', source: 'Home Value column' },
                    { type: 'operator', value: '−' },
                    { type: 'value', value: formatCurrency(purchasePrice), label: 'Purchase Price', source: 'Input' },
                    { type: 'operator', value: '−' },
                    { type: 'value', value: formatCurrency(sellingCosts), label: 'Selling Costs', source: 'Sales Fees column' },
                    { type: 'text', value: ') × 0.5 × ' },
                    { type: 'value', value: formatPercent(marginalRate), label: 'Marginal Tax Rate', source: 'Input' },
                    { type: 'equals', value: '=' },
                    { type: 'text', value: formatCurrency(capitalGainsTax) }
                ];
                
                breakdown.result = formatCurrency(data.capital_gains_tax);
                break;
            }

            case 'return_comparison': {
                // Return Comparison = Net Return / Cumulative Expected Return
                const cumulativeExpectedReturn = data.cumulative_expected_return || 0;
                const netReturn = data.net_return || 0;
                const returnComparison = cumulativeExpectedReturn !== 0 ? netReturn / cumulativeExpectedReturn : 0;
                
                breakdown.expression = [
                    { type: 'value', value: formatCurrency(netReturn), label: 'Net Return', source: 'Net Return column' },
                    { type: 'operator', value: '÷' },
                    { type: 'value', value: formatCurrency(cumulativeExpectedReturn), label: 'Cumulative Expected Return', source: 'Cumulative Expected Return column' },
                    { type: 'equals', value: '=' },
                    { type: 'text', value: returnComparison.toFixed(4) }
                ];
                
                breakdown.result = returnComparison.toFixed(4);
                break;
            }

            case 'return_percent': {
                // Return % = Net Return ÷ Cumulative Investment × 100
                // Where Net Return and Cumulative Investment are calculated using the new method
                const netReturn = data.net_return || 0;
                const cumulativeInvestment = data.cumulative_investment || 0;
                const returnPercent = cumulativeInvestment > 0 ? (netReturn / cumulativeInvestment) * 100 : 0;
                breakdown.expression = [
                    { type: 'value', value: formatCurrency(netReturn), label: 'Net Return', source: 'Net Return column (calculated using new method)' },
                    { type: 'operator', value: '÷' },
                    { type: 'value', value: formatCurrency(cumulativeInvestment), label: 'Cumulative Investment', source: 'Cumulative Investment column (calculated using new method)' },
                    { type: 'operator', value: '×' },
                    { type: 'value', value: '100', label: '100', source: 'Convert to %' },
                    { type: 'equals', value: '=' },
                    { type: 'text', value: `${returnPercent.toFixed(2)}%` }
                ];
                breakdown.result = `${returnPercent.toFixed(2)}%`;
                break;
            }

            default:
                breakdown.expression = [
                    { type: 'text', value: formatCurrency(data[columnKey] || 0) }
                ];
                breakdown.result = formatCurrency(data[columnKey] || 0);
        }

        return breakdown;
    }
}
