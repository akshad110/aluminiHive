// API Configuration for split Render deploy (static frontend + API backend)

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Backend base URL (no /api suffix).
 * In dev, empty string = same-origin via Vite middleware.
 * In production, must be the Render backend URL from VITE_API_URL.
 */
export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '';
  }

  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  return '';
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Build a full API URL. Paths may be `/auth/login`, `auth/login`, or `/api/auth/login`.
 */
export function apiUrl(path: string): string {
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (!cleanPath.startsWith('api/')) {
    cleanPath = `api/${cleanPath}`;
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    if (!import.meta.env.DEV && typeof window !== 'undefined') {
      console.error(
        '[AlumniHive] VITE_API_URL is not set. API calls will fail on the static frontend. ' +
          'Set VITE_API_URL to your backend URL (e.g. https://your-backend.onrender.com) and redeploy.'
      );
    }
    return `/${cleanPath}`;
  }

  return `${baseUrl}/${cleanPath}`;
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
