/**
 * Wisdom Journey Pause - Pause an active journey
 * This route proxies to the backend with robust fallback support
 *
 * IMPORTANT: This route is designed to NEVER return a 500 error.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Safe response helper that never throws
function safeJsonResponse(data: unknown, status = 200): NextResponse {
  try {
    return NextResponse.json(data, { status })
  } catch {
    return new NextResponse(JSON.stringify({ _offline: true, status: 'paused' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function createPausedResponse(journeyId: string, isOffline = false) {
  const now = new Date().toISOString()
  return {
    id: journeyId,
    status: 'paused',
    paused_at: now,
    updated_at: now,
    ...(isOffline && { message: 'Journey paused locally - will sync when connection restored', _offline: true }),
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string }> }
) {
  let journeyId = 'unknown'

  try {
    const resolvedParams = await params
    journeyId = resolvedParams.journeyId

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

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${BACKEND_URL}/api/wisdom-journey/${journeyId}/pause`, {
        method: 'PUT',
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return safeJsonResponse(data)
      }

      // Backend failed - return simulated paused state
      console.warn(`Backend returned ${response.status} for pause, returning simulated response`)
      return safeJsonResponse(createPausedResponse(journeyId, true))

    } catch (error) {
      console.error('Error pausing journey:', error)
      return safeJsonResponse(createPausedResponse(journeyId, true))
    }
  } catch (outerError) {
    console.error('Critical error in pause PUT handler:', outerError)
    return safeJsonResponse(createPausedResponse(journeyId, true))
  }
}
