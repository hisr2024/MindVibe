/**
 * Companion Voice Synthesis - Next.js API Route
 *
 * Proxies voice synthesis requests to the KIAAN voice companion backend.
 * Returns audio bytes from premium TTS providers (ElevenLabs, Sarvam AI,
 * Edge TTS) or a browser fallback config when premium audio is unavailable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/api/voice-companion/synthesize`, {
      method: 'POST',
      headers: proxyHeaders(request, 'POST'),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    if (backendResponse.ok) {
      const contentType = backendResponse.headers.get('content-type') || ''

      if (contentType.includes('audio')) {
        try {
          const audioBuffer = await backendResponse.arrayBuffer()
          if (audioBuffer.byteLength === 0) {
            return NextResponse.json({
              fallback_to_browser: true,
              browser_config: { rate: 0.93, pitch: 0 },
            })
          }
          const audioResponse = new NextResponse(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'x-voice-provider': backendResponse.headers.get('x-voice-provider') || 'premium',
              'x-voice-persona': backendResponse.headers.get('x-voice-persona') || 'unknown',
            },
          })
          return forwardCookies(backendResponse, audioResponse)
        } catch {
          return NextResponse.json({
            fallback_to_browser: true,
            browser_config: { rate: 0.93, pitch: 0 },
          })
        }
      }

      const data = await backendResponse.json().catch(() => null)
      if (data) return forwardCookies(backendResponse, NextResponse.json(data))
    }

    return NextResponse.json({
      fallback_to_browser: true,
      browser_config: { rate: 0.93, pitch: 0 },
    })
  } catch {
    return NextResponse.json({
      fallback_to_browser: true,
      browser_config: { rate: 0.93, pitch: 0 },
    })
  }
}
