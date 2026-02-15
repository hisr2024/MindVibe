/**
 * Companion Voice Synthesis - Next.js API Route
 * Proxies voice synthesis requests to the backend companion voice service.
 * Returns audio bytes or browser fallback config.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Build headers including both cookie and Authorization for auth flexibility
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const cookie = request.headers.get('cookie')
    if (cookie) headers.cookie = cookie
    const authorization = request.headers.get('authorization')
    if (authorization) headers.authorization = authorization

    const backendResponse = await fetch(`${BACKEND_URL}/api/companion/voice/synthesize`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    if (backendResponse.ok) {
      const contentType = backendResponse.headers.get('content-type') || ''

      if (contentType.includes('audio')) {
        // Forward audio bytes directly
        const audioBuffer = await backendResponse.arrayBuffer()
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'x-voice-provider': backendResponse.headers.get('x-voice-provider') || 'premium',
          },
        })
      }

      // Forward JSON (browser fallback config)
      const data = await backendResponse.json()
      return NextResponse.json(data)
    }

    // Backend error - suggest browser fallback with voice config from request
    return NextResponse.json({
      fallback_to_browser: true,
      browser_config: { rate: 0.93, pitch: 0, voice_id: body.voice_id, language: body.language },
    })
  } catch {
    return NextResponse.json({
      fallback_to_browser: true,
      browser_config: { rate: 0.93, pitch: 0 },
    })
  }
}
