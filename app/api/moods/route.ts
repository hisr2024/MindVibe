/**
 * Moods API Route
 *
 * Handles mood check-in submissions from the mobile home page.
 * Proxies to backend mood service with offline queue support.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieHeader = request.headers.get('cookie') || ''

    // Validate score is in range
    const score = body.score
    if (typeof score !== 'number' || score < -2 || score > 2) {
      return NextResponse.json(
        { detail: 'Score must be a number between -2 and 2' },
        { status: 400 }
      )
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/moods`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        score,
        timestamp: body.timestamp || new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    if (backendResponse.status === 401) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      )
    }

    // If backend is unavailable, acknowledge the mood anyway
    // The offline sync service will retry later
    return NextResponse.json({
      success: true,
      queued: true,
      message: 'Mood recorded locally, will sync when connection is restored',
    })
  } catch (error) {
    console.error('[Moods] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')

    // Graceful degradation - acknowledge the mood
    return NextResponse.json({
      success: true,
      queued: true,
      message: 'Mood recorded locally, will sync when connection is restored',
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'

    const backendResponse = await fetch(`${BACKEND_URL}/api/moods?period=${period}`, {
      method: 'GET',
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

    return NextResponse.json({ moods: [], trend: 'stable' })
  } catch (error) {
    console.error('[Moods] Failed to fetch:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ moods: [], trend: 'stable' })
  }
}
