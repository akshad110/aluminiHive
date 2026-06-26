/**
 * Global fetch helper to automatically prepend API base URL
 * This helps with migration from relative URLs to absolute URLs
 */

import { API_BASE_URL } from './api';

/**
 * Wraps fetch to automatically handle API URLs
 * If the URL starts with /api/, it will prepend the API_BASE_URL
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let url: string;
  
  if (typeof input === 'string') {
    // If it's a relative API URL, prepend the base URL
    if (input.startsWith('/api/')) {
      url = `${API_BASE_URL}${input}`;
    } else if (input.startsWith('api/')) {
      url = `${API_BASE_URL}/${input}`;
    } else {
      url = input;
    }
  } else if (input instanceof URL) {
    url = input.toString();
  } else {
    url = input.url;
  }
  
  return fetch(url, init);
}

/**
 * Helper to make it easy to replace fetch calls
 * Usage: Replace `fetch('/api/endpoint')` with `apiFetch('/api/endpoint')`
 */
export default apiFetch;

