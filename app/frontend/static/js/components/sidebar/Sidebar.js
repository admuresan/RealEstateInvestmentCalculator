/**
 * Sidebar component for displaying column explanations and formulas.
 */
import { COLUMN_DEFINITIONS } from './ColumnInfo.js';
import { storage } from '../../utils/storage.js';
export class Sidebar {
    constructor(parent) {
        this.columnItems = new Map();
        this.wrapper = parent; // Store reference to wrapper
        
        // Create column info container wrapper
        this.columnInfoContainer = document.createElement('div');
        this.columnInfoContainer.className = 'column-info-container';
        parent.appendChild(this.columnInfoContainer);
        
        // Create header (without button) - above scrollable content
        this.createHeader();
        
        // Create scrollable content container
        this.scrollableContent = document.createElement('div');
        this.scrollableContent.className = 'sidebar-content-scrollable';
        
        this.content = document.createElement('div');
        this.content.className = 'sidebar-content';
        this.scrollableContent.appendChild(this.content);
        
        this.columnInfoContainer.appendChild(this.scrollableContent);
        
        // Display all column information
        this.showAllColumns();
        
        // Create toggle button on the sidebar itself (after content is added)
        this.createToggleButton();
        
        // Load collapse states after DOM is ready
        requestAnimationFrame(() => {
            this.loadCollapseStates();
            this.loadSidebarCollapseState();
        });
    }
    createHeader() {
        const header = document.createElement('div');
        header.className = 'sidebar-header';
        
        const title = document.createElement('h2');
        title.textContent = 'Column Information';
        title.className = 'sidebar-title';
        header.appendChild(title);
        
        this.columnInfoContainer.appendChild(header);
    }
    createToggleButton() {
        // Create toggle button on the sidebar wrapper itself (not inside sidebar component)
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle-btn sidebar-toggle-btn-positioned';
        toggleButton.innerHTML = '▶';
        toggleButton.title = 'Hide sidebar';
        toggleButton.setAttribute('aria-label', 'Toggle sidebar visibility');
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });
        
        // Append to wrapper (sidebar-wrapper), not the sidebar container
        this.wrapper.appendChild(toggleButton);
        this.toggleButton = toggleButton;
        
        // Create floating expand button (hidden by default)
        const floatingButton = document.createElement('button');
        floatingButton.className = 'sidebar-floating-btn sidebar-floating-btn-right';
        floatingButton.innerHTML = '◀';
        floatingButton.title = 'Show column information sidebar';
        floatingButton.setAttribute('aria-label', 'Show column information sidebar');
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
            this.toggleButton.innerHTML = '▶';
            this.toggleButton.title = 'Hide sidebar';
            if (this.floatingButton) {
                this.floatingButton.style.display = 'none';
            }
        } else {
            // Collapse sidebar
            this.wrapper.classList.add('collapsed');
            this.toggleButton.innerHTML = '◀';
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
            storage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
        } catch (error) {
            console.warn('Failed to save sidebar collapse state:', error);
        }
    }
    loadSidebarCollapseState() {
        try {
            const savedState = storage.getItem('sidebar_collapsed');
            if (savedState) {
                const isCollapsed = JSON.parse(savedState);
                if (isCollapsed) {
                    this.wrapper.classList.add('collapsed');
                    this.toggleButton.innerHTML = '◀';
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
    showAllColumns() {
        this.content.innerHTML = '';
        COLUMN_DEFINITIONS.forEach((column, index) => {
            const columnItem = document.createElement('div');
            columnItem.className = 'column-info-item';
            
            const nameHeader = document.createElement('div');
            nameHeader.className = 'column-name-header';
            
            const nameEl = document.createElement('h3');
            nameEl.textContent = column.name;
            nameEl.className = 'column-name';
            nameEl.style.margin = '0';
            nameHeader.appendChild(nameEl);
            
            const collapseIcon = document.createElement('span');
            collapseIcon.className = 'collapse-icon';
            collapseIcon.textContent = '▼';
            nameHeader.appendChild(collapseIcon);
            
            const detailsContainer = document.createElement('div');
            detailsContainer.className = 'column-details';
            detailsContainer.style.overflow = 'hidden';
            detailsContainer.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
            
            const descEl = document.createElement('p');
            descEl.textContent = column.description;
            descEl.className = 'column-description';
            const formulaLabel = document.createElement('strong');
            formulaLabel.textContent = 'Formula: ';
            const formulaEl = document.createElement('p');
            formulaEl.className = 'column-formula';
            formulaEl.appendChild(formulaLabel);
            formulaEl.appendChild(document.createTextNode(column.formula));
            
            detailsContainer.appendChild(descEl);
            detailsContainer.appendChild(formulaEl);
            
            // Add aggregation note if available
            if (column.aggregationNote) {
                const aggregationLabel = document.createElement('strong');
                aggregationLabel.textContent = 'Summary Aggregation: ';
                const aggregationEl = document.createElement('p');
                aggregationEl.className = 'column-aggregation';
                aggregationEl.style.marginTop = '8px';
                aggregationEl.style.fontSize = '0.9em';
                aggregationEl.style.color = '#666';
                aggregationEl.appendChild(aggregationLabel);
                aggregationEl.appendChild(document.createTextNode(column.aggregationNote));
                detailsContainer.appendChild(aggregationEl);
            }
            
            columnItem.appendChild(nameHeader);
            columnItem.appendChild(detailsContainer);
            this.content.appendChild(columnItem);
            
            // Store column item info
            const itemInfo = { columnItem, nameHeader, detailsContainer, collapseIcon, columnName: column.name };
            this.columnItems.set(column.name, itemInfo);
            
            // Add click handler to toggle collapse
            nameHeader.addEventListener('click', () => {
                this.toggleColumn(column.name);
            });
        });
    }
    toggleColumn(columnName) {
        const itemInfo = this.columnItems.get(columnName);
        if (!itemInfo) return;
        
        const { detailsContainer, collapseIcon, columnItem } = itemInfo;
        const isCollapsed = columnItem.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            columnItem.classList.remove('collapsed');
            collapseIcon.style.transform = 'rotate(0deg)';
            detailsContainer.style.maxHeight = detailsContainer.scrollHeight + 'px';
            detailsContainer.style.opacity = '1';
            // Remove max-height after transition to allow natural height
            setTimeout(() => {
                detailsContainer.style.maxHeight = 'none';
            }, 300);
        } else {
            // Collapse
            columnItem.classList.add('collapsed');
            collapseIcon.style.transform = 'rotate(-90deg)';
            detailsContainer.style.maxHeight = detailsContainer.scrollHeight + 'px';
            // Force reflow
            detailsContainer.offsetHeight;
            detailsContainer.style.maxHeight = '0';
            detailsContainer.style.opacity = '0';
        }
        
        // Save collapse state
        this.saveCollapseStates();
    }
    saveCollapseStates() {
        try {
            const states = {};
            this.columnItems.forEach((info, columnName) => {
                states[columnName] = info.columnItem.classList.contains('collapsed');
            });
            storage.setItem('sidebar_collapse_states', JSON.stringify(states));
        } catch (error) {
            console.warn('Failed to save collapse states:', error);
        }
    }
    loadCollapseStates() {
        try {
            const savedStates = storage.getItem('sidebar_collapse_states');
            if (savedStates) {
                const states = JSON.parse(savedStates);
                this.columnItems.forEach((info, columnName) => {
                    if (states[columnName]) {
                        // Set initial collapsed state
                        const { detailsContainer, collapseIcon, columnItem } = info;
                        columnItem.classList.add('collapsed');
                        collapseIcon.style.transform = 'rotate(-90deg)';
                        detailsContainer.style.maxHeight = '0';
                        detailsContainer.style.opacity = '0';
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to load collapse states:', error);
        }
    }
}
