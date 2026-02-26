/**
 * Auth Me API Route
 *
 * Returns the current authenticated user's identity.
 * Proxies to backend /api/auth/me with cookie-based auth.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''

    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    if (backendResponse.status === 401 || backendResponse.status === 403) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { detail: 'Auth service unavailable' },
      { status: backendResponse.status }
    )
  } catch (error) {
    console.error('[Auth Me] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { detail: 'Auth service unavailable' },
      { status: 503 }
    )
  }
}
