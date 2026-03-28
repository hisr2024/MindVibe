/**
 * KIAAN Assistant — Execute Ecosystem Tool API Proxy
 *
 * POST: Execute an ecosystem tool by name
 */

import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const res = await fetch(`${BACKEND_URL}/api/kiaan/assistant/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Assistant service unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
