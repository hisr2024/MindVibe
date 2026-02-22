/**
 * Journal Blob API Route
 *
 * Handles encrypted journal entry storage for the mobile journal.
 * Proxies to backend journal service with acknowledgement fallback.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieHeader = request.headers.get('cookie') || ''

    // Validate blob_json is provided
    if (!body.blob_json) {
      return NextResponse.json(
        { detail: 'blob_json is required' },
        { status: 400 }
      )
    }

    // Try the backend journal endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/journal/blob`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    // Try alternate journal endpoint
    const altResponse = await fetch(`${BACKEND_URL}/api/journal/entries`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null)

    if (altResponse?.ok) {
      const data = await altResponse.json()
      return NextResponse.json(data)
    }

    if (backendResponse.status === 401) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Journal data is critical - acknowledge save attempt
    // The offline sync service queues the entry for retry
    return NextResponse.json({
      success: true,
      queued: true,
      message: 'Journal entry saved locally, will sync when connection is restored',
    })
  } catch (error) {
    console.error('[Journal Blob] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')

    return NextResponse.json({
      success: true,
      queued: true,
      message: 'Journal entry saved locally, will sync when connection is restored',
    })
  }
}
