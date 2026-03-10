/**
 * LipSyncController — Audio-driven lip animation
 *
 * Analyzes TTS audio amplitude in real-time via Web Audio API (AnalyserNode).
 * Drives mouth shape animation on Krishna's model synced with speech playback.
 * Falls back to simple amplitude-based mouth open/close.
 */

'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'

// Cross-browser AudioContext
const getAudioContextClass = (): typeof AudioContext | null => {
  if (typeof AudioContext !== 'undefined') return AudioContext
  if (typeof (window as unknown as Record<string, unknown>).webkitAudioContext !== 'undefined') {
    return (window as unknown as Record<string, unknown>).webkitAudioContext as typeof AudioContext
  }
  return null
}

export function useLipSync() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const animationFrameRef = useRef<number>(0)
  const amplitudeRef = useRef(0)
  const analyzeRef = useRef<() => void>(() => {})

  const setAudioPlaying = useGitaVRStore((s) => s.setAudioPlaying)
  const setSubtitleText = useGitaVRStore((s) => s.setSubtitleText)

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = getAudioContextClass()
      if (!AudioCtx) return
      audioContextRef.current = new AudioCtx()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8
    }
  }, [])

  // Use a ref-based loop to avoid self-referencing useCallback
  useEffect(() => {
    analyzeRef.current = () => {
      if (!analyserRef.current) return

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)

      // Calculate average amplitude in speech frequency range (300Hz - 3000Hz)
      const speechBins = dataArray.slice(2, 30)
      const avg = speechBins.reduce((sum, val) => sum + val, 0) / speechBins.length
      amplitudeRef.current = avg / 255

      animationFrameRef.current = requestAnimationFrame(analyzeRef.current)
    }
  }, [])

  const startAnalysis = useCallback(() => {
    analyzeRef.current()
  }, [])

  const playAudio = useCallback(async (audioUrl: string, subtitles?: string) => {
    try {
      initAudioContext()

      // Clean up previous audio element
      if (audioElementRef.current) {
        audioElementRef.current.onended = null
        audioElementRef.current.pause()
        audioElementRef.current.src = ''
      }

      const audio = new Audio(audioUrl)
      audio.crossOrigin = 'anonymous'
      audioElementRef.current = audio

      if (audioContextRef.current && analyserRef.current) {
        if (sourceRef.current) {
          sourceRef.current.disconnect()
        }
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio)
        sourceRef.current.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
      }

      if (subtitles) {
        setSubtitleText(subtitles)
      }

      // Register onended BEFORE play() to avoid race condition
      audio.onended = () => {
        setAudioPlaying(false)
        amplitudeRef.current = 0
        cancelAnimationFrame(animationFrameRef.current)
        setSubtitleText('')
      }

      setAudioPlaying(true)
      startAnalysis()

      await audio.play()
    } catch {
      setAudioPlaying(false)
      amplitudeRef.current = 0
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [initAudioContext, startAnalysis, setAudioPlaying, setSubtitleText])

  const stopAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.onended = null
      audioElementRef.current.pause()
      audioElementRef.current.src = ''
    }
    setAudioPlaying(false)
    amplitudeRef.current = 0
    cancelAnimationFrame(animationFrameRef.current)
  }, [setAudioPlaying])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      if (audioElementRef.current) {
        audioElementRef.current.onended = null
        audioElementRef.current.pause()
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
    }
  }, [])

  return {
    playAudio,
    stopAudio,
    getAmplitude: () => amplitudeRef.current,
  }
}

export default function LipSyncController() {
  // This is a logic-only component. Actual rendering happens in KrishnaModel.
  // Use the useLipSync hook directly in the orchestrator component.
  return null
}
