/**
 * Relationship Compass Guide API Route (Gita-grounded wisdom proxy)
 *
 * Proxies to the backend Relationship Compass Engine which integrates
 * deeply with the full 700+ verse Bhagavad Gita corpus and 20 curated
 * relationship principles. Responses are filtered through the Gita
 * Wisdom Filter to ensure every guidance is grounded in authentic teachings.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'
const REQUEST_TIMEOUT = 60000

const FALLBACK_RESPONSE = {
  response: `## Step 1: Pause Before Reacting
Right now, part of you wants to react — to send a message, to defend yourself, or to shut down entirely. Pause. The Gita teaches (BG 2.56): "One whose mind is not shaken by adversity, who is free from attachment, fear, and anger — such a person is called a sage of steady wisdom." Before you act, let the storm inside settle. Name what you feel. Sit with it for just a moment. That pause alone prevents most of the damage.

## Step 2: Identify the Attachment
Ask yourself honestly: what outcome were you attached to? Were you attached to being valued? To being right? To receiving a specific response? The Gita reveals (BG 2.62-63): from attachment springs desire, from desire comes anger, from anger arises delusion. The pain lives in the gap between what you hoped for and what actually happened. Separate the EVENT from the STORY your mind created about it.

## Step 3: Regulate Before You Communicate
Do not respond while your chest is still tight or your mind is racing. Take 10 slow breaths. Go for a short walk. Write what you want to say — but do not send it yet. Wait until the reactive fire settles. The Gita teaches (BG 6.35): "The mind is restless, but it can be controlled by practice and detachment." Respond from clarity, not from the heat of the moment.

## Step 4: Speak Without Demanding an Outcome
Instead of blaming or demanding, try sharing your experience: "When this happened, I felt this. I value our relationship, so I wanted to share that honestly." Notice the difference — no accusation, no demand. The Gita teaches (BG 2.47): "You have the right to perform your duty, but not to the fruits of action." Do your part — honest, kind communication. Release their reaction.

## Step 5: See Their Humanity
Before assuming the worst about their intentions, consider: maybe they are carrying something you cannot see. Maybe they responded poorly because they were overwhelmed — not because they don't care. The Gita teaches (BG 6.29): "One who sees all beings in the Self and the Self in all beings never shrinks from anything." Equal vision doesn't mean excusing the behavior. It means not reducing a whole person to one moment.`,
  sections: {
    'Step 1: Pause Before Reacting': 'Right now, part of you wants to react — to send a message, to defend yourself, or to shut down entirely. Pause. The Gita teaches (BG 2.56): "One whose mind is not shaken by adversity — such a person is called a sage of steady wisdom." Before you act, let the storm inside settle.',
    'Step 2: Identify the Attachment': 'Ask yourself honestly: what outcome were you attached to? The Gita reveals (BG 2.62-63): from attachment springs desire, from desire comes anger, from anger arises delusion. The pain lives in the gap between what you hoped for and what actually happened.',
    'Step 3: Regulate Before You Communicate': 'Do not respond while your chest is still tight. Take 10 slow breaths. The Gita teaches (BG 6.35): "The mind is restless, but it can be controlled by practice and detachment." Respond from clarity, not from the heat of the moment.',
    'Step 4: Speak Without Demanding an Outcome': 'Instead of blaming, share your experience honestly. The Gita teaches (BG 2.47): "You have the right to perform your duty, but not to the fruits of action." Do your part — honest communication. Release their reaction.',
    'Step 5: See Their Humanity': 'Before assuming the worst, consider: maybe they are carrying something you cannot see. The Gita teaches (BG 6.29): "One who sees all beings in the Self and the Self in all beings never shrinks from anything." Equal vision means not reducing a whole person to one moment.',
  },
  citations: [
    { source_file: 'data/gita/gita_verses_complete.json', reference_if_any: 'BG 2.56', chunk_id: '2.56' },
    { source_file: 'data/gita/gita_verses_complete.json', reference_if_any: 'BG 2.62-63', chunk_id: '2.62' },
    { source_file: 'data/gita/gita_verses_complete.json', reference_if_any: 'BG 6.35', chunk_id: '6.35' },
    { source_file: 'data/gita/gita_verses_complete.json', reference_if_any: 'BG 2.47', chunk_id: '2.47' },
    { source_file: 'data/gita/gita_verses_complete.json', reference_if_any: 'BG 6.29', chunk_id: '6.29' },
  ],
  wisdom: {
    verse_citations: [
      { ref: 'BG 2.56', teaching: 'Steady wisdom in adversity' },
      { ref: 'BG 2.62-63', teaching: 'Chain of attachment-desire-anger-delusion' },
      { ref: 'BG 6.35', teaching: 'Mind controlled by practice and detachment' },
      { ref: 'BG 2.47', teaching: 'Right to action, not to fruits' },
      { ref: 'BG 6.29', teaching: 'Equal vision — seeing Self in all beings' },
    ],
    principle_citations: [],
    verses_used: 5,
    principles_used: 0,
    corpus_size: 701,
    gita_grounded: true
  },
  contextSufficient: true,
  secularMode: false,
  fallback: true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body.message === 'string'
      ? body.message.trim()
      : typeof body.conflict === 'string'
        ? body.conflict.trim()
        : ''
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : crypto.randomUUID()
    const relationshipTypeRaw = typeof body.relationshipType === 'string'
      ? body.relationshipType.trim()
      : typeof body.relationship_type === 'string'
        ? body.relationship_type.trim()
        : 'other'

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      // Try the enhanced engine endpoint first (deep Gita wisdom integration)
      const engineUrl = `${BACKEND_URL}/api/relationship-compass-engine/clarity`
      const legacyUrl = `${BACKEND_URL}/api/relationship-compass/gita-guidance`

      let targetUrl = engineUrl
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body: JSON.stringify({
          message,
          sessionId,
          relationshipType: relationshipTypeRaw,
          secularMode: false // Guide route: Gita-grounded mode
        }),
        signal: controller.signal
      }).catch(async () => {
        // Fallback to legacy endpoint if engine is unavailable
        targetUrl = legacyUrl
        return fetch(legacyUrl, {
          method: 'POST',
          headers: proxyHeaders(request, 'POST'),
          body: JSON.stringify({
            message,
            sessionId,
            relationshipType: relationshipTypeRaw,
            secularMode: false
          }),
          signal: controller.signal
        })
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`[Relationship Compass Guide] Backend (${targetUrl}) returned ${response.status}: ${errorText}`)
        // Return fallback as valid 200 content (don't forward cookies from failed response)
        return NextResponse.json(FALLBACK_RESPONSE)
      }

      const data = await response.json()

      // Ensure wisdom metadata is present in the response
      if (!data.wisdom && data.response) {
        data.wisdom = {
          verse_citations: [],
          principle_citations: [],
          verses_used: 0,
          principles_used: 0,
          corpus_size: 700,
          gita_grounded: true
        }
      }

      // Normalize citations from engine's wisdom.verse_citations for client compatibility
      if (!data.citations && data.wisdom?.verse_citations) {
        data.citations = data.wisdom.verse_citations.map((v: { ref?: string; teaching?: string; source?: string }) => ({
          source_file: v.source || 'data/gita/gita_verses_complete.json',
          reference_if_any: v.ref || undefined,
          chunk_id: v.ref || 'unknown',
        }))
      }

      // Ensure contextSufficient and secularMode are present for client
      if (data.contextSufficient === undefined) {
        data.contextSufficient = (data.wisdom?.verses_used ?? 0) > 0
      }
      if (data.secularMode === undefined) {
        data.secularMode = false
      }

      return forwardCookies(response, NextResponse.json(data))
    } catch (backendError) {
      clearTimeout(timeoutId)
      if (backendError instanceof Error && backendError.name === 'AbortError') {
        console.warn('[Relationship Compass Guide] Request timeout')
      } else {
        console.warn('[Relationship Compass Guide] Backend connection failed:', backendError)
      }
      return NextResponse.json(FALLBACK_RESPONSE)
    }
  } catch (error) {
    console.error('[Relationship Compass Guide] Error:', error)
    return NextResponse.json(FALLBACK_RESPONSE)
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'relationship-compass',
    endpoint: 'guide',
    version: '2.0',
    features: [
      'gita_wisdom_700_verses',
      'curated_relationship_principles',
      'deep_root_cause_analysis',
      'gita_wisdom_filter',
      'multi_provider_ai',
      'modern_secular_expression'
    ],
    timestamp: new Date().toISOString()
  })
}
