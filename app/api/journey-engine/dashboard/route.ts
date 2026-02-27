/**
 * Journey Engine Dashboard API Proxy
 * Proxies to backend journey-engine service with graceful fallback
 * when the backend is unavailable or user is not authenticated.
 *
 * Forwards Set-Cookie headers from backend so CSRF tokens reach the browser.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FALLBACK_DASHBOARD = {
  active_journeys: [],
  completed_journeys: 0,
  total_days_practiced: 0,
  current_streak: 0,
  enemy_progress: [],
  recommended_templates: [],
  today_steps: [],
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
    const response = await fetch(`${BACKEND_URL}/api/journey-engine/dashboard`, {
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

    return forwardCookies(response, NextResponse.json(FALLBACK_DASHBOARD))
  } catch {
    return NextResponse.json(FALLBACK_DASHBOARD)
  }
}
