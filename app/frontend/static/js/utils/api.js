/**
 * API utility functions for communicating with the backend.
 */
/**
 * Get the API base URL, accounting for ProxyFix prefix if present.
 */
function getApiBaseUrl() {
    // Use injected config if available (from template), otherwise fall back to relative path
    if (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) {
        return window.APP_CONFIG.apiBaseUrl;
    }
    // Fallback to relative path which will work with ProxyFix
    return './api';
}

/**
 * Send calculation request to the backend API.
 */
export async function calculateInvestment(params) {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/calculate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });
        if (!response.ok) {
            let errorMessage = `API request failed: ${response.statusText}`;
            let errorErrors = null;
            try {
                const errorData = await response.json();
                if (Array.isArray(errorData.errors)) {
                    // Backend returned an array of specific errors
                    errorErrors = errorData.errors;
                    errorMessage = errorData.error || 'Validation errors occurred';
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // If response is not JSON, try to get text
                try {
                    const text = await response.text();
                    if (text) {
                        errorMessage = text;
                    }
                } catch (e2) {
                    // Use default error message
                }
            }
            const error = new Error(errorMessage);
            error.status = response.status;
            error.response = response;
            if (errorErrors) {
                error.errors = errorErrors;
            }
            throw error;
        }
    return response.json();
}
