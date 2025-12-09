/**
 * Hook for managing voice input (Speech-to-Text)
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SpeechRecognitionService } from '@/utils/speech/recognition'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'
import { canUseVoiceInput, isSecureContext, getBrowserName } from '@/utils/browserSupport'

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
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => isSpeechRecognitionSupported())
  
  const recognitionRef = useRef<SpeechRecognitionService | null>(null)
  const { language = 'en', onTranscript, onError, autoSend = false } = options

  // Initialize recognition service
  useEffect(() => {
    if (!isSupported) return

    recognitionRef.current = new SpeechRecognitionService({
      language,
      continuous: false,
      interimResults: true,
    })

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.destroy()
        recognitionRef.current = null
      }
    }
  }, [isSupported, language])

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.setLanguage(language)
    }
  }, [language])

  const startListening = useCallback(() => {
    // Enhanced browser support checks
    const voiceCheck = canUseVoiceInput()
    if (!voiceCheck.available) {
      const errorMsg = voiceCheck.reason || 'Voice input not available'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    if (!recognitionRef.current || !isSupported) {
      const browserName = getBrowserName()
      const errorMsg = `Speech recognition not supported in ${browserName}. Please use Chrome, Edge, or Safari.`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    // Check if secure context (HTTPS or localhost)
    if (!isSecureContext()) {
      const errorMsg = 'Voice features require HTTPS or localhost. Please access this site securely.'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setError(null)
    setTranscript('')
    setInterimTranscript('')

    recognitionRef.current.start({
      onStart: () => {
        setIsListening(true)
      },
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
        // Enhance error messages with more helpful guidance
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
  }, [isSupported, onTranscript, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
