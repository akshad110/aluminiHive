import { apiUrl, getApiBaseUrl } from '@/config/api';

export const API_BASE_URL = getApiBaseUrl();

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = apiUrl(endpoint);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(errorData.error || `API request failed: ${response.statusText}`);
  }

  return response.json();
}

export function getApiUrl(endpoint: string): string {
  return apiUrl(endpoint);
}

export default {
  API_BASE_URL,
  apiRequest,
  getApiUrl,
};
