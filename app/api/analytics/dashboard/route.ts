/**
 * Analytics Dashboard API Route
 *
 * Provides aggregated dashboard data for the mobile home page and profile.
 * Proxies to backend analytics service with graceful fallback.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Forward cookies for authentication
    const cookieHeader = request.headers.get('cookie') || ''

    const backendResponse = await fetch(`${BACKEND_URL}/api/analytics/dashboard`, {
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

    // If backend returns 401/403, return empty state (user not authenticated)
    if (backendResponse.status === 401 || backendResponse.status === 403) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Backend unavailable - return empty dashboard state
    return NextResponse.json(getEmptyDashboard())
  } catch (error) {
    // Network error or timeout - return empty state gracefully
    console.error('[Analytics Dashboard] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(getEmptyDashboard())
  }
}

function getEmptyDashboard() {
  return {
    streak: 0,
    today_mood: null,
    insights_count: 0,
    journal_entries: 0,
    journeys_completed: 0,
    active_journey: null,
    member_since: null,
  }
}
