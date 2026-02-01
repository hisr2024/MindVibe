/**
 * Ardha Reframe API Route
 * Proxies reframing requests to the backend Ardha service
 * Handles CORS, error handling, and response formatting
 *
 * Supports three depths:
 * - quick: Fast reframe (~30 seconds)
 * - deep: Comprehensive reframing (~1 minute)
 * - quantum: Multi-dimensional reframing (~2 minutes)
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'
const BACKEND_TIMEOUT = 60000 // 60 seconds timeout for AI processing

// Valid depth modes
type DepthMode = 'quick' | 'deep' | 'quantum'

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
      // Call the backend Ardha endpoint with extended timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT)

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
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Parse response
      const data = await response.json().catch(() => ({}))

      if (response.ok && data.response) {
        return NextResponse.json({
          response: data.response,
          sources: data.sources || [],
          depth,
        })
      }

      // Handle specific error codes from backend
      if (response.status === 429) {
        return NextResponse.json(
          {
            error: 'Too many requests. Please wait a moment and try again.',
            status: 'rate_limited',
          },
          { status: 429 }
        )
      }

      if (response.status === 503) {
        console.error('[Ardha API] Backend service unavailable:', data.detail)
        return NextResponse.json(
          {
            error: data.detail || 'AI service is temporarily unavailable. Please try again later.',
            status: 'service_unavailable',
          },
          { status: 503 }
        )
      }

      if (response.status === 400) {
        return NextResponse.json(
          {
            error: data.detail || 'Invalid request. Please check your input.',
            status: 'bad_request',
          },
          { status: 400 }
        )
      }

      // Log unexpected errors
      console.error(`[Ardha API] Backend returned ${response.status}:`, data)

      return NextResponse.json(
        {
          error: data.detail || 'An unexpected error occurred. Please try again.',
          status: 'error',
        },
        { status: response.status || 500 }
      )

    } catch (backendError) {
      // Handle timeout
      if (backendError instanceof Error && backendError.name === 'AbortError') {
        console.error('[Ardha API] Request timeout')
        return NextResponse.json(
          {
            error: 'Request timed out. The AI is taking longer than expected. Please try again.',
            status: 'timeout',
          },
          { status: 504 }
        )
      }

      // Handle network errors
      console.error('[Ardha API] Backend connection failed:', backendError)
      return NextResponse.json(
        {
          error: 'Unable to connect to the AI service. Please check your connection and try again.',
          status: 'connection_error',
        },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('[Ardha API] Error:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        status: 'error',
      },
      { status: 500 }
    )
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
