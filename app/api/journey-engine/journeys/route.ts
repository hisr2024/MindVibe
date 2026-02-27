/**
 * Journey Engine Journeys API Proxy
 * Proxies to backend journey-engine service with graceful fallback
 * when the backend is unavailable or user is not authenticated.
 *
 * IMPORTANT: All responses forward Set-Cookie headers from the backend
 * so that CSRF tokens and session cookies reach the browser through
 * the proxy layer. Without this, the backend CSRF middleware rejects
 * POST requests with 403 because the csrf_token cookie is never set.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FALLBACK_JOURNEYS = {
  journeys: [],
  total: 0,
  _fallback: true,
}

/**
 * Forward Set-Cookie headers from the backend response to the client.
 * This ensures CSRF tokens and auth cookies pass through the proxy.
 */
function forwardCookies(backendRes: Response, clientRes: NextResponse): NextResponse {
  const cookies = backendRes.headers.getSetCookie?.() ?? []
  for (const cookie of cookies) {
    clientRes.headers.append('Set-Cookie', cookie)
  }
  return clientRes
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const queryString = url.search

    const response = await fetch(`${BACKEND_URL}/api/journey-engine/journeys${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    return forwardCookies(response, NextResponse.json(FALLBACK_JOURNEYS))
  } catch {
    return NextResponse.json(FALLBACK_JOURNEYS)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/journey-engine/journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        cookie: request.headers.get('cookie') || '',
        ...(request.headers.get('X-CSRF-Token') ? { 'X-CSRF-Token': request.headers.get('X-CSRF-Token')! } : {}),
      },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    const status = response.status
    if (status === 401) {
      return forwardCookies(
        response,
        NextResponse.json(
          { error: 'Authentication required to start a journey. Please sign in.' },
          { status: 401 }
        )
      )
    }

    const errorText = await response.text().catch(() => 'Unknown error')
    return forwardCookies(
      response,
      NextResponse.json(
        { error: errorText || 'Failed to create journey' },
        { status }
      )
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
