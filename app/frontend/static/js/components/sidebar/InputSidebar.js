/**
 * Input sidebar component for all calculator inputs organized by category.
 */
import { InputGroup } from '../inputs/InputGroup.js';
export class InputSidebar {
    constructor(parent) {
        this.inputGroups = new Map();
        this.categories = new Map();
        this.wrapper = parent; // Store reference to wrapper
        this.container = document.createElement('div');
        this.container.className = 'input-sidebar';
        
        // Create header with toggle button
        this.createHeader();
        
        // Create categories
        this.createPurchaseCategory();
        this.createMortgageCategory();
        this.createExpensesCategory();
        this.createRentalCategory();
        this.createTaxCategory();
        this.createInvestmentCategory();
        this.createSaleCategory();
        parent.appendChild(this.container);
        
        // Load collapse states after DOM is ready
        requestAnimationFrame(() => {
            this.loadCollapseStates();
            this.loadSidebarCollapseState();
        });
    }
    createHeader() {
        const header = document.createElement('div');
        header.className = 'sidebar-toggle-header';
        
        const title = document.createElement('h2');
        title.textContent = 'Inputs';
        title.className = 'sidebar-title';
        header.appendChild(title);
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle-btn';
        toggleButton.innerHTML = '◀';
        toggleButton.title = 'Hide sidebar';
        toggleButton.setAttribute('aria-label', 'Toggle sidebar visibility');
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });
        
        header.appendChild(toggleButton);
        this.container.insertBefore(header, this.container.firstChild);
        this.toggleButton = toggleButton;
        
        // Create floating expand button (hidden by default)
        const floatingButton = document.createElement('button');
        floatingButton.className = 'sidebar-floating-btn sidebar-floating-btn-left';
        floatingButton.innerHTML = '▶';
        floatingButton.title = 'Show inputs sidebar';
        floatingButton.setAttribute('aria-label', 'Show inputs sidebar');
        floatingButton.style.display = 'none';
        floatingButton.addEventListener('click', () => {
            this.toggleSidebar();
        });
        document.body.appendChild(floatingButton);
        this.floatingButton = floatingButton;
    }
    toggleSidebar() {
        const isCollapsed = this.wrapper.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand sidebar
            this.wrapper.classList.remove('collapsed');
            this.toggleButton.innerHTML = '◀';
            this.toggleButton.title = 'Hide sidebar';
            if (this.floatingButton) {
                this.floatingButton.style.display = 'none';
            }
        } else {
            // Collapse sidebar
            this.wrapper.classList.add('collapsed');
            this.toggleButton.innerHTML = '▶';
            this.toggleButton.title = 'Show sidebar';
            if (this.floatingButton) {
                this.floatingButton.style.display = 'flex';
            }
        }
        
        // Save state
        this.saveSidebarCollapseState();
    }
    saveSidebarCollapseState() {
        try {
            const isCollapsed = this.wrapper.classList.contains('collapsed');
            localStorage.setItem('input_sidebar_collapsed', JSON.stringify(isCollapsed));
        } catch (error) {
            console.warn('Failed to save sidebar collapse state:', error);
        }
    }
    loadSidebarCollapseState() {
        try {
            const savedState = localStorage.getItem('input_sidebar_collapsed');
            if (savedState) {
                const isCollapsed = JSON.parse(savedState);
                if (isCollapsed) {
                    this.wrapper.classList.add('collapsed');
                    this.toggleButton.innerHTML = '▶';
                    this.toggleButton.title = 'Show sidebar';
                    if (this.floatingButton) {
                        this.floatingButton.style.display = 'flex';
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load sidebar collapse state:', error);
        }
    }
    createCategory(title) {
        const category = document.createElement('div');
        category.className = 'input-category';
        
        const heading = document.createElement('div');
        heading.className = 'input-category-heading';
        
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        titleElement.style.margin = '0';
        heading.appendChild(titleElement);
        
        const collapseIcon = document.createElement('span');
        collapseIcon.className = 'collapse-icon';
        collapseIcon.textContent = '▼';
        heading.appendChild(collapseIcon);
        
        const content = document.createElement('div');
        content.className = 'input-category-content';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
        
        // Store category info
        const categoryInfo = { category, heading, content, collapseIcon, title };
        this.categories.set(title, categoryInfo);
        
        // Add click handler to toggle collapse
        heading.addEventListener('click', () => {
            this.toggleCategory(title);
        });
        
        category.appendChild(heading);
        category.appendChild(content);
        this.container.appendChild(category);
        
        return content;
    }
    toggleCategory(title) {
        const categoryInfo = this.categories.get(title);
        if (!categoryInfo) return;
        
        const { content, collapseIcon, category } = categoryInfo;
        const isCollapsed = category.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            category.classList.remove('collapsed');
            collapseIcon.style.transform = 'rotate(0deg)';
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            // Remove max-height after transition to allow natural height
            setTimeout(() => {
                content.style.maxHeight = 'none';
            }, 300);
        } else {
            // Collapse
            category.classList.add('collapsed');
            collapseIcon.style.transform = 'rotate(-90deg)';
            content.style.maxHeight = content.scrollHeight + 'px';
            // Force reflow
            content.offsetHeight;
            content.style.maxHeight = '0';
            content.style.opacity = '0';
        }
        
        // Save collapse state
        this.saveCollapseStates();
    }
    saveCollapseStates() {
        try {
            const states = {};
            this.categories.forEach((info, title) => {
                states[title] = info.category.classList.contains('collapsed');
            });
            localStorage.setItem('input_sidebar_collapse_states', JSON.stringify(states));
        } catch (error) {
            console.warn('Failed to save collapse states:', error);
        }
    }
    loadCollapseStates() {
        try {
            const savedStates = localStorage.getItem('input_sidebar_collapse_states');
            if (savedStates) {
                const states = JSON.parse(savedStates);
                this.categories.forEach((info, title) => {
                    if (states[title]) {
                        // Set initial collapsed state
                        const { content, collapseIcon, category } = info;
                        category.classList.add('collapsed');
                        collapseIcon.style.transform = 'rotate(-90deg)';
                        content.style.maxHeight = '0';
                        content.style.opacity = '0';
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to load collapse states:', error);
        }
    }
    createPurchaseCategory() {
        const content = this.createCategory('Purchase & Downpayment');
        const purchasePriceInput = new InputGroup(content, 'Purchase Price', 'number', '', '1000');
        // Downpayment percentage input with computed amount display
        const downpaymentGroup = document.createElement('div');
        downpaymentGroup.className = 'input-group';
        const downpaymentLabel = document.createElement('label');
        downpaymentLabel.textContent = 'Downpayment (%)';
        downpaymentLabel.className = 'input-label';
        const downpaymentInput = document.createElement('input');
        downpaymentInput.type = 'number';
        downpaymentInput.value = '';
        downpaymentInput.step = '0.1';
        downpaymentInput.className = 'input-field';
        // Computed downpayment amount display
        const downpaymentAmountLabel = document.createElement('label');
        downpaymentAmountLabel.textContent = 'Downpayment Amount';
        downpaymentAmountLabel.className = 'input-label';
        const downpaymentAmountDisplay = document.createElement('input');
        downpaymentAmountDisplay.type = 'text';
        downpaymentAmountDisplay.className = 'input-field';
        downpaymentAmountDisplay.readOnly = true;
        downpaymentAmountDisplay.style.backgroundColor = '#f8f9fa';
        downpaymentAmountDisplay.style.cursor = 'default';
        const updateDownpaymentDisplay = () => {
            const purchasePrice = purchasePriceInput.getValue();
            const downpaymentPercent = parseFloat(downpaymentInput.value) || 0;
            const downpaymentAmount = purchasePrice * (downpaymentPercent / 100);
            downpaymentAmountDisplay.value = `$${downpaymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };
        const saveAndUpdate = () => {
            updateDownpaymentDisplay();
            if (this.saveConfigurationCallback) {
                this.saveConfigurationCallback();
            }
        };
        purchasePriceInput.addEventListener('input', saveAndUpdate);
        purchasePriceInput.addEventListener('change', saveAndUpdate);
        downpaymentInput.addEventListener('input', saveAndUpdate);
        downpaymentInput.addEventListener('change', saveAndUpdate);
        downpaymentGroup.appendChild(downpaymentLabel);
        downpaymentGroup.appendChild(downpaymentInput);
        downpaymentGroup.appendChild(downpaymentAmountLabel);
        downpaymentGroup.appendChild(downpaymentAmountDisplay);
        // Store reference to downpayment input element for event handling
        const downpaymentWrapper = {
            getValue: () => parseFloat(downpaymentInput.value) || 0,
            setValue: (val) => { downpaymentInput.value = val.toString(); updateDownpaymentDisplay(); },
            addEventListener: (event, handler) => {
                downpaymentInput.addEventListener(event, handler);
            },
            getInputElement: () => downpaymentInput
        };
        this.inputGroups.set('purchase_price', purchasePriceInput);
        this.inputGroups.set('downpayment_percentage', downpaymentWrapper);
        content.appendChild(downpaymentGroup);
        updateDownpaymentDisplay(); // Initial display
    }
    createMortgageCategory() {
        const content = this.createCategory('Mortgage');
        const interestRateInput = new InputGroup(content, 'Interest Rate (%)', 'number', '', '0.1');
        const loanYearsInput = new InputGroup(content, 'Loan Years', 'number', '', '1');
        this.inputGroups.set('interest_rate', interestRateInput);
        this.inputGroups.set('loan_years', loanYearsInput);
    }
    createExpensesCategory() {
        const content = this.createCategory('Expenses');
        // Maintenance
        const maintenanceBaseInput = new InputGroup(content, 'Maintenance - Monthly Base', 'number', '', '10');
        const maintenanceIncreaseInput = new InputGroup(content, 'Maintenance - Yearly Increase (%)', 'number', '', '0.1');
        // Property Tax
        const taxBaseInput = new InputGroup(content, 'Property Tax - Annual Base', 'number', '', '100');
        const taxIncreaseInput = new InputGroup(content, 'Property Tax - Yearly Increase (%)', 'number', '', '0.1');
        // Insurance
        const insuranceInput = new InputGroup(content, 'Annual Insurance', 'number', '', '100');
        // Utilities
        const utilitiesInput = new InputGroup(content, 'Monthly Utilities', 'number', '', '10');
        // Repairs
        const repairsInput = new InputGroup(content, 'Annual Repairs', 'number', '', '100');
        this.inputGroups.set('maintenance_base', maintenanceBaseInput);
        this.inputGroups.set('maintenance_increase', maintenanceIncreaseInput);
        this.inputGroups.set('property_tax_base', taxBaseInput);
        this.inputGroups.set('property_tax_increase', taxIncreaseInput);
        this.inputGroups.set('insurance', insuranceInput);
        this.inputGroups.set('utilities', utilitiesInput);
        this.inputGroups.set('repairs', repairsInput);
    }
    createRentalCategory() {
        const content = this.createCategory('Rental Income');
        const rentalBaseInput = new InputGroup(content, 'Monthly Rental', 'number', '', '100');
        const rentalIncreaseInput = new InputGroup(content, 'Yearly Increase (%)', 'number', '', '0.1');
        this.inputGroups.set('rental_income_base', rentalBaseInput);
        this.inputGroups.set('rental_increase', rentalIncreaseInput);
    }
    createTaxCategory() {
        const content = this.createCategory('Tax');
        const taxRateInput = new InputGroup(content, 'Marginal Tax Rate (%)', 'number', '', '1');
        this.inputGroups.set('marginal_tax_rate', taxRateInput);
    }
    createInvestmentCategory() {
        const content = this.createCategory('Investment');
        const expectedReturnInput = new InputGroup(content, 'Expected Return Rate (%)', 'number', '', '0.1');
        this.inputGroups.set('expected_return_rate', expectedReturnInput);
    }
    createSaleCategory() {
        const content = this.createCategory('Sale & Market');
        const realEstateMarketIncreaseInput = new InputGroup(content, 'Real Estate Market Increase (%)', 'number', '', '0.1');
        const commissionPercentageInput = new InputGroup(content, 'Commission Percentage (%)', 'number', '', '0.1');
        this.inputGroups.set('real_estate_market_increase', realEstateMarketIncreaseInput);
        this.inputGroups.set('commission_percentage', commissionPercentageInput);
    }
    getInputGroups() {
        return this.inputGroups;
    }
    setSaveConfigurationCallback(callback) {
        this.saveConfigurationCallback = callback;
        // Attach save listeners to all inputs
        this.inputGroups.forEach((inputGroup) => {
            const inputElement = inputGroup.getInputElement();
            if (inputElement) {
                const saveHandler = () => {
                    this.saveConfiguration();
                    setTimeout(() => {
                        if (this.saveConfigurationCallback) {
                            this.saveConfigurationCallback();
                        }
                    }, 0);
                };
                inputElement.addEventListener('input', saveHandler);
                inputElement.addEventListener('change', saveHandler);
            }
        });
    }
    addInputChangeListener(handler) {
        this.inputGroups.forEach(inputGroup => {
            inputGroup.addEventListener('input', handler);
            inputGroup.addEventListener('change', handler);
        });
    }
    getInputValues() {
        const values = new Map();
        this.inputGroups.forEach((inputGroup, key) => {
            values.set(key, inputGroup.getValue());
        });
        return values;
    }

    /**
     * Check if an input field is empty or invalid.
     * @param {string} key - The input key to check
     * @returns {boolean} True if the input is empty or invalid
     */
    isInputEmpty(key) {
        const inputGroup = this.inputGroups.get(key);
        if (!inputGroup) {
            return true;
        }
        const inputElement = inputGroup.getInputElement();
        if (!inputElement) {
            return true;
        }
        const rawValue = inputElement.value;
        if (rawValue === null || rawValue === undefined) {
            return true;
        }
        const trimmedValue = String(rawValue).trim();
        if (trimmedValue === '') {
            return true;
        }
        const numValue = parseFloat(trimmedValue);
        return isNaN(numValue);
    }
    saveConfiguration() {
        try {
            const inputValues = {};
            this.inputGroups.forEach((inputGroup, key) => {
                const value = inputGroup.getValue();
                if (value !== undefined && !isNaN(value)) {
                    inputValues[key] = value;
                }
            });
            localStorage.setItem('calculator_inputs', JSON.stringify(inputValues));
        }
        catch (error) {
            console.warn('Failed to save configuration:', error);
        }
    }
    loadConfiguration() {
        try {
            const savedInputs = localStorage.getItem('calculator_inputs');
            if (savedInputs) {
                const inputValues = JSON.parse(savedInputs);
                this.inputGroups.forEach((inputGroup, key) => {
                    if (inputValues[key] !== undefined) {
                        inputGroup.setValue(inputValues[key]);
                    }
                });
                // Trigger downpayment display update
                const purchasePriceInput = this.inputGroups.get('purchase_price');
                const downpaymentInput = this.inputGroups.get('downpayment_percentage');
                if (purchasePriceInput && downpaymentInput) {
                    setTimeout(() => {
                        purchasePriceInput.getInputElement().dispatchEvent(new Event('input', { bubbles: true }));
                        downpaymentInput.getInputElement().dispatchEvent(new Event('input', { bubbles: true }));
                    }, 0);
                }
            }
        }
        catch (error) {
            console.warn('Failed to load configuration:', error);
        }
    }
}
