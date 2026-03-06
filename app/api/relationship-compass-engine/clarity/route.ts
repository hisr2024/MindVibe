import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'
const REQUEST_TIMEOUT = 60000

/**
 * Gita-grounded fallback response when backend is unavailable.
 * All wisdom derived from Bhagavad Gita, presented in modern feeling-rich language.
 */
const FALLBACK_RESPONSE = {
  response: `Mode: Conflict

## Step 1: Pause Before Reacting
Right now, part of you wants to react — to send a long message defending yourself, point out everything they did wrong, or call someone to vent. Pause. You feel distressed — and that feeling is real and valid. Name it. Sit with it for a moment. The Gita teaches (BG 2.56): "One whose mind is not shaken by adversity, who is free from attachment, fear, and anger — such a person is called a sage of steady wisdom." The disturbance is inside you, and recognizing that isn't weakness — it IS the practice. That pause alone prevents 80% of the damage.

## Step 2: Identify the Attachment
You were attached to a specific outcome — to how they SHOULD have responded, to what they SHOULD have understood. The pain lives in the gap between what you hoped for and what you got. The Gita reveals (BG 2.62-63): from contemplation of sense objects arises attachment, from attachment springs desire, from desire comes anger, from anger arises delusion. The EVENT was what happened. The STORY your mind created is the interpretation, the fear, the meaning-making. Separate the two.

## Step 3: Regulate Before You Communicate
Write what you want to say. Don't send it. Wait 2 hours. Reread it. Rewrite from a place of calm. Go for a short walk. Breathe slowly. The Gita teaches (BG 6.35): "The mind is restless, but it can be controlled by practice and detachment." Do NOT text while your chest is still tight. Respond only when your nervous system is settled — not when you've rehearsed the perfect comeback.

## Step 4: Speak Without Demanding an Outcome
Instead of: "You always do this. You don't care." Try: "When [specific thing] happened, I felt [specific emotion]. I value this relationship, so I wanted to share that honestly. I'm not looking for you to fix it or defend yourself — I just need you to know where I'm at." The Gita teaches (BG 2.47): "You have the right to perform your duty, but not to the fruits of action." You are doing your duty — honesty. You release the fruit — their reaction.

## Step 5: See Their Humanity
Instead of assuming they were trying to hurt you, consider: Maybe they're stressed. Maybe they're carrying something you can't see. The Gita teaches (BG 6.29): "One who sees all beings in the Self and the Self in all beings never shrinks from anything." Equal vision doesn't mean excusing the behavior — it means you don't reduce a whole person to one moment. Hold space for their complexity while protecting your own peace.

## What This Looks Like in Practice
"Hey, I realized I reacted internally because I had expectations. I value our relationship, so I wanted to say I felt [emotion] when [event]. No blame — I just wanted to be open. I'm good, and I hope we can stay steady with each other."

## The Real Test
The real practice begins after you act. If they reply coldly — can you stay peaceful? If they don't reply at all — can you stay steady? If they misunderstand — can you resist the urge to over-explain? THAT is the real test. The Gita's standard: You don't suppress emotions. You don't explode emotions. You observe them. You act from clarity. You surrender the result.`,
  sections: {
    'Step 1: Pause Before Reacting': 'Right now, part of you wants to react. Pause. The Gita teaches (BG 2.56): "One whose mind is not shaken by adversity — such a person is called a sage of steady wisdom." The disturbance is inside you, and recognizing that isn\'t weakness — it IS the practice.',
    'Step 2: Identify the Attachment': 'You were attached to a specific outcome — to how they SHOULD have responded. The Gita reveals (BG 2.62-63): from attachment springs desire, from desire comes anger, from anger arises delusion. Separate the EVENT from the STORY your mind created.',
    'Step 3: Regulate Before You Communicate': 'Write what you want to say. Don\'t send it. Wait 2 hours. The Gita teaches (BG 6.35): "The mind is restless, but it can be controlled by practice and detachment." Respond only when your nervous system is settled.',
    'Step 4: Speak Without Demanding an Outcome': 'The Gita teaches (BG 2.47): "You have the right to perform your duty, but not to the fruits of action." Share your experience honestly. Release their reaction.',
    'Step 5: See Their Humanity': 'The Gita teaches (BG 6.29): "One who sees all beings in the Self and the Self in all beings never shrinks from anything." Equal vision means not reducing a whole person to one moment.',
    'What This Looks Like in Practice': '"Hey, I realized I reacted internally because I had expectations. I value our relationship, so I wanted to say I felt [emotion] when [event]. No blame — I just wanted to be open."',
    'The Real Test': 'If they reply coldly — can you stay peaceful? If they don\'t reply — can you stay steady? That is the real test. You observe emotions. You act from clarity. You surrender the result.',
  },
  analysis: {
    mode: 'conflict',
    primary_emotion: 'distressed',
    secondary_emotions: [],
    emotional_intensity: 'moderate',
    mechanism: 'unmet_expectation',
    mechanism_detail: 'Pain from the gap between heartfelt expectation and reality — attachment to outcome (BG 2.62-63).',
    power_dynamic: 'unknown',
    boundary_needed: false,
    safety_concern: false,
    pattern_identified: null,
    user_contribution: '',
    core_need: '',
    confidence: 0.3,
    analysis_depth: 'fallback',
  },
  wisdom: {
    verse_citations: [
      { ref: 'BG 2.56', teaching: 'Steady wisdom — unmoved by adversity' },
      { ref: 'BG 2.62-63', teaching: 'Chain: attachment → desire → anger → delusion' },
      { ref: 'BG 6.35', teaching: 'Mind controlled by practice and detachment' },
      { ref: 'BG 2.47', teaching: 'Right to action, not to fruits' },
      { ref: 'BG 6.29', teaching: 'Equal vision — seeing Self in all beings' },
    ],
    principle_citations: [],
    verses_used: 5,
    principles_used: 0,
    corpus_size: 701,
    gita_grounded: true,
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
        headers: proxyHeaders(request, 'POST'),
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
