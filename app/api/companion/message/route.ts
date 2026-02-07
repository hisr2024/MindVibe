/**
 * Companion Message - Next.js API Route
 * Proxies chat messages to the backend companion service.
 * Falls back to the general chat API if companion endpoint is unavailable.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FALLBACK_RESPONSES = [
  "I hear you, friend. Whatever you're going through, you don't have to face it alone. I'm right here.",
  "Thank you for sharing that with me. It takes real courage to open up, and I'm grateful you trust me.",
  "You know what I think? You're stronger than you give yourself credit for. Think about everything you've already survived.",
  "I'm listening, really listening. Not to fix you - you don't need fixing. Just to be here with you.",
  "Here's what I've learned: the only moment that's real is this one. Right here, with me. Whatever else is happening, right now you're safe.",
  "Your feelings are valid. All of them. You don't need to justify them to anyone, least of all to me.",
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Sanitize input
    const sanitizedMessage = body.message
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    // Try companion endpoint first
    try {
      const companionResponse = await fetch(`${BACKEND_URL}/api/companion/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          session_id: body.session_id,
          message: sanitizedMessage,
          language: body.language || 'en',
          content_type: body.content_type || 'text',
        }),
      })

      if (companionResponse.ok) {
        const data = await companionResponse.json()
        return NextResponse.json(data)
      }
    } catch {
      // Companion endpoint unavailable, try chat fallback
    }

    // Fallback to general chat API
    try {
      const chatResponse = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          message: sanitizedMessage,
          language: body.language || 'en',
          context: 'companion',
        }),
      })

      if (chatResponse.ok) {
        const chatData = await chatResponse.json()
        return NextResponse.json({
          message_id: `msg_${Date.now()}`,
          response: chatData.response || chatData.message,
          mood: chatData.detected_emotion || 'neutral',
          mood_intensity: 0.5,
          phase: 'connect',
        })
      }
    } catch {
      // Chat API also unavailable
    }

    // Ultimate fallback: local response
    const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
    return NextResponse.json({
      message_id: `msg_${Date.now()}`,
      response: fallback,
      mood: 'neutral',
      mood_intensity: 0.3,
      phase: 'connect',
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
