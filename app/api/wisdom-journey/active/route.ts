/**
 * Wisdom Journey Active - Get user's active journey
 * This route proxies to the backend with fallback support
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
    return new NextResponse(JSON.stringify(null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function GET(request: NextRequest) {
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
        return safeJsonResponse(data)
      }

      // No active journey or error - return null (valid response)
      if (response.status === 404 || response.status === 204) {
        return safeJsonResponse(null)
      }

      // Backend error - return null to allow frontend to show recommendations
      console.warn(`Backend returned ${response.status} for active journey, returning null`)
      return safeJsonResponse(null)
    } catch (error) {
      console.error('Error fetching active journey:', error)

      // Return null (no active journey) on error to allow fallback in frontend
      // This prevents the 500 error from propagating to the client
      return safeJsonResponse(null)
    }
  } catch (outerError) {
    console.error('Critical error in active GET handler:', outerError)
    return safeJsonResponse(null)
  }
}
