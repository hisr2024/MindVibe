/**
 * API Fetch utility
 * Uses relative paths to leverage Vercel proxy rewrites for CORS handling
 * The proxy rewrite in vercel.json routes /api/* to the backend
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

  // Try to get JWT token from localStorage (check multiple possible keys)
  if (typeof window !== 'undefined') {
    // Check the primary key first (used by useAuth hook)
    const accessToken = localStorage.getItem('mindvibe_access_token')
      || localStorage.getItem('access_token')
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  // Also set X-Auth-UID for flexible authentication fallback
  if (uid) {
    headers.set('X-Auth-UID', uid)
  }

  return fetch(url, { ...options, headers })
}

/**
 * Get the current access token if available
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('mindvibe_access_token') || localStorage.getItem('access_token')
}

/**
 * Check if the user is authenticated (has a valid access token)
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken()
}
