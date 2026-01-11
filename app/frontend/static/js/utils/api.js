/**
 * API utility functions for communicating with the backend.
 */
/**
 * Send calculation request to the backend API.
 */
export async function calculateInvestment(params) {
    const response = await fetch('/api/calculate', {
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
