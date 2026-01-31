/**
 * Relationship Compass Guide API Route
 * Proxies relationship guidance requests to the backend KIAAN-powered service
 *
 * Features:
 * - Ultra-deep relationship guidance through Bhagavad Gita wisdom
 * - Support for 6 relationship types (romantic, family, friendship, workplace, self, community)
 * - Emotion-aware analysis with Gita psychology
 * - 8-section structured response for comprehensive guidance
 *
 * Part of the KIAAN AI Ecosystem
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'
const REQUEST_TIMEOUT = 60000 // 60 seconds for deep analysis

// Ultra-deep fallback response with Gita wisdom
const FALLBACK_RESPONSE = {
  status: 'success',
  compass_guidance: {
    sacred_witnessing: "Dear friend, I bow to the tender heart that brought you here seeking clarity. This relationship difficulty weighs on you, and that pain is completely valid. That you seek understanding rather than simply reacting shows profound courage. Every awakened soul throughout time has faced moments exactly like this one. You are not alone in this struggle.",
    mirror_of_relationship: "Ancient wisdom teaches: 'Yatha drishti, tatha srishti' - as you see, so you create. All outer conflicts are mirrors of inner ones. Let us gently explore: What do you truly NEED beneath this conflict? To be seen? Respected? Understood? Valued? And what fear might be awakened here? The Gita teaches svadhyaya - sacred self-study - as the first step toward clarity.",
    others_inner_world: "Now, with daya (compassion) - not excuse-making - let us consider the other's inner world. They too are a soul navigating their own fears and wounds. What unmet need might drive their behavior? 'Hurt people hurt people' is not excuse-making but understanding that their actions reflect their suffering, not your worth. The Gita teaches sama-darshana - seeing the same consciousness struggling in all beings.",
    dharmic_path: "Dharma in relationships is NOT about winning - it is right action aligned with your highest self. The Gita teaches: speak truth that is pleasant and beneficial. Truth without cruelty, honesty without weaponizing. Ask yourself: 'What would my wisest self do here?' The goal is not to be RIGHT - it is to be at PEACE.",
    ego_illumination: "Ancient wisdom's liberating teaching: Ahamkara (ego) wears many disguises - it disguises itself as 'being right,' as 'righteous hurt.' The EGO asks: 'How can I WIN?' The SOUL asks: 'How can I be at PEACE?' Most conflicts are simply ego defending ego. Tyaga - sacred surrender - means letting go of the need to win. This is not weakness but PROFOUND STRENGTH.",
    sacred_communication: "When you're ready, try this dharmic communication: 'When [situation]... I feel [emotion]... Because I need [underlying need]... What I'm hoping for is [request]...' Before speaking, ask: 'Am I speaking from wound or from wisdom?' 'What would LOVE do here?' The Gita teaches priya vachana - speak pleasant truth, never harsh truth harshly.",
    forgiveness_teaching: "If forgiveness is relevant: Kshama is NOT saying the harm was acceptable, NOT pretending it didn't hurt. Kshama IS releasing the poison YOU drink hoping THEY suffer - freeing YOURSELF from resentment's prison. 'Kshama vira bhushanam' - Forgiveness is the ornament of the brave. It is a gift to yourself.",
    eternal_anchor: "Carry this eternal truth: 'Atma-tripti' - you are ALREADY complete within yourself. Your peace does NOT depend on another's behavior. Another person cannot give you your worth (you already have it), cannot take it away (they never had that power). 'Purnatva' - fullness: You are whole, even in heartbreak. Beneath the pain, you remain untouched, complete. 💙",
  },
  response: "Dear friend, I bow to the tender heart that brought you here seeking clarity. This relationship difficulty weighs on you, and that pain is completely valid.\n\nAncient wisdom teaches: 'Yatha drishti, tatha srishti' - as you see, so you create. What do you truly NEED beneath this conflict? To be seen? Respected? Understood?\n\nWith daya (compassion), let us consider the other's inner world. They too are navigating their own fears. 'Hurt people hurt people' - their actions reflect their suffering, not your worth.\n\nDharma in relationships is NOT about winning - it is right action aligned with your highest self. Ask: 'What would my wisest self do here?'\n\nThe ego asks: 'How can I WIN?' The soul asks: 'How can I be at PEACE?' Letting go of the need to win is not weakness but PROFOUND STRENGTH.\n\nWhen ready, try: 'When [situation]... I feel [emotion]... Because I need [need]... What I'm hoping for is [request]...'\n\nIf forgiveness is relevant: Kshama is releasing the poison you drink hoping another suffers. It is a gift to yourself.\n\nCarry this eternal truth: You are ALREADY complete. Your peace does NOT depend on another's behavior. Beneath the pain, you remain untouched, whole. 💙",
  gita_verses_used: 0,
  relationship_type: 'romantic',
  relationship_teachings: {
    core_principles: ['Sama-darshana (equal vision)', 'Nishkama Prema (desireless love)', 'Satya (truth in love)'],
    key_teaching: 'True love is nishkama - without selfish attachment. The Gita teaches that genuine love flows from recognizing the divine in your partner.',
  },
  emotion_insight: '',
  model: 'fallback',
  provider: 'kiaan',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conflict,
      relationship_type = 'romantic',
      primary_emotion,
      context,
      desired_outcome,
    } = body

    if (!conflict || typeof conflict !== 'string') {
      return NextResponse.json(
        { error: 'Please share your relationship situation - it helps me understand and guide you better', status: 'error' },
        { status: 400 }
      )
    }

    if (conflict.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please share a bit more detail so I can truly understand your situation', status: 'error' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedConflict = conflict
      .replace(/[<>]/g, '')
      .replace(/\\/g, '')
      .slice(0, 3000)

    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      // Call the backend Relationship Compass endpoint with all fields
      const response = await fetch(`${BACKEND_URL}/api/relationship-compass/guide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          conflict: sanitizedConflict,
          relationship_type: relationship_type || 'romantic',
          primary_emotion: primary_emotion || undefined,
          context: context || undefined,
          desired_outcome: desired_outcome || undefined,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          status: data.status || 'success',
          compass_guidance: data.compass_guidance,
          response: data.response,
          gita_verses_used: data.gita_verses_used || 0,
          relationship_type: data.relationship_type || relationship_type,
          relationship_teachings: data.relationship_teachings,
          emotion_insight: data.emotion_insight || '',
          model: data.model,
          provider: data.provider || 'kiaan',
        })
      }

      // Log the error for debugging
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[Relationship Compass API] Backend returned ${response.status}: ${errorText}`)

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
      if (backendError instanceof Error && backendError.name === 'AbortError') {
        console.warn('[Relationship Compass API] Request timeout')
      } else {
        console.warn('[Relationship Compass API] Backend connection failed:', backendError)
      }
    }

    // Use fallback response when backend is unavailable
    // Customize fallback based on relationship type
    const fallback = { ...FALLBACK_RESPONSE }
    fallback.relationship_type = relationship_type || 'romantic'

    return NextResponse.json(fallback)
  } catch (error) {
    console.error('[Relationship Compass API] Error:', error)

    // Always return a helpful response
    return NextResponse.json(FALLBACK_RESPONSE)
  }
}

// Health check for the Relationship Compass endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'relationship-compass',
    provider: 'kiaan',
    ecosystem: 'KIAAN AI',
    features: [
      'Ultra-deep relationship guidance',
      '6 relationship types supported',
      'Emotion-aware Gita psychology',
      '8-section structured response',
      '700+ Gita verses database',
    ],
    relationship_types: ['romantic', 'family', 'friendship', 'workplace', 'self', 'community'],
    timestamp: new Date().toISOString(),
  })
}
