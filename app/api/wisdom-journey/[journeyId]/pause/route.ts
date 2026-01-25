/**
 * Wisdom Journey Pause - Pause an active journey
 * This route proxies to the backend
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

    const data = await response.json().catch(() => null)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error pausing journey:', error)
    return NextResponse.json({ detail: 'Failed to pause journey' }, { status: 500 })
  }
}
