/**
 * Storage utility that uses cookies in production mode and localStorage in development.
 * This allows multiple users to have independent experiences when using the app simultaneously.
 */

/**
 * Check if we're running in production mode.
 * Production mode is detected when:
 * - Hostname is not localhost or 127.0.0.1
 * - Or when explicitly set via environment variable
 */
function isProductionMode() {
    // Check if we're on localhost (development)
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       hostname === '0.0.0.0' ||
                       hostname === '';
    
    // In production, we're not on localhost
    return !isLocalhost;
}

/**
 * Cookie utility functions
 */
function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

function removeCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Storage API that mimics localStorage but uses cookies in production
 */
class Storage {
    constructor() {
        this.isProduction = isProductionMode();
    }

    /**
     * Get item that may be stored in chunks (for production mode)
     */
    _getChunkedItem(key) {
        if (!this.isProduction) {
            return null;
        }
        
        const chunks = getCookie(`${key}_chunks`);
        if (!chunks) {
            return null;
        }
        
        const chunkCount = parseInt(chunks, 10);
        let fullEncodedValue = '';
        
        for (let i = 0; i < chunkCount; i++) {
            const chunk = getCookie(`${key}_${i}`);
            if (chunk === null) {
                // Missing chunk, return null
                return null;
            }
            // Chunks are already encoded, just concatenate
            fullEncodedValue += chunk;
        }
        
        try {
            // Decode the full concatenated encoded value
            return decodeURIComponent(fullEncodedValue);
        } catch (e) {
            console.warn(`Failed to decode chunked cookie ${key}:`, e);
            return null;
        }
    }

    /**
     * Get item from storage (handles both single and chunked values)
     */
    getItem(key) {
        if (this.isProduction) {
            // First try to get as a single cookie
            const singleValue = getCookie(key);
            if (singleValue !== null) {
                return singleValue;
            }
            
            // If not found, try chunked version
            return this._getChunkedItem(key);
        } else {
            return localStorage.getItem(key);
        }
    }

    /**
     * Set item in storage
     */
    setItem(key, value) {
        if (this.isProduction) {
            // Cookies have a 4KB limit per cookie, so we need to handle large values
            // For large values, we'll split them across multiple cookies
            // We need to account for encoding overhead, so use a smaller limit
            const maxCookieSize = 3000; // Leave margin for encoding and cookie metadata
            
            // First, encode to see the actual size
            const encodedValue = encodeURIComponent(value);
            
            if (encodedValue.length <= maxCookieSize) {
                // Small enough for a single cookie
                setCookie(key, value);
            } else {
                // Too large, split into multiple cookies
                // Split the encoded value to ensure we don't break multi-byte characters
                const chunks = Math.ceil(encodedValue.length / maxCookieSize);
                setCookie(`${key}_chunks`, chunks.toString());
                
                // Store chunks - they're already encoded, so use a raw cookie setter
                for (let i = 0; i < chunks; i++) {
                    const start = i * maxCookieSize;
                    const end = Math.min(start + maxCookieSize, encodedValue.length);
                    const chunk = encodedValue.substring(start, end);
                    // Store the already-encoded chunk (setCookie will encode again, so we need a raw version)
                    this._setCookieRaw(`${key}_${i}`, chunk);
                }
            }
        } else {
            localStorage.setItem(key, value);
        }
    }

    /**
     * Set cookie with raw value (already encoded)
     */
    _setCookieRaw(name, encodedValue) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    /**
     * Remove item from storage
     */
    removeItem(key) {
        if (this.isProduction) {
            // Remove main cookie
            removeCookie(key);
            
            // Check if there are chunked cookies and remove them
            const chunks = getCookie(`${key}_chunks`);
            if (chunks) {
                const chunkCount = parseInt(chunks, 10);
                for (let i = 0; i < chunkCount; i++) {
                    removeCookie(`${key}_${i}`);
                }
                removeCookie(`${key}_chunks`);
            }
        } else {
            localStorage.removeItem(key);
        }
    }

}

// Export a singleton instance
export const storage = new Storage();

