/**
 * Step Completion API Proxy
 *
 * POST /api/journey-engine/journeys/[id]/steps/[day]/complete → Complete a step
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL, fetchWithRetry } from '@/lib/proxy-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; day: string }> }
) {
  const { id, day } = await params
  try {
    const body = await request.json().catch(() => ({}))

    const response = await fetchWithRetry(
      `${BACKEND_URL}/api/journey-engine/journeys/${encodeURIComponent(id)}/steps/${encodeURIComponent(day)}/complete`,
      {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body: JSON.stringify(body),
      },
      { maxRetries: 2, timeoutMs: 45000, label: '[Journey POST /steps/complete]' }
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
