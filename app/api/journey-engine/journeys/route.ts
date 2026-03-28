/**
 * Journey Engine Journeys API Proxy
 *
 * GET  /api/journey-engine/journeys → List user journeys (with fallback)
 * POST /api/journey-engine/journeys → Start a new journey from a template
 *
 * Proxies to the backend journey-engine service. Returns an empty
 * fallback on GET if the backend is unreachable so the UI still renders.
 *
 * Both handlers use fetchWithRetry to survive Render cold starts (30-60s)
 * and transient 502/503/504 errors during deploys.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL, fetchWithRetry } from '@/lib/proxy-utils'

const FALLBACK_JOURNEYS = {
  journeys: [],
  total: 0,
  _fallback: true,
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)

    const response = await fetchWithRetry(
      `${BACKEND_URL}/api/journey-engine/journeys${url.search}`,
      {
        method: 'GET',
        headers: proxyHeaders(request, 'GET'),
      },
      { maxRetries: 1, timeoutMs: 15000, label: '[Journey GET /journeys]' }
    )

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

    const response = await fetchWithRetry(
      `${BACKEND_URL}/api/journey-engine/journeys`,
      {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body,
      },
      { maxRetries: 2, timeoutMs: 45000, label: '[Journey POST /journeys]' }
    )

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data, { status: response.status }))
    }

    // Forward the backend's error status and message
    const data = await response.json().catch(() => ({}))
    const detail = typeof data?.detail === 'string'
      ? data.detail
      : (data?.detail?.message || data?.detail?.error || 'Failed to create journey')
    const code = data?.detail?.error || undefined

    return forwardCookies(
      response,
      NextResponse.json({ error: detail, detail, code }, { status: response.status })
    )
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError'
    return NextResponse.json(
      {
        error: isTimeout
          ? 'Server is waking up, please try again in a few seconds.'
          : 'Service temporarily unavailable. Please try again.',
      },
      { status: 503 }
    )
  }
}
