/**
 * Today's Agenda API Route
 * Proxies to backend to get today's steps across all active journeys
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

function safeJsonResponse(data: unknown, status = 200): NextResponse {
  try {
    return NextResponse.json(data, { status })
  } catch {
    return new NextResponse(JSON.stringify({
      steps: [],
      priority_step: null,
      message: 'Unable to load today\'s agenda. Please try again.',
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
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s for AI generation

      const response = await fetch(`${BACKEND_URL}/api/journeys/today`, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Return empty agenda on auth errors
        if (response.status === 401) {
          console.warn('User not authenticated for today agenda')
          return safeJsonResponse({
            steps: [],
            priority_step: null,
            message: 'Please log in to view your daily wisdom.',
          })
        }

        const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error(`Backend today agenda returned ${response.status}:`, error)
        return NextResponse.json(error, { status: response.status })
      }

      const data = await response.json()
      return safeJsonResponse(data)
    } catch (error) {
      console.error('Error fetching today agenda from backend:', error)
      return safeJsonResponse({
        steps: [],
        priority_step: null,
        message: 'Unable to load today\'s wisdom. Please try again.',
      })
    }
  } catch (outerError) {
    console.error('Critical error in today GET handler:', outerError)
    return safeJsonResponse({
      steps: [],
      priority_step: null,
      message: 'An unexpected error occurred.',
    })
  }
}
