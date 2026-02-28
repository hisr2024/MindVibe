/**
 * Single Journey API Proxy
 *
 * GET    /api/journeys/[id] → Get a single journey by ID
 * PUT    /api/journeys/[id] → Update a journey
 * DELETE /api/journeys/[id] → Delete a journey
 *
 * Proxies to the backend /api/journeys/:id endpoint.
 * Forwards Set-Cookie headers so CSRF tokens reach the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/journeys/${encodeURIComponent(id)}`,
      { method: 'GET', headers: proxyHeaders(request), signal: AbortSignal.timeout(10000) }
    )
    const data = await response.json().catch(() => ({}))
    return forwardCookies(response, NextResponse.json(data, { status: response.status }))
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.text()
    const response = await fetch(
      `${BACKEND_URL}/api/journeys/${encodeURIComponent(id)}`,
      { method: 'PUT', headers: proxyHeaders(request), body: body || undefined, signal: AbortSignal.timeout(10000) }
    )
    if (response.status === 204) {
      return forwardCookies(response, new NextResponse(null, { status: 204 }))
    }
    const data = await response.json().catch(() => ({}))
    return forwardCookies(response, NextResponse.json(data, { status: response.status }))
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/journeys/${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: proxyHeaders(request), signal: AbortSignal.timeout(10000) }
    )
    if (response.status === 204) {
      return forwardCookies(response, new NextResponse(null, { status: 204 }))
    }
    const data = await response.json().catch(() => ({}))
    return forwardCookies(response, NextResponse.json(data, { status: response.status }))
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}
