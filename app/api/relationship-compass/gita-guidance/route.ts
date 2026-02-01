import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT = 60000

const FALLBACK_RESPONSE = {
  response: `# Sacred Acknowledgement
I witness the pain you carry with deep daya (compassion). The Gita teaches us (2:47): "Karmanye vadhikaraste, ma phaleshu kadachana" - You have the right to your actions alone, never to the fruits. Your willingness to seek understanding reveals your inner strength.

# Inner Conflict Mirror
Ancient wisdom teaches: all outer conflicts are mirrors of inner ones. The Gita's teaching of svadhyaya (self-study) invites us to look within first. What do you truly need beneath the surface of this conflict - to be seen? Understood? Respected?

# Gita Teachings Used
The Bhagavad Gita (2:47, 6:5, 12:13) illuminates relationship wisdom:
1. (2:47) Focus on your actions, not outcomes you cannot control
2. (6:5) "One must elevate, not degrade, oneself. The mind can be the friend or enemy of the self."
3. (12:13) "One who is free from malice toward all beings, friendly and compassionate..."

# Dharma Options
Consider three dharmic paths:
1. **Karma Yoga Path** (2:47): Focus on YOUR actions and intentions, not on controlling the other's response.
2. **Kshama (Forgiveness) Path** (12:13): Forgiveness is YOUR liberation - releasing resentment so YOU can be free.
3. **Sama-Darshana (Equal Vision) Path** (6:32): See the divine struggling in them too - they act from their own wounds.

# Sacred Speech
The Gita teaches (17:15): "Speech that causes no distress, that is truthful, pleasant, and beneficial."
Try this: "When [situation], I feel [emotion], because I need [need]. What I'm hoping is [request]."

# Detachment Anchor
(2:47): Your dharma is to act with integrity; the outcome is not yours to control. Release attachment to HOW this must resolve.

# One Next Step
Today, practice witness consciousness (6:5): When emotions arise, simply observe them. Say: "I see you, feeling. I am not you - I am the one who witnesses."

# One Gentle Question
If you were at complete peace with yourself - needing nothing from this person to feel whole - how would you respond?`,
  sections: {
    'Sacred Acknowledgement': 'I witness the pain you carry with deep daya (compassion). The Gita teaches us (2:47): "Karmanye vadhikaraste, ma phaleshu kadachana" - You have the right to your actions alone, never to the fruits. Your willingness to seek understanding reveals your inner strength.',
    'Inner Conflict Mirror': "Ancient wisdom teaches: all outer conflicts are mirrors of inner ones. The Gita's teaching of svadhyaya (self-study) invites us to look within first. What do you truly need beneath the surface of this conflict - to be seen? Understood? Respected?",
    'Gita Teachings Used': '1. (2:47) Focus on your actions, not outcomes you cannot control\n2. (6:5) "One must elevate, not degrade, oneself."\n3. (12:13) "One who is free from malice toward all beings..."',
    'Dharma Options': '1. **Karma Yoga Path** (2:47): Focus on YOUR actions and intentions.\n2. **Kshama (Forgiveness) Path** (12:13): Forgiveness is YOUR liberation.\n3. **Sama-Darshana (Equal Vision) Path** (6:32): See the divine in them too.',
    'Sacred Speech': 'Try: "When [situation], I feel [emotion], because I need [need]. What I\'m hoping is [request]."',
    'Detachment Anchor': '(2:47): Your dharma is to act with integrity; the outcome is not yours to control.',
    'One Next Step': 'Today, practice witness consciousness (6:5): When emotions arise, simply observe them.',
    'One Gentle Question': 'If you were at complete peace with yourself - needing nothing from this person to feel whole - how would you respond?'
  },
  citations: [
    { chapter: '2', verse: '47', source: 'Bhagavad Gita', chunk_id: 'fallback_2_47' },
    { chapter: '6', verse: '5', source: 'Bhagavad Gita', chunk_id: 'fallback_6_5' },
    { chapter: '12', verse: '13', source: 'Bhagavad Gita', chunk_id: 'fallback_12_13' },
    { chapter: '6', verse: '32', source: 'Bhagavad Gita', chunk_id: 'fallback_6_32' },
    { chapter: '17', verse: '15', source: 'Bhagavad Gita', chunk_id: 'fallback_17_15' }
  ],
  contextSufficient: true,
  fallback: true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    const relationshipType = typeof body.relationshipType === 'string' ? body.relationshipType.trim() : 'other'

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
          relationshipType
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
