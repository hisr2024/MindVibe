/**
 * useAudioAnalyzer - Real-time audio level monitoring via Web Audio API
 *
 * Captures microphone audio and provides:
 * - Normalized volume level (0-1) at ~60fps
 * - Frequency data for waveform visualization
 * - Automatic cleanup on unmount
 *
 * Used by KiaanVoiceOrb and VoiceWaveform to react to user speech.
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface AudioAnalyzerData {
  /** Normalized volume level 0-1 */
  volume: number
  /** Raw frequency data (Uint8Array) for waveform rendering */
  frequencyData: Uint8Array | null
  /** Whether the analyzer is actively capturing audio */
  isActive: boolean
  /** Start capturing microphone audio */
  start: () => Promise<void>
  /** Stop capturing and release resources */
  stop: () => void
}

export function useAudioAnalyzer(): AudioAnalyzerData {
  const [volume, setVolume] = useState(0)
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)
  const [isActive, setIsActive] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const analyze = useCallback(() => {
    if (!analyzerRef.current || !isMountedRef.current) return

    const analyzer = analyzerRef.current
    const dataArray = new Uint8Array(analyzer.frequencyBinCount)
    analyzer.getByteFrequencyData(dataArray)

    // Calculate RMS volume (root mean square for perceptual accuracy)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = dataArray[i] / 255
      sum += normalized * normalized
    }
    const rms = Math.sqrt(sum / dataArray.length)

    // Apply smoothing and normalization (0-1 range, boosted for sensitivity)
    const smoothedVolume = Math.min(1, rms * 2.5)

    if (isMountedRef.current) {
      setVolume(smoothedVolume)
      setFrequencyData(new Uint8Array(dataArray))
    }

    rafRef.current = requestAnimationFrame(analyze)
  }, [])

  const start = useCallback(async () => {
    // Clean up any existing resources to prevent leaks on repeated start() calls
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyzerRef.current = null

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream

      // Create audio context and analyzer
      const audioContext = new AudioContext()
      const analyzer = audioContext.createAnalyser()
      analyzer.fftSize = 256
      analyzer.smoothingTimeConstant = 0.8

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyzer)

      audioContextRef.current = audioContext
      analyzerRef.current = analyzer

      if (isMountedRef.current) {
        setIsActive(true)
      }

      // Start the analysis loop
      rafRef.current = requestAnimationFrame(analyze)
    } catch {
      // Microphone access denied or unavailable - degrade gracefully
      if (isMountedRef.current) {
        setIsActive(false)
      }
    }
  }, [analyze])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    analyzerRef.current = null

    if (isMountedRef.current) {
      setVolume(0)
      setFrequencyData(null)
      setIsActive(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  return { volume, frequencyData, isActive, start, stop }
}
