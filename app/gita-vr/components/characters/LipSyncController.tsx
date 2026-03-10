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

interface LipSyncControllerProps {
  onAmplitude?: (amplitude: number) => void
}

export function useLipSync() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const animationFrameRef = useRef<number>(0)
  const amplitudeRef = useRef(0)

  const setAudioPlaying = useGitaVRStore((s) => s.setAudioPlaying)
  const setSubtitleText = useGitaVRStore((s) => s.setSubtitleText)

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8
    }
  }, [])

  const analyzeAmplitude = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calculate average amplitude in speech frequency range (300Hz - 3000Hz)
    const speechBins = dataArray.slice(2, 30)
    const avg = speechBins.reduce((sum, val) => sum + val, 0) / speechBins.length
    amplitudeRef.current = avg / 255

    animationFrameRef.current = requestAnimationFrame(analyzeAmplitude)
  }, [])

  const playAudio = useCallback(async (audioUrl: string, subtitles?: string) => {
    try {
      initAudioContext()

      if (audioElementRef.current) {
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

      setAudioPlaying(true)
      analyzeAmplitude()

      await audio.play()

      audio.onended = () => {
        setAudioPlaying(false)
        amplitudeRef.current = 0
        cancelAnimationFrame(animationFrameRef.current)
        setSubtitleText('')
      }
    } catch (error) {
      setAudioPlaying(false)
      amplitudeRef.current = 0
    }
  }, [initAudioContext, analyzeAmplitude, setAudioPlaying, setSubtitleText])

  const stopAudio = useCallback(() => {
    if (audioElementRef.current) {
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

export default function LipSyncController({ onAmplitude }: LipSyncControllerProps) {
  // This is a logic-only component. Actual rendering happens in KrishnaModel.
  // Use the useLipSync hook directly in the orchestrator component.
  return null
}
