/**
 * Hook for managing voice input (Speech-to-Text)
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SpeechRecognitionService } from '@/utils/speech/recognition'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'

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
    if (!recognitionRef.current || !isSupported) {
      const errorMsg = 'Speech recognition not supported in this browser'
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
        setError(err)
        setIsListening(false)
        setInterimTranscript('')
        onError?.(err)
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
