/**
 * Viyoga Detach API Route
 * Proxies detachment requests to the backend Viyoga service
 * Handles CORS, error fallbacks, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

// Fallback response when backend is unavailable
const FALLBACK_RESPONSE = {
  status: 'success',
  detachment_guidance: {
    validation: "Your concern about outcomes is understandable. The weight of expectations can feel heavy.",
    attachment_check: "Notice how your mind is focused on results rather than the process of action itself.",
    detachment_principle: "Your responsibility is to act with full effort and intention, then release attachment to results. What is meant to come will come through right action.",
    one_action: "Take one small step today with complete focus, letting go of how it will be received.",
  },
  gita_verses_used: 0,
  _offline: true,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { outcome_worry } = body

    if (!outcome_worry || typeof outcome_worry !== 'string') {
      return NextResponse.json(
        { error: 'outcome_worry is required' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedWorry = outcome_worry
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 2000)

    try {
      // Call the backend Viyoga endpoint
      const response = await fetch(`${BACKEND_URL}/api/viyoga/detach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          outcome_worry: sanitizedWorry,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          status: data.status || 'success',
          detachment_guidance: data.detachment_guidance,
          gita_verses_used: data.gita_verses_used || 0,
          raw_text: data.raw_text,
          model: data.model,
          provider: data.provider || 'viyoga',
        })
      }

      // Log the error for debugging
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[Viyoga API] Backend returned ${response.status}: ${errorText}`)

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
      console.warn('[Viyoga API] Backend connection failed:', backendError)
    }

    // Use fallback response when backend is unavailable
    return NextResponse.json(FALLBACK_RESPONSE)
  } catch (error) {
    console.error('[Viyoga API] Error:', error)

    // Always return a helpful response
    return NextResponse.json(FALLBACK_RESPONSE)
  }
}

// Health check for the Viyoga endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'viyoga-detach',
    timestamp: new Date().toISOString(),
  })
}
