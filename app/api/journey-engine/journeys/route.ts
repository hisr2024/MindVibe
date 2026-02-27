/**
 * Journey Engine Journeys API Proxy
 * Proxies to backend journey-engine service with graceful fallback
 * when the backend is unavailable or user is not authenticated.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

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
      headers: proxyHeaders(request),
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    return forwardCookies(response, NextResponse.json(FALLBACK_JOURNEYS))
  } catch {
    return NextResponse.json(FALLBACK_JOURNEYS)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/journey-engine/journeys`, {
      method: 'POST',
      headers: proxyHeaders(request),
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    const status = response.status
    if (status === 401) {
      return forwardCookies(
        response,
        NextResponse.json(
          { error: 'Authentication required to start a journey. Please sign in.' },
          { status: 401 }
        )
      )
    }

    const errorText = await response.text().catch(() => 'Unknown error')
    return forwardCookies(
      response,
      NextResponse.json(
        { error: errorText || 'Failed to create journey' },
        { status }
      )
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
