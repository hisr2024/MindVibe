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
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${BACKEND_URL}/api/wisdom-journey/active`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data, { status: 200 })
    }

    // No active journey or error - return null (valid response)
    if (response.status === 404 || response.status === 204) {
      return NextResponse.json(null, { status: 200 })
    }

    // Backend error - return null to allow frontend to show recommendations
    console.warn(`Backend returned ${response.status} for active journey, returning null`)
    return NextResponse.json(null, { status: 200 })
  } catch (error) {
    console.error('Error fetching active journey:', error)

    // Return null (no active journey) on error to allow fallback in frontend
    // This prevents the 500 error from propagating to the client
    return NextResponse.json(null, { status: 200 })
  }
}
