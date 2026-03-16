/**
 * Companion Feedback - Next.js API Route
 *
 * Collects user thumbs-up/thumbs-down feedback on KIAAN responses.
 * Proxies to backend if available, otherwise logs structured metrics locally.
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

function logMetrics(data: Record<string, unknown>) {
  console.warn('[Companion:Metrics]', JSON.stringify({ ts: new Date().toISOString(), ...data }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { message_id, rating, session_id } = body

    if (!message_id || typeof message_id !== 'string') {
      return NextResponse.json({ error: 'message_id is required' }, { status: 400 })
    }

    if (rating !== 'positive' && rating !== 'negative') {
      return NextResponse.json({ error: 'rating must be "positive" or "negative"' }, { status: 400 })
    }

    // Try proxying to backend
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/voice-companion/feedback`, {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body: JSON.stringify({ message_id, rating, session_id }),
        signal: AbortSignal.timeout(5000),
      })

      if (backendResponse.ok) {
        logMetrics({ event: 'feedback', rating, message_id, tier: 'backend' })
        return NextResponse.json({ success: true })
      }
    } catch {
      // Backend unavailable — fall through to local logging
    }

    // Fallback: log locally for later aggregation
    logMetrics({ event: 'feedback', rating, message_id, session_id: session_id || null, tier: 'local' })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 })
  }
}
