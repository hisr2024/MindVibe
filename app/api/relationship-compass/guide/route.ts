/**
 * Relationship Compass Guide API Route (Gita-only proxy)
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const REQUEST_TIMEOUT = 60000

const FALLBACK_RESPONSE = {
  response: [
    'Sacred Acknowledgement',
    'I hear the weight in what you shared. Your feelings matter, and I want to ground any guidance in the Gita verses.',
    '',
    'What I Need From the Gita Repository',
    'I do not yet have enough Bhagavad Gita verse context retrieved to offer guidance grounded only in those verses.',
    '',
    'One Gentle Question',
    'What specific moment or exchange should I anchor in the Gita verses first?',
    '',
    'Citations',
    '(none)'
  ].join('\n'),
  sections: {
    'Sacred Acknowledgement': 'I hear the weight in what you shared. Your feelings matter, and I want to ground any guidance in the Gita verses.',
    'What I Need From the Gita Repository': 'I do not yet have enough Bhagavad Gita verse context retrieved to offer guidance grounded only in those verses.',
    'One Gentle Question': 'What specific moment or exchange should I anchor in the Gita verses first?',
    Citations: '(none)'
  },
  citations: [],
  contextSufficient: false,
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
      const response = await fetch(`${BACKEND_URL}/api/relationship-compass/gita-guidance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId,
          relationshipType: relationshipTypeRaw,
          secularMode: false // Guide route: Gita-only mode
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`[Relationship Compass Guide] Backend returned ${response.status}: ${errorText}`)
        return NextResponse.json(FALLBACK_RESPONSE)
      }

      const data = await response.json()
      return NextResponse.json(data)
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
    timestamp: new Date().toISOString()
  })
}
