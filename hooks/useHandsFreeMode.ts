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

  // Pre-compute whether VAD is likely supported so useVoiceInput can be
  // configured with autoStopOnSilence as a fallback on low-end devices.
  // Uses the same criteria as useVoiceActivityDetection (4+ cores, 4+ GB RAM,
  // AudioWorkletNode available).
  const [vadLikelySupported] = useState(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
    const cores = navigator.hardwareConcurrency || 2
    const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4
    return cores >= 4 && memory >= 4 && typeof AudioWorkletNode !== 'undefined'
  })

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
  // Web Speech API STT (via existing useVoiceInput)
  // Must be declared before callbacks that reference voiceInput methods.
  // ---------------------------------------------------------------------------
  const voiceInput = useVoiceInput({
    language,
    punctuationAssist: true,
    module: 'hands-free',
    // When VAD is not supported (low-end device), rely on STT's built-in
    // silence detection to auto-finalize the transcript
    autoStopOnSilence: !vadLikelySupported,
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

  // Ref for stopVAD — allows idle timer callback to call stopVAD without
  // accessing it before declaration (resolves circular dependency between
  // idle timer and VAD hook).
  const stopVADRef = useRef<() => void>(() => {})

  // Silence-based submission fallback — used when VAD is unavailable at runtime.
  // When VAD fails (e.g. ONNX model load error), STT runs in continuous mode
  // with no mechanism to detect speech end. This timer monitors transcript
  // changes and submits after 2s of silence as a fallback.
  const silenceSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSilenceSubmitTimer = useCallback(() => {
    if (silenceSubmitTimerRef.current) {
      clearTimeout(silenceSubmitTimerRef.current)
      silenceSubmitTimerRef.current = null
    }
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
        stopVADRef.current()
        voiceInput.stopListening()
      }
    }, IDLE_TIMEOUT_MS)
  }, [clearIdleTimer, setActiveState, setHandsFreeState, voiceInput])

  // ---------------------------------------------------------------------------
  // Voice Activity Detection
  // ---------------------------------------------------------------------------
  const {
    startVAD,
    stopVAD,
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

  // Keep stopVADRef in sync with the actual stopVAD function
  useEffect(() => {
    stopVADRef.current = stopVAD
  }, [stopVAD])

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
  }, [voiceInput, startVAD, resetIdleTimer, setHandsFreeState])

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
    clearSilenceSubmitTimer()
    stopVAD()
    voiceInput.stopListening()
    voiceInput.resetTranscript()
    setActiveState(false)
    setHandsFreeState('inactive')
  }, [voiceInput, clearIdleTimer, clearSilenceSubmitTimer, stopVAD, setActiveState, setHandsFreeState])

  // ---------------------------------------------------------------------------
  // Non-VAD fallback — when VAD is not supported, detect STT completion
  // via the voice input status transitioning to 'idle' with a transcript.
  // ---------------------------------------------------------------------------
  const prevStatusRef = useRef(voiceInput.status)
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = voiceInput.status

    // Only handle non-VAD fallback path
    if (vadSupported) return
    if (!isActiveRef.current || !mountedRef.current) return

    // STT transitioned from listening/processing to idle — speech ended
    if ((prevStatus === 'listening' || prevStatus === 'processing') && voiceInput.status === 'idle') {
      const finalText = transcriptRef.current.trim()
      if (finalText) {
        setHandsFreeState('submitting') // eslint-disable-line react-hooks/set-state-in-effect -- syncing with external STT system state
        onTranscriptRef.current(finalText)
      }

      voiceInput.resetTranscript()

      if (!conversationalRef.current) {
        setActiveState(false)
        setHandsFreeState('inactive')
      }
    }
  }, [voiceInput.status, vadSupported, setHandsFreeState, setActiveState, voiceInput])

  // ---------------------------------------------------------------------------
  // Non-VAD silence fallback — when VAD fails at runtime, detect speech end
  // by monitoring transcript changes. Submit after 2s of no new input.
  // This covers the case where vadLikelySupported was true (so
  // autoStopOnSilence=false) but VAD actually failed to initialize at runtime.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Only activate when VAD is NOT available and we're actively listening
    if (vadSupported) return
    if (!isActiveRef.current) return
    if (stateRef.current === 'inactive' || stateRef.current === 'submitting') return

    clearSilenceSubmitTimer()

    const text = (voiceInput.transcript || voiceInput.interimTranscript || '').trim()
    if (!text) return

    // Start timer — if no new transcript in 2s, speech has ended
    silenceSubmitTimerRef.current = setTimeout(() => {
      if (!mountedRef.current || !isActiveRef.current) return
      if (stateRef.current === 'submitting' || stateRef.current === 'inactive') return

      const finalText = transcriptRef.current.trim()
      if (!finalText) return

      setHandsFreeState('submitting')
      voiceInput.stopListening()
      onTranscriptRef.current(finalText)
      voiceInput.resetTranscript()

      if (!conversationalRef.current) {
        setActiveState(false)
        setHandsFreeState('inactive')
        stopVADRef.current()
      }
    }, 2000)
  }, [vadSupported, voiceInput.transcript, voiceInput.interimTranscript,
      clearSilenceSubmitTimer, voiceInput, setHandsFreeState, setActiveState])

  // ---------------------------------------------------------------------------
  // Update state to 'hearing' when speech is detected via STT (non-VAD path).
  // Without this, the UI stays in 'waiting' because only VAD's onSpeechStart
  // sets 'hearing'.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (vadSupported) return
    if (!isActiveRef.current) return
    if (stateRef.current !== 'waiting') return

    if (voiceInput.interimTranscript || voiceInput.transcript) {
      setHandsFreeState('hearing') // eslint-disable-line react-hooks/set-state-in-effect -- syncing with external STT state
    }
  }, [vadSupported, voiceInput.interimTranscript, voiceInput.transcript, setHandsFreeState])

  // ---------------------------------------------------------------------------
  // Conversational mode — restart VAD + STT after KIAAN finishes processing
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isActive) return
    if (!conversational) return

    // When isProcessing transitions from true to false, restart listening.
    // startBoth sets state internally — this is intentional as it restarts
    // the VAD+STT pipeline (an external system synchronization).
    if (!isProcessing && state === 'submitting') {
      startBoth() // eslint-disable-line react-hooks/set-state-in-effect
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
      if (silenceSubmitTimerRef.current) {
        clearTimeout(silenceSubmitTimerRef.current)
        silenceSubmitTimerRef.current = null
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
