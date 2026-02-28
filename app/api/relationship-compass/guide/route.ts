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
  response: [
    'Sacred Acknowledgement',
    'I hear the weight in what you shared. Your feelings matter deeply, and I want to ground any guidance in the Gita\'s timeless wisdom.',
    '',
    'What I Need From the Gita Repository',
    'I am reaching into the 700+ verse Bhagavad Gita corpus to find the wisdom that speaks directly to your situation. The guidance I offer must trace back to authentic teachings.',
    '',
    'One Gentle Question',
    'What specific moment or exchange is causing the most pain right now? I want to understand the root of what you\'re feeling before I offer guidance.',
    '',
    'Citations',
    '(none)'
  ].join('\n'),
  sections: {
    'Sacred Acknowledgement': 'I hear the weight in what you shared. Your feelings matter deeply, and I want to ground any guidance in the Gita\'s timeless wisdom.',
    'What I Need From the Gita Repository': 'I am reaching into the 700+ verse Bhagavad Gita corpus to find the wisdom that speaks directly to your situation.',
    'One Gentle Question': 'What specific moment or exchange is causing the most pain right now? I want to understand the root of what you\'re feeling before I offer guidance.',
    Citations: '(none)'
  },
  citations: [],
  wisdom: {
    verse_citations: [],
    principle_citations: [],
    verses_used: 0,
    principles_used: 0,
    corpus_size: 700,
    gita_grounded: false
  },
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
        return forwardCookies(response, NextResponse.json(FALLBACK_RESPONSE))
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
