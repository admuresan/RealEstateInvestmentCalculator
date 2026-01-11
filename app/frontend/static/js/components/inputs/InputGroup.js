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
        return parseFloat(this.input.value) || 0;
    }
    setValue(value) {
        this.input.value = value.toString();
    }
    addEventListener(event, handler) {
        this.input.addEventListener(event, handler);
    }
    getInputElement() {
        return this.input;
    }
}
