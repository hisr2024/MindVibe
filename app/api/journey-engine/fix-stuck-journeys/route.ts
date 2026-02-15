/**
 * Journey Engine Fix Stuck Journeys API Proxy
 * Proxies to backend fix-stuck-journeys endpoint.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/journey-engine/fix-stuck-journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (response.status === 401) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const errorText = await response.text().catch(() => 'Unknown error')
    return NextResponse.json(
      { error: errorText || 'Failed to fix stuck journeys' },
      { status: response.status }
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
