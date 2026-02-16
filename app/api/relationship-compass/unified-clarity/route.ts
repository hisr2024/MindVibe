/**
 * Unified Relationship Compass API Route - Secular Wisdom Core + OpenAI.
 *
 * Proxies to the backend /api/relationship-compass/unified-clarity endpoint.
 * Includes a wisdom-enhanced fallback response for when the backend is unavailable.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT = 60000

/**
 * Wisdom-enhanced fallback response.
 * Uses principle-based insight instead of generic advice.
 */
const FALLBACK_RESPONSE = {
  response: `Mode: Conflict

## Emotional Precision
Something important has been crossed in this relationship. The intensity you're feeling — whether it's frustration, hurt, or something harder to name — is your system flagging that a core need isn't being met. That's not overreacting. That's information.

## What's Really Going On
There's likely a gap between what you expected from this person and what you're actually getting. That gap is where the pain lives. It could be an unmet expectation, an attachment response, or a pattern that keeps repeating. The surface-level conflict is rarely the actual issue — underneath is usually a need for respect, safety, or recognition that isn't being addressed.

## The Deeper Insight
There's a principle worth considering: you control how you show up — you do not control their response. Investing energy in managing their reaction is energy stolen from your own clarity. And strong emotions signal what matters, not what to do. The pause between feeling and action is where your actual power lives.

## The Hard Truth
You cannot solve this by thinking harder about it. At some point, clarity comes from action, not analysis. The question isn't "What's the perfect thing to say?" — it's "What would I do if I respected myself enough to be honest?"

## What To Do
Before your next interaction, take 90 seconds to let the cortisol surge pass. Then ask yourself one question: "What do I actually need here?" Lead with that need, not the complaint. Not "You always do X" — but "I need Y. Can we talk about that?"

## Script
"I want to talk about something that matters to me. When [specific event] happened, I felt [specific emotion]. What I actually need is [specific need]. I'm not trying to win an argument — I want us to understand each other."`,
  sections: {
    'Emotional Precision': 'Something important has been crossed in this relationship. The intensity you\'re feeling — whether it\'s frustration, hurt, or something harder to name — is your system flagging that a core need isn\'t being met. That\'s not overreacting. That\'s information.',
    "What's Really Going On": 'There\'s likely a gap between what you expected from this person and what you\'re actually getting. That gap is where the pain lives. It could be an unmet expectation, an attachment response, or a pattern that keeps repeating. The surface-level conflict is rarely the actual issue — underneath is usually a need for respect, safety, or recognition.',
    'The Deeper Insight': 'There\'s a principle worth considering: you control how you show up — you do not control their response. Investing energy in managing their reaction is energy stolen from your own clarity. And strong emotions signal what matters, not what to do. The pause between feeling and action is where your actual power lives.',
    'The Hard Truth': 'You cannot solve this by thinking harder about it. At some point, clarity comes from action, not analysis. The question isn\'t "What\'s the perfect thing to say?" — it\'s "What would I do if I respected myself enough to be honest?"',
    'What To Do': 'Before your next interaction, take 90 seconds to let the cortisol surge pass. Then ask yourself one question: "What do I actually need here?" Lead with that need, not the complaint.',
    'Script': '"I want to talk about something that matters to me. When [specific event] happened, I felt [specific emotion]. What I actually need is [specific need]. I\'m not trying to win an argument — I want us to understand each other."',
  },
  analysis: {
    mode: 'conflict',
    primary_emotion: 'distressed',
    secondary_emotions: [],
    emotional_intensity: 'moderate',
    mechanism: 'unmet_expectation',
    mechanism_detail: 'A gap exists between expectation and reality.',
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
  model: 'wisdom_enhanced_static',
  latency_ms: 0,
  wisdom_metadata: {
    total_sources: 2,
    total_corpus_verses: 701,
    corpus_chapters: 18,
    principles_used: 2,
    static_verses_matched: 0,
    dynamic_verses_found: 0,
    learned_wisdom_found: 0,
    wisdom_confidence: 0.2,
    principles: [
      {
        id: 'P01',
        principle: 'Focus on your actions, not their response',
        explanation: 'You control how you show up. You do not control their reaction.',
      },
      {
        id: 'P02',
        principle: 'Strong emotions signal what matters, not what to do',
        explanation: 'Anger, hurt, fear: these flag that something important is at stake. But acting from the emotion itself usually makes things worse.',
      },
    ],
    top_verses: [],
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    const relationshipType = typeof body.relationshipType === 'string' ? body.relationshipType.trim() : 'romantic'
    const includeWisdomSources = body.includeWisdomSources !== false

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'message and sessionId are required' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      const response = await fetch(`${BACKEND_URL}/api/relationship-compass/unified-clarity`, {
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
          includeWisdomSources,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`[Unified Compass] Backend returned ${response.status}: ${errorText}`)
        return NextResponse.json(FALLBACK_RESPONSE)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (backendError) {
      clearTimeout(timeoutId)
      if (backendError instanceof Error && backendError.name === 'AbortError') {
        console.warn('[Unified Compass] Request timeout')
      } else {
        console.warn('[Unified Compass] Backend unavailable:', backendError)
      }
      return NextResponse.json(FALLBACK_RESPONSE)
    }
  } catch (error) {
    console.error('[Unified Compass] Route error:', error)
    return NextResponse.json(FALLBACK_RESPONSE)
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'relationship-compass-unified',
    version: '5.0',
    features: [
      'full_corpus_700_verses',
      'wisdom_core_integration',
      'static_principles',
      'dynamic_gita_retrieval',
      'learned_wisdom',
      'openai_synthesis',
      'secular_framing',
      'mode_detection',
      'mechanism_analysis',
    ],
    timestamp: new Date().toISOString(),
  })
}
