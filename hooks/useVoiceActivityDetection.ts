/**
 * useVoiceActivityDetection — Voice Activity Detection Hook
 *
 * Wraps @ricky0123/vad-web for browser-based speech boundary detection.
 * Detects when the user starts and stops speaking (does NOT record audio).
 * Used to power hands-free conversational mode alongside Web Speech API STT.
 *
 * Features:
 *   - Silero VAD v5 model via ONNX Runtime (high accuracy speech detection)
 *   - Auto-pause on tab switch (visibility change) to save battery
 *   - Device tier gating (disabled on low-end devices)
 *   - Graceful fallback when ONNX model fails to load
 *   - SSR-safe with full unmount cleanup
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseVADOptions {
  onSpeechStart?: () => void
  onSpeechEnd?: (audio: Float32Array) => void
  onVADMisfire?: () => void
}

interface UseVADReturn {
  startVAD: () => Promise<void>
  stopVAD: () => void
  isVADActive: boolean
  isSpeechDetected: boolean
  vadSupported: boolean
  vadError: string | null
}

/**
 * MicVAD instance type extracted from @ricky0123/vad-web.
 * We define it locally to avoid importing the module at the top level
 * (it is browser-only and loaded via dynamic import).
 */
interface MicVADInstance {
  start: () => void
  pause: () => void
  destroy: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether the current device has enough resources to run
 * the ONNX-based VAD model without degrading the user experience.
 *
 * Requires at least 4 logical cores and 4 GB of memory.
 * Returns false on SSR or when hardware info is unavailable.
 */
function detectDeviceTier(): boolean {
  if (typeof navigator === 'undefined') return false

  const cores = navigator.hardwareConcurrency || 2
  const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4

  return cores >= 4 && memory >= 4
}

/**
 * Check whether AudioWorkletNode is available in the current environment.
 * Required by @ricky0123/vad-web for its audio processing pipeline.
 */
function isAudioWorkletSupported(): boolean {
  if (typeof window === 'undefined') return false
  return typeof AudioWorkletNode !== 'undefined'
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceActivityDetection(options: UseVADOptions = {}): UseVADReturn {
  const { onSpeechStart, onSpeechEnd, onVADMisfire } = options

  const [isVADActive, setIsVADActive] = useState(false)
  const [isSpeechDetected, setIsSpeechDetected] = useState(false)
  const [vadSupported, setVadSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return detectDeviceTier() && isAudioWorkletSupported()
  })
  const [vadError, setVadError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  const vadInstanceRef = useRef<MicVADInstance | null>(null)
  const wasActiveBeforeHiddenRef = useRef(false)
  const dutyCycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stable callback refs to avoid stale closures
  const onSpeechStartRef = useRef(onSpeechStart)
  const onSpeechEndRef = useRef(onSpeechEnd)
  const onVADMisfireRef = useRef(onVADMisfire)

  useEffect(() => {
    onSpeechStartRef.current = onSpeechStart
    onSpeechEndRef.current = onSpeechEnd
    onVADMisfireRef.current = onVADMisfire
  })

  // ---------------------------------------------------------------------------
  // Visibility change handler — pause VAD when tab is hidden to save battery
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      if (!mountedRef.current) return

      if (document.visibilityState === 'hidden') {
        // Tab hidden — pause VAD if active
        if (vadInstanceRef.current && isVADActive) {
          wasActiveBeforeHiddenRef.current = true
          vadInstanceRef.current.pause()
          setIsVADActive(false)
          setIsSpeechDetected(false)
        }
      } else if (document.visibilityState === 'visible') {
        // Tab visible again — resume if was active before hiding
        if (vadInstanceRef.current && wasActiveBeforeHiddenRef.current) {
          wasActiveBeforeHiddenRef.current = false
          try {
            vadInstanceRef.current.start()
            setIsVADActive(true)
          } catch {
            // VAD instance may have been destroyed while hidden
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isVADActive])

  // ---------------------------------------------------------------------------
  // startVAD — Dynamically import vad-web and create a MicVAD instance
  // ---------------------------------------------------------------------------
  const startVAD = useCallback(async () => {
    // SSR guard
    if (typeof window === 'undefined') return

    // Device capability check
    if (!detectDeviceTier() || !isAudioWorkletSupported()) {
      setVadSupported(false)
      return
    }

    // Already running
    if (vadInstanceRef.current) {
      try {
        vadInstanceRef.current.start()
        if (mountedRef.current) setIsVADActive(true)
      } catch {
        // Instance may be stale — fall through to create a new one
        vadInstanceRef.current = null
      }
      if (vadInstanceRef.current) return
    }

    try {
      // Dynamic import — @ricky0123/vad-web is browser-only
      const { MicVAD } = await import('@ricky0123/vad-web')

      if (!mountedRef.current) return

      // Detect GPU/NPU acceleration for faster ONNX inference
      const supportsWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator
      const supportsWebNN = typeof navigator !== 'undefined' && 'ml' in navigator

      const instance = await MicVAD.new({
        positiveSpeechThreshold: 0.8,
        minSpeechMs: 480,
        redemptionMs: 1500,
        baseAssetPath: '/vad/',
        // Prefer hardware-accelerated ONNX execution when available
        ...(supportsWebGPU || supportsWebNN ? {
          onnxWASMBasePath: '/vad/',
          // Optimize ONNX Runtime thread count for available cores
          ortConfig: (ort: Record<string, unknown>) => {
            const env = ort.env as { wasm?: { numThreads?: number } } | undefined
            if (env?.wasm) {
              env.wasm.numThreads = Math.min(navigator.hardwareConcurrency || 4, 4)
            }
          },
        } : {}),

        onSpeechStart: () => {
          if (!mountedRef.current) return
          setIsSpeechDetected(true)
          onSpeechStartRef.current?.()
        },

        onSpeechEnd: (audio: Float32Array) => {
          if (!mountedRef.current) return
          setIsSpeechDetected(false)
          onSpeechEndRef.current?.(audio)
        },

        onVADMisfire: () => {
          if (!mountedRef.current) return
          setIsSpeechDetected(false)
          onVADMisfireRef.current?.()
        },
      })

      if (!mountedRef.current) {
        instance.destroy()
        return
      }

      vadInstanceRef.current = instance
      instance.start()
      setIsVADActive(true)
      setVadError(null)
    } catch {
      // ONNX load failure or any other initialization error — graceful fallback.
      // Mark unsupported so useHandsFreeMode activates its silence-based
      // transcript submission timer as a fallback for speech-end detection.
      if (!mountedRef.current) return
      setVadSupported(false)
      setVadError('VAD initialization failed — using silence detection fallback')
      setIsVADActive(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // stopVAD — Pause the VAD instance (does not destroy it for reuse)
  // ---------------------------------------------------------------------------
  const stopVAD = useCallback(() => {
    // Clear duty cycle timer if active
    if (dutyCycleTimerRef.current) {
      clearInterval(dutyCycleTimerRef.current)
      dutyCycleTimerRef.current = null
    }
    if (vadInstanceRef.current) {
      vadInstanceRef.current.pause()
    }
    wasActiveBeforeHiddenRef.current = false
    if (mountedRef.current) {
      setIsVADActive(false)
      setIsSpeechDetected(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Cleanup on unmount — destroy VAD instance and release microphone
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (dutyCycleTimerRef.current) {
        clearInterval(dutyCycleTimerRef.current)
        dutyCycleTimerRef.current = null
      }
      if (vadInstanceRef.current) {
        vadInstanceRef.current.destroy()
        vadInstanceRef.current = null
      }
    }
  }, [])

  return {
    startVAD,
    stopVAD,
    isVADActive,
    isSpeechDetected,
    vadSupported,
    vadError,
  }
}

export type { UseVADOptions, UseVADReturn }
