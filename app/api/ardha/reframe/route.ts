/**
 * Ardha Reframe API Route
 * Proxies reframing requests to the backend Ardha service
 * Handles CORS, error fallbacks, and response formatting
 *
 * Supports three depths:
 * - quick: Fast reframe
 * - deep: Comprehensive reframing
 * - quantum: Multi-dimensional reframing
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Valid depth modes
type DepthMode = 'quick' | 'deep' | 'quantum'

const FALLBACK_RESPONSE = `Sacred Witnessing
I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.
Anatomy of the Thought
I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.
Gita Core Reframe
I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.
Stabilizing Awareness
I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.
One Grounded Reframe
I don’t yet have the relevant Gita wisdom in my repository context. Let me retrieve it.
One Small Action
Take one slow breath and wait for the Gita context to load.
One Question
Would you like me to retrieve more Gita wisdom for this?`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { thought, depth: requestedDepth, sessionId } = body

    if (!thought || typeof thought !== 'string') {
      return NextResponse.json(
        { error: 'thought is required' },
        { status: 400 }
      )
    }

    // Validate and sanitize depth
    const validDepths: DepthMode[] = ['quick', 'deep', 'quantum']
    const depth: DepthMode = validDepths.includes(requestedDepth)
      ? requestedDepth
      : 'quick'

    // Sanitize input
    const sanitizedThought = thought
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    try {
      // Call the backend Ardha endpoint with analysis mode
      const response = await fetch(`${BACKEND_URL}/api/ardha/reframe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          thought: sanitizedThought,
          depth,
          sessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          response: data.response || '',
          sources: data.sources || [],
          depth,
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
    return NextResponse.json({ response: FALLBACK_RESPONSE, sources: [], depth })
  } catch (error) {
    console.error('[Ardha API] Error:', error)

    // Always return a helpful response
    return NextResponse.json({ response: FALLBACK_RESPONSE, sources: [], depth: 'quick' })
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
