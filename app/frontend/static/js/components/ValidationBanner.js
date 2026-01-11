/**
 * Validation banner component to display input validation errors.
 */
import { ValidationErrorsModal } from './ValidationErrorsModal.js';

export class ValidationBanner {
    constructor(parent) {
        this.container = document.createElement('div');
        this.container.className = 'validation-banner';
        this.container.style.display = 'none';
        this.errorsModal = new ValidationErrorsModal();
        this.allErrors = [];
        parent.appendChild(this.container);
    }

    /**
     * Show validation errors.
     * @param {Array<string>} errors - Array of error messages
     */
    show(errors) {
        if (!errors || errors.length === 0) {
            this.hide();
            return;
        }

        // Store all errors
        this.allErrors = errors;

        this.container.innerHTML = '';
        
        const icon = document.createElement('span');
        icon.className = 'validation-icon';
        icon.textContent = '⚠️';
        this.container.appendChild(icon);

        const content = document.createElement('div');
        content.className = 'validation-content';
        
        const title = document.createElement('div');
        title.className = 'validation-title';
        title.textContent = 'Please fix the following issues before calculating:';
        content.appendChild(title);

        const errorList = document.createElement('ul');
        errorList.className = 'validation-errors';
        
        // Show only first 2 errors
        const displayErrors = errors.slice(0, 2);
        displayErrors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorList.appendChild(li);
        });

        // If there are more than 2 errors, add "..." link
        if (errors.length > 2) {
            const moreLink = document.createElement('li');
            moreLink.className = 'validation-more-link';
            moreLink.style.cssText = `
                color: #856404;
                cursor: pointer;
                text-decoration: underline;
                font-weight: 600;
            `;
            moreLink.textContent = `... and ${errors.length - 2} more (click to view all)`;
            moreLink.addEventListener('click', () => {
                this.errorsModal.show(this.allErrors);
            });
            moreLink.addEventListener('mouseenter', () => {
                moreLink.style.color = '#664d03';
            });
            moreLink.addEventListener('mouseleave', () => {
                moreLink.style.color = '#856404';
            });
            errorList.appendChild(moreLink);
        }

        content.appendChild(errorList);
        this.container.appendChild(content);
        this.container.style.display = 'flex';
    }

    /**
     * Hide the validation banner.
     */
    hide() {
        this.container.style.display = 'none';
        this.allErrors = [];
    }
}

