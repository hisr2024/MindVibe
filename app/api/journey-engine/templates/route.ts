/**
 * Journey Engine Templates API Proxy
 * Proxies to backend journey-engine service with graceful fallback.
 * Templates are public (no auth required) so fallback returns empty list.
 *
 * Forwards Set-Cookie headers from backend so CSRF tokens reach the browser.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FALLBACK_TEMPLATES = {
  templates: [],
  total: 0,
  limit: 20,
  offset: 0,
  _fallback: true,
}

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

    const response = await fetch(`${BACKEND_URL}/api/journey-engine/templates${queryString}`, {
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

    return forwardCookies(response, NextResponse.json(FALLBACK_TEMPLATES))
  } catch {
    return NextResponse.json(FALLBACK_TEMPLATES)
  }
}
