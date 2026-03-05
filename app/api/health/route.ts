/**
 * Health Check API Proxy Route
 *
 * Proxies GET /api/health to the backend. Used by the frontend warm-up
 * mechanism to wake the Render free-tier backend before login attempts.
 * Without this route, the fallback rewrite in next.config.js returns 405.
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
    return NextResponse.json(data, { status: backendResponse.status })
  } catch {
    return NextResponse.json(
      { status: 'unavailable', detail: 'Backend is starting up' },
      { status: 503 }
    )
  }
}
