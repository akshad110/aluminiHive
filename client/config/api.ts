// API Configuration
// Get API base URL from environment variable or use default
const getApiBaseUrl = (): string => {
  // Check for VITE_API_URL first (Vite environment variable)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development with integrated backend (Vite middleware), use empty string for relative URLs
  if (import.meta.env.DEV) {
    return ''; // Empty string means use relative URLs (same origin)
  }
  
  // For production, try to infer from current origin if no env var is set
  // This assumes the API is on the same domain with /api prefix
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper function to build API URLs
 * Ensures proper formatting and handles both relative and absolute paths
 * Accepts paths like '/api/...' or 'api/...' or just '...'
 */
export function apiUrl(path: string): string {
  // Remove leading slash if present
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // If path doesn't start with 'api/', add it
  if (!cleanPath.startsWith('api/')) {
    cleanPath = `api/${cleanPath}`;
  }
  // If API_BASE_URL is empty (development with Vite middleware), use relative URL
  if (!API_BASE_URL) {
    return `/${cleanPath}`;
  }
  return `${API_BASE_URL}/${cleanPath}`;
}

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  AUTH: {
    LOGIN: apiUrl('/auth/login'),
    SIGNUP: apiUrl('/auth/simple-signup'),
    REGISTER: apiUrl('/auth/register'),
    PROFILE: (userId: string) => apiUrl(`/auth/profile/${userId}`),
  },
  SKILLS: {
    LIST: apiUrl('/skills'),
    SEARCH: apiUrl('/skills/search'),
  },
  COLLEGES: {
    SEARCH: apiUrl('/colleges/search'),
  },
  BRANCHES: {
    LIST: apiUrl('/branches'),
  },
  DEGREES: {
    LIST: apiUrl('/degrees'),
  },
  PING: apiUrl('/ping'),
};

export default API_ENDPOINTS;
