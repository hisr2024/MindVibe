/**
 * Journey Step API Proxy
 *
 * GET /api/journey-engine/journeys/[id]/steps/[day] → Get step by day index
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; day: string }> }
) {
  const { id, day } = await params
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/journey-engine/journeys/${encodeURIComponent(id)}/steps/${encodeURIComponent(day)}`,
      {
        method: 'GET',
        headers: proxyHeaders(request, 'GET'),
        signal: AbortSignal.timeout(8000),
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
