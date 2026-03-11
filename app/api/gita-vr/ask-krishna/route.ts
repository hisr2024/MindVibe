/**
 * Next.js API proxy for the Gita VR ask-krishna endpoint.
 * Forwards requests to the FastAPI backend.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendRes = await fetch(`${BACKEND_URL}/api/gita-vr/ask-krishna`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!backendRes.ok) {
      const errorText = await backendRes.text()
      console.error(`[gita-vr/ask-krishna] Backend error ${backendRes.status}: ${errorText}`)
      return NextResponse.json(
        { error: errorText },
        { status: backendRes.status }
      )
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[gita-vr/ask-krishna] Proxy error:', error)
    return NextResponse.json(
      { error: "Krishna's wisdom is momentarily unreachable. Please try again." },
      { status: 503 }
    )
  }
}
