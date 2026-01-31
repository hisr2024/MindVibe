/**
 * Journey History API Route
 * Proxies to backend to get journey step history
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

interface RouteParams {
  params: Promise<{ journeyId: string }>
}

function safeJsonResponse(data: unknown, status = 200): NextResponse {
  try {
    return NextResponse.json(data, { status })
  } catch {
    return new NextResponse(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { journeyId } = await params

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

      const response = await fetch(`${BACKEND_URL}/api/journeys/${journeyId}/history`, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error(`Backend journey history returned ${response.status}:`, error)
        return NextResponse.json(error, { status: response.status })
      }

      const data = await response.json()
      return safeJsonResponse(data)
    } catch (error) {
      console.error('Error fetching journey history from backend:', error)
      return safeJsonResponse([])
    }
  } catch (outerError) {
    console.error('Critical error in journey history GET handler:', outerError)
    return safeJsonResponse([])
  }
}
