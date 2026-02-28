/**
 * Journey Engine Fix Stuck Journeys API Proxy
 * Proxies to backend fix-stuck-journeys endpoint. Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/journey-engine/fix-stuck-journeys`, {
      method: 'POST',
      headers: proxyHeaders(request),
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    }

    if (response.status === 401) {
      return forwardCookies(
        response,
        NextResponse.json(
          { error: 'Authentication required. Please sign in.' },
          { status: 401 }
        )
      )
    }

    const errorText = await response.text().catch(() => 'Unknown error')
    return forwardCookies(
      response,
      NextResponse.json(
        { error: errorText || 'Failed to fix stuck journeys' },
        { status: response.status }
      )
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
