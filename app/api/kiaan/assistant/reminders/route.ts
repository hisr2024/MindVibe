/**
 * KIAAN Assistant — List Reminders API Proxy
 *
 * GET: List all active reminders for a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || 'anonymous'

    const res = await fetch(
      `${BACKEND_URL}/api/kiaan/assistant/reminders?user_id=${userId}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(15_000),
      }
    )

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Assistant service unavailable.', reminders: [], count: 0 },
      { status: 503 }
    )
  }
}
