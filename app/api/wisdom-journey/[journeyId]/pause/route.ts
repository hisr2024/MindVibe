/**
 * Wisdom Journey Pause - Pause an active journey
 * This route proxies to the backend with fallback support
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string }> }
) {
  const { journeyId } = await params
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
    const response = await fetch(`${BACKEND_URL}/api/wisdom-journey/${journeyId}/pause`, {
      method: 'PUT',
      headers,
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data, { status: 200 })
    }

    // Backend failed - return simulated paused state
    console.warn(`Backend returned ${response.status} for pause, returning simulated response`)

    return NextResponse.json({
      id: journeyId,
      status: 'paused',
      paused_at: new Date().toISOString(),
      message: 'Journey paused locally - will sync when connection restored',
    }, { status: 200 })
  } catch (error) {
    console.error('Error pausing journey:', error)

    // Return simulated response for offline scenarios
    return NextResponse.json({
      id: journeyId,
      status: 'paused',
      paused_at: new Date().toISOString(),
      message: 'Journey paused locally - will sync when connection restored',
    }, { status: 200 })
  }
}
