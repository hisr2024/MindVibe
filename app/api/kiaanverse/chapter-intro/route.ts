/**
 * Next.js API route for Kiaanverse chapter-intro endpoint.
 * Proxies to FastAPI backend for chapter data from STATIC CORE WISDOM.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chapter = searchParams.get('chapter')

    if (!chapter) {
      return NextResponse.json(
        { error: 'Missing chapter parameter' },
        { status: 400 }
      )
    }

    const backendRes = await fetch(
      `${BACKEND_URL}/api/kiaanverse/chapter-intro/${chapter}`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (!backendRes.ok) {
      const errorText = await backendRes.text()
      return NextResponse.json({ error: errorText }, { status: backendRes.status })
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[kiaanverse/chapter-intro] Proxy error:', error)
    return NextResponse.json(
      { error: 'Unable to retrieve chapter introduction' },
      { status: 503 }
    )
  }
}
