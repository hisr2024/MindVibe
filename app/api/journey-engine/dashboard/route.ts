/**
 * Journey Engine Dashboard API Proxy
 * Proxies to backend journey-engine service with graceful fallback.
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
      headers: proxyHeaders(request),
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
