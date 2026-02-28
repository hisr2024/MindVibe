/**
 * Session Revoke API Proxy
 *
 * POST /api/auth/sessions/[sessionId]/revoke → Revoke a specific session
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  try {
    const body = await request.text()
    const response = await fetch(
      `${BACKEND_URL}/api/auth/sessions/${encodeURIComponent(sessionId)}/revoke`,
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
