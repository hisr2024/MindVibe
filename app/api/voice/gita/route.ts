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
 *
 * When all TTS providers are unavailable, returns JSON with { fallback: true }
 * The KIAAN Vibe Player pre-fetches and detects this, falling back to browser
 * Speech Synthesis API for a seamless reading experience.
 */

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/** Timeout for backend TTS calls (8s to keep UX responsive) */
const BACKEND_TIMEOUT_MS = 8000

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
 * Create a JSON fallback response with proper headers.
 * The player detects non-audio content-type and uses browser TTS instead.
 */
function createFallbackResponse(text: string, language: string): NextResponse {
  return NextResponse.json(
    {
      fallback: true,
      text,
      language,
      message: 'Use browser Speech Synthesis API as fallback',
    },
    {
      headers: {
        'X-Fallback': 'true',
        'Cache-Control': 'no-cache',
      },
    }
  )
}

/**
 * GET handler - Stream synthesized audio for a Gita verse.
 * Used as the Track.src URL by the KIAAN Vibe Player.
 *
 * The player pre-fetches this URL via fetch() and checks the content-type.
 * If audio/* is returned, it creates a blob URL for the <audio> element.
 * If JSON is returned (fallback), it uses browser Speech Synthesis instead.
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

    // Fallback: signal to client to use browser Speech Synthesis
    return createFallbackResponse(sanitizedText, ttsLanguage)

  } catch (error) {
    console.error('[GitaVoice API] Synthesis error:', error)
    return createFallbackResponse(sanitizedText, ttsLanguage)
  }
}

/**
 * POST handler - Advanced Sanskrit shloka synthesis.
 * Uses the divine voice orchestrator for Vedic pronunciation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shloka, chandas = 'anushtubh', with_meaning, meaning_text } = body

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
        signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
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
            },
          })
        }
      }
    } catch (shlokaError) {
      console.warn('[GitaVoice API] Divine shloka endpoint failed:', shlokaError)
    }

    // Fallback: use standard synthesis with Hindi voice for Sanskrit
    const fallbackResult = await synthesizeViaBackend(
      request, sanitizedShloka, 'hi', 'wisdom', 0.85
    )
    if (fallbackResult) return fallbackResult

    return createFallbackResponse(sanitizedShloka, 'hi')

  } catch (error) {
    console.error('[GitaVoice API] POST error:', error)
    return createFallbackResponse('', 'hi')
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
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
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
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })

    if (response.ok) {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('audio/')) {
        const audioBlob = await response.blob()
        return new NextResponse(audioBlob, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=604800',
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

  return createFallbackResponse(bilingualText, ttsLanguage)
}
