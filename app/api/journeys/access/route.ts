/**
 * Journey Access API Route
 * Proxies to backend to check user's access to Wisdom Journeys
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

function safeJsonResponse(data: unknown, status = 200): NextResponse {
  try {
    return NextResponse.json(data, { status })
  } catch {
    // Return default free access on error
    return new NextResponse(JSON.stringify({
      has_access: true,
      tier: 'free',
      active_journeys: 0,
      journey_limit: 1,
      remaining: 1,
      is_unlimited: false,
      can_start_more: true,
      is_trial: true,
      trial_days_limit: 3,
      upgrade_url: '/pricing',
      upgrade_cta: 'Upgrade for Full Access',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
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

    // Forward cookies for httpOnly cookie auth
    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader)
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${BACKEND_URL}/api/journeys/access`, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Return default access for free users on error
        console.warn(`Backend access check returned ${response.status}`)
        return safeJsonResponse({
          has_access: true,
          tier: 'free',
          active_journeys: 0,
          journey_limit: 1,
          remaining: 1,
          is_unlimited: false,
          can_start_more: true,
          is_trial: true,
          trial_days_limit: 3,
          upgrade_url: '/pricing',
          upgrade_cta: 'Upgrade for Full Access',
        })
      }

      const data = await response.json()
      return safeJsonResponse(data)
    } catch (error) {
      console.error('Error fetching journey access from backend:', error)
      // Return default access on error
      return safeJsonResponse({
        has_access: true,
        tier: 'free',
        active_journeys: 0,
        journey_limit: 1,
        remaining: 1,
        is_unlimited: false,
        can_start_more: true,
        is_trial: true,
        trial_days_limit: 3,
        upgrade_url: '/pricing',
        upgrade_cta: 'Upgrade for Full Access',
      })
    }
  } catch (outerError) {
    console.error('Critical error in access GET handler:', outerError)
    return safeJsonResponse({
      has_access: true,
      tier: 'free',
      active_journeys: 0,
      journey_limit: 1,
      remaining: 1,
      is_unlimited: false,
      can_start_more: true,
    })
  }
}
