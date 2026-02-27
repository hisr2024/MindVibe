/**
 * Chat Session Start API Route
 *
 * Initializes a new KIAAN chat session for the mobile chat interface.
 * Proxies to backend chat service with session ID generation fallback.
 */

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    // Try backend session creation
    const backendResponse = await fetch(`${BACKEND_URL}/api/chat/session/start`, {
      method: 'POST',
      headers: proxyHeaders(request),
      signal: AbortSignal.timeout(5000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return forwardCookies(backendResponse, NextResponse.json(data))
    }

    // Try alternate endpoint
    const altResponse = await fetch(`${BACKEND_URL}/api/kiaan/friend/chat`, {
      method: 'POST',
      headers: proxyHeaders(request),
      body: JSON.stringify({ action: 'start_session' }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)

    if (altResponse?.ok) {
      const data = await altResponse.json()
      return forwardCookies(altResponse, NextResponse.json({
        session_id: data.session_id || generateSessionId(),
        messages: data.messages || [],
      }))
    }

    // Generate local session ID as fallback
    return NextResponse.json({
      session_id: generateSessionId(),
      messages: [],
    })
  } catch (error) {
    console.error('[Chat Start] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')

    // Always return a session ID so the user can start chatting
    return NextResponse.json({
      session_id: generateSessionId(),
      messages: [],
    })
  }
}

function generateSessionId(): string {
  return `local-${randomUUID()}`
}
