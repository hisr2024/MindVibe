/**
 * Journey Access API Route
 * Proxies to backend with proper error handling
 *
 * This route handles GET /api/journeys/access
 * Returns the user's journey access/subscription status
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'
const BACKEND_TIMEOUT_MS = 10000

// Default access for when backend is unavailable
const DEFAULT_ACCESS = {
  has_access: true,
  tier: 'trial',
  active_journeys: 0,
  journey_limit: 1,
  remaining: 1,
  is_unlimited: false,
  can_start_more: true,
  is_trial: true,
  trial_days_limit: 3,
  upgrade_url: '/pricing',
  upgrade_cta: 'Upgrade for Full Access',
  _offline: true,
}

export async function GET(request: NextRequest) {
  try {
    const headers = new Headers()

    // Forward auth headers
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      headers.set('Authorization', authHeader)
    }

    const uidHeader = request.headers.get('X-Auth-UID')
    if (uidHeader) {
      headers.set('X-Auth-UID', uidHeader)
    }

    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader)
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS)

      const response = await fetch(`${BACKEND_URL}/api/journeys/access`, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'authentication_required', message: 'Please log in to view your journey access' },
          { status: 401 }
        )
      }

      if (!response.ok) {
        console.warn(`[journeys/access] Backend returned ${response.status}, using default access`)
        return NextResponse.json(DEFAULT_ACCESS)
      }

      const data = await response.json()
      return NextResponse.json(data)

    } catch (error) {
      console.error('[journeys/access] Error fetching from backend:', error)
      return NextResponse.json(DEFAULT_ACCESS)
    }
  } catch (outerError) {
    console.error('[journeys/access] Critical error:', outerError)
    return NextResponse.json(DEFAULT_ACCESS)
  }
}
