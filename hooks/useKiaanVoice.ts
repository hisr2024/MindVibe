/**
 * useKiaanVoice - Universal Voice Integration Hook
 *
 * Provides voice interaction capabilities to any component in the app.
 * Combines voice input (STT), voice output (TTS), and power management.
 *
 * TTS Strategy:
 * - speakInstant(): Browser SpeechSynthesis for immediate local responses (~200ms)
 * - speak(): Backend premium TTS for enhanced responses (higher quality)
 *
 * Power Management:
 * - Pauses mic/TTS when tab is hidden (visibilitychange)
 * - Resumes when tab becomes visible
 *
 * Usage:
 *   const { speak, speakInstant, startListening, stopListening } = useKiaanVoice()
 *   speakInstant('I understand how you feel...') // instant browser voice
 *   speak('Here is deeper wisdom...')            // premium backend voice
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { getSavedVoice, getSavedLanguage } from '@/utils/voice/voiceCatalog'
import { apiFetch } from '@/lib/api'
import { stopAllAudio } from '@/utils/audio/universalAudioStop'

export interface UseKiaanVoiceOptions {
  language?: string
  voiceId?: string
  mood?: string
  preferDivine?: boolean
  onSpeakEnd?: () => void
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
}

export interface UseKiaanVoiceReturn {
  /** Speak with premium backend TTS (enhanced quality, 100-500ms latency) */
  speak: (text: string, mood?: string) => Promise<void>
  /** Speak instantly with browser TTS (lower quality, ~0ms latency) */
  speakInstant: (text: string) => void
  startListening: () => void
  stopListening: () => void
  stopAll: () => void
  isSpeaking: boolean
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  activeVoiceId: string
  activeLanguage: string
  /** Current STT provider: 'moonshine' | 'whisper' | 'web-speech-api' */
  sttProvider: string
  /** Device capability tier: 'high' | 'mid' | 'low' */
  deviceTier: string
}

export function useKiaanVoice(options: UseKiaanVoiceOptions = {}): UseKiaanVoiceReturn {
  const {
    mood = 'neutral',
    onSpeakEnd,
    onTranscript,
    onError,
  } = options

  const language = options.language || (typeof window !== 'undefined' ? getSavedLanguage() : 'en')
  const voiceId = options.voiceId || (typeof window !== 'undefined' ? getSavedVoice().id : 'sarvam-aura')

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const wasListeningRef = useRef(false)

  // Browser TTS (instant, for local responses)
  const {
    speak: speakBrowser,
    cancel: cancelBrowserSpeech,
    isSpeaking: isBrowserSpeaking,
    isSupported: isTTSSupported,
  } = useVoiceOutput({
    language,
    rate: 0.95,
    onEnd: () => {
      setIsSpeaking(false)
      onSpeakEnd?.()
    },
  })

  // Voice input (STT with tiered on-device fallback)
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSTTSupported,
    startListening: startSTT,
    stopListening: stopSTT,
    resetTranscript,
    sttProvider,
    deviceTier,
  } = useVoiceInput({
    language,
    onTranscript: useCallback((text: string, isFinal: boolean) => {
      if (isFinal && text.trim()) {
        onTranscript?.(text.trim())
      }
    }, [onTranscript]),
    onError: useCallback((err: string) => {
      if (!err.toLowerCase().includes('no speech')) {
        setError(err)
        onError?.(err)
      }
    }, [onError]),
  })

  // ─── Page Visibility Power Management ──────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // Pause everything when tab is hidden
        if (isListening) {
          wasListeningRef.current = true
          stopSTT()
        }
        cancelBrowserSpeech()
        if (audioRef.current) {
          audioRef.current.pause()
        }
      } else if (document.visibilityState === 'visible') {
        // Resume listening if it was active before hiding
        if (wasListeningRef.current) {
          wasListeningRef.current = false
          startSTT()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isListening, stopSTT, startSTT, cancelBrowserSpeech])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  /**
   * Speak instantly using browser's native SpeechSynthesis.
   * ~0ms network latency. Use for local engine responses.
   */
  const speakInstant = useCallback((text: string) => {
    if (!text.trim()) return
    cancelBrowserSpeech()
    setIsSpeaking(true)
    setError(null)
    speakBrowser(text)
  }, [speakBrowser, cancelBrowserSpeech])

  /**
   * Speak using premium backend TTS (EdgeTTS / Sarvam).
   * Higher quality voice, 100-500ms network latency.
   * Falls back to browser TTS if backend unavailable.
   */
  const speak = useCallback(async (text: string, speakMood?: string) => {
    if (!text.trim()) return

    stopAllAudio()
    cancelBrowserSpeech()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setIsSpeaking(true)
    setError(null)

    try {
      const response = await apiFetch('/api/companion/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mood: speakMood || mood,
          voice_id: voiceId,
          language,
        }),
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('audio')) {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio

          audio.onended = () => {
            URL.revokeObjectURL(url)
            audioRef.current = null
            setIsSpeaking(false)
            onSpeakEnd?.()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(url)
            audioRef.current = null
            // Fall back to browser TTS
            speakBrowser(text)
          }

          await audio.play()
          return
        }
      }
    } catch {
      // Backend unavailable — fall through to browser TTS
    }

    // Fallback to browser TTS
    speakBrowser(text)
  }, [mood, voiceId, language, speakBrowser, cancelBrowserSpeech, onSpeakEnd])

  const startListening = useCallback(() => {
    setError(null)
    resetTranscript()
    startSTT()
  }, [startSTT, resetTranscript])

  const stopListening = useCallback(() => {
    stopSTT()
  }, [stopSTT])

  const stopAll = useCallback(() => {
    stopSTT()
    cancelBrowserSpeech()
    stopAllAudio()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
  }, [stopSTT, cancelBrowserSpeech])

  return {
    speak,
    speakInstant,
    startListening,
    stopListening,
    stopAll,
    isSpeaking: isSpeaking || isBrowserSpeaking,
    isListening,
    isSupported: isSTTSupported || isTTSSupported,
    transcript,
    interimTranscript,
    error,
    activeVoiceId: voiceId,
    activeLanguage: language,
    sttProvider,
    deviceTier,
  }
}
