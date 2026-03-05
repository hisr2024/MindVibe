/**
 * Health Check API Proxy Route
 *
 * Proxies GET /api/health to the backend. Used by the frontend warm-up
 * mechanism to wake the Render free-tier backend before login attempts.
 *
 * IMPORTANT: Always returns HTTP 200 to prevent browser console errors.
 * The `ready` field in the JSON body indicates whether the backend is
 * actually reachable. This eliminates the flood of red 503 errors in
 * DevTools during Render cold starts (30-60s).
 */

import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    })

    const data = await backendResponse.json().catch(() => ({ status: 'unknown' }))

    if (backendResponse.ok) {
      return NextResponse.json({ ...data, ready: true }, { status: 200 })
    }

    // Backend responded but with an error (e.g. migrations pending)
    return NextResponse.json(
      { ...data, ready: false, backendStatus: backendResponse.status },
      { status: 200 }
    )
  } catch {
    // Backend unreachable (cold start, network error, timeout)
    return NextResponse.json(
      { status: 'warming_up', ready: false, detail: 'Backend is starting up' },
      { status: 200 }
    )
  }
}
