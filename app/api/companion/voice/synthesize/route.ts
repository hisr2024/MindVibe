/**
 * Companion Voice Synthesis - Next.js API Route
 * Proxies voice synthesis requests to the backend companion voice service.
 * Returns audio bytes or browser fallback config.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/api/companion/voice/synthesize`, {
      method: 'POST',
      headers: proxyHeaders(request),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    if (backendResponse.ok) {
      const contentType = backendResponse.headers.get('content-type') || ''

      if (contentType.includes('audio')) {
        // Forward audio bytes directly
        const audioBuffer = await backendResponse.arrayBuffer()
        const audioResponse = new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'x-voice-provider': backendResponse.headers.get('x-voice-provider') || 'premium',
          },
        })
        return forwardCookies(backendResponse, audioResponse)
      }

      // Forward JSON (browser fallback config)
      const data = await backendResponse.json()
      return forwardCookies(backendResponse, NextResponse.json(data))
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
