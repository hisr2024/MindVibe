/**
 * Karma Problem Analysis API Route
 * Analyzes user's situation and recommends the best karmic path
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.situation || typeof body.situation !== 'string' || body.situation.length < 5) {
      return NextResponse.json(
        { error: 'situation is required (minimum 5 characters)' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${BACKEND_URL}/api/karma-reset/problems/analyze`, {
      method: 'POST',
      headers: proxyHeaders(request, 'POST'),
      body: JSON.stringify({
        situation: body.situation.slice(0, 2000),
      }),
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: response.status }
    )
  } catch {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    )
  }
}
