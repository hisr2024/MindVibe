/**
 * GDPR Data Export API Route (Art. 15 + Art. 20)
 *
 * POST — queue a data export (proxies to backend)
 * GET  — download ZIP via signed token (proxies to backend)
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

const BACKEND_EXPORT = `${BACKEND_URL}/api/v1/privacy/export`

export async function POST(request: NextRequest) {
  try {
    const backendResponse = await fetch(BACKEND_EXPORT, {
      method: 'POST',
      headers: proxyHeaders(request, 'POST'),
      signal: AbortSignal.timeout(600_000), // 10 min — export can be large
    })

    if (backendResponse.status === 429) {
      const data = await backendResponse.json().catch(() => ({}))
      return NextResponse.json(
        { detail: data.detail || 'Rate limited — one export per 24 hours.' },
        { status: 429 }
      )
    }

    if (backendResponse.status === 401) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }

    const data = await backendResponse.json().catch(() => ({}))
    return forwardCookies(
      backendResponse,
      NextResponse.json(data, { status: backendResponse.status })
    )
  } catch (error) {
    console.error('[Privacy Export POST] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { detail: 'Data export is temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { detail: 'Missing download token.' },
      { status: 400 }
    )
  }

  try {
    const backendResponse = await fetch(
      `${BACKEND_EXPORT}?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
        headers: proxyHeaders(request, 'GET'),
        signal: AbortSignal.timeout(120_000),
      }
    )

    if (!backendResponse.ok) {
      const data = await backendResponse.json().catch(() => ({}))
      return NextResponse.json(
        { detail: data.detail || 'Download failed.' },
        { status: backendResponse.status }
      )
    }

    const zipBuffer = await backendResponse.arrayBuffer()

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="kiaanverse-data-export.zip"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[Privacy Export GET] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { detail: 'Download is temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  }
}
