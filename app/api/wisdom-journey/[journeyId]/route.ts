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

    const data = await response.json().catch(() => null)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching journey:', error)
    return NextResponse.json({ detail: 'Failed to fetch journey' }, { status: 500 })
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

    const data = await response.json().catch(() => ({ message: 'Journey deleted' }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error deleting journey:', error)
    return NextResponse.json({ detail: 'Failed to delete journey' }, { status: 500 })
  }
}
