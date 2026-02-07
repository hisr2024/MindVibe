/**
 * Companion Voices Catalog - Next.js API Route
 * Proxies voice catalog requests to the backend companion voice service.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/companion/voices`, {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    // Fallback voice catalog
    return NextResponse.json({
      voices: [
        { id: 'priya', name: 'Priya', personality: 'Warm, empathetic best friend', gender: 'female' },
        { id: 'maya', name: 'Maya', personality: 'Calm, thoughtful listener', gender: 'female' },
        { id: 'ananya', name: 'Ananya', personality: 'Gentle, peaceful presence', gender: 'female' },
        { id: 'arjun', name: 'Arjun', personality: 'Strong, reassuring guide', gender: 'male' },
        { id: 'devi', name: 'Devi', personality: 'Joyful, uplifting spirit', gender: 'female' },
      ],
      default_voice: 'priya',
    })
  } catch {
    return NextResponse.json({
      voices: [
        { id: 'priya', name: 'Priya', personality: 'Warm, empathetic best friend', gender: 'female' },
        { id: 'maya', name: 'Maya', personality: 'Calm, thoughtful listener', gender: 'female' },
      ],
      default_voice: 'priya',
    })
  }
}
