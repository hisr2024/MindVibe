/**
 * useOnDeviceSTT — React Hook for On-Device Speech Recognition
 *
 * Wraps OnDeviceSTT controller with React state management.
 * Same interface shape as useVoiceInput for drop-in integration.
 *
 * For Tier 3 devices (budget phones), this hook signals the caller
 * to fall back to Web Speech API — zero extra RAM used.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { OnDeviceSTT, type STTProvider, type STTState } from '@/lib/voice/on-device-stt'
import type { DeviceTier } from '@/utils/browserSupport'

export interface UseOnDeviceSTTOptions {
  language?: string
  onTranscript?: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

export interface UseOnDeviceSTTReturn {
  isListening: boolean
  transcript: string
  interimTranscript: string
  isSupported: boolean
  isModelLoaded: boolean
  modelLoadProgress: number
  sttProvider: STTProvider
  deviceTier: DeviceTier
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  /** True when this hook can handle STT (not web-speech-api fallback) */
  canHandleSTT: boolean
}

export function useOnDeviceSTT(options: UseOnDeviceSTTOptions = {}): UseOnDeviceSTTReturn {
  const { language = 'en', onTranscript, onError } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [modelLoadProgress, setModelLoadProgress] = useState(0)
  const [sttProvider, setSttProvider] = useState<STTProvider>('none')
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('low')
  const [error, setError] = useState<string | null>(null)

  const sttRef = useRef<OnDeviceSTT | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)

  // Keep callback refs current
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  // Initialize on mount
  useEffect(() => {
    const stt = new OnDeviceSTT()
    sttRef.current = stt

    // Detect capabilities
    stt.detectCapabilities().then(({ tier, recommendedProvider }) => {
      setDeviceTier(tier)
      setSttProvider(recommendedProvider)
    }).catch(() => {
      // Detection failed — stay on defaults (low tier, web-speech-api)
    })

    return () => {
      stt.destroy()
      sttRef.current = null
    }
  }, [])

  // Initialize for language when it changes
  useEffect(() => {
    if (!sttRef.current) return

    sttRef.current.initialize(language, {
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          setTranscript(text)
          setInterimTranscript('')
          onTranscriptRef.current?.(text, true)
        } else {
          setInterimTranscript(text)
          onTranscriptRef.current?.(text, false)
        }
      },
      onStateChange: (state: STTState) => {
        setIsListening(state === 'listening')
        setIsModelLoaded(state === 'ready' || state === 'listening')
      },
      onProviderChange: (provider) => {
        setSttProvider(provider)
      },
      onLoadProgress: (progress) => {
        setModelLoadProgress(progress)
      },
      onError: (err) => {
        setError(err)
        setIsListening(false)
        onErrorRef.current?.(err)
      },
    }).then(provider => {
      setSttProvider(provider)
    }).catch((err) => {
      setError(err instanceof Error ? err.message : String(err))
      onErrorRef.current?.(err instanceof Error ? err.message : String(err))
    })
  }, [language])

  const startListening = useCallback(async () => {
    if (!sttRef.current) return
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    try {
      await sttRef.current.startListening()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setIsListening(false)
      onErrorRef.current?.(msg)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!sttRef.current) return
    sttRef.current.stopListening()
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  const canHandleSTT = sttProvider !== 'web-speech-api' && sttProvider !== 'none'

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported: canHandleSTT,
    isModelLoaded,
    modelLoadProgress,
    sttProvider,
    deviceTier,
    error,
    startListening,
    stopListening,
    resetTranscript,
    canHandleSTT,
  }
}
