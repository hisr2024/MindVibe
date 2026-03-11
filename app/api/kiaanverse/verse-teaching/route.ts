/**
 * Next.js API route for Kiaanverse verse-teaching endpoint.
 * Proxies to FastAPI backend for verse data from STATIC CORE WISDOM.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chapter = searchParams.get('chapter')
    const verse = searchParams.get('verse')

    if (!chapter || !verse) {
      return NextResponse.json(
        { error: 'Missing chapter or verse parameter' },
        { status: 400 }
      )
    }

    const backendRes = await fetch(
      `${BACKEND_URL}/api/kiaanverse/verse-teaching/${chapter}/${verse}`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (!backendRes.ok) {
      const errorText = await backendRes.text()
      return NextResponse.json({ error: errorText }, { status: backendRes.status })
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[kiaanverse/verse-teaching] Proxy error:', error)
    return NextResponse.json(
      { error: 'Unable to retrieve verse teaching' },
      { status: 503 }
    )
  }
}
