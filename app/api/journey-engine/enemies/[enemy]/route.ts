/**
 * Journey Engine Enemy Detail API Proxy
 *
 * GET /api/journey-engine/enemies/[enemy] → Get details for a specific inner enemy
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL, fetchWithRetry } from '@/lib/proxy-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enemy: string }> }
) {
  const { enemy } = await params
  try {
    const response = await fetchWithRetry(
      `${BACKEND_URL}/api/journey-engine/enemies/${encodeURIComponent(enemy)}`,
      { method: 'GET', headers: proxyHeaders(request, 'GET') },
      { maxRetries: 1, timeoutMs: 15000, label: '[Journey GET /enemies/:enemy]' }
    )
    const data = await response.json().catch(() => ({}))
    return forwardCookies(response, NextResponse.json(data, { status: response.status }))
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError'
    return NextResponse.json(
      { error: isTimeout ? 'Server is waking up, please try again in a few seconds.' : 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
