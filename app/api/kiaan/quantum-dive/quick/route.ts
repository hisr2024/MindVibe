/**
 * Quantum Dive Quick - Next.js API Route
 *
 * Proxies quick consciousness scan requests to the FastAPI backend.
 * Returns a lighter analysis using 1 week of data.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/kiaan/quantum-dive/quick`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => null)
      return NextResponse.json(
        errorData || { error: 'Quick quantum dive failed' },
        { status: backendRes.status }
      )
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Quantum Dive] Quick scan error:', error)
    return NextResponse.json(
      { error: 'Failed to perform quick quantum dive' },
      { status: 502 }
    )
  }
}
