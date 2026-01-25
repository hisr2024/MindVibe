/**
 * Wisdom Journey Active - Get user's active journey
 * This route proxies to the backend with fallback support
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

export async function GET(request: NextRequest) {
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
    const response = await fetch(`${BACKEND_URL}/api/wisdom-journey/active`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    // Return the backend response
    const data = await response.json().catch(() => null)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching active journey:', error)

    // Return null (no active journey) on error to allow fallback in frontend
    return NextResponse.json(null, { status: 200 })
  }
}
