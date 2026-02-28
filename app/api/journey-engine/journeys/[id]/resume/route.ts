/**
 * Journey Resume API Proxy
 *
 * POST /api/journey-engine/journeys/[id]/resume → Resume a paused journey
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/journey-engine/journeys/${encodeURIComponent(id)}/resume`,
      {
        method: 'POST',
        headers: proxyHeaders(request),
        signal: AbortSignal.timeout(10000),
      }
    )

    const data = await response.json().catch(() => ({ error: 'Invalid response' }))
    return forwardCookies(
      response,
      NextResponse.json(data, { status: response.status })
    )
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
