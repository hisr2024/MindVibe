import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT = 60000

/**
 * Rule-based fallback response when the backend is unavailable.
 * Mirrors the backend's `build_fallback_response` for conflict mode.
 */
const FALLBACK_RESPONSE = {
  response: `Mode: Conflict

## Emotional Precision
You're distressed. That's a real response to a real situation. Name it without judging yourself for it — the emotion is giving you information about what matters to you here.

## What's Actually Happening
There's a gap between what you expected and what you got. You had an image of how this should go — how they should respond, what they should understand — and reality didn't match. The pain lives in that gap, not in the event itself.

## The Hard Truth
You cannot win an argument and deepen a relationship at the same time. If you're optimizing for being right, you're not optimizing for connection. The question isn't "Who's right?" — it's "What do I actually need here, and can I ask for it without needing to defeat them first?"

## What To Do
Before your next interaction, regulate your nervous system first. Take 90 seconds — that's how long it takes for a cortisol surge to pass through. Then ask yourself one question: "What do I actually need here?" Lead with that need, not with the complaint. Instead of "You never listen," try "I need to feel heard right now. Can you listen without fixing?"

## Script
"I want to talk about what happened, but I need us both to be calm for it to go well. Here's what I experienced: [specific event]. What I felt was [emotion]. What I actually need is [need]. I'm not looking to assign blame — I want us to figure this out together."`,
  sections: {
    'Emotional Precision': "You're distressed. That's a real response to a real situation. Name it without judging yourself for it — the emotion is giving you information about what matters to you here.",
    "What's Actually Happening": "There's a gap between what you expected and what you got. You had an image of how this should go — how they should respond, what they should understand — and reality didn't match. The pain lives in that gap, not in the event itself.",
    'The Hard Truth': 'You cannot win an argument and deepen a relationship at the same time. If you\'re optimizing for being right, you\'re not optimizing for connection. The question isn\'t "Who\'s right?" — it\'s "What do I actually need here, and can I ask for it without needing to defeat them first?"',
    'What To Do': 'Before your next interaction, regulate your nervous system first. Take 90 seconds — that\'s how long it takes for a cortisol surge to pass through. Then ask yourself one question: "What do I actually need here?" Lead with that need, not with the complaint.',
    'Script': '"I want to talk about what happened, but I need us both to be calm for it to go well. Here\'s what I experienced: [specific event]. What I felt was [emotion]. What I actually need is [need]. I\'m not looking to assign blame — I want us to figure this out together."',
  },
  analysis: {
    mode: 'conflict',
    primary_emotion: 'distressed',
    secondary_emotions: [],
    emotional_intensity: 'moderate',
    mechanism: 'unmet_expectation',
    mechanism_detail: 'Gap between expected and actual outcome.',
    power_dynamic: 'unknown',
    boundary_needed: false,
    safety_concern: false,
    pattern_identified: null,
    user_contribution: '',
    core_need: '',
    confidence: 0.3,
    analysis_depth: 'fallback',
  },
  provider: 'fallback',
  model: 'static',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    const relationshipType = typeof body.relationshipType === 'string' ? body.relationshipType.trim() : 'romantic'

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'message and sessionId are required' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      const response = await fetch(`${BACKEND_URL}/api/relationship-compass-engine/clarity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          message,
          sessionId,
          relationshipType,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`[Compass Engine] Backend returned ${response.status}: ${errorText}`)
        return NextResponse.json(FALLBACK_RESPONSE)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (backendError) {
      clearTimeout(timeoutId)
      if (backendError instanceof Error && backendError.name === 'AbortError') {
        console.warn('[Compass Engine] Request timeout')
      } else {
        console.warn('[Compass Engine] Backend connection failed:', backendError)
      }
      return NextResponse.json(FALLBACK_RESPONSE)
    }
  } catch (error) {
    console.error('[Compass Engine] Error:', error)
    return NextResponse.json(FALLBACK_RESPONSE)
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'relationship-compass-engine',
    endpoint: 'clarity',
    timestamp: new Date().toISOString(),
  })
}
