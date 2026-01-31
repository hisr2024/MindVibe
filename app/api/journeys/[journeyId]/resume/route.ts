/**
 * Journey Resume API Route
 * Proxies to backend to resume a paused journey
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

interface RouteParams {
  params: Promise<{ journeyId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { journeyId } = await params

  try {
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')

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

    // Forward CSRF token
    const csrfToken = request.headers.get('X-CSRF-Token')
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${BACKEND_URL}/api/journeys/${journeyId}/resume`, {
        method: 'POST',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json().catch(() => ({ detail: 'Unknown error' }))

      if (!response.ok) {
        console.error(`Backend journey resume returned ${response.status}:`, data)
        return NextResponse.json(data, { status: response.status })
      }

      return NextResponse.json(data)
    } catch (error) {
      console.error('Error resuming journey from backend:', error)

      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { detail: 'Request timed out. Please try again.' },
          { status: 504 }
        )
      }

      return NextResponse.json(
        { detail: 'Failed to resume journey. Please try again.' },
        { status: 503 }
      )
    }
  } catch (outerError) {
    console.error('Critical error in journey resume POST handler:', outerError)
    return NextResponse.json(
      { detail: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
