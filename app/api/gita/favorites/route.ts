/**
 * Gita Favorites API Route
 *
 * Handles saving/removing favorite Gita verses for the wisdom page.
 * Proxies to backend with local storage fallback.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieHeader = request.headers.get('cookie') || ''

    // Validate verse reference
    if (!body.chapter || !body.verse) {
      return NextResponse.json(
        { detail: 'chapter and verse are required' },
        { status: 400 }
      )
    }

    const backendResponse = await fetch(`${API_URL}/api/gita/favorites`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        chapter: body.chapter,
        verse: body.verse,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    // Silently acknowledge - favorite will be stored locally
    return NextResponse.json({
      success: true,
      queued: true,
    })
  } catch (error) {
    console.error('[Gita Favorites] Backend unavailable:', error instanceof Error ? error.message : 'Unknown error')

    return NextResponse.json({
      success: true,
      queued: true,
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''

    const backendResponse = await fetch(`${API_URL}/api/gita/favorites`, {
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

    return NextResponse.json({ favorites: [] })
  } catch (error) {
    console.error('[Gita Favorites] Failed to fetch:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ favorites: [] })
  }
}
