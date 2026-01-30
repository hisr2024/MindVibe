/**
 * Relationship Compass Guide API Route
 * Proxies relationship guidance requests to the backend KIAAN-powered service
 * Part of the KIAAN AI Ecosystem
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Fallback response when backend is unavailable
const FALLBACK_RESPONSE = {
  status: 'success',
  compass_guidance: {
    acknowledgment: "I sense the weight of this relationship challenge you're carrying.",
    ego_check: "In moments of conflict, the ego seeks to win. But true strength lies in understanding.",
    values_identification: "Consider what matters most to you: respect, honesty, peace, connection.",
    right_action: "Right action (dharma) in relationships means being honest while remaining kind.",
    detachment_suggestion: "Release the need to be right. Focus on being present and compassionate.",
    compassion_perspective: "The other person is also struggling in their own way. See their humanity.",
    communication_pattern: "Try: 'I feel... when... because... I need...' This invites dialogue, not defense.",
    next_step: "Before responding, take three breaths and ask yourself: 'What would love do here?'",
  },
  response: "Take a gentle breath with me... I hear the weight of this relationship challenge you're carrying. In moments of conflict, our ego often wants to win, to be right. But true strength in relationships comes not from winning, but from understanding.\n\nConsider what truly matters to you here: respect, honesty, peace, or connection? Right action (dharma) in relationships means having the courage to be honest while remaining kind.\n\nRelease the need to be right. The other person is also struggling in their own way - can you see the shared humanity beneath the conflict?\n\nBefore responding, take three breaths and ask yourself: 'What would love do here?' 💙",
  gita_verses_used: 0,
  _offline: true,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conflict } = body

    if (!conflict || typeof conflict !== 'string') {
      return NextResponse.json(
        { error: 'conflict is required' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedConflict = conflict
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    try {
      // Call the backend Relationship Compass endpoint
      const response = await fetch(`${BACKEND_URL}/api/relationship-compass/guide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          conflict: sanitizedConflict,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          status: data.status || 'success',
          compass_guidance: data.compass_guidance,
          response: data.response,
          gita_verses_used: data.gita_verses_used || 0,
          model: data.model,
          provider: data.provider || 'kiaan',
        })
      }

      // Log the error for debugging
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[Relationship Compass API] Backend returned ${response.status}: ${errorText}`)

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
      console.warn('[Relationship Compass API] Backend connection failed:', backendError)
    }

    // Use fallback response when backend is unavailable
    return NextResponse.json(FALLBACK_RESPONSE)
  } catch (error) {
    console.error('[Relationship Compass API] Error:', error)

    // Always return a helpful response
    return NextResponse.json(FALLBACK_RESPONSE)
  }
}

// Health check for the Relationship Compass endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'relationship-compass',
    provider: 'kiaan',
    ecosystem: 'KIAAN AI',
    timestamp: new Date().toISOString(),
  })
}
