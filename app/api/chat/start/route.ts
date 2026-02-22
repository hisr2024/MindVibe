/**
 * Chat Session Start API Route
 *
 * Initializes a new KIAAN chat session for the mobile chat interface.
 * Proxies to backend chat service with session ID generation fallback.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''

    // Try backend session creation
    const backendResponse = await fetch(`${BACKEND_URL}/api/chat/session/start`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    // Try alternate endpoint
    const altResponse = await fetch(`${BACKEND_URL}/api/kiaan/friend/chat`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ action: 'start_session' }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)

    if (altResponse?.ok) {
      const data = await altResponse.json()
      return NextResponse.json({
        session_id: data.session_id || generateSessionId(),
        messages: data.messages || [],
      })
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
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `local-${timestamp}-${random}`
}
