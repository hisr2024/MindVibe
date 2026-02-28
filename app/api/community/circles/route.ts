/**
 * Community Circles API Proxy
 *
 * GET /api/community/circles → List available circles (with query params forwarding)
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const response = await fetch(
      `${BACKEND_URL}/api/community/circles${url.search}`,
      {
        method: 'GET',
        headers: proxyHeaders(request, 'GET'),
        signal: AbortSignal.timeout(10000),
      }
    )

    const data = await response.json().catch(() => ({}))
    return forwardCookies(
      response,
      NextResponse.json(data, { status: response.status })
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
