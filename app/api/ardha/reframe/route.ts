/**
 * Ardha Reframe API Route
 * Proxies reframing requests to the backend Ardha service
 * Handles CORS, error fallbacks, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Fallback response when backend is unavailable
const FALLBACK_RESPONSE = {
  status: 'success',
  reframe_guidance: {
    recognition: "You're experiencing difficult thoughts right now. That weight is real and valid.",
    deep_insight: "Thoughts are not facts - they are passing clouds in the sky of awareness. Your true self observes them without being defined by them.",
    reframe: "This challenge is an opportunity for growth. Each difficulty builds the inner strength that leads to lasting peace.",
    small_action_step: "Take three deep breaths, then choose one small action that aligns with your values today.",
  },
  gita_verses_used: 0,
  _offline: true,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { negative_thought } = body

    if (!negative_thought || typeof negative_thought !== 'string') {
      return NextResponse.json(
        { error: 'negative_thought is required' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedThought = negative_thought
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    try {
      // Call the backend Ardha endpoint
      const response = await fetch(`${BACKEND_URL}/api/ardha/reframe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          negative_thought: sanitizedThought,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          status: data.status || 'success',
          reframe_guidance: data.reframe_guidance,
          gita_verses_used: data.gita_verses_used || 0,
          raw_text: data.raw_text,
          model: data.model,
          provider: data.provider || 'ardha',
        })
      }

      // Log the error for debugging
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[Ardha API] Backend returned ${response.status}: ${errorText}`)

      // If rate limited, return appropriate error
      if (response.status === 429) {
        return NextResponse.json(
          {
            error: 'Too many requests. Please wait a moment and try again.',
            status: 'error',
          },
          { status: 429 }
        )
      }

      // For other errors, fall through to fallback
    } catch (backendError) {
      console.warn('[Ardha API] Backend connection failed:', backendError)
    }

    // Use fallback response when backend is unavailable
    return NextResponse.json(FALLBACK_RESPONSE)
  } catch (error) {
    console.error('[Ardha API] Error:', error)

    // Always return a helpful response
    return NextResponse.json(FALLBACK_RESPONSE)
  }
}

// Health check for the Ardha endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ardha-reframe',
    timestamp: new Date().toISOString(),
  })
}
