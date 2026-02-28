/**
 * Wisdom Rooms API Route
 *
 * Lists available wisdom chat rooms.
 * Proxies to backend /api/rooms with fallback to default rooms.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

const DEFAULT_ROOMS = [
  { id: 'grounding', slug: 'grounding', name: 'Calm Grounding', theme: 'Deep breaths & check-ins', active_count: 0 },
  { id: 'gratitude', slug: 'gratitude', name: 'Gratitude Garden', theme: 'Share what is going well', active_count: 0 },
  { id: 'courage', slug: 'courage', name: 'Courage Circle', theme: 'Encouragement & support', active_count: 0 },
  { id: 'clarity', slug: 'clarity', name: 'Clarity Corner', theme: 'Finding inner stillness', active_count: 0 },
  { id: 'compassion', slug: 'compassion', name: 'Compassion Cave', theme: 'Self-kindness & acceptance', active_count: 0 },
]

export async function GET(request: NextRequest) {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/rooms`, {
      method: 'GET',
      headers: proxyHeaders(request),
      signal: AbortSignal.timeout(5000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return forwardCookies(backendResponse, NextResponse.json(data))
    }

    if (backendResponse.status === 401 || backendResponse.status === 403) {
      return forwardCookies(backendResponse, NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      ))
    }

    return forwardCookies(backendResponse, NextResponse.json(DEFAULT_ROOMS))
  } catch (error) {
    console.error('[Rooms] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(DEFAULT_ROOMS)
  }
}
