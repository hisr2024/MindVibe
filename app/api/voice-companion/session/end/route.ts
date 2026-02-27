/**
 * Voice Companion Session End - Next.js API Route
 * Proxies session end requests to the backend voice companion service.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/api/voice-companion/session/end`, {
      method: 'POST',
      headers: proxyHeaders(request),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return forwardCookies(backendResponse, NextResponse.json(data))
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
