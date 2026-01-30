/**
 * Today's Agenda API Route
 * Proxies to backend with proper error handling
 *
 * This route handles GET /api/journeys/today
 * Returns today's steps across all active journeys
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'
const BACKEND_TIMEOUT_MS = 15000 // Longer timeout as this may generate content

// Default empty agenda response
const DEFAULT_AGENDA = {
  steps: [],
  priority_step: null,
  active_journey_count: 0,
  message: 'No active journeys. Start a journey to begin your wisdom path.',
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

      const response = await fetch(`${BACKEND_URL}/api/journeys/today`, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'authentication_required', message: 'Please log in to view your daily agenda' },
          { status: 401 }
        )
      }

      if (!response.ok) {
        console.warn(`[journeys/today] Backend returned ${response.status}, returning empty agenda`)
        return NextResponse.json(DEFAULT_AGENDA, {
          headers: { 'X-MindVibe-Fallback': 'empty' },
        })
      }

      const data = await response.json()
      return NextResponse.json(data)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[journeys/today] Request timeout')
      } else {
        console.error('[journeys/today] Error fetching from backend:', error)
      }
      // Return empty agenda on network error
      return NextResponse.json(DEFAULT_AGENDA, {
        headers: { 'X-MindVibe-Offline': 'true' },
      })
    }
  } catch (outerError) {
    console.error('[journeys/today] Critical error:', outerError)
    return NextResponse.json(DEFAULT_AGENDA)
  }
}
