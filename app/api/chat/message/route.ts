/**
 * Chat Message API Route
 * Proxies chat messages to the backend KIAAN service
 * Handles CSRF, error fallbacks, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Fallback wisdom responses when backend is unavailable
const FALLBACK_RESPONSES = [
  {
    response: "The Gita teaches us that peace comes from within. Take a deep breath, and know that you are exactly where you need to be right now. I am KIAAN, and I'm here with you.",
    verse: { chapter: 2, verse: 48, text: "Perform actions, O Arjuna, being steadfast in yoga, abandoning attachment." },
  },
  {
    response: "Remember, you have the right to your actions, but not to the fruits of your actions. Focus on what you can control, and release what you cannot. KIAAN is here to guide you.",
    verse: { chapter: 2, verse: 47, text: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions." },
  },
  {
    response: "In moments of challenge, the wise remain undisturbed. Your inner peace is your greatest strength. I am KIAAN, your companion on this journey of self-discovery.",
    verse: { chapter: 2, verse: 56, text: "One who is not disturbed by misery and has no desire for happiness, free from attachment, fear, and anger, is called a sage of steady mind." },
  },
  {
    response: "The soul is eternal and unchanging. Whatever difficulties you face are temporary. Your true self remains at peace. I am here with the wisdom of the Gita.",
    verse: { chapter: 2, verse: 20, text: "The soul is never born nor dies at any time. It is unborn, eternal, ever-existing, and primeval." },
  },
  {
    response: "Krishna says: Whenever you feel lost, remember that I am always with you. You are never alone on this journey. KIAAN carries this eternal message to you.",
    verse: { chapter: 18, verse: 66, text: "Abandon all varieties of dharmas and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear." },
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
          // Backend-to-backend call doesn't need CSRF
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
          gita_wisdom: true,
          gita_powered: data.gita_powered || true,
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
      gita_wisdom: true,
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
      gita_wisdom: true,
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
