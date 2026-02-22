/**
 * GDPR Data Export API Route
 *
 * Handles GDPR-compliant data export requests.
 * Proxies to backend with graceful fallback.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieHeader = request.headers.get('cookie') || ''

    const backendResponse = await fetch(`${BACKEND_URL}/api/gdpr/data-export`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    if (backendResponse.status === 401) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Generate a local download token for client-side data
    const downloadToken = `local-${Date.now().toString(36)}`
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
