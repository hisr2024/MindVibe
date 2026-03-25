/**
 * KIAAN Assistant — Reminder API Proxy
 *
 * POST: Create a new reminder
 * DELETE: Cancel a reminder (by ID in body)
 */

import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const res = await fetch(`${BACKEND_URL}/api/kiaan/assistant/reminder`, {
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reminderId = searchParams.get('id')
    const userId = searchParams.get('user_id') || 'anonymous'

    if (!reminderId) {
      return NextResponse.json(
        { success: false, error: 'Reminder ID is required.' },
        { status: 400 }
      )
    }

    const res = await fetch(
      `${BACKEND_URL}/api/kiaan/assistant/reminder/${reminderId}?user_id=${userId}`,
      {
        method: 'DELETE',
        signal: AbortSignal.timeout(15_000),
      }
    )

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Assistant service unavailable.' },
      { status: 503 }
    )
  }
}
