/**
 * Chat Message API Route
 * Proxies chat messages to the backend KIAAN service
 * Handles CSRF, error fallbacks, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'
import { selectWisdom } from '@/lib/wisdom-core'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Static fallback responses (used when Wisdom Core also unavailable)
const STATIC_FALLBACKS = [
  "Take a slow breath. What you're feeling right now is a temporary neurological state, not a permanent condition. Your nervous system is doing its job. I'm here — tell me what's on your mind.",
  "Focus on what's within your control right now — your attention, your next small action. Outcomes are uncertain by nature, but your effort is fully yours. What's weighing on you?",
  "Difficult moments activate your stress response, but they don't define your capacity. You've navigated hard things before. Your baseline resilience is stronger than the current discomfort. What's happening?",
  "Whatever you're experiencing right now is real and valid. Emotions are signals, not sentences. They carry information about what matters to you. I'm listening — share what's going on.",
  "When things feel overwhelming, your brain is processing more than it can hold at once. That's not weakness — it's overload. Start with one thing. What feels most pressing right now?",
]

/**
 * Build a dynamic fallback response using the full 701-verse Wisdom Core.
 * Falls back to static responses if the corpus is unavailable.
 */
function buildDynamicFallback(message: string): { response: string; verse: { ref: string; english: string } | null } {
  // Simple mood detection for fallback context
  const lower = message.toLowerCase()
  let mood = 'neutral'
  if (['anxious', 'anxiety', 'worried', 'scared', 'panic', 'stress'].some(k => lower.includes(k))) mood = 'anxious'
  else if (['sad', 'depressed', 'hopeless', 'crying', 'grief', 'lonely'].some(k => lower.includes(k))) mood = 'sad'
  else if (['angry', 'furious', 'frustrated', 'mad', 'hate'].some(k => lower.includes(k))) mood = 'angry'
  else if (['confused', 'stuck', 'unsure', 'uncertain'].some(k => lower.includes(k))) mood = 'confused'
  else if (['overwhelmed', 'exhausted', 'burnt out', 'too much'].some(k => lower.includes(k))) mood = 'overwhelmed'

  // Try to get wisdom from the full 701-verse corpus
  const wisdom = selectWisdom(mood, 'general')
  if (wisdom) {
    return {
      response: `${wisdom.psychological_insight} What's happening for you right now?`,
      verse: { ref: `BG ${wisdom.verse_ref}`, english: wisdom.english },
    }
  }

  // Static fallback
  return {
    response: STATIC_FALLBACKS[Math.floor(Math.random() * STATIC_FALLBACKS.length)],
    verse: null,
  }
}

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

        // Check if backend returned an error status (e.g., quota exceeded)
        if (data.status === 'error' && data.error_code === 'quota_exceeded') {
          return NextResponse.json(
            {
              success: false,
              error: data.response || 'Quota exceeded',
              detail: {
                error: 'quota_exceeded',
                message: data.response,
                upgrade_url: data.upgrade_url || '/pricing',
              },
            },
            { status: 429 }
          )
        }

        return NextResponse.json({
          success: true,
          response: data.response || data.message,
          summary: data.summary || null,
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

    // Use dynamic fallback from 701-verse Wisdom Core when backend is unavailable
    const fallback = buildDynamicFallback(sanitizedMessage)

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
    const fallback = buildDynamicFallback('')
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
