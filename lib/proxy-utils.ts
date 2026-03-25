/**
 * Proxy Utilities for Next.js API Routes
 *
 * Shared helpers for API routes that proxy requests to the backend.
 * Ensures CSRF tokens and session cookies pass through correctly.
 *
 * Why this matters:
 * The backend CSRF middleware sets a csrf_token cookie on GET responses
 * and validates it on POST/PUT/PATCH/DELETE requests. When Next.js API
 * routes create new NextResponse objects, backend Set-Cookie headers are
 * lost unless explicitly forwarded. Without these helpers, every
 * state-changing request fails with 403 "CSRF token missing".
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Forward Set-Cookie headers from a backend response to the client.
 * Call this on every NextResponse returned from a proxy route.
 */
export function forwardCookies(backendRes: Response, clientRes: NextResponse): NextResponse {
  const cookies = backendRes.headers.getSetCookie?.() ?? []
  for (const cookie of cookies) {
    clientRes.headers.append('Set-Cookie', cookie)
  }
  return clientRes
}

/**
 * Build headers for a proxied request to the backend.
 * Automatically forwards cookies and CSRF token from the original request.
 *
 * Content-Type is only set for methods that carry a body (POST, PUT, PATCH).
 * Sending Content-Type on bodyless requests (GET, DELETE, HEAD) causes some
 * backends (e.g. FastAPI) to reject the request with 400 Bad Request.
 *
 * @param request - The incoming Next.js request
 * @param method  - HTTP method (used to decide Content-Type)
 * @param extra   - Additional headers to merge
 */
export function proxyHeaders(
  request: NextRequest,
  method?: string,
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...extra,
  }

  // Only set Content-Type for methods that carry a request body
  const upperMethod = (method || request.method).toUpperCase()
  if (['POST', 'PUT', 'PATCH'].includes(upperMethod)) {
    headers['Content-Type'] = 'application/json'
  }

  // Forward cookies for session-based auth
  const cookie = request.headers.get('cookie')
  if (cookie) {
    headers['Cookie'] = cookie
  }

  // Forward CSRF token for state-changing requests
  const csrfToken = request.headers.get('X-CSRF-Token')
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  // Forward Authorization header if present
  const auth = request.headers.get('Authorization')
  if (auth) {
    headers['Authorization'] = auth
  }

  // Forward client IP headers so the backend rate limiter and audit logs
  // see the real client IP instead of the Vercel proxy server IP.
  // Without this, ALL users share the same rate limit (e.g., 5 logins/minute
  // globally) because the backend sees every request as coming from one IP.
  const forwardedFor = request.headers.get('X-Forwarded-For')
  if (forwardedFor) {
    headers['X-Forwarded-For'] = forwardedFor
  }
  const realIp = request.headers.get('X-Real-IP')
  if (realIp) {
    headers['X-Real-IP'] = realIp
  }

  return headers
}

/**
 * The backend URL from environment, used by all proxy routes.
 *
 * CRITICAL: In production (Vercel), this MUST resolve to the real backend.
 * If NEXT_PUBLIC_API_URL is not set, fall back to the Render production URL
 * rather than localhost (which doesn't exist on Vercel and causes 503 errors
 * on every proxy request — breaking login, signup, and all authenticated flows).
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://mindvibe-api.onrender.com'
    : 'http://localhost:8000')

// =============================================================================
// TRANSIENT ERROR DETECTION
// =============================================================================

/** HTTP status codes that indicate a transient backend failure (cold start, deploy, etc.) */
const TRANSIENT_STATUS_CODES = [502, 503, 504]

/**
 * Fetch with retry logic for transient backend failures.
 *
 * Render free-tier cold starts can take 30-60s. Without retries, the proxy
 * returns 503 immediately, and the frontend retry loop compounds the problem
 * (each frontend retry spawns a new proxy request that also fails).
 *
 * This helper retries at the proxy level so the backend has time to wake up
 * before the frontend gives up entirely.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit & { signal?: AbortSignal },
  options: { maxRetries?: number; timeoutMs?: number; label?: string } = {}
): Promise<Response> {
  const { maxRetries = 2, timeoutMs = 45000, label = '[Proxy]' } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(timeoutMs),
      })

      // Retry on transient errors (backend cold-starting or deploying)
      if (TRANSIENT_STATUS_CODES.includes(response.status) && attempt < maxRetries) {
        const backoffMs = 2000 * Math.pow(2, attempt)
        console.warn(`${label} Got ${response.status}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }

      return response
    } catch (error) {
      const isTimeout = error instanceof Error && (
        error.name === 'TimeoutError' || error.name === 'AbortError'
      )

      if (attempt < maxRetries) {
        const backoffMs = 2000 * Math.pow(2, attempt)
        console.warn(`${label} ${isTimeout ? 'Timeout' : 'Error'} on attempt ${attempt + 1}, retrying in ${backoffMs}ms`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }

      // Final attempt failed — throw with context
      if (isTimeout) {
        const err = new Error('Backend timeout — server may be waking up')
        err.name = 'TimeoutError'
        throw err
      }
      throw error
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error('fetchWithRetry exhausted all attempts')
}

// =============================================================================
// PROXY HANDLER FACTORY
// =============================================================================

/**
 * Create a proxy handler that forwards a request to the backend and returns
 * the response with Set-Cookie headers preserved.
 *
 * Usage in a route.ts file:
 *   import { createProxyHandler } from '@/lib/proxy-utils'
 *   export const POST = createProxyHandler('/api/auth/login', 'POST')
 *   export const GET  = createProxyHandler('/api/auth/sessions', 'GET')
 *
 * Auth and critical endpoints use a longer timeout (45s) to handle
 * Render free-tier cold starts (which can take 30-60s).
 */
export function createProxyHandler(
  backendPath: string,
  method: string,
  timeoutMs?: number
) {
  // Auth and critical endpoints get a longer timeout for Render cold starts
  const isAuthPath = backendPath.startsWith('/api/auth')
  const effectiveTimeout = timeoutMs ?? (isAuthPath ? 60000 : 15000)
  // Auth endpoints retry 3x with exponential backoff (cold start can take 30-60s+)
  const maxRetries = isAuthPath ? 3 : 0

  return async function handler(request: NextRequest) {
    const upperMethod = method.toUpperCase()
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(upperMethod)
    const rawBody = hasBody ? await request.text() : undefined
    const body = rawBody && rawBody.length > 0 ? rawBody : undefined
    const label = `[Proxy ${method} ${backendPath}]`

    // Forward query parameters from the original request
    const queryString = new URL(request.url).search
    const targetUrl = `${BACKEND_URL}${backendPath}${queryString}`

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const backendResponse = await fetch(targetUrl, {
          method: upperMethod,
          headers: proxyHeaders(request, upperMethod),
          body,
          signal: AbortSignal.timeout(effectiveTimeout),
        })

        if (backendResponse.status === 204) {
          return forwardCookies(
            backendResponse,
            new NextResponse(null, { status: 204 })
          )
        }

        // Retry on transient backend errors (cold-starting, deploy in progress,
        // or temporary failures). Without this, a single backend hiccup during
        // deploy or cold start shows as a raw 500 to the user.
        // 403 included because backend DDoS middleware may temporarily block
        // the Vercel edge IP; retrying usually succeeds on the next attempt.
        const isTransient = [403, 500, 502, 503, 504].includes(backendResponse.status)
        if (isTransient && attempt < maxRetries) {
          const backoffMs = 2000 * Math.pow(2, attempt)
          console.warn(`${label} Got ${backendResponse.status}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, backoffMs))
          continue
        }

        const data = await backendResponse.json().catch(() => ({}))

        return forwardCookies(
          backendResponse,
          NextResponse.json(data, { status: backendResponse.status })
        )
      } catch (error) {
        const isTimeout = error instanceof Error && (
          error.name === 'TimeoutError' || error.name === 'AbortError'
        )

        if (attempt < maxRetries && isTimeout) {
          const backoffMs = 1000 * Math.pow(2, attempt)
          console.warn(`${label} Timeout on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, backoffMs))
          continue
        }

        console.error(`${label} Backend unavailable:`, error instanceof Error ? error.message : 'Unknown error')
        return NextResponse.json(
          {
            detail: isTimeout
              ? 'Server is waking up, please try again in a few seconds.'
              : 'Unable to connect to the server. Please try again shortly.',
            error: 'service_unavailable',
          },
          { status: 503 }
        )
      }
    }

    // Should not reach here, but handle gracefully
    return NextResponse.json(
      { detail: 'Unable to connect to the server. Please try again shortly.', error: 'service_unavailable' },
      { status: 503 }
    )
  }
}
