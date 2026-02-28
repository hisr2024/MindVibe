/**
 * Journey Detail API Proxy
 *
 * GET  /api/journey-engine/journeys/[id] → Get journey details
 * DELETE /api/journey-engine/journeys/[id] → Abandon a journey
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/journey-engine/journeys/${encodeURIComponent(id)}`,
      {
        method: 'GET',
        headers: proxyHeaders(request),
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/journey-engine/journeys/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: proxyHeaders(request),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (response.status === 204) {
      return forwardCookies(response, new NextResponse(null, { status: 204 }))
    }

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
