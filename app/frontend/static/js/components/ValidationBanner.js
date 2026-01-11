/**
 * Validation banner component to display input validation errors.
 */
export class ValidationBanner {
    constructor(parent) {
        this.container = document.createElement('div');
        this.container.className = 'validation-banner';
        this.container.style.display = 'none';
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
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorList.appendChild(li);
        });
        content.appendChild(errorList);

        this.container.appendChild(content);
        this.container.style.display = 'flex';
    }

    /**
     * Hide the validation banner.
     */
    hide() {
        this.container.style.display = 'none';
    }
}

