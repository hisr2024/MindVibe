/**
 * Hook for managing voice input (Speech-to-Text)
 *
 * Tiered fallback chain:
 * 1. On-device STT (Moonshine/Whisper) for Tier 1/2 devices
 * 2. Web Speech API for Tier 3 devices or fallback
 *
 * Tier 3 (budget phones): zero extra RAM, uses browser-native STT only.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SpeechRecognitionService } from '@/utils/speech/recognition'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'
import { canUseVoiceInput, isSecureContext, getBrowserName } from '@/utils/browserSupport'
import { useOnDeviceSTT } from '@/hooks/useOnDeviceSTT'

export interface UseVoiceInputOptions {
  language?: string
  onTranscript?: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  autoSend?: boolean
}

export interface UseVoiceInputReturn {
  isListening: boolean
  transcript: string
  interimTranscript: string
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  /** Which STT provider is active */
  sttProvider: string
  /** Device capability tier */
  deviceTier: string
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { language = 'en', onTranscript, onError } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isWebSpeechSupported] = useState(() => isSpeechRecognitionSupported())

  const recognitionRef = useRef<SpeechRecognitionService | null>(null)
  const usingOnDeviceRef = useRef(false)

  // On-device STT (Tier 1/2 — zero overhead for Tier 3)
  const onDeviceSTT = useOnDeviceSTT({
    language,
    onTranscript: useCallback((text: string, isFinal: boolean) => {
      if (!usingOnDeviceRef.current) return
      if (isFinal) {
        setTranscript(text)
        setInterimTranscript('')
        onTranscript?.(text, true)
      } else {
        setInterimTranscript(text)
        onTranscript?.(text, false)
      }
    }, [onTranscript]),
    onError: useCallback((err: string) => {
      // On-device failed → fall back to Web Speech API silently
      usingOnDeviceRef.current = false
      onError?.(err)
    }, [onError]),
  })

  // Web Speech API fallback (initialize only if needed)
  useEffect(() => {
    if (!isWebSpeechSupported) return

    recognitionRef.current = new SpeechRecognitionService({
      language,
      continuous: true,
      interimResults: true,
    })

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.destroy()
        recognitionRef.current = null
      }
    }
  }, [isWebSpeechSupported, language])

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.setLanguage(language)
    }
  }, [language])

  const startListening = useCallback(() => {
    const voiceCheck = canUseVoiceInput()
    if (!voiceCheck.available && !onDeviceSTT.canHandleSTT) {
      const errorMsg = voiceCheck.reason || 'Voice input not available'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    if (!isSecureContext()) {
      const errorMsg = 'Voice features require HTTPS or localhost.'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setError(null)
    setTranscript('')
    setInterimTranscript('')

    // Try on-device first (Tier 1/2), fall back to Web Speech API (Tier 3)
    if (onDeviceSTT.canHandleSTT) {
      usingOnDeviceRef.current = true
      onDeviceSTT.startListening()
      setIsListening(true)
      return
    }

    // Web Speech API fallback
    usingOnDeviceRef.current = false
    if (!recognitionRef.current || !isWebSpeechSupported) {
      const browserName = getBrowserName()
      const errorMsg = `Speech recognition not supported in ${browserName}. Please use Chrome, Edge, or Safari.`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    recognitionRef.current.start({
      onStart: () => setIsListening(true),
      onResult: (text, isFinal) => {
        if (isFinal) {
          setTranscript(text)
          setInterimTranscript('')
          onTranscript?.(text, true)
        } else {
          setInterimTranscript(text)
          onTranscript?.(text, false)
        }
      },
      onEnd: () => {
        setIsListening(false)
        setInterimTranscript('')
      },
      onError: (err) => {
        let enhancedError = err
        if (err.includes('not-allowed') || err.includes('permission denied')) {
          enhancedError = 'Microphone access denied. Please allow microphone permissions in your browser settings.'
        } else if (err.includes('no-speech')) {
          enhancedError = 'No speech detected. Please speak clearly and try again.'
        } else if (err.includes('network')) {
          enhancedError = 'Network error. Please check your internet connection.'
        } else if (err.includes('audio-capture')) {
          enhancedError = 'Microphone not found. Please check your microphone connection.'
        }
        setError(enhancedError)
        setIsListening(false)
        setInterimTranscript('')
        onError?.(enhancedError)
      },
    })
  }, [isWebSpeechSupported, onTranscript, onError, onDeviceSTT])

  const stopListening = useCallback(() => {
    if (usingOnDeviceRef.current) {
      onDeviceSTT.stopListening()
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setInterimTranscript('')
  }, [onDeviceSTT])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    onDeviceSTT.resetTranscript()
  }, [onDeviceSTT])

  return {
    isListening: isListening || onDeviceSTT.isListening,
    transcript,
    interimTranscript,
    isSupported: isWebSpeechSupported || onDeviceSTT.canHandleSTT,
    error,
    startListening,
    stopListening,
    resetTranscript,
    sttProvider: onDeviceSTT.sttProvider,
    deviceTier: onDeviceSTT.deviceTier,
  }
}
