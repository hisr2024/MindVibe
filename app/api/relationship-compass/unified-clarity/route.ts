/**
 * Unified Relationship Compass API Route - Secular Wisdom Core + OpenAI.
 *
 * Proxies to the backend /api/relationship-compass/unified-clarity endpoint.
 * Includes a wisdom-enhanced fallback response for when the backend is unavailable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'
const REQUEST_TIMEOUT = 60000

/**
 * Gita-grounded wisdom-enhanced fallback response.
 * All wisdom derived from Bhagavad Gita, presented in modern feeling-rich language.
 */
const FALLBACK_RESPONSE = {
  response: `Mode: Conflict

## Emotional Precision
Something important has been crossed in this relationship — and you can feel it in your body, in the tightness of your chest, in the way your mind keeps circling back to what happened. The intensity you're feeling — whether it's frustration, hurt, or something harder to name — isn't overreacting. It's your heart telling you that something you deeply value is at stake. A need for respect, for safety, for being truly seen. That feeling deserves to be honored, not dismissed.

## What's Really Going On
Beneath the surface of this conflict, there's likely a deeper current at work. Much of our relationship pain comes from attachment — from holding tightly to how we believe things should be, and suffering when reality doesn't match. You had an image of how they should show up, what they should understand, how they should respond — and the gap between that expectation and what actually happened is where the pain lives. This isn't about being weak or needy. It's about being human enough to care deeply.

## The Deeper Insight
Here's a truth that has guided people through heartbreak for thousands of years: you have complete authority over your own actions — but you have no control over the outcome. Pouring your heart into doing what's right while releasing your grip on how they respond is one of the hardest things a person can do. But it's also where your real freedom lives. Your peace can't be at the mercy of someone else's choices. When you stop trying to manage their reaction and focus entirely on showing up with integrity, something shifts inside you — and often, in the relationship too.

## The Hard Truth
You cannot solve this by thinking harder about it or by replaying the conversation a hundred more times in your head. At some point, clarity comes from action, not analysis. The question isn't "What's the perfect thing to say?" — it's "What would I do if I trusted my own worth enough to be honest?" That question cuts through everything.

## What To Do
Before your next interaction, give yourself the gift of a pause. Let the emotional storm pass through you — even 90 seconds of conscious breathing changes your inner landscape. Then ask yourself one honest question: "What do I actually need here?" Lead with that need, not the complaint. Not "You always do X" — but "I need Y. Can we talk about that?" Speaking from your real need instead of your accumulated frustration changes the entire dynamic.

## Script
"I want to talk about something that's been weighing on my heart. When [specific event] happened, I felt [specific emotion]. What I really need underneath all of it is [specific need]. I'm not bringing this up to fight or to win — I'm bringing it up because this relationship matters to me, and I want us to truly understand each other."`,
  sections: {
    'Emotional Precision': 'Something important has been crossed in this relationship — and you can feel it in your body, in the tightness of your chest, in the way your mind keeps circling back. The intensity you\'re feeling isn\'t overreacting. It\'s your heart telling you that something you deeply value is at stake. That feeling deserves to be honored, not dismissed.',
    "What's Really Going On": 'Beneath the surface, there\'s likely a deeper current at work. Much of our relationship pain comes from attachment — from holding tightly to how we believe things should be, and suffering when reality doesn\'t match. The gap between expectation and what actually happened is where the pain lives. This isn\'t about being weak. It\'s about being human enough to care deeply.',
    'The Deeper Insight': 'You have complete authority over your own actions — but you have no control over the outcome. Pouring your heart into doing what\'s right while releasing your grip on how they respond is where your real freedom lives. Your peace can\'t be at the mercy of someone else\'s choices.',
    'The Hard Truth': 'You cannot solve this by thinking harder about it. Clarity comes from action, not analysis. The question isn\'t "What\'s the perfect thing to say?" — it\'s "What would I do if I trusted my own worth enough to be honest?"',
    'What To Do': 'Before your next interaction, give yourself the gift of a pause. Let the emotional storm pass. Then ask: "What do I actually need here?" Lead with that need, not the complaint.',
    'Script': '"I want to talk about something that\'s been weighing on my heart. When [event] happened, I felt [emotion]. What I really need is [need]. I\'m not bringing this up to fight — I\'m bringing it up because this relationship matters to me."',
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
        principle: 'Pour your heart into right action, release attachment to outcome',
        explanation: 'You have authority over your actions, but not over their results. Your peace lives in doing what is right — not in controlling how others respond. (BG 2.47)',
      },
      {
        id: 'P02',
        principle: 'Strong emotions reveal what matters — equanimity reveals what to do',
        explanation: 'Anger, hurt, fear: these tell you what is at stake. But acting from the emotional storm leads to regret. The pause between feeling and action is where wisdom lives. (BG 2.56)',
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
        headers: proxyHeaders(request, 'POST'),
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
        return forwardCookies(response, NextResponse.json(FALLBACK_RESPONSE))
      }

      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
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
