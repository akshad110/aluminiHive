// API configuration for split Render deploy (static frontend + API backend)

declare global {
  interface Window {
    __ALUMINIHIVE_API_URL__?: string;
  }
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function isFrontendOrigin(url: string): boolean {
  if (typeof window === 'undefined') return false;
  return normalizeBaseUrl(url) === window.location.origin;
}

/** Infer backend URL from Render frontend hostname, e.g. aluminihive-frontend -> aluminihive-backend */
function inferBackendFromHostname(): string {
  if (typeof window === 'undefined') return '';

  const { hostname, protocol } = window.location;
  if (!hostname.endsWith('.onrender.com')) return '';

  if (hostname.includes('-frontend')) {
    return `${protocol}//${hostname.replace('-frontend', '-backend')}`;
  }

  return '';
}

/**
 * Backend base URL (no /api suffix).
 * Dev: empty string = same-origin via Vite middleware.
 */
export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '';
  }

  const candidates = [
    import.meta.env.VITE_API_URL,
    typeof window !== 'undefined' ? window.__ALUMINIHIVE_API_URL__ : '',
    inferBackendFromHostname(),
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;

    const normalized = normalizeBaseUrl(value);
    if (isFrontendOrigin(normalized)) continue;

    return normalized;
  }

  return '';
}

export const API_BASE_URL = getApiBaseUrl();

/** Build full API URL from `/auth/login`, `auth/login`, or `/api/auth/login`. */
export function apiUrl(path: string): string {
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (!cleanPath.startsWith('api/')) {
    cleanPath = `api/${cleanPath}`;
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    if (!import.meta.env.DEV && typeof window !== 'undefined') {
      console.error(
        '[AlumniHive] Could not resolve backend URL. Set VITE_API_URL on the frontend Render service to your backend URL (e.g. https://aluminihive-backend.onrender.com) and redeploy.'
      );
    }
    return `/${cleanPath}`;
  }

  return `${baseUrl}/${cleanPath}`;
}

/** Rewrite relative /api/* paths to the backend in production. */
export function resolveFetchUrl(input: string): string {
  if (!input.startsWith('/api/') || import.meta.env.DEV) {
    return input;
  }

  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}${input}` : input;
}

export const API_ENDPOINTS = {
  get BASE_URL() {
    return getApiBaseUrl();
  },
  AUTH: {
    get LOGIN() {
      return apiUrl('/auth/login');
    },
    get SIGNUP() {
      return apiUrl('/auth/simple-signup');
    },
    get REGISTER() {
      return apiUrl('/auth/register');
    },
    PROFILE: (userId: string) => apiUrl(`/auth/profile/${userId}`),
  },
  SKILLS: {
    get LIST() {
      return apiUrl('/skills');
    },
    get SEARCH() {
      return apiUrl('/skills/search');
    },
  },
  COLLEGES: {
    get SEARCH() {
      return apiUrl('/colleges/search');
    },
  },
  BRANCHES: {
    get LIST() {
      return apiUrl('/branches');
    },
  },
  DEGREES: {
    get LIST() {
      return apiUrl('/degrees');
    },
  },
  get PING() {
    return apiUrl('/ping');
  },
};

export default API_ENDPOINTS;
