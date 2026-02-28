/**
 * GDPR Account Deletion API Route
 *
 * Handles GDPR-compliant account deletion requests.
 * Proxies to backend - this is a destructive operation that requires
 * backend confirmation. Supports idempotency keys to prevent duplicate deletions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

// Track processed idempotency keys to prevent duplicate deletions (TTL: 1 hour)
const processedKeys = new Map<string, { status: number; body: Record<string, unknown>; expiresAt: number }>()

function cleanExpiredKeys() {
  const now = Date.now()
  for (const [key, entry] of processedKeys) {
    if (now > entry.expiresAt) processedKeys.delete(key)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.confirm) {
      return NextResponse.json(
        { detail: 'Deletion must be explicitly confirmed' },
        { status: 400 }
      )
    }

    // Idempotency: if client sends the same key twice, return cached result
    const idempotencyKey = request.headers.get('idempotency-key')
    if (idempotencyKey) {
      cleanExpiredKeys()
      const cached = processedKeys.get(idempotencyKey)
      if (cached) {
        return NextResponse.json(cached.body, { status: cached.status })
      }
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/gdpr/delete-account`, {
      method: 'POST',
      headers: proxyHeaders(request, 'POST'),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      if (idempotencyKey) {
        processedKeys.set(idempotencyKey, { status: 200, body: data, expiresAt: Date.now() + 3600_000 })
      }
      return forwardCookies(backendResponse, NextResponse.json(data))
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
