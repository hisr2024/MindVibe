/**
 * Journey Engine Dashboard API Proxy
 *
 * GET /api/journey-engine/dashboard → User's journey dashboard
 *
 * Returns a fallback with empty arrays when the backend is
 * unreachable so the frontend always has data to render.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

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

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/journey-engine/dashboard`, {
      method: 'GET',
      headers: proxyHeaders(request, 'GET'),
      signal: AbortSignal.timeout(8000),
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    // Forward auth errors so the frontend can show sign-in prompt
    if (response.status === 401 || response.status === 403) {
      return forwardCookies(
        response,
        NextResponse.json(
          { ...FALLBACK_DASHBOARD, detail: 'Authentication required' },
          { status: response.status }
        )
      )
    }

    return forwardCookies(response, NextResponse.json(FALLBACK_DASHBOARD))
  } catch {
    return NextResponse.json(FALLBACK_DASHBOARD)
  }
}
