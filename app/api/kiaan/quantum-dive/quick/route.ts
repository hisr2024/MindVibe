/**
 * Quantum Dive Quick - Next.js API Route
 *
 * Proxies quick consciousness scan requests to the FastAPI backend.
 * Returns a lighter analysis using 1 week of data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(request: NextRequest) {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/kiaan/quantum-dive/quick`, {
      method: 'GET',
      headers: proxyHeaders(request, 'GET'),
      signal: AbortSignal.timeout(10000),
    })

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => null)
      return forwardCookies(
        backendRes,
        NextResponse.json(
          errorData || { error: 'Quick quantum dive failed' },
          { status: backendRes.status }
        )
      )
    }

    const data = await backendRes.json()
    return forwardCookies(backendRes, NextResponse.json(data))
  } catch (error) {
    console.error('[Quantum Dive] Quick scan error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to perform quick quantum dive' },
      { status: 502 }
    )
  }
}
