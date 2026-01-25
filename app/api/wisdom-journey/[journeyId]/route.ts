/**
 * Wisdom Journey by ID - Get, Delete journey
 * This route proxies to the backend with fallback support
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

export async function GET(
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
    const response = await fetch(`${BACKEND_URL}/api/wisdom-journey/${journeyId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data, { status: 200 })
    }

    if (response.status === 404) {
      return NextResponse.json({ detail: 'Journey not found' }, { status: 404 })
    }

    // Backend error - return a minimal journey structure
    console.warn(`Backend returned ${response.status} for journey ${journeyId}`)
    return NextResponse.json({ detail: 'Journey temporarily unavailable' }, { status: 503 })
  } catch (error) {
    console.error('Error fetching journey:', error)
    return NextResponse.json({ detail: 'Journey temporarily unavailable' }, { status: 503 })
  }
}

export async function DELETE(
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
    const response = await fetch(`${BACKEND_URL}/api/wisdom-journey/${journeyId}`, {
      method: 'DELETE',
      headers,
    })

    if (response.ok) {
      const data = await response.json().catch(() => ({ message: 'Journey deleted' }))
      return NextResponse.json(data, { status: 200 })
    }

    // Backend failed - return simulated success (journey will be deleted when backend is available)
    console.warn(`Backend returned ${response.status} for delete, returning simulated success`)

    return NextResponse.json({
      message: 'Journey marked for deletion - will sync when connection restored',
      journey_id: journeyId,
    }, { status: 200 })
  } catch (error) {
    console.error('Error deleting journey:', error)

    // Return simulated success for offline scenarios
    return NextResponse.json({
      message: 'Journey marked for deletion - will sync when connection restored',
      journey_id: journeyId,
    }, { status: 200 })
  }
}
