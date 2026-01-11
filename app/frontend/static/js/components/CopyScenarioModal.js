/**
 * Modal for selecting which scenario tab to copy values from.
 */
export class CopyScenarioModal {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.resolveCallback = null;
        this.createModal();
    }

    createModal() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'copy-scenario-modal-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10001;
            display: none;
            justify-content: center;
            align-items: center;
        `;

        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'copy-scenario-modal';
        this.modal.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: relative;
        `;

        // Title
        const title = document.createElement('h3');
        title.textContent = 'Copy Scenario';
        title.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 20px;
            color: #333;
            font-weight: 600;
        `;
        this.modal.appendChild(title);

        // Description
        this.descriptionElement = document.createElement('p');
        this.descriptionElement.textContent = 'Select which scenario to copy values from:';
        this.descriptionElement.style.cssText = `
            margin: 0 0 16px 0;
            color: #666;
            font-size: 14px;
        `;
        this.modal.appendChild(this.descriptionElement);

        // Options container
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 20px;
        `;
        this.modal.appendChild(this.optionsContainer);

        // Buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        `;

        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            color: #333;
        `;
        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.backgroundColor = '#f5f5f5';
        });
        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.backgroundColor = 'white';
        });
        cancelButton.addEventListener('click', () => this.hide());
        buttonsContainer.appendChild(cancelButton);

        this.modal.appendChild(buttonsContainer);
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

    show(scenarioNames) {
        // Clear previous options
        this.optionsContainer.innerHTML = '';

        // Update description based on whether there are scenarios to copy from
        if (scenarioNames.length === 0) {
            this.descriptionElement.textContent = 'Create a new scenario:';
        } else {
            this.descriptionElement.textContent = 'Select which scenario to copy values from, or create a new one:';
        }

        // Add "Create from default" option first
        const defaultOption = document.createElement('button');
        defaultOption.textContent = 'Create from Default';
        defaultOption.style.cssText = `
            padding: 12px 16px;
            border: 1px solid #667eea;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            color: #667eea;
            text-align: left;
            transition: all 0.2s ease;
            font-weight: 600;
        `;
        defaultOption.addEventListener('mouseenter', () => {
            defaultOption.style.backgroundColor = '#f0f4ff';
        });
        defaultOption.addEventListener('mouseleave', () => {
            defaultOption.style.backgroundColor = 'white';
        });
        defaultOption.addEventListener('click', () => {
            if (this.resolveCallback) {
                this.resolveCallback('default');
            }
            this.hide();
        });
        this.optionsContainer.appendChild(defaultOption);

        // Add "Blank" option
        const blankOption = document.createElement('button');
        blankOption.textContent = 'Blank (Start Fresh)';
        blankOption.style.cssText = `
            padding: 12px 16px;
            border: 1px solid #667eea;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            color: #667eea;
            text-align: left;
            transition: all 0.2s ease;
        `;
        blankOption.addEventListener('mouseenter', () => {
            blankOption.style.backgroundColor = '#f0f4ff';
        });
        blankOption.addEventListener('mouseleave', () => {
            blankOption.style.backgroundColor = 'white';
        });
        blankOption.addEventListener('click', () => {
            if (this.resolveCallback) {
                this.resolveCallback('blank');
            }
            this.hide();
        });
        this.optionsContainer.appendChild(blankOption);

        // Create option for each scenario
        scenarioNames.forEach((name, index) => {
            const option = document.createElement('button');
            option.textContent = name;
            option.style.cssText = `
                padding: 12px 16px;
                border: 1px solid #667eea;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                color: #667eea;
                text-align: left;
                transition: all 0.2s ease;
            `;
            option.addEventListener('mouseenter', () => {
                option.style.backgroundColor = '#f0f4ff';
            });
            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = 'white';
            });
            option.addEventListener('click', () => {
                if (this.resolveCallback) {
                    this.resolveCallback(index);
                }
                this.hide();
            });
            this.optionsContainer.appendChild(option);
        });

        this.overlay.style.display = 'flex';
    }

    hide() {
        this.overlay.style.display = 'none';
        if (this.resolveCallback) {
            this.resolveCallback(null);
        }
        this.resolveCallback = null;
    }

    isVisible() {
        return this.overlay.style.display === 'flex';
    }

    /**
     * Show modal and return a promise that resolves with the selected scenario index (or null if cancelled)
     */
    async selectScenario(scenarioNames) {
        return new Promise((resolve) => {
            this.resolveCallback = resolve;
            this.show(scenarioNames);
        });
    }
}

