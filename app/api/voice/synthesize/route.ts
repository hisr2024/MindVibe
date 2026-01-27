/**
 * Voice Synthesize API Route
 * Proxies TTS requests to the backend with fallback to browser synthesis
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, language = 'en', voice_type = 'friendly', speed = 1.0 } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required for synthesis' },
        { status: 400 }
      )
    }

    // Limit text length for safety
    const sanitizedText = text.slice(0, 5000)

    try {
      // Try backend TTS first
      const response = await fetch(`${BACKEND_URL}/api/voice/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sanitizedText,
          language,
          voice_type,
          speed,
        }),
      })

      if (response.ok) {
        // Return audio blob
        const audioBlob = await response.blob()
        return new NextResponse(audioBlob, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    } catch (backendError) {
      console.warn('[Voice API] Backend TTS failed, using browser fallback:', backendError)
    }

    // Return fallback indicator for browser-based TTS
    return NextResponse.json({
      fallback: true,
      text: sanitizedText,
      language,
      message: 'Use browser Speech Synthesis API',
    })
  } catch (error) {
    console.error('[Voice API] Synthesis error:', error)
    return NextResponse.json(
      { error: 'Failed to synthesize speech', fallback: true },
      { status: 500 }
    )
  }
}
