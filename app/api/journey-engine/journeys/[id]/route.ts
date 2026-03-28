/**
 * Journey Detail API Proxy
 *
 * GET  /api/journey-engine/journeys/[id] → Get journey details
 * DELETE /api/journey-engine/journeys/[id] → Abandon a journey
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL, fetchWithRetry } from '@/lib/proxy-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const response = await fetchWithRetry(
      `${BACKEND_URL}/api/journey-engine/journeys/${encodeURIComponent(id)}`,
      {
        method: 'GET',
        headers: proxyHeaders(request, 'GET'),
      },
      { maxRetries: 2, timeoutMs: 30000, label: '[Journey GET /journeys/:id]' }
    )

    const data = await response.json().catch(() => ({ error: 'Invalid response' }))
    return forwardCookies(
      response,
      NextResponse.json(data, { status: response.status })
    )
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError'
    return NextResponse.json(
      { error: isTimeout ? 'Server is waking up, please try again in a few seconds.' : 'Service temporarily unavailable. Please try again.' },
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
    const response = await fetchWithRetry(
      `${BACKEND_URL}/api/journey-engine/journeys/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: proxyHeaders(request, 'DELETE'),
      },
      { maxRetries: 2, timeoutMs: 45000, label: '[Journey DELETE /journeys/:id]' }
    )

    if (response.status === 204) {
      return forwardCookies(response, new NextResponse(null, { status: 204 }))
    }

    const data = await response.json().catch(() => ({ error: 'Invalid response' }))
    return forwardCookies(
      response,
      NextResponse.json(data, { status: response.status })
    )
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError'
    return NextResponse.json(
      { error: isTimeout ? 'Server is waking up, please try again in a few seconds.' : 'Service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
