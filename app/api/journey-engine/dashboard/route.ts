/**
 * Journey Engine Dashboard API Proxy
 * Proxies to backend journey-engine service with graceful fallback
 * when the backend is unavailable or user is not authenticated.
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
      return NextResponse.json(data)
    }

    // Return fallback for auth failures or other errors
    return NextResponse.json(FALLBACK_DASHBOARD)
  } catch {
    // Backend unavailable - return fallback
    return NextResponse.json(FALLBACK_DASHBOARD)
  }
}
