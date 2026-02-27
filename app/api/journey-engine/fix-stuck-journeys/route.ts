/**
 * Journey Engine Fix Stuck Journeys API Proxy
 * Proxies to backend fix-stuck-journeys endpoint.
 * Requires authentication.
 *
 * Forwards Set-Cookie headers from backend so CSRF tokens reach the browser.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function forwardCookies(backendRes: Response, clientRes: NextResponse): NextResponse {
  const cookies = backendRes.headers.getSetCookie?.() ?? []
  for (const cookie of cookies) {
    clientRes.headers.append('Set-Cookie', cookie)
  }
  return clientRes
}

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/journey-engine/fix-stuck-journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        cookie: request.headers.get('cookie') || '',
        ...(request.headers.get('X-CSRF-Token') ? { 'X-CSRF-Token': request.headers.get('X-CSRF-Token')! } : {}),
      },
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    if (response.status === 401) {
      return forwardCookies(
        response,
        NextResponse.json(
          { error: 'Authentication required. Please sign in.' },
          { status: 401 }
        )
      )
    }

    const errorText = await response.text().catch(() => 'Unknown error')
    return forwardCookies(
      response,
      NextResponse.json(
        { error: errorText || 'Failed to fix stuck journeys' },
        { status: response.status }
      )
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
