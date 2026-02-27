/**
 * Auth Me API Route
 * Returns the current authenticated user's identity.
 * Proxies to backend /api/auth/me with cookie-based auth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(request: NextRequest) {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: proxyHeaders(request),
      signal: AbortSignal.timeout(5000),
    })

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
    console.error('[Auth Me] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { detail: 'Auth service unavailable' },
      { status: 503 }
    )
  }
}
