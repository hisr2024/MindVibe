import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'
const REQUEST_TIMEOUT = 60000

/**
 * Gita-grounded fallback response when backend is unavailable.
 * All wisdom derived from Bhagavad Gita, presented in modern feeling-rich language.
 */
const FALLBACK_RESPONSE = {
  response: `Mode: Conflict

## Emotional Precision
You're hurting — and that hurt runs deeper than the surface of what happened. There's a tightness in your chest, a weight that won't lift. That emotional intensity isn't a flaw or an overreaction. It's your heart telling you that something genuinely important is at stake here — a need for respect, for understanding, for being truly seen. Let yourself feel it. The emotion is information, and it deserves your attention.

## What's Actually Happening
Beneath this conflict, there's a deeper current at work. Much of our relationship pain comes from attachment — from the gap between what our heart hoped for and what actually happened. You carried an expectation of how they should respond, what they should understand, and when reality fell short of that picture, the pain rushed in. This is one of the most universal human experiences: the suffering that comes from holding tightly to how things should be. The event itself may have been small. But the disappointment of unmet hope — that's enormous.

## The Hard Truth
Here's what's true, even though it's hard to hear: you cannot win an argument and deepen a relationship at the same time. Acting from the need to be right is acting from ego — and ego never leads to peace. The real question isn't "Who's right?" It's "What do I actually need here, and can I ask for it without needing to defeat them first?" That shift — from winning to understanding — is where healing begins.

## What To Do
Before your next interaction, give yourself the gift of a pause. Let the emotional storm pass through you — even 90 seconds of conscious breathing changes your entire inner landscape. When the mind is turbulent, wisdom can't reach you. Then ask yourself one honest question: "What do I actually NEED here?" Lead with that need, not the complaint. Instead of "You never listen," try "I need to feel heard right now. Can you just listen, without trying to fix it?" That vulnerable honesty changes everything.

## Script
"Hey, I want to talk about what happened — and I want us both to be in a good place for it. Here's what I experienced: [specific event]. What I felt in that moment was [emotion]. And what I really need underneath all of it is [need]. I'm not bringing this up to blame you or to win. I'm bringing it up because this relationship matters to me, and I want us to understand each other."`,
  sections: {
    'Emotional Precision': "You're hurting — and that hurt runs deeper than the surface of what happened. That emotional intensity isn't a flaw. It's your heart telling you that something genuinely important is at stake — a need for respect, for understanding, for being truly seen. Let yourself feel it.",
    "What's Actually Happening": "Beneath this conflict, there's a deeper current at work. Much of our relationship pain comes from attachment — from the gap between what our heart hoped for and what actually happened. The suffering comes from holding tightly to how things should be.",
    'The Hard Truth': 'You cannot win an argument and deepen a relationship at the same time. Acting from the need to be right is acting from ego — and ego never leads to peace. The real question isn\'t "Who\'s right?" — it\'s "What do I actually need, and can I ask for it without defeating them first?"',
    'What To Do': 'Give yourself the gift of a pause. Let the emotional storm pass through you. Then ask: "What do I actually NEED here?" Lead with that need, not the complaint. Instead of "You never listen," try "I need to feel heard right now."',
    'Script': '"Hey, I want to talk about what happened. Here\'s what I experienced: [event]. What I felt was [emotion]. What I really need is [need]. I\'m not bringing this up to blame you — I\'m bringing it up because this relationship matters to me."',
  },
  analysis: {
    mode: 'conflict',
    primary_emotion: 'distressed',
    secondary_emotions: [],
    emotional_intensity: 'moderate',
    mechanism: 'unmet_expectation',
    mechanism_detail: 'Pain from the gap between heartfelt expectation and reality — attachment to outcome.',
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
  model: 'gita_wisdom_static',
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
        headers: proxyHeaders(request),
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
        return forwardCookies(response, NextResponse.json(FALLBACK_RESPONSE))
      }

      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
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
