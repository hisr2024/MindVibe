/**
 * Community Circle Detail API Proxy
 *
 * GET /api/community/circles/[circleId] → Get circle details
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const { circleId } = await params
  try {
    const url = new URL(request.url)
    const response = await fetch(
      `${BACKEND_URL}/api/community/circles/${encodeURIComponent(circleId)}${url.search}`,
      {
        method: 'GET',
        headers: proxyHeaders(request),
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
