# Quick Fix for API Calls

Since there are many files using relative URLs (`/api/...`), here's a quick fix to make them work with Render:

## Option 1: Global Fetch Interceptor (Recommended for Quick Fix)

Add this to the top of `client/App.tsx` (before the component definition):

```typescript
// Global fetch interceptor for API calls
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string') {
      // If it's a relative API URL, prepend the base URL
      if (input.startsWith('/api/')) {
        input = `${API_BASE_URL}${input}`;
      }
    }
    return originalFetch(input, init);
  };
}
```

This will automatically convert all `/api/...` calls to use the full URL.

## Option 2: Update Files Individually

For each file that uses `fetch('/api/...')`, replace with:

```typescript
const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
fetch(`${apiUrl}/api/...`)
```

Or use the helper from `client/config/api.ts`:

```typescript
import { apiUrl } from '@/config/api';
fetch(apiUrl('/endpoint'))
```

## Option 3: Use the API_ENDPOINTS

For endpoints that are already defined in `client/config/api.ts`, use:

```typescript
import { API_ENDPOINTS } from '@/config/api';
fetch(API_ENDPOINTS.AUTH.LOGIN)
```

## Files That Need Updating

Here are the main files that use relative API URLs:

1. `client/pages/JobPostingsPage.tsx` - ✅ Partially updated
2. `client/pages/MentorshipPage.tsx` - ✅ Partially updated  
3. `client/components/EmbeddedChat.tsx`
4. `client/components/BatchChat.tsx`
5. `client/components/ConnectionRequests.tsx`
6. `client/pages/Aluminii.tsx`
7. `client/pages/BatchManagement.tsx`
8. `client/pages/ConversationPage.tsx`
9. `client/pages/MessagesPage.tsx`
10. And many more...

**Recommendation**: Use Option 1 (Global Fetch Interceptor) for the quickest fix, then gradually migrate to Option 2 or 3 for better code organization.

