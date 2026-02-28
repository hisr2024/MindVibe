/**
 * Journey Engine Enemy Detail API Proxy
 *
 * GET /api/journey-engine/enemies/[enemy] → Get details for a specific inner enemy
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enemy: string }> }
) {
  const { enemy } = await params
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/journey-engine/enemies/${encodeURIComponent(enemy)}`,
      { method: 'GET', headers: proxyHeaders(request), signal: AbortSignal.timeout(10000) }
    )
    const data = await response.json().catch(() => ({}))
    return forwardCookies(response, NextResponse.json(data, { status: response.status }))
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}
