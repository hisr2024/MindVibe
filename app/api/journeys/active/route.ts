/**
 * Active Journeys API Route
 * Proxies to backend with proper error handling
 *
 * This route handles GET /api/journeys/active
 * Returns the user's active journeys
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'
const BACKEND_TIMEOUT_MS = 10000

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

      const response = await fetch(`${BACKEND_URL}/api/journeys/active`, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'authentication_required', message: 'Please log in to view your journeys' },
          { status: 401 }
        )
      }

      if (!response.ok) {
        console.warn(`[journeys/active] Backend returned ${response.status}, returning empty array`)
        return NextResponse.json([], {
          headers: { 'X-MindVibe-Fallback': 'empty' },
        })
      }

      const data = await response.json()
      return NextResponse.json(data)

    } catch (error) {
      console.error('[journeys/active] Error fetching from backend:', error)
      // Return empty array on network error - allows graceful degradation
      return NextResponse.json([], {
        headers: { 'X-MindVibe-Offline': 'true' },
      })
    }
  } catch (outerError) {
    console.error('[journeys/active] Critical error:', outerError)
    return NextResponse.json([])
  }
}
