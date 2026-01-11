/**
 * Modal for displaying all validation errors.
 */
export class ValidationErrorsModal {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.createModal();
    }

    createModal() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'validation-errors-modal-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10002;
            display: none;
            justify-content: center;
            align-items: center;
        `;

        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'validation-errors-modal';
        this.modal.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: relative;
        `;

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

        // Title
        this.titleElement = document.createElement('h3');
        this.titleElement.textContent = 'Validation Errors';
        this.titleElement.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 20px;
            color: #856404;
            font-weight: 600;
        `;
        this.modal.appendChild(this.titleElement);

        // Description
        this.descriptionElement = document.createElement('p');
        this.descriptionElement.textContent = 'Please fix the following issues before calculating:';
        this.descriptionElement.style.cssText = `
            margin: 0 0 16px 0;
            color: #666;
            font-size: 14px;
        `;
        this.modal.appendChild(this.descriptionElement);

        // Errors container
        this.errorsContainer = document.createElement('ul');
        this.errorsContainer.className = 'validation-errors-modal-list';
        this.errorsContainer.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
            color: #856404;
        `;
        this.modal.appendChild(this.errorsContainer);

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

    show(errors) {
        if (!errors || errors.length === 0) {
            this.hide();
            return;
        }

        // Clear previous errors
        this.errorsContainer.innerHTML = '';

        // Add all errors
        errors.forEach(error => {
            const li = document.createElement('li');
            li.style.cssText = `
                padding: 8px 0;
                padding-left: 24px;
                position: relative;
                border-bottom: 1px solid #f0f0f0;
            `;
            li.textContent = error;
            
            // Add bullet point
            const bullet = document.createElement('span');
            bullet.textContent = '•';
            bullet.style.cssText = `
                position: absolute;
                left: 0;
                font-weight: bold;
                color: #856404;
            `;
            li.insertBefore(bullet, li.firstChild);
            
            this.errorsContainer.appendChild(li);
        });

        this.overlay.style.display = 'flex';
    }

    hide() {
        this.overlay.style.display = 'none';
    }

    isVisible() {
        return this.overlay.style.display === 'flex';
    }
}

