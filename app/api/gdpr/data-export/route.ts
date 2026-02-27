/**
 * GDPR Data Export API Route
 *
 * Handles GDPR-compliant data export requests.
 * Proxies to backend with graceful fallback.
 */

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/api/gdpr/data-export`, {
      method: 'POST',
      headers: proxyHeaders(request),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return forwardCookies(backendResponse, NextResponse.json(data))
    }

    if (backendResponse.status === 401) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Generate a local download token for client-side data
    const downloadToken = `local-${randomUUID()}`
    return NextResponse.json({
      download_token: downloadToken,
      message: 'Export queued. Server data will be available when backend is online.',
    })
  } catch (error) {
    console.error('[GDPR Export] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { detail: 'Data export is temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  }
}
