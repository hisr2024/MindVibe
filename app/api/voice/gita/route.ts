/**
 * Gita Divine Voice Synthesis API Route
 *
 * Handles multi-language TTS for Bhagavad Gita verses.
 * Supports Sanskrit shloka recitation with Vedic meter,
 * bilingual mode (Sanskrit + translation), and single-language synthesis.
 *
 * GET: Stream audio for a specific verse (used by the player Track src)
 * POST: Synthesize Sanskrit shloka with advanced phonology
 *
 * Provider Priority:
 *   Sanskrit/Hindi → /api/voice/divine/shloka (Sarvam AI) → /api/voice/synthesize (fallback)
 *   English/Others → /api/voice/synthesize (Google Neural2 / ElevenLabs)
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/** Voice style to backend voice_type mapping */
const STYLE_TO_VOICE_TYPE: Record<string, string> = {
  divine: 'wisdom',
  calm: 'calm',
  wisdom: 'wisdom',
  chanting: 'calm',
  friendly: 'friendly',
}

/** Voice style to optimal speed mapping */
const STYLE_TO_SPEED: Record<string, number> = {
  divine: 0.85,
  calm: 0.90,
  wisdom: 0.92,
  chanting: 0.80,
  friendly: 0.97,
}

/**
 * GET handler - Stream synthesized audio for a Gita verse.
 * Used as the Track.src URL by the KIAAN Vibe Player.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get('text')
  const language = searchParams.get('language') || 'sa'
  const style = searchParams.get('style') || 'divine'
  const speed = parseFloat(searchParams.get('speed') || '0')
  const mode = searchParams.get('mode') || 'single'
  const sanskrit = searchParams.get('sanskrit') || ''
  const translation = searchParams.get('translation') || ''

  if (!text) {
    return NextResponse.json(
      { error: 'Text parameter is required' },
      { status: 400 }
    )
  }

  const sanitizedText = text.slice(0, 10000)
  const voiceType = STYLE_TO_VOICE_TYPE[style] || 'wisdom'
  const effectiveSpeed = speed > 0 ? speed : (STYLE_TO_SPEED[style] || 0.88)

  // Determine TTS language code (Sanskrit uses Hindi as closest phonetic match)
  const ttsLanguage = language === 'sa' ? 'hi' : language

  try {
    // For bilingual mode: synthesize Sanskrit first, then translation
    if (mode === 'bilingual' && sanskrit && translation) {
      return await synthesizeBilingual(
        request, sanskrit, translation, language, voiceType, effectiveSpeed
      )
    }

    // For Sanskrit text, try the divine shloka endpoint first
    if (language === 'sa') {
      const shlokaResult = await tryShlokaSynthesis(request, sanitizedText)
      if (shlokaResult) return shlokaResult
    }

    // Standard synthesis via backend
    const audioResponse = await synthesizeViaBackend(
      request, sanitizedText, ttsLanguage, voiceType, effectiveSpeed
    )
    if (audioResponse) return audioResponse

    // Fallback: return indicator for browser-based TTS
    return NextResponse.json({
      fallback: true,
      text: sanitizedText,
      language: ttsLanguage,
      message: 'Use browser Speech Synthesis API as fallback',
    })

  } catch (error) {
    console.error('[GitaVoice API] Synthesis error:', error)
    return NextResponse.json(
      { error: 'Failed to synthesize Gita verse audio', fallback: true },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Advanced Sanskrit shloka synthesis.
 * Uses the divine voice orchestrator for Vedic pronunciation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shloka, chandas = 'anushtubh', with_meaning, meaning_text, mode } = body

    if (!shloka || typeof shloka !== 'string') {
      return NextResponse.json(
        { error: 'Shloka text is required' },
        { status: 400 }
      )
    }

    const sanitizedShloka = shloka.slice(0, 5000)

    // Try the divine shloka endpoint on the backend
    try {
      const response = await fetch(`${BACKEND_URL}/api/voice/divine/shloka`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          shloka: sanitizedShloka,
          chandas,
          with_meaning: with_meaning || false,
          meaning_text: meaning_text || '',
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        return new NextResponse(audioBlob, {
          status: 200,
          headers: {
            'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
            'Cache-Control': 'public, max-age=2592000', // 30 days (verses don't change)
          },
        })
      }
    } catch (shlokaError) {
      console.warn('[GitaVoice API] Divine shloka endpoint failed:', shlokaError)
    }

    // Fallback: use standard synthesis with Hindi voice for Sanskrit
    const fallbackResult = await synthesizeViaBackend(
      request, sanitizedShloka, 'hi', 'wisdom', 0.85
    )
    if (fallbackResult) return fallbackResult

    return NextResponse.json({
      fallback: true,
      text: sanitizedShloka,
      language: 'hi',
      message: 'Use browser Speech Synthesis API for Sanskrit',
    })

  } catch (error) {
    console.error('[GitaVoice API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to synthesize shloka', fallback: true },
      { status: 500 }
    )
  }
}

// ============ Internal Helpers ============

/**
 * Try synthesizing Sanskrit shloka via the divine shloka endpoint.
 * Returns Response or null if endpoint unavailable.
 */
async function tryShlokaSynthesis(
  request: NextRequest,
  text: string,
): Promise<NextResponse | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/voice/divine/shloka`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        shloka: text,
        chandas: 'anushtubh',
        with_meaning: false,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('audio/')) {
        const audioBlob = await response.blob()
        return new NextResponse(audioBlob, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=2592000',
            'X-Provider': response.headers.get('X-Provider') || 'sarvam-ai',
            'X-Quality-Score': response.headers.get('X-Quality-Score') || '9.5',
          },
        })
      }
    }
  } catch {
    // Shloka endpoint unavailable, will fallback
  }
  return null
}

/**
 * Synthesize audio via the standard backend TTS endpoint.
 * Returns Response or null if backend unavailable.
 */
async function synthesizeViaBackend(
  request: NextRequest,
  text: string,
  language: string,
  voiceType: string,
  speed: number,
): Promise<NextResponse | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/voice/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        text,
        language,
        voice_type: voiceType,
        speed,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('audio/')) {
        const audioBlob = await response.blob()
        return new NextResponse(audioBlob, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=604800', // 7 days
          },
        })
      }
    }
  } catch (error) {
    console.warn('[GitaVoice API] Backend synthesis failed:', error)
  }
  return null
}

/**
 * Synthesize bilingual audio: Sanskrit recitation + translation.
 * Attempts to synthesize each part separately and combine.
 * Falls back to combined text if separate synthesis fails.
 */
async function synthesizeBilingual(
  request: NextRequest,
  sanskrit: string,
  translation: string,
  targetLanguage: string,
  voiceType: string,
  speed: number,
): Promise<NextResponse> {
  // Try to synthesize the combined bilingual text
  // The backend handles Sanskrit → pause → translation flow
  const bilingualText = `${sanskrit}\n\n${translation}`
  const ttsLanguage = targetLanguage === 'sa' ? 'hi' : targetLanguage

  const result = await synthesizeViaBackend(
    request, bilingualText, ttsLanguage, voiceType, speed
  )
  if (result) return result

  // If bilingual synthesis fails, try just the Sanskrit part
  const sanskritResult = await tryShlokaSynthesis(request, sanskrit)
  if (sanskritResult) return sanskritResult

  // Final fallback
  const fallbackResult = await synthesizeViaBackend(
    request, sanskrit, 'hi', 'wisdom', 0.85
  )
  if (fallbackResult) return fallbackResult

  return NextResponse.json({
    fallback: true,
    text: bilingualText,
    language: ttsLanguage,
    message: 'Use browser Speech Synthesis API',
  })
}
