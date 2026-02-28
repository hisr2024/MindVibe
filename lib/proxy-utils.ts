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
 * @param request - The incoming Next.js request
 * @param extra - Additional headers to merge (e.g. Content-Type)
 */
export function proxyHeaders(
  request: NextRequest,
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...extra,
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

  return headers
}

/**
 * The backend URL from environment, used by all proxy routes.
 */
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Create a proxy handler that forwards a request to the backend and returns
 * the response with Set-Cookie headers preserved.
 *
 * Usage in a route.ts file:
 *   import { createProxyHandler } from '@/lib/proxy-utils'
 *   export const POST = createProxyHandler('/api/auth/login', 'POST')
 *   export const GET  = createProxyHandler('/api/auth/sessions', 'GET')
 */
export function createProxyHandler(
  backendPath: string,
  method: string,
  timeoutMs: number = 10000
) {
  return async function handler(request: NextRequest) {
    try {
      const hasBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
      const body = hasBody ? await request.text() : undefined

      const backendResponse = await fetch(`${BACKEND_URL}${backendPath}`, {
        method: method.toUpperCase(),
        headers: proxyHeaders(request),
        body: body || undefined,
        signal: AbortSignal.timeout(timeoutMs),
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
      const label = `[Proxy ${method} ${backendPath}]`
      console.error(`${label} Backend unavailable:`, error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.json(
        { detail: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }
  }
}
