/**
 * Journey Engine Journeys API Proxy
 *
 * GET  /api/journey-engine/journeys → List user journeys (with fallback)
 * POST /api/journey-engine/journeys → Start a new journey from a template
 *
 * Proxies to the backend journey-engine service. Returns an empty
 * fallback on GET if the backend is unreachable so the UI still renders.
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

    const response = await fetch(`${BACKEND_URL}/api/journey-engine/journeys${url.search}`, {
      method: 'GET',
      headers: proxyHeaders(request, 'GET'),
      signal: AbortSignal.timeout(8000),
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    // Forward auth errors so the frontend can redirect to login
    if (response.status === 401 || response.status === 403) {
      return forwardCookies(
        response,
        NextResponse.json(
          { detail: 'Authentication required', journeys: [], total: 0 },
          { status: response.status }
        )
      )
    }

    // For other errors return fallback with 200 so the UI still renders
    return forwardCookies(response, NextResponse.json(FALLBACK_JOURNEYS))
  } catch {
    return NextResponse.json(FALLBACK_JOURNEYS)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Safely read body — may be empty if template_id is in query
    const rawBody = await request.text().catch(() => '')
    const body = rawBody && rawBody.length > 0 ? rawBody : '{}'

    const response = await fetch(`${BACKEND_URL}/api/journey-engine/journeys`, {
      method: 'POST',
      headers: proxyHeaders(request, 'POST'),
      body,
      signal: AbortSignal.timeout(10000),
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    // Forward the backend's error status and message
    const data = await response.json().catch(() => ({}))
    const detail = typeof data?.detail === 'string' ? data.detail : 'Failed to create journey'

    return forwardCookies(
      response,
      NextResponse.json({ error: detail, detail }, { status: response.status })
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
