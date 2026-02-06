/**
 * Voice Query API Route
 * Handles voice queries to KIAAN with Gita wisdom integration
 * Returns both text response and optional audio
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Fallback wisdom responses when backend is unavailable
const FALLBACK_RESPONSES = [
  {
    response: "The Gita teaches us that peace comes from within. Take a deep breath, and know that you are exactly where you need to be right now.",
    verse: { chapter: 2, verse: 48, text: "Perform actions, O Arjuna, being steadfast in yoga, abandoning attachment." },
  },
  {
    response: "Remember, you have the right to your actions, but not to the fruits of your actions. Focus on what you can control, and release what you cannot.",
    verse: { chapter: 2, verse: 47, text: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions." },
  },
  {
    response: "In moments of challenge, the wise remain undisturbed. Your inner peace is your greatest strength. KIAAN is here with you.",
    verse: { chapter: 2, verse: 56, text: "One who is not disturbed by misery and has no desire for happiness, free from attachment, fear, and anger, is called a sage of steady mind." },
  },
  {
    response: "The soul is eternal and unchanging. Whatever difficulties you face are temporary. Your true self remains at peace.",
    verse: { chapter: 2, verse: 20, text: "The soul is never born nor dies at any time. It is unborn, eternal, ever-existing, and primeval." },
  },
  {
    response: "Krishna says: Whenever you feel lost, remember that I am always with you. You are never alone on this journey.",
    verse: { chapter: 18, verse: 66, text: "Abandon all varieties of dharmas and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear." },
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, language = 'en', include_audio = false, context = 'voice' } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query text is required' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedQuery = query
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    // Forward auth headers from client to backend
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
    const authToken = request.headers.get('authorization')
    if (authToken) authHeaders['Authorization'] = authToken

    try {
      // Try enhanced voice query endpoint first
      const response = await fetch(`${BACKEND_URL}/api/voice/query/enhanced`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          query: sanitizedQuery,
          language,
          include_audio,
          context,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          success: true,
          response: data.response || data.text,
          verse: data.verse,
          emotion: data.detected_emotion,
          audio_url: data.audio_url,
          gita_wisdom: true,
        })
      }

      // Try regular chat endpoint as fallback
      const chatResponse = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          message: sanitizedQuery,
          language,
          context: 'voice',
        }),
      })

      if (chatResponse.ok) {
        const chatData = await chatResponse.json()
        return NextResponse.json({
          success: true,
          response: chatData.response || chatData.message,
          gita_wisdom: true,
        })
      }
    } catch (backendError) {
      console.warn('[Voice Query] Backend failed, using fallback:', backendError)
    }

    // Use fallback response
    const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]

    return NextResponse.json({
      success: true,
      response: fallback.response,
      verse: fallback.verse,
      gita_wisdom: true,
      _offline: true,
    })
  } catch (error) {
    console.error('[Voice Query] Error:', error)

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
