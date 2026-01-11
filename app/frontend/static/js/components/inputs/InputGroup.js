/**
 * Input group component for column parameters.
 */
export class InputGroup {
    constructor(parent, labelText, inputType = 'number', defaultValue = '', step = '0.01') {
        this.container = document.createElement('div');
        this.container.className = 'input-group';
        this.label = document.createElement('label');
        this.label.textContent = labelText;
        this.label.className = 'input-label';
        this.input = document.createElement('input');
        this.input.type = inputType;
        this.input.value = defaultValue;
        this.input.step = step;
        this.input.className = 'input-field';
        this.container.appendChild(this.label);
        this.container.appendChild(this.input);
        parent.appendChild(this.container);
    }
    getValue() {
        const trimmedValue = String(this.input.value).trim();
        if (trimmedValue === '') {
            return null; // Return null for empty inputs to distinguish from 0
        }
        const numValue = parseFloat(trimmedValue);
        return isNaN(numValue) ? null : numValue;
    }
    setValue(value) {
        // Handle null/undefined by setting to empty string
        if (value === null || value === undefined) {
            this.input.value = '';
        } else {
            this.input.value = value.toString();
        }
        // Trigger change and input events so listeners are notified
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    addEventListener(event, handler) {
        this.input.addEventListener(event, handler);
    }
    getInputElement() {
        return this.input;
    }
}
