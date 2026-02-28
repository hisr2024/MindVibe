/**
 * Companion Session Start - Next.js API Route
 * Proxies session start requests to the backend companion service.
 */

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/api/companion/session/start`, {
      method: 'POST',
      headers: proxyHeaders(request, 'POST'),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return forwardCookies(backendResponse, NextResponse.json(data))
    }

    // Fallback greeting for when backend is unavailable
    const hour = new Date().getHours()
    let greeting: string
    if (hour >= 5 && hour < 12) {
      greeting = "Good morning! I'm KIAAN, your personal friend. What's on your mind today?"
    } else if (hour >= 17 && hour < 21) {
      greeting = "Good evening, friend! How was your day? I'm here to listen."
    } else if (hour >= 21 || hour < 5) {
      greeting = "Hey there, night owl. Can't sleep, or just need a friend? I'm right here."
    } else {
      greeting = "Hey friend! I'm KIAAN. I'm always here when you need someone to talk to. What's up?"
    }

    return NextResponse.json({
      session_id: `local_${randomUUID()}`,
      greeting,
      phase: 'connect',
      friendship_level: 'new',
      user_name: null,
    })
  } catch {
    return NextResponse.json(
      {
        session_id: `local_${randomUUID()}`,
        greeting: "Hey! I'm KIAAN, your best friend. Whatever's on your mind, I'm here. Talk to me.",
        phase: 'connect',
        friendship_level: 'new',
        user_name: null,
      },
    )
  }
}
