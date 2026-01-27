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
 * - Authentication: Uses httpOnly cookies (XSS-protected) as primary auth method
 * - CSRF Protection: Automatically includes X-CSRF-Token header for state-changing requests
 * - Falls back to localStorage tokens for backward compatibility during migration
 */
export async function apiFetch(path: string, options: RequestInit = {}, uid?: string) {
  // Use relative path to go through Vercel proxy (avoids CORS issues)
  // The vercel.json rewrites /api/* to the backend server
  // Only use absolute URL for local development without Vercel
  const isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  let url: string
  if (isLocalDev && process.env.NEXT_PUBLIC_API_URL) {
    // Local development - use direct API URL
    url = process.env.NEXT_PUBLIC_API_URL + path
  } else {
    // Production/Vercel - use relative path for proxy
    url = path
  }

  const headers = new Headers(options.headers || {})

  // DEPRECATED: localStorage token storage - migrate to httpOnly cookies
  // Security Risk: Tokens in localStorage are vulnerable to XSS attacks.
  // httpOnly cookies are sent automatically with credentials: 'include'
  // This fallback will be removed in a future version.
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('mindvibe_access_token')
      || localStorage.getItem('access_token')
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
      // Log deprecation warning in development only
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[SECURITY] Using localStorage token (DEPRECATED). ' +
          'Migrate to httpOnly cookies for XSS protection. ' +
          'See: https://owasp.org/www-community/HttpOnly'
        )
      }
    }
  }

  // Also set X-Auth-UID for flexible authentication fallback
  if (uid) {
    headers.set('X-Auth-UID', uid)
  }

  // Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
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
 * Get the current access token if available
 *
 * @deprecated This function uses localStorage which is vulnerable to XSS.
 * Prefer using httpOnly cookies for authentication.
 * The primary auth mechanism is httpOnly cookies sent with credentials: 'include'.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('mindvibe_access_token') || localStorage.getItem('access_token')
}

/**
 * Check if the user is authenticated
 *
 * Note: This only checks localStorage token presence. The primary auth mechanism
 * uses httpOnly cookies which cannot be checked from JavaScript (by design).
 * For accurate auth status, make an API call to verify session.
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken()
}
