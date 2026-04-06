/**
 * Get CSRF token from cookie.
 * The CSRF token is set by the backend on GET requests and must be included
 * in the X-CSRF-Token header for state-changing requests (POST, PUT, PATCH, DELETE).
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  // Loop-based parser: iOS Safari URL-encodes cookie values containing special
  // characters (=, +, /), and the previous regex truncated base64-like values
  // at the first '='. We split on ';' and use indexOf('=') (first occurrence
  // only) so the full value survives intact, then decode once.
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    if (trimmed.slice(0, eqIdx).trim() !== 'csrf_token') continue
    const raw = trimmed.slice(eqIdx + 1)
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}

// Shared refresh promise so concurrent 401s only trigger one refresh request.
let _refreshPromise: Promise<boolean> | null = null

export async function tryRefreshToken(): Promise<boolean> {
  // If the user never logged in (no profile in localStorage), there is no
  // refresh_token cookie to send.  Skipping the request avoids a guaranteed
  // 400 "Missing refresh token" that clutters the browser console.
  if (typeof window !== 'undefined' && !localStorage.getItem('mindvibe_auth_user')) {
    return false
  }

  if (_refreshPromise) return _refreshPromise

  _refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      })
      return res.ok
    } catch {
      return false
    } finally {
      _refreshPromise = null
    }
  })()

  return _refreshPromise
}

/**
 * API Fetch utility with automatic token refresh on 401.
 *
 * Uses relative paths so requests go through the Next.js proxy layer.
 * On 401 (expired access token), automatically calls /api/auth/refresh
 * to get a new access token via the httpOnly refresh_token cookie,
 * then retries the original request once.
 *
 * Security features:
 * - Authentication: Uses httpOnly cookies exclusively (XSS-protected)
 * - CSRF Protection: Automatically includes X-CSRF-Token header for state-changing requests
 * - Credentials: Always included so httpOnly cookies are sent automatically
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path

  const buildHeaders = () => {
    const headers = new Headers(options.headers || {})
    const method = (options.method || 'GET').toUpperCase()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfToken()
      if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken)
      } else if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn(`[apiFetch] No CSRF token for ${method} ${path} — request may be rejected with 403`)
      }
    }
    return headers
  }

  const doFetch = () =>
    fetch(url, { ...options, headers: buildHeaders(), credentials: 'include' })

  const response = await doFetch()

  // Skip auto-refresh for auth endpoints to avoid infinite loops
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      return doFetch()
    }
  }

  return response
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
