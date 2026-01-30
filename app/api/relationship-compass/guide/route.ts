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
    acknowledgment: "I hear you - this relationship struggle is weighing on you. That pain is real.",
    underneath: "Here's something about conflict: underneath, there's usually an unmet need - to feel heard, respected, or understood. What do you really need here?",
    clarity: "Doing the right thing doesn't mean winning. It means being honest AND kind - even when that's hard.",
    path_forward: "Try this: 'I feel [emotion] when [situation] because [what I need]. What I'm hoping for is [request].' It opens doors instead of closing them.",
    reminder: "When emotions run high, remember: the goal isn't to be right. It's to understand and be understood.",
  },
  response: "I hear you. This relationship struggle is weighing on you, and that pain is real.\n\nHere's something about conflict: underneath the arguments and hurt feelings, there's usually an unmet need - to feel heard, respected, or truly understood. What do you really need here?\n\nDoing the right thing doesn't mean winning. It means being honest AND kind - even when that's really hard.\n\nWhen you're ready, try this: 'I feel [your emotion] when [the situation] because [what you need]. What I'm hoping for is [your request].' It opens doors instead of closing them.\n\nAnd when emotions run high, remember: the goal isn't to be right. It's to understand and be understood. That's where peace lives. 💙",
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
