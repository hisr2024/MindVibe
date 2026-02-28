import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'
const REQUEST_TIMEOUT = 60000

// Gita-grounded secular fallback - modern, feeling-rich, all wisdom from Gita
const FALLBACK_RESPONSE = {
  response: `# I Hear You
I can feel the weight of what you're carrying right now. Relationship pain has a way of settling into your chest and coloring everything — your thoughts, your sleep, your sense of self. The fact that you're here, reaching out, trying to make sense of it instead of just reacting from the hurt — that tells me something important about who you are. You're choosing awareness over autopilot, and that takes real courage.

# What Might Be Happening
When we look beneath the surface of relationship conflict, there's almost always something deeper at work:
- **The grip of attachment**: Much of our pain comes from holding tightly to how we think things SHOULD be — how they should respond, what they should understand. The ache lives in the gap between expectation and reality.
- **The ego's quiet voice**: Sometimes what feels like righteous hurt is actually our sense of self feeling threatened. Being dismissed, disrespected, or unseen strikes at something fundamental.
- **The chain of reaction**: When we replay what hurt us, frustration spirals into anger, and anger clouds the very clarity we need. Recognizing that spiral is the first step to breaking free from it.

# The Other Side
Without excusing anything that's happened, there's a truth worth holding: the other person is also navigating their own fears, conditioning, and unresolved pain. People rarely act from a desire to hurt — they act from their own internal storms. Their behavior reflects their inner struggle, not your worth. Seeing that doesn't mean accepting poor treatment — it means you see the full picture, which gives you more power to choose wisely.

# What You Could Try
1. **Give yourself the gift of a pause**: Before the next conversation, let the emotional storm pass through you. When the mind is turbulent, wisdom can't reach you. Even 90 seconds of conscious breathing changes your entire internal landscape.

2. **Focus on what's truly yours to control**: You can't control how they behave, but you have complete authority over how you respond. Ask yourself: "What would the wisest version of me do here?" Then do that — regardless of their reaction.

3. **Lead with your real need, not the accusation**: Instead of "You always..." try "What I really need right now is..." When you speak from vulnerability instead of anger, something shifts — in you and in them.

# A Way to Say It
*"Hey, can we talk about something that's been on my heart? When [specific situation], I felt [your emotion]. I think what I really need underneath all of it is [your need]. I'm not bringing this up to fight or to be right — I'm bringing it up because you matter to me and I want us to understand each other better."*

# Gita Wisdom
**BG 2.47** — "You have the right to your actions, but never to the fruits of your actions."
In relationships, this means: pour your heart into showing up with honesty and kindness — but release your grip on how they respond. Your peace can't depend on their reaction. Do what's right because it's right, not because it guarantees a specific outcome.

# One Small Step
For today: before your next interaction with this person, place one hand on your heart and take three slow, deep breaths. Then set a quiet intention — not an outcome you're hoping for, but a way of being. Something like: "I'm going to speak from my heart, not my hurt" or "I'm going to listen with the goal of understanding, not winning." That inner shift changes everything.`,
  sections: {
    'I Hear You': 'I can feel the weight of what you\'re carrying right now. Relationship pain has a way of settling into your chest and coloring everything — your thoughts, your sleep, your sense of self. The fact that you\'re here, reaching out, trying to make sense of it instead of just reacting from the hurt — that tells me something important about who you are. You\'re choosing awareness over autopilot, and that takes real courage.',
    'What Might Be Happening': 'When we look beneath the surface of relationship conflict, there\'s almost always something deeper at work:\n- **The grip of attachment**: Much of our pain comes from holding tightly to how we think things SHOULD be. The ache lives in the gap between expectation and reality.\n- **The ego\'s quiet voice**: Sometimes what feels like righteous hurt is actually our sense of self feeling threatened.\n- **The chain of reaction**: When we replay what hurt us, frustration spirals into anger, and anger clouds the very clarity we need.',
    'The Other Side': 'The other person is also navigating their own fears, conditioning, and unresolved pain. People rarely act from a desire to hurt — they act from their own internal storms. Their behavior reflects their inner struggle, not your worth. Seeing that doesn\'t mean accepting poor treatment — it means you see the full picture.',
    'What You Could Try': '1. **Give yourself the gift of a pause**: Let the emotional storm pass through you. Even 90 seconds of conscious breathing changes your entire internal landscape.\n\n2. **Focus on what\'s truly yours to control**: You have complete authority over how you respond. Ask yourself: "What would the wisest version of me do here?"\n\n3. **Lead with your real need, not the accusation**: Instead of "You always..." try "What I really need right now is..."',
    'A Way to Say It': '*"Hey, can we talk about something that\'s been on my heart? When [situation], I felt [emotion]. What I really need is [need]. I\'m not bringing this up to fight — I\'m bringing it up because you matter to me and I want us to understand each other better."*',
    'Gita Wisdom': '**BG 2.47** — "You have the right to your actions, but never to the fruits of your actions." In relationships, this means: pour your heart into showing up with honesty and kindness — but release your grip on how they respond. Your peace can\'t depend on their reaction.',
    'One Small Step': 'Before your next interaction, place one hand on your heart and take three slow, deep breaths. Then set a quiet intention — not an outcome, but a way of being: "I\'m going to speak from my heart, not my hurt." That inner shift changes everything.'
  },
  citations: [],
  contextSufficient: true,
  fallback: true,
  secularMode: true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    const relationshipType = typeof body.relationshipType === 'string' ? body.relationshipType.trim() : 'other'
    const secularMode = typeof body.secularMode === 'boolean' ? body.secularMode : true // Default secular

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'message and sessionId are required' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      const response = await fetch(`${BACKEND_URL}/api/relationship-compass/gita-guidance`, {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body: JSON.stringify({
          message,
          sessionId,
          relationshipType,
          secularMode
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`[Relationship Compass Gita] Backend returned ${response.status}: ${errorText}`)
        return forwardCookies(response, NextResponse.json(FALLBACK_RESPONSE))
      }

      const data = await response.json()
      return forwardCookies(response, NextResponse.json(data))
    } catch (backendError) {
      clearTimeout(timeoutId)
      if (backendError instanceof Error && backendError.name === 'AbortError') {
        console.warn('[Relationship Compass Gita] Request timeout')
      } else {
        console.warn('[Relationship Compass Gita] Backend connection failed:', backendError)
      }
      return NextResponse.json(FALLBACK_RESPONSE)
    }
  } catch (error) {
    console.error('[Relationship Compass Gita] Error:', error)
    return NextResponse.json(FALLBACK_RESPONSE)
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'relationship-compass',
    endpoint: 'gita-guidance',
    timestamp: new Date().toISOString()
  })
}
