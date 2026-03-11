/**
 * Next.js API route for Kiaanverse ask-krishna endpoint.
 * Proxies to FastAPI backend's KIAAN Krishna VR persona service.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendRes = await fetch(`${BACKEND_URL}/api/kiaanverse/ask-krishna`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!backendRes.ok) {
      const errorText = await backendRes.text()
      console.error(`[kiaanverse/ask-krishna] Backend error ${backendRes.status}: ${errorText}`)
      return NextResponse.json(
        { error: errorText },
        { status: backendRes.status }
      )
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[kiaanverse/ask-krishna] Proxy error:', error)
    return NextResponse.json(
      { error: "Krishna's wisdom is momentarily unreachable. Please try again." },
      { status: 503 }
    )
  }
}
