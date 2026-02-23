/**
 * Quantum Dive Analyze - Next.js API Route
 *
 * Proxies full consciousness analysis requests to the FastAPI backend.
 * The backend performs multi-layer Pancha Kosha analysis using
 * historical daily/weekly wellness data.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendRes = await fetch(`${BACKEND_URL}/api/kiaan/quantum-dive/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => null)
      return NextResponse.json(
        errorData || { error: 'Quantum dive analysis failed' },
        { status: backendRes.status }
      )
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Quantum Dive] Analyze error:', error)
    return NextResponse.json(
      { error: 'Failed to perform quantum dive analysis' },
      { status: 502 }
    )
  }
}
