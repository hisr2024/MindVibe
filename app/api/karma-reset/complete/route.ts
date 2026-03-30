/**
 * Karma Reset Complete API Route
 * Records session completion, awards XP, and tracks streak.
 * Proxies to backend with fallback to local computation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyHeaders, BACKEND_URL, forwardCookies } from '@/lib/proxy-utils'

/** XP calculation based on completion quality */
function calculateXP(sankalpaSigned: boolean, actionDharmaCommitted: string[]): number {
  let xp = 25 // Base XP for completing the flow
  if (sankalpaSigned) xp += 10
  xp += actionDharmaCommitted.length * 5 // 5 XP per committed practice
  return xp
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, sankalpaSigned, actionDharmaCommitted } = body

    if (!sessionId) {
      return NextResponse.json(
        { detail: 'Missing required field: sessionId' },
        { status: 400 }
      )
    }

    // Try backend first
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/karma-reset/complete`, {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body: JSON.stringify({ sessionId, sankalpaSigned, actionDharmaCommitted }),
        signal: AbortSignal.timeout(10000),
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        return forwardCookies(
          backendResponse,
          NextResponse.json(data)
        )
      }
    } catch {
      // Backend unavailable — fall through to local computation
    }

    // Fallback: compute locally
    const xpAwarded = calculateXP(
      sankalpaSigned ?? false,
      actionDharmaCommitted ?? []
    )

    return NextResponse.json({
      success: true,
      xpAwarded,
      streakCount: 1,
      message: 'Your karma has been met with dharma.',
    })
  } catch (error) {
    console.error('[Karma Reset Complete] Error:', error)
    return NextResponse.json(
      { detail: 'Unable to complete session' },
      { status: 500 }
    )
  }
}
