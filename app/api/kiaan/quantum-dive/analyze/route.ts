/**
 * Quantum Dive Analyze - Next.js API Route
 *
 * Proxies full consciousness analysis requests to the FastAPI backend.
 * The backend performs multi-layer Pancha Kosha analysis using
 * historical daily/weekly wellness data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text().catch(() => '{}')

    const backendRes = await fetch(`${BACKEND_URL}/api/kiaan/quantum-dive/analyze`, {
      method: 'POST',
      headers: proxyHeaders(request, 'POST'),
      body: body || '{}',
      signal: AbortSignal.timeout(15000),
    })

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => null)
      return forwardCookies(
        backendRes,
        NextResponse.json(
          errorData || { error: 'Quantum dive analysis failed' },
          { status: backendRes.status }
        )
      )
    }

    const data = await backendRes.json()
    return forwardCookies(backendRes, NextResponse.json(data))
  } catch (error) {
    console.error('[Quantum Dive] Analyze error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to perform quantum dive analysis' },
      { status: 502 }
    )
  }
}
