/**
 * Chat Health Check API Proxy Route
 *
 * Proxies GET /api/chat/health to the backend.
 * Always returns HTTP 200 to prevent browser console errors.
 * The `ready` field in the JSON body indicates backend availability.
 */

import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/chat/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    const data = await backendResponse.json().catch(() => ({ status: 'unknown' }))

    return NextResponse.json(
      { ...data, ready: backendResponse.ok },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { status: 'warming_up', ready: false, detail: 'Chat backend is starting up' },
      { status: 200 }
    )
  }
}
