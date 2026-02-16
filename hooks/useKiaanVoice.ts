/**
 * useKiaanVoice - Universal Voice Integration Hook
 *
 * Provides voice interaction capabilities to any component in the app.
 * Combines voice input (STT), voice output (TTS via backend + browser fallback),
 * and wake word awareness into a single easy-to-use hook.
 *
 * Usage:
 *   const { speak, listen, isListening, isSpeaking } = useKiaanVoice()
 *   speak('Namaste! How can I help you today?')
 *   listen((transcript) => handleUserSpeech(transcript))
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { getSavedVoice, getSavedLanguage } from '@/utils/voice/voiceCatalog'
import { apiFetch } from '@/lib/api'
import { stopAllAudio } from '@/utils/audio/universalAudioStop'

export interface UseKiaanVoiceOptions {
  /** Language override (defaults to user's saved preference) */
  language?: string
  /** Voice ID override (defaults to user's saved voice) */
  voiceId?: string
  /** Mood for emotion-adaptive voice (defaults to 'neutral') */
  mood?: string
  /** Whether to prefer divine voice mode */
  preferDivine?: boolean
  /** Called when KIAAN finishes speaking */
  onSpeakEnd?: () => void
  /** Called when voice input produces a final transcript */
  onTranscript?: (text: string) => void
  /** Called on any voice error */
  onError?: (error: string) => void
}

export interface UseKiaanVoiceReturn {
  /** Speak text using KIAAN's voice (backend TTS → browser fallback) */
  speak: (text: string, mood?: string) => Promise<void>
  /** Start listening for voice input */
  startListening: () => void
  /** Stop listening for voice input */
  stopListening: () => void
  /** Stop all audio (speaking + listening) */
  stopAll: () => void
  /** Whether KIAAN is currently speaking */
  isSpeaking: boolean
  /** Whether mic is actively listening */
  isListening: boolean
  /** Whether voice features are supported */
  isSupported: boolean
  /** Current voice transcript (interim or final) */
  transcript: string
  /** Current interim transcript */
  interimTranscript: string
  /** Any error message */
  error: string | null
  /** The user's selected voice ID */
  activeVoiceId: string
  /** The user's selected language */
  activeLanguage: string
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

  // Browser TTS fallback
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

  // Voice input (STT)
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSTTSupported,
    startListening: startSTT,
    stopListening: stopSTT,
    resetTranscript,
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

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  /**
   * Speak text using KIAAN's voice.
   * Tries backend premium TTS first, falls back to browser SpeechSynthesis.
   */
  const speak = useCallback(async (text: string, speakMood?: string) => {
    if (!text.trim()) return

    // Stop any currently playing audio
    stopAllAudio()
    cancelBrowserSpeech()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setIsSpeaking(true)
    setError(null)

    // Try backend premium voice synthesis
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
  }
}
