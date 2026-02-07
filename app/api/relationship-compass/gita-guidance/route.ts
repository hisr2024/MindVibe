import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT = 60000

// Secular fallback response - modern, friendly, no religious references
const FALLBACK_RESPONSE = {
  response: `# I Hear You
I can tell this is weighing on you. Relationship challenges can feel overwhelming, especially when you're right in the middle of them. The fact that you're taking time to reflect on this instead of just reacting shows a lot of self-awareness.

# What Might Be Happening
A few things that might be at play here:
- **Unmet needs**: Conflicts often aren't about what they seem on the surface. What do you really need - respect? To be heard? Understanding?
- **Different perspectives**: You and the other person might be seeing the same situation very differently. Neither view is necessarily "wrong."
- **Communication patterns**: Sometimes how we communicate creates misunderstandings that snowball.

# The Other Side
Without excusing any hurtful behavior, it might help to consider: the other person is also navigating their own fears, insecurities, and past experiences. People often act from their own pain, not from a desire to hurt us.

Some questions to consider:
- What might they be feeling or fearing in this situation?
- Is there any possibility they're unaware of how their actions are affecting you?

# What You Could Try
Here are a few approaches that might help:

1. **Take a breather first**: Before having a conversation, give yourself time to move from reactive to responsive. A calm conversation is 10x more productive than one driven by raw emotion.

2. **Focus on what you can control**: You can't control how someone else behaves, but you can control how you respond. Ask yourself: "What would the version of me I'm proud of do here?"

3. **Lead with curiosity, not accusations**: Instead of "You always..." try "Help me understand..." People get defensive when they feel attacked.

# A Way to Say It
When you're ready, here's a template that tends to work well:

*"Hey, can we talk about something that's been on my mind? When [specific situation], I felt [your emotion]. I think it's because [your underlying need]. I'm not looking to argue - I just want us to understand each other better. What was going on for you in that moment?"*

# One Small Step
For today, try this: Before your next interaction, take a moment to set an intention. Not an outcome you're hoping for, but a way of being. Something like: "I'm going to stay curious" or "I'm going to listen more than I speak."`,
  sections: {
    'I Hear You': 'I can tell this is weighing on you. Relationship challenges can feel overwhelming, especially when you\'re right in the middle of them. The fact that you\'re taking time to reflect on this instead of just reacting shows a lot of self-awareness.',
    'What Might Be Happening': 'A few things that might be at play here:\n- **Unmet needs**: Conflicts often aren\'t about what they seem on the surface. What do you really need - respect? To be heard? Understanding?\n- **Different perspectives**: You and the other person might be seeing the same situation very differently.\n- **Communication patterns**: Sometimes how we communicate creates misunderstandings that snowball.',
    'The Other Side': 'Without excusing any hurtful behavior, it might help to consider: the other person is also navigating their own fears, insecurities, and past experiences. People often act from their own pain, not from a desire to hurt us.',
    'What You Could Try': '1. **Take a breather first**: Before having a conversation, give yourself time to move from reactive to responsive.\n\n2. **Focus on what you can control**: You can\'t control how someone else behaves, but you can control how you respond.\n\n3. **Lead with curiosity, not accusations**: Instead of "You always..." try "Help me understand..."',
    'A Way to Say It': '*"Hey, can we talk about something? When [situation], I felt [emotion]. I think it\'s because [need]. I\'m not looking to argue - I just want us to understand each other better."*',
    'One Small Step': 'For today: Before your next interaction, set an intention. Not an outcome you\'re hoping for, but a way of being. Something like: "I\'m going to stay curious" or "I\'m going to listen more than I speak."'
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
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
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
        return NextResponse.json(FALLBACK_RESPONSE)
      }

      const data = await response.json()
      return NextResponse.json(data)
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
