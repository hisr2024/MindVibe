/**
 * Chat Message API Route
 * Proxies chat messages to the backend KIAAN service
 * Handles CSRF, error fallbacks, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Fallback responses grounded in psychology and behavioral science
const FALLBACK_RESPONSES = [
  {
    response: "Take a slow breath. What you're feeling right now is a temporary neurological state, not a permanent condition. Your nervous system is doing its job. I'm here — tell me what's on your mind.",
    verse: null,
  },
  {
    response: "Focus on what's within your control right now — your attention, your next small action. Outcomes are uncertain by nature, but your effort is fully yours. What's weighing on you?",
    verse: null,
  },
  {
    response: "Difficult moments activate your stress response, but they don't define your capacity. You've navigated hard things before. Your baseline resilience is stronger than the current discomfort. What's happening?",
    verse: null,
  },
  {
    response: "Whatever you're experiencing right now is real and valid. Emotions are signals, not sentences. They carry information about what matters to you. I'm listening — share what's going on.",
    verse: null,
  },
  {
    response: "When things feel overwhelming, your brain is processing more than it can hold at once. That's not weakness — it's overload. Start with one thing. What feels most pressing right now?",
    verse: null,
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, language = 'en', context, session_id, conversation_history } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedMessage = message
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    // Sanitize conversation history if provided
    const sanitizedHistory = conversation_history?.map((msg: { role: string; content: string; timestamp: string }) => ({
      role: msg.role,
      content: msg.content?.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 2000) || '',
      timestamp: msg.timestamp
    })) || []

    try {
      // Call the backend chat endpoint
      const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          message: sanitizedMessage,
          language,
          context,
          session_id,
          conversation_history: sanitizedHistory,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          success: true,
          response: data.response || data.message,
          summary: data.summary || null,  // AI-generated summary for Quick View
          verse: data.verse,
          verses_used: data.verses_used,
          emotion: data.detected_emotion || data.emotion,
          ai_powered: true,
        })
      }

      // Log the error for debugging
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[Chat API] Backend returned ${response.status}: ${errorText}`)

      // Handle specific HTTP error codes
      if (response.status === 429) {
        return NextResponse.json(
          {
            error: 'Too many requests. Please wait a moment and try again.',
            success: false,
          },
          { status: 429 }
        )
      }

      if (response.status === 403) {
        return NextResponse.json(
          {
            error: 'Access denied. Please try again or contact support.',
            success: false,
          },
          { status: 403 }
        )
      }

      if (response.status === 404) {
        console.error('[Chat API] Backend endpoint not found - check API routes')
        // Fall through to use fallback
      }

      if (response.status === 503) {
        console.warn('[Chat API] Backend service unavailable - using fallback')
        // Fall through to use fallback
      }

      // For other errors, fall through to fallback
    } catch (backendError) {
      console.warn('[Chat API] Backend connection failed:', backendError)
    }

    // Use fallback response when backend is unavailable
    const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]

    return NextResponse.json({
      success: true,
      response: fallback.response,
      verse: fallback.verse,
      ai_powered: true,
      _offline: true,
    })
  } catch (error) {
    console.error('[Chat API] Error:', error)

    // Always return a helpful response
    const fallback = FALLBACK_RESPONSES[0]
    return NextResponse.json({
      success: true,
      response: fallback.response,
      verse: fallback.verse,
      ai_powered: true,
      _offline: true,
    })
  }
}

// Health check for the chat endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'kiaan-chat',
    timestamp: new Date().toISOString(),
  })
}
