/**
 * Journey Engine Journeys API Proxy
 * Proxies to backend journey-engine service with graceful fallback
 * when the backend is unavailable or user is not authenticated.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FALLBACK_JOURNEYS = {
  journeys: [],
  total: 0,
  _fallback: true,
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const queryString = url.search

    const response = await fetch(`${BACKEND_URL}/api/journey-engine/journeys${queryString}`, {
      method: 'GET',
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

    // Return fallback for auth failures or other errors
    return NextResponse.json(FALLBACK_JOURNEYS)
  } catch {
    // Backend unavailable - return fallback
    return NextResponse.json(FALLBACK_JOURNEYS)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/journey-engine/journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    const status = response.status
    if (status === 401) {
      return NextResponse.json(
        { error: 'Authentication required to start a journey. Please sign in.' },
        { status: 401 }
      )
    }

    const errorText = await response.text().catch(() => 'Unknown error')
    return NextResponse.json(
      { error: errorText || 'Failed to create journey' },
      { status }
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
