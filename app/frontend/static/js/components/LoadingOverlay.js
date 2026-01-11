/**
 * Loading overlay component that greys out the page and shows a loading message.
 */
export class LoadingOverlay {
    constructor() {
        this.overlay = null;
        this.messageElement = null;
        this.isVisible = false;
        this.createOverlay();
    }

    createOverlay() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            z-index: 99999;
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            gap: 1.5rem;
        `;

        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        // Create message container
        const messageContainer = document.createElement('div');
        messageContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        `;

        // Create message text
        this.messageElement = document.createElement('div');
        this.messageElement.className = 'loading-message';
        this.messageElement.textContent = 'Loading...';
        this.messageElement.style.cssText = `
            color: white;
            font-size: 1.25rem;
            font-weight: 600;
            text-align: center;
        `;

        // Create sub-message
        this.subMessageElement = document.createElement('div');
        this.subMessageElement.className = 'loading-sub-message';
        this.subMessageElement.style.cssText = `
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.95rem;
            text-align: center;
        `;

        messageContainer.appendChild(this.messageElement);
        messageContainer.appendChild(this.subMessageElement);
        this.overlay.appendChild(spinner);
        this.overlay.appendChild(messageContainer);

        // Add spinner animation keyframes if not already present
        if (!document.getElementById('loading-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-styles';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(this.overlay);
    }

    show(message = 'Loading...', subMessage = 'Please wait while we prepare everything') {
        if (this.overlay) {
            this.messageElement.textContent = message;
            this.subMessageElement.textContent = subMessage;
            this.overlay.style.display = 'flex';
            this.isVisible = true;
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
            this.isVisible = false;
        }
    }

    updateMessage(message, subMessage = null) {
        if (this.messageElement) {
            this.messageElement.textContent = message;
        }
        if (this.subMessageElement && subMessage !== null) {
            this.subMessageElement.textContent = subMessage;
        }
    }

    isShowing() {
        return this.isVisible;
    }
}

