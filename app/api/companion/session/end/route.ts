/**
 * Companion Session End - Next.js API Route
 * Proxies session end requests to the backend companion service.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/api/companion/session/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    // Fallback farewell
    return NextResponse.json({
      farewell: "Take care of yourself, friend. I'm always here when you need me.",
      session_summary: {
        messages_exchanged: 0,
        duration_minutes: 0,
        mood_improved: null,
      },
    })
  } catch {
    return NextResponse.json({
      farewell: "Until next time, friend. Remember - you're stronger than you think.",
      session_summary: {
        messages_exchanged: 0,
        duration_minutes: 0,
        mood_improved: null,
      },
    })
  }
}
