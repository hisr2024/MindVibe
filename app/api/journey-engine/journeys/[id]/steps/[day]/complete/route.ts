/**
 * Step Completion API Proxy
 *
 * POST /api/journey-engine/journeys/[id]/steps/[day]/complete → Complete a step
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; day: string }> }
) {
  const { id, day } = await params
  try {
    const body = await request.json().catch(() => ({}))

    const response = await fetch(
      `${BACKEND_URL}/api/journey-engine/journeys/${encodeURIComponent(id)}/steps/${encodeURIComponent(day)}/complete`,
      {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body: JSON.stringify(body),
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
