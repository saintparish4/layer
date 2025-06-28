/**
 * API Configuration utilities
 * Centralizes API URL configuration for both client and server-side usage
 */

export const getApiBaseUrl = (): string => {
    // Check for environment variable first
    if (typeof window !== 'undefined') {
        // Client-side: use NEXT_PUBLIC_ prefixed variable
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    }
    
    // Server-side: use regular environment variable
    return process.env.API_URL || 'http://localhost:4000';
};

export const getApiUrl = (endpoint: string): string => {
    const baseUrl = getApiBaseUrl();
    // Ensure endpoint starts with / and remove any duplicate slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
    TENANTS: '/api/tenants',
    BILLING_PORTAL: '/api/billing/portal',
} as const;

// Helper function to make API requests with proper error handling
export const apiRequest = async <T = unknown>(
    endpoint: string, 
    options: RequestInit = {}
): Promise<T> => {
    const url = getApiUrl(endpoint);
    
    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const response = await fetch(url, {
        ...defaultOptions,
        ...options,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    
    return response.text() as T;
}; 