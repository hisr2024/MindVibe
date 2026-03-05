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
  const effectiveTimeout = timeoutMs ?? (isAuthPath ? 45000 : 15000)
  // Auth endpoints retry once on timeout (cold start recovery)
  const maxRetries = isAuthPath ? 1 : 0

  return async function handler(request: NextRequest) {
    const upperMethod = method.toUpperCase()
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(upperMethod)
    const rawBody = hasBody ? await request.text() : undefined
    const body = rawBody && rawBody.length > 0 ? rawBody : undefined
    const label = `[Proxy ${method} ${backendPath}]`

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const backendResponse = await fetch(`${BACKEND_URL}${backendPath}`, {
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
          console.warn(`${label} Timeout on attempt ${attempt + 1}, retrying...`)
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
