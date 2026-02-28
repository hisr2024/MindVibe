/**
 * Community Circle Join API Proxy
 *
 * POST /api/community/circles/[circleId]/join → Join a circle
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  const { circleId } = await params
  try {
    const body = await request.text()
    const response = await fetch(
      `${BACKEND_URL}/api/community/circles/${encodeURIComponent(circleId)}/join`,
      {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body: body || undefined,
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
