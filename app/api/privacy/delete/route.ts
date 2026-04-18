/**
 * GDPR Account Deletion API Route (Art. 17 — Right to Erasure)
 *
 * POST  /api/privacy/delete         — initiate 30-day deletion grace period
 * PATCH /api/privacy/delete          — cancel deletion during grace period
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/privacy/delete`,
      {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      }
    )

    const data = await backendResponse.json().catch(() => ({}))

    if (backendResponse.status === 401) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })
    }

    return forwardCookies(
      backendResponse,
      NextResponse.json(data, { status: backendResponse.status })
    )
  } catch (error) {
    console.error('[Privacy Delete POST] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { detail: 'Account deletion is temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/privacy/delete/cancel`,
      {
        method: 'POST',
        headers: proxyHeaders(request, 'POST'),
        signal: AbortSignal.timeout(30_000),
      }
    )

    const data = await backendResponse.json().catch(() => ({}))
    return forwardCookies(
      backendResponse,
      NextResponse.json(data, { status: backendResponse.status })
    )
  } catch (error) {
    console.error('[Privacy Delete PATCH] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { detail: 'Unable to cancel deletion. Please try again later.' },
      { status: 503 }
    )
  }
}
