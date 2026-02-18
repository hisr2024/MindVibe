/**
 * GDPR Account Deletion API Route
 *
 * Handles GDPR-compliant account deletion requests.
 * Proxies to backend - this is a destructive operation that requires
 * backend confirmation.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieHeader = request.headers.get('cookie') || ''

    if (!body.confirm) {
      return NextResponse.json(
        { detail: 'Deletion must be explicitly confirmed' },
        { status: 400 }
      )
    }

    const backendResponse = await fetch(`${API_URL}/api/gdpr/delete-account`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
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

    return NextResponse.json(
      { detail: 'Account deletion is temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  } catch (error) {
    console.error('[GDPR Delete] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { detail: 'Account deletion is temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  }
}
