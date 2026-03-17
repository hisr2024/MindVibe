/**
 * useHandsFreeMode — Hands-Free Conversational Voice Hook
 *
 * Orchestrates Voice Activity Detection (VAD) and Web Speech API STT
 * for a Siri/Alexa-like hands-free experience. VAD detects speech
 * boundaries while STT provides live interim transcripts.
 *
 * Flow:
 *   1. User activates hands-free mode
 *   2. VAD + STT start simultaneously (state: 'waiting')
 *   3. VAD detects speech start (state: 'hearing'), STT streams interim text
 *   4. VAD detects 1.5s silence → stop STT, auto-submit transcript (state: 'submitting')
 *   5. After KIAAN finishes processing, restart VAD + STT (conversational mode)
 *
 * Safety:
 *   - Auto-deactivate after 5 minutes of waiting with no speech (CPU guard)
 *   - mountedRef pattern for unmount safety
 *   - Full cleanup on deactivate/unmount
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useVoiceActivityDetection } from './useVoiceActivityDetection'
import { useVoiceInput } from './useVoiceInput'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HandsFreeState = 'inactive' | 'waiting' | 'hearing' | 'submitting'

interface UseHandsFreeModeOptions {
  language?: string
  onTranscript: (text: string) => void
  conversational?: boolean
  isProcessing?: boolean
  /** Called when user speaks while KIAAN is responding (barge-in).
   *  Frontend should stop audio playback and abort pending TTS requests. */
  onBargeIn?: () => void
}

interface UseHandsFreeModeReturn {
  isActive: boolean
  state: HandsFreeState
  activate: () => void
  deactivate: () => void
  transcript: string
  interimTranscript: string
  confidence: number
  sttProvider: string
  error: string | null
  vadSupported: boolean
  /** True when KIAAN is speaking and VAD is listening for barge-in */
  isSpeaking: boolean
  /** Call this when KIAAN starts speaking a response */
  markSpeaking: () => void
  /** Call this when KIAAN finishes speaking */
  markDoneSpeaking: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Auto-deactivate after 5 minutes of idle waiting (no speech detected) */
const IDLE_TIMEOUT_MS = 5 * 60 * 1000

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useHandsFreeMode(options: UseHandsFreeModeOptions): UseHandsFreeModeReturn {
  const {
    language = 'en',
    onTranscript,
    conversational = true,
    isProcessing = false,
    onBargeIn,
  } = options

  const [isActive, setIsActive] = useState(false)
  const [state, setState] = useState<HandsFreeState>('inactive')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isSpeakingRef = useRef(false)

  const mountedRef = useRef(true)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isActiveRef = useRef(false)
  const stateRef = useRef<HandsFreeState>('inactive')

  // Stable callback refs
  const onTranscriptRef = useRef(onTranscript)
  const onBargeInRef = useRef(onBargeIn)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
    onBargeInRef.current = onBargeIn
  })

  // Keep refs in sync with state
  const setActiveState = useCallback((active: boolean) => {
    isActiveRef.current = active
    setIsActive(active)
  }, [])

  const setHandsFreeState = useCallback((s: HandsFreeState) => {
    stateRef.current = s
    setState(s)
  }, [])

  // ---------------------------------------------------------------------------
  // Idle timer — auto-deactivate after 5 minutes of no speech
  // ---------------------------------------------------------------------------
  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const resetIdleTimer = useCallback(() => {
    clearIdleTimer()
    idleTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      // Auto-deactivate due to prolonged idle
      if (isActiveRef.current && stateRef.current === 'waiting') {
        setActiveState(false)
        setHandsFreeState('inactive')
        stopVAD()
        voiceInput.stopListening()
      }
    }, IDLE_TIMEOUT_MS)
  }, [clearIdleTimer]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Voice Activity Detection
  // ---------------------------------------------------------------------------
  const {
    startVAD,
    stopVAD,
    isVADActive,
    vadSupported,
  } = useVoiceActivityDetection({
    onSpeechStart: () => {
      if (!mountedRef.current || !isActiveRef.current) return
      clearIdleTimer()

      // Barge-in detection: user started speaking while KIAAN is responding
      if (isSpeakingRef.current) {
        isSpeakingRef.current = false
        setIsSpeaking(false)
        onBargeInRef.current?.()
      }

      setHandsFreeState('hearing')
    },

    onSpeechEnd: () => {
      if (!mountedRef.current || !isActiveRef.current) return

      // Transition to submitting — capture whatever transcript STT has produced
      setHandsFreeState('submitting')

      // Stop STT to finalize transcript
      voiceInput.stopListening()

      // Submit the transcript after a short delay to allow final STT result
      setTimeout(() => {
        if (!mountedRef.current) return

        // Use the latest transcript from the voice input
        const finalText = transcriptRef.current.trim()
        if (finalText) {
          onTranscriptRef.current(finalText)
        }

        // Reset transcript for next utterance
        voiceInput.resetTranscript()

        // If not in conversational mode, deactivate
        if (!conversationalRef.current) {
          setActiveState(false)
          setHandsFreeState('inactive')
          stopVAD()
        }
        // In conversational mode, we wait for isProcessing to go false
        // before restarting (handled in the isProcessing effect)
      }, 150)
    },

    onVADMisfire: () => {
      if (!mountedRef.current || !isActiveRef.current) return
      // VAD thought speech started but it was too short — stay in waiting
      setHandsFreeState('waiting')
      resetIdleTimer()
    },
  })

  // ---------------------------------------------------------------------------
  // Web Speech API STT (via existing useVoiceInput)
  // ---------------------------------------------------------------------------
  const voiceInput = useVoiceInput({
    language,
    punctuationAssist: true,
    module: 'hands-free',
  })

  // Track the latest transcript via ref so the VAD onSpeechEnd callback
  // can read it without stale closure issues
  const transcriptRef = useRef('')
  useEffect(() => {
    const text = voiceInput.transcript || voiceInput.interimTranscript
    transcriptRef.current = text
  }, [voiceInput.transcript, voiceInput.interimTranscript])

  // Ref for conversational option
  const conversationalRef = useRef(conversational)
  useEffect(() => {
    conversationalRef.current = conversational
  }, [conversational])

  // ---------------------------------------------------------------------------
  // Start both VAD and STT simultaneously
  // ---------------------------------------------------------------------------
  const startBoth = useCallback(async () => {
    if (!mountedRef.current) return
    voiceInput.resetTranscript()
    await startVAD()
    voiceInput.startListening()
    if (mountedRef.current) {
      setHandsFreeState('waiting')
      resetIdleTimer()
    }
  }, [startVAD, resetIdleTimer]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Activate hands-free mode
  // ---------------------------------------------------------------------------
  const activate = useCallback(() => {
    if (!mountedRef.current) return
    setActiveState(true)
    startBoth()
  }, [setActiveState, startBoth])

  // ---------------------------------------------------------------------------
  // Deactivate hands-free mode
  // ---------------------------------------------------------------------------
  const deactivate = useCallback(() => {
    if (!mountedRef.current) return
    clearIdleTimer()
    stopVAD()
    voiceInput.stopListening()
    voiceInput.resetTranscript()
    setActiveState(false)
    setHandsFreeState('inactive')
  }, [clearIdleTimer, stopVAD, setActiveState, setHandsFreeState]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Conversational mode — restart VAD + STT after KIAAN finishes processing
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isActive) return
    if (!conversational) return

    // When isProcessing transitions from true to false, restart listening
    if (!isProcessing && state === 'submitting') {
      startBoth()
    }
  }, [isProcessing, isActive, conversational, state, startBoth])

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
    }
  }, [])

  // Mark KIAAN as speaking (keeps VAD active for barge-in detection)
  const markSpeaking = useCallback(() => {
    isSpeakingRef.current = true
    setIsSpeaking(true)
  }, [])

  const markDoneSpeaking = useCallback(() => {
    isSpeakingRef.current = false
    setIsSpeaking(false)
  }, [])

  return {
    isActive,
    state,
    activate,
    deactivate,
    transcript: voiceInput.transcript,
    interimTranscript: voiceInput.interimTranscript,
    confidence: voiceInput.confidence,
    sttProvider: voiceInput.sttProvider,
    error: voiceInput.error,
    vadSupported,
    isSpeaking,
    markSpeaking,
    markDoneSpeaking,
  }
}

export type { UseHandsFreeModeOptions, UseHandsFreeModeReturn, HandsFreeState }
