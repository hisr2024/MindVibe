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
