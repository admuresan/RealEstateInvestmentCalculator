/**
 * Select group component for dropdown inputs.
 */
export class SelectGroup {
    constructor(parent, labelText, options = [], defaultValue = '') {
        this.container = document.createElement('div');
        this.container.className = 'input-group';
        this.label = document.createElement('label');
        this.label.textContent = labelText;
        this.label.className = 'input-label';
        this.select = document.createElement('select');
        this.select.className = 'input-field';
        
        // Add options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            if (typeof option === 'string') {
                optionElement.value = option;
                optionElement.textContent = option;
            } else {
                optionElement.value = option.value;
                optionElement.textContent = option.label || option.value;
            }
            this.select.appendChild(optionElement);
        });
        
        // Set default value
        if (defaultValue) {
            this.select.value = defaultValue;
        }
        
        this.container.appendChild(this.label);
        this.container.appendChild(this.select);
        parent.appendChild(this.container);
    }
    
    getValue() {
        return this.select.value;
    }
    
    setValue(value) {
        this.select.value = value || '';
        // Trigger change and input events so listeners are notified
        this.select.dispatchEvent(new Event('change', { bubbles: true }));
        this.select.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    addEventListener(event, handler) {
        this.select.addEventListener(event, handler);
    }
    
    getInputElement() {
        return this.select;
    }
}

