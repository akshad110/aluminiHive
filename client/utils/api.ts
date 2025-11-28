/**
 * API utility functions for making requests to the backend
 * Handles base URL configuration from environment variables
 */

// Get API base URL from environment variable or use default
const getApiBaseUrl = (): string => {
  // Check for VITE_API_URL first (Vite environment variable)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback to localhost for development
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  // For production, try to infer from current origin if no env var is set
  // This assumes the API is on the same domain with /api prefix
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Make an API request with proper error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${API_BASE_URL}/${cleanEndpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(errorData.error || `API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

export default {
  API_BASE_URL,
  apiRequest,
  getApiUrl,
};

