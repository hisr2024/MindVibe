/**
 * Companion Session Start - Next.js API Route
 * Proxies session start requests to the backend voice companion service.
 * Falls back to a local session if backend is unavailable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

function logMetrics(data: Record<string, unknown>) {
  console.warn('[Companion:Metrics]', JSON.stringify({ ts: new Date().toISOString(), ...data }))
}

function withTierHeader(response: NextResponse, tier: string): NextResponse {
  response.headers.set('X-AI-Tier', tier)
  return response
}

function buildLocalGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    return "Good morning! I'm KIAAN, your personal friend. What's on your mind today?"
  } else if (hour >= 17 && hour < 21) {
    return "Good evening, friend! How was your day? I'm here to listen."
  } else if (hour >= 21 || hour < 5) {
    return "Hey there, night owl. Can't sleep, or just need a friend? I'm right here."
  }
  return "Hey friend! I'm KIAAN. I'm always here when you need someone to talk to. What's up?"
}

export async function POST(request: NextRequest) {
  const start = Date.now()

  try {
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/api/voice-companion/session/start`, {
      method: 'POST',
      headers: proxyHeaders(request, 'POST'),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json().catch(() => null)
      if (!data) throw new Error('Backend returned invalid JSON')
      logMetrics({ event: 'session_start', tier: 'backend', latency_ms: Date.now() - start })
      return withTierHeader(
        forwardCookies(backendResponse, NextResponse.json(data)),
        'backend',
      )
    }

    logMetrics({ event: 'session_start', tier: 'local', latency_ms: Date.now() - start, reason: `http_${backendResponse.status}` })
    return withTierHeader(NextResponse.json({
      session_id: `local_${Date.now()}`,
      greeting: buildLocalGreeting(),
      phase: 'connect',
      friendship_level: 'new',
      user_name: null,
    }), 'local')
  } catch (err) {
    logMetrics({ event: 'session_start', tier: 'local', latency_ms: Date.now() - start, reason: err instanceof Error ? err.message : 'unknown' })
    return withTierHeader(NextResponse.json({
      session_id: `local_${Date.now()}`,
      greeting: "Hey! I'm KIAAN, your best friend. Whatever's on your mind, I'm here. Talk to me.",
      phase: 'connect',
      friendship_level: 'new',
      user_name: null,
    }), 'local')
  }
}
