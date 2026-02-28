/**
 * Companion Voices Catalog - Next.js API Route
 * Proxies voice catalog requests to the backend companion voice service.
 */

import { NextRequest, NextResponse } from 'next/server'
import { forwardCookies, proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

export async function GET(request: NextRequest) {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/companion/voices`, {
      method: 'GET',
      headers: proxyHeaders(request),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return forwardCookies(backendResponse, NextResponse.json(data))
    }

    // Fallback voice catalog
    return NextResponse.json({
      voices: [
        { id: 'sarvam-aura', name: 'Aura', personality: 'Warm Sarvam AI companion for Indian and multilingual support', gender: 'female' },
        { id: 'sarvam-rishi', name: 'Rishi', personality: 'Grounded Sarvam AI guide for deep reflective sessions', gender: 'male' },
        { id: 'elevenlabs-nova', name: 'Nova', personality: 'Ultra-natural ElevenLabs-inspired global companion voice', gender: 'female' },
        { id: 'elevenlabs-orion', name: 'Orion', personality: 'Studio-grade ElevenLabs-inspired mentor voice', gender: 'male' },
      ],
      default_voice: 'sarvam-aura',
    })
  } catch {
    return NextResponse.json({
      voices: [
        { id: 'sarvam-aura', name: 'Aura', personality: 'Warm Sarvam AI companion for Indian and multilingual support', gender: 'female' },
        { id: 'elevenlabs-nova', name: 'Nova', personality: 'Ultra-natural ElevenLabs-inspired global companion voice', gender: 'female' },
      ],
      default_voice: 'sarvam-aura',
    })
  }
}
