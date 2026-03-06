/**
 * Get CSRF token from cookie.
 * The CSRF token is set by the backend on GET requests and must be included
 * in the X-CSRF-Token header for state-changing requests (POST, PUT, PATCH, DELETE).
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * API Fetch utility
 * Uses relative paths to leverage Vercel proxy rewrites for CORS handling
 * The proxy rewrite in vercel.json routes /api/* to the backend
 *
 * Security features:
 * - Authentication: Uses httpOnly cookies exclusively (XSS-protected)
 * - CSRF Protection: Automatically includes X-CSRF-Token header for state-changing requests
 * - Credentials: Always included so httpOnly cookies are sent automatically
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  // ALWAYS use relative paths so requests go through the Next.js proxy layer.
  // The proxy (app/api/*/route.ts + lib/proxy-utils.ts) forwards to the backend
  // and correctly relays Set-Cookie headers back to the browser.
  //
  // Previously, local dev sent requests directly to http://localhost:8000,
  // which caused cross-origin cookie failures (httpOnly cookies set on port 8000
  // are not sent with subsequent requests to port 3000) and bypassed the proxy's
  // retry logic for backend cold starts — resulting in 503 errors.
  const url = path

  const headers = new Headers(options.headers || {})

  // Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
    } else if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn(`[apiFetch] No CSRF token for ${method} ${path} — request may be rejected with 403`)
    }
  }

  // Use credentials: 'include' to send httpOnly cookies automatically
  // This is the primary (XSS-protected) auth mechanism
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })
}

/**
 * Check if the user is authenticated by calling the backend.
 *
 * Since auth tokens are stored in httpOnly cookies (not accessible to JS),
 * the only reliable way to check auth status is to call the /api/auth/me endpoint.
 * For synchronous checks, use the user state from the useAuth hook instead.
 */
export async function checkAuthenticated(): Promise<boolean> {
  try {
    const response = await apiFetch('/api/auth/me')
    return response.ok
  } catch {
    return false
  }
}
