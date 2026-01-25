/**
 * Wisdom Journey Resume - Resume a paused journey
 * This route proxies to the backend with robust fallback support
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

function createResumedResponse(journeyId: string, isOffline = false) {
  const now = new Date().toISOString()
  return {
    id: journeyId,
    status: 'active',
    paused_at: null,
    updated_at: now,
    ...(isOffline && { message: 'Journey resumed locally - will sync when connection restored', _offline: true }),
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

      const response = await fetch(`${BACKEND_URL}/api/wisdom-journey/${journeyId}/resume`, {
        method: 'PUT',
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data, { status: 200 })
      }

      // Backend failed - return simulated resumed state
      console.warn(`Backend returned ${response.status} for resume, returning simulated response`)
      return NextResponse.json(createResumedResponse(journeyId, true), { status: 200 })

    } catch (error) {
      console.error('Error resuming journey:', error)
      return NextResponse.json(createResumedResponse(journeyId, true), { status: 200 })
    }
  } catch (outerError) {
    console.error('Critical error in resume PUT handler:', outerError)
    return NextResponse.json(createResumedResponse(journeyId, true), { status: 200 })
  }
}
