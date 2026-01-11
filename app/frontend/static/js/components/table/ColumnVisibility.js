/**
 * Column visibility control component.
 */
export class ColumnVisibility {
    constructor(parent, columns, onChange) {
        this.checkboxes = new Map();
        this.columns = columns;
        this.onChangeCallback = onChange;
        this.container = document.createElement('div');
        this.container.className = 'column-visibility';
        const header = document.createElement('h3');
        header.textContent = 'Show/Hide Columns';
        header.className = 'visibility-header';
        this.container.appendChild(header);
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'visibility-checkboxes';
        columns.forEach(column => {
            const label = document.createElement('label');
            label.className = 'visibility-label';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true; // All columns visible by default
            checkbox.className = 'visibility-checkbox';
            checkbox.dataset.column = column;
            const span = document.createElement('span');
            span.textContent = this.formatColumnName(column);
            span.className = 'visibility-label-text';
            label.appendChild(checkbox);
            label.appendChild(span);
            checkboxContainer.appendChild(label);
            this.checkboxes.set(column, checkbox);
            checkbox.addEventListener('change', () => this.handleChange());
        });
        this.container.appendChild(checkboxContainer);
        parent.appendChild(this.container);
    }
    formatColumnName(column) {
        return column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    handleChange() {
        const visibleColumns = new Set();
        this.checkboxes.forEach((checkbox, column) => {
            if (checkbox.checked) {
                visibleColumns.add(column);
            }
        });
        this.onChangeCallback(visibleColumns);
    }
    getVisibleColumns() {
        const visibleColumns = new Set();
        this.checkboxes.forEach((checkbox, column) => {
            if (checkbox.checked) {
                visibleColumns.add(column);
            }
        });
        return visibleColumns;
    }
    setColumnVisibility(visibleColumns) {
        this.checkboxes.forEach((checkbox, column) => {
            checkbox.checked = visibleColumns.has(column);
        });
    }
}
