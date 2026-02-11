/**
 * Viyoga Detach API Route
 * Proxies detachment requests to the backend Viyoga service
 * Handles CORS, error fallbacks, and response formatting
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Generate personalized fallback response with ultra-deep sections
 * when backend is unavailable.
 */
function generateFallbackResponse(outcomeWorry: string) {
  const inputShort = outcomeWorry.length > 50 ? outcomeWorry.slice(0, 50) + '...' : outcomeWorry

  return {
    status: 'success',
    detachment_guidance: {
      honoring_pain: `Dear friend, I bow to the courage it takes to name your fear. This worry about "${inputShort}" - I truly see it, and I feel the weight you're carrying. Your anxiety isn't weakness; it reveals how deeply you care about this outcome. Every seeker who ever lived has stood where you stand now. You are not alone in this struggle.`,
      understanding_attachment: `Ancient wisdom names this pattern: "phala-sakti" - the binding force of attachment to outcomes. Your peace has become conditional: "I can only be okay IF ${inputShort} turns out well." This creates suffering not once but many times - in fearful anticipation, in obsessive planning, in the waiting, even after the outcome arrives. The liberating insight: The outcome itself has never caused your suffering - only the attachment to it. Like gripping water, the tighter we hold, the faster it escapes. Open hands receive everything.`,
      karma_yoga_liberation: `The timeless teaching of Karma Yoga offers profound liberation: "Karmanye vadhikaraste, ma phaleshu kadachana" - You have the right to your actions alone, never to their fruits. This is "nishkama karma" - desireless action. NOT indifference (you still care deeply), NOT passivity (you still act with full commitment), BUT freedom from the tyranny of results. The archer who releases attachment to the target enters a flow state where aim becomes perfect. Attachment creates trembling; surrender creates steadiness.`,
      witness_consciousness: `Ancient wisdom reveals: You are not your anxiety - you are the awareness watching it. This is "sakshi bhava" - witness consciousness. Practice: "I notice I am having thoughts about this outcome." Feel the space between "I" and "these thoughts." In that gap lives your true nature - vast, peaceful, untouched. You are the "drashtri" - the Seer, the unchanging witness. Like a mountain unmoved by weather, your awareness remains steady while thoughts and worries pass like clouds.`,
      practical_wisdom: `Here is your sacred practice for this moment: Before taking any action related to "${inputShort}", pause. Place your hand on your heart. Take three deep breaths - each one releasing attachment. Then say: "I offer my best effort as sacred service. The outcome belongs to the universe." Act with complete presence, as if this action is the only one that matters. After, release: "It is done. I am free." This is "ishvara pranidhana" - surrender to the higher.`,
      eternal_anchor: `Carry this eternal truth: You are already complete, exactly as you are, regardless of any outcome. Your worth was never meant to be measured by results - it is your birthright. "Yogastha kuru karmani" - Established in your true self, perform action. You are the infinite sky; outcomes are merely clouds - light ones, dark ones, storm clouds. They pass. The sky remains. You have always been the sky. You will always be the sky.`,
    },
    response: `Dear friend, I bow to the courage it takes to name your fear. This worry about "${inputShort}" - I truly see it, and I feel the weight you're carrying. Your anxiety isn't weakness; it reveals how deeply you care about this outcome. You are not alone in this struggle.\n\nAncient wisdom names this pattern: "phala-sakti" - the binding force of attachment to outcomes. Your peace has become conditional. This creates suffering in fearful anticipation, in obsessive planning, in the waiting. The liberating insight: The outcome itself has never caused your suffering - only the attachment to it.\n\nThe timeless teaching of Karma Yoga offers profound liberation: "Karmanye vadhikaraste" - You have the right to your actions alone, never to their fruits. This is "nishkama karma" - desireless action. NOT indifference, NOT passivity, BUT freedom from the tyranny of results.\n\nAncient wisdom also reveals: You are not your anxiety - you are the awareness watching it. This is "sakshi bhava" - witness consciousness. In the space between "I" and "these thoughts" lives your true nature - peaceful, complete, unshaken.\n\nHere is your sacred practice: Before taking any action, pause. Place your hand on your heart. Take three deep breaths. Say: "I offer my best effort as sacred service. The outcome belongs to the universe." Then act with complete presence.\n\nCarry this eternal truth: You are already complete, regardless of any outcome. You are the infinite sky; outcomes are merely clouds passing through. 💙`,
    gita_verses_used: 0,
    _offline: true,
  }
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
          cookie: request.headers.get('cookie') || '',
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

    // Use personalized fallback response when backend is unavailable
    return NextResponse.json(generateFallbackResponse(sanitizedWorry))
  } catch (error) {
    console.error('[Viyoga API] Error:', error)

    // Always return a helpful response with generic fallback
    return NextResponse.json(generateFallbackResponse('this situation'))
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
