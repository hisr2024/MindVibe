/**
 * Auth Me API Route
 * Returns the current authenticated user's identity.
 * Proxies to backend /api/auth/me with cookie-based auth.
 *
 * Includes retry/backoff for transient backend errors (502/503/504)
 * during Render cold starts, matching createProxyHandler resilience.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

const MAX_RETRIES = 3
const TRANSIENT_STATUSES = new Set([502, 503, 504])

export async function GET(request: NextRequest) {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: 'GET',
        headers: proxyHeaders(request, 'GET'),
        signal: AbortSignal.timeout(15000),
      })

      // Retry on transient backend errors (cold start, deploy in progress)
      if (TRANSIENT_STATUSES.has(backendResponse.status) && attempt < MAX_RETRIES) {
        const backoffMs = 2000 * Math.pow(2, attempt) // 2s, 4s, 8s
        console.warn(
          `[Auth Me] Got ${backendResponse.status} on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`
        )
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        return forwardCookies(backendResponse, NextResponse.json(data))
      }

      if (backendResponse.status === 401 || backendResponse.status === 403) {
        return forwardCookies(
          backendResponse,
          NextResponse.json(
            { detail: 'Not authenticated' },
            { status: 401 }
          )
        )
      }

      return forwardCookies(
        backendResponse,
        NextResponse.json(
          { detail: 'Auth service unavailable' },
          { status: backendResponse.status }
        )
      )
    } catch (error) {
      lastError = error
      const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')

      if (attempt < MAX_RETRIES && isTimeout) {
        const backoffMs = 1000 * Math.pow(2, attempt) // 1s, 2s, 4s
        console.warn(`[Auth Me] Timeout on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }

      console.error('[Auth Me] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const isTimeout = lastError instanceof Error && (lastError.name === 'TimeoutError' || lastError.name === 'AbortError')
  return NextResponse.json(
    { detail: isTimeout ? 'Server is waking up, please try again.' : 'Unable to verify session. Please try again shortly.' },
    { status: 503 }
  )
}
