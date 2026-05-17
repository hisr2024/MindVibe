/**
 * Journey Step API Proxy
 *
 * GET /api/journey-engine/journeys/[id]/steps/[day] → Get step by day index
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL, fetchWithRetry } from '@/lib/proxy-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; day: string }> }
) {
  const { id, day } = await params
  try {
    const response = await fetchWithRetry(
      `${BACKEND_URL}/api/journey-engine/journeys/${encodeURIComponent(id)}/steps/${encodeURIComponent(day)}`,
      {
        method: 'GET',
        headers: proxyHeaders(request, 'GET'),
      },
      { maxRetries: 1, timeoutMs: 15000, label: '[Journey GET /steps/:day]' }
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
