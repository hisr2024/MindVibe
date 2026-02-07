/**
 * Karma Reset KIAAN Generate API Route
 * Proxies karma reset requests to the backend KIAAN service
 * Handles CORS, error fallbacks, retry logic, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableError(status: number): boolean {
  return status === 502 || status === 503 || status === 504
}

// Fallback responses for different repair types
const FALLBACK_RESPONSES: Record<string, {
  reset_guidance: {
    breathingLine: string
    rippleSummary: string
    repairAction: string
    forwardIntention: string
  }
  kiaan_metadata: {
    provider: string
    model: string
    fallback: boolean
  }
}> = {
  apology: {
    reset_guidance: {
      breathingLine: "Take four slow breaths. With each exhale, release tension and judgment. Let your breath soften your heart.",
      rippleSummary: "You experienced a moment that created a ripple in your relationship. This happens to everyone—what matters is how we respond.",
      repairAction: "When you're ready, offer a sincere apology. Acknowledge what happened without making excuses. Simply say: 'I'm sorry for what happened. I value our relationship and want to do better.'",
      forwardIntention: "Moving forward, pause before reacting. Remember that your words carry weight, and kindness is always a choice."
    },
    kiaan_metadata: {
      provider: 'fallback',
      model: 'static',
      fallback: true
    }
  },
  clarification: {
    reset_guidance: {
      breathingLine: "Breathe deeply three times. Clear communication begins with inner calm. Let each breath bring clarity.",
      rippleSummary: "A misunderstanding created distance. This is an opportunity to bridge the gap with thoughtful words.",
      repairAction: "Gently clarify your intention: 'I realize what I said may have come across differently than I meant. What I was trying to express was...' Then listen openly to their perspective.",
      forwardIntention: "Practice speaking with both clarity and compassion. Before important conversations, take a moment to center yourself."
    },
    kiaan_metadata: {
      provider: 'fallback',
      model: 'static',
      fallback: true
    }
  },
  calm_followup: {
    reset_guidance: {
      breathingLine: "Take a centering breath. Calm is not the absence of emotion—it's the presence of peace alongside it.",
      rippleSummary: "A tense moment left some residue. This is natural, and it can be released through mindful reconnection.",
      repairAction: "Return to the person with warmth. You might say: 'I've been thinking about our conversation. I want to make sure we're okay. How are you feeling about things?'",
      forwardIntention: "Practice responding rather than reacting. When you feel tension rising, pause, breathe, and choose your response with intention."
    },
    kiaan_metadata: {
      provider: 'fallback',
      model: 'static',
      fallback: true
    }
  }
}

interface KarmaResetRequest {
  situation: string
  feeling: string
  repair_type: 'apology' | 'clarification' | 'calm_followup'
}

export async function POST(request: NextRequest) {
  try {
    const body: KarmaResetRequest = await request.json()
    const { situation, feeling, repair_type } = body

    // Validate input
    if (!situation || typeof situation !== 'string') {
      return NextResponse.json(
        { error: 'situation is required', detail: 'Please describe the situation' },
        { status: 400 }
      )
    }

    if (!feeling || typeof feeling !== 'string') {
      return NextResponse.json(
        { error: 'feeling is required', detail: 'Please describe how the other person felt' },
        { status: 400 }
      )
    }

    const validRepairTypes = ['apology', 'clarification', 'calm_followup']
    if (!repair_type || !validRepairTypes.includes(repair_type)) {
      return NextResponse.json(
        { error: 'invalid repair_type', detail: 'repair_type must be apology, clarification, or calm_followup' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedSituation = situation.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 2000)
    const sanitizedFeeling = feeling.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, 500)

    // Build headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    })

    // Forward auth headers
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      headers.set('Authorization', authHeader)
    }

    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader)
    }

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1)
        await sleep(backoffMs)
      }

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout for AI

        const response = await fetch(`${BACKEND_URL}/api/karma-reset/kiaan/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            situation: sanitizedSituation,
            feeling: sanitizedFeeling,
            repair_type,
          }),
          signal: controller.signal,
          cache: 'no-store',
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({
            reset_guidance: data.reset_guidance,
            kiaan_metadata: data.kiaan_metadata || {
              provider: data.provider || 'kiaan',
              model: data.model || 'unknown',
              fallback: false
            },
            _meta: data._meta,
          })
        }

        // Check for retryable errors
        if (isRetryableError(response.status) && attempt < MAX_RETRIES) {
          console.warn(`[karma-reset/generate] Retryable error ${response.status}, will retry...`)
          continue
        }

        // Log non-retryable errors
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`[karma-reset/generate] Backend returned ${response.status}: ${errorText}`)

        // Rate limiting
        if (response.status === 429) {
          return NextResponse.json(
            {
              error: 'rate_limited',
              message: 'Too many requests. Please wait a moment and try again.',
            },
            { status: 429 }
          )
        }

        // Auth errors - don't use fallback
        if (response.status === 401) {
          return NextResponse.json(
            {
              error: 'authentication_required',
              message: 'Please log in to use Karma Reset',
            },
            { status: 401 }
          )
        }

      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(`[karma-reset/generate] Request timeout on attempt ${attempt + 1}`)
            if (attempt < MAX_RETRIES) continue
          } else {
            console.warn(`[karma-reset/generate] Network error on attempt ${attempt + 1}:`, error.message)
            if (attempt < MAX_RETRIES) continue
          }
        }
      }
    }

    // All retries failed - use fallback response
    console.warn('[karma-reset/generate] All retries exhausted, using fallback response')
    const fallback = FALLBACK_RESPONSES[repair_type] || FALLBACK_RESPONSES.apology
    return NextResponse.json({
      ...fallback,
      _offline: true,
    })

  } catch (error) {
    console.error('[karma-reset/generate] Error:', error)

    // Return a fallback response
    return NextResponse.json({
      ...FALLBACK_RESPONSES.apology,
      _offline: true,
      _error: 'An unexpected error occurred'
    })
  }
}
