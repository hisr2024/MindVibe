/**
 * Voice Transcribe API Route — Server-side STT Fallback
 *
 * Provides a backend transcription endpoint for browsers that lack
 * native Web Speech API support (Firefox, older mobile browsers).
 *
 * Flow:
 * 1. Client records audio via MediaRecorder API
 * 2. Sends audio blob to this endpoint
 * 3. This route proxies to the backend STT service (Whisper/Sarvam)
 * 4. Returns transcript text with confidence score
 *
 * Privacy: Audio is streamed to the backend for processing and NOT stored.
 * The backend processes in-memory and returns only text.
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyHeaders, BACKEND_URL } from '@/lib/proxy-utils'

/** Maximum audio size: 10MB */
const MAX_AUDIO_SIZE = 10 * 1024 * 1024

/** Supported audio MIME types */
const SUPPORTED_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  'audio/mp4',
  'audio/mpeg',
]

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // Handle multipart form data (audio file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const audioFile = formData.get('audio') as File | null
      const language = (formData.get('language') as string) || 'en'

      if (!audioFile) {
        return NextResponse.json(
          { transcript: '', confidence: null, language, error: 'Audio file is required' },
          { status: 400 },
        )
      }

      // Validate file size
      if (audioFile.size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { transcript: '', confidence: null, language, error: 'Audio file too large. Maximum 10MB allowed.' },
          { status: 413 },
        )
      }

      // Validate MIME type
      const mimeType = audioFile.type
      if (mimeType && !SUPPORTED_TYPES.some((t) => mimeType.startsWith(t))) {
        return NextResponse.json(
          { transcript: '', confidence: null, language, error: `Unsupported audio format: ${mimeType}` },
          { status: 415 },
        )
      }

      // Forward to backend STT service
      const backendFormData = new FormData()
      backendFormData.append('audio', audioFile)
      backendFormData.append('language', language)

      try {
        const response = await fetch(`${BACKEND_URL}/api/kiaan/transcribe`, {
          method: 'POST',
          headers: {
            // Don't set Content-Type — fetch handles multipart boundary automatically
            ...Object.fromEntries(
              Object.entries(proxyHeaders(request, 'POST')).filter(
                ([key]) => key.toLowerCase() !== 'content-type',
              ),
            ),
          },
          body: backendFormData,
          signal: AbortSignal.timeout(60000),
        })

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({
            transcript: data.transcript || data.text || '',
            confidence: data.confidence ?? null,
            language: data.language || language,
          })
        }

        // Backend returned an error
        const errorData = await response.json().catch(() => ({}))
        return NextResponse.json(
          {
            transcript: '',
            confidence: null,
            language,
            error: errorData.detail || 'Transcription service unavailable',
          },
          { status: response.status },
        )
      } catch {
        // Backend unreachable — return graceful fallback
        return NextResponse.json(
          {
            transcript: '',
            confidence: null,
            language,
            error:
              "Transcription service is temporarily unavailable. Please use the browser's built-in voice input or type your message.",
            fallback: 'browser',
          },
          { status: 503 },
        )
      }
    }

    // JSON body fallback (for pre-recorded base64 audio)
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { audio_base64, audio, language = 'en', format = 'webm' } = body
      const audioPayload = audio_base64 || audio

      if (!audioPayload || typeof audioPayload !== 'string') {
        return NextResponse.json(
          {
            transcript: '',
            confidence: null,
            language,
            error: 'audio or audio_base64 field is required',
          },
          { status: 400 },
        )
      }

      // Size check on base64 (roughly 4/3 of original)
      if (audioPayload.length > MAX_AUDIO_SIZE * 1.4) {
        return NextResponse.json(
          {
            transcript: '',
            confidence: null,
            language,
            error: 'Audio data too large',
          },
          { status: 413 },
        )
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/kiaan/transcribe`, {
          method: 'POST',
          headers: proxyHeaders(request, 'POST'),
          body: JSON.stringify({ audio: audioPayload, language, format }),
          signal: AbortSignal.timeout(60000),
        })

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({
            transcript: data.transcript || data.text || '',
            confidence: data.confidence ?? null,
            language: data.language || language,
          })
        }

        const errorData = await response.json().catch(() => ({}))
        return NextResponse.json(
          {
            transcript: '',
            confidence: null,
            language,
            error: errorData.detail || 'Transcription failed',
          },
          { status: response.status },
        )
      } catch {
        return NextResponse.json(
          {
            transcript: '',
            confidence: null,
            language,
            error: 'Transcription service temporarily unavailable.',
            fallback: 'browser',
          },
          { status: 503 },
        )
      }
    }

    return NextResponse.json(
      { transcript: '', confidence: null, language: 'en', error: 'Unsupported content type. Send multipart/form-data or application/json.' },
      { status: 415 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { transcript: '', confidence: null, language: 'en', error: message },
      { status: 500 },
    )
  }
}
