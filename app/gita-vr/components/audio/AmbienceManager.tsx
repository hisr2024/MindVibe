/**
 * AmbienceManager — Background ambience for the battlefield
 *
 * Manages ambient audio layers:
 * - Wind across battlefield
 * - Distant army murmur
 * - Sacred music during teachings
 *
 * Uses Web Audio API for layered, state-dependent mixing.
 * No actual audio files required — uses procedural noise.
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * duration
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  // Brown noise (wind-like)
  let lastOut = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 3.5
  }

  return buffer
}

export default function AmbienceManager() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const windNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const startedRef = useRef(false)

  const sceneState = useGitaVRStore((s) => s.sceneState)
  const volume = useGitaVRStore((s) => s.volume)

  const startAmbience = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true

    try {
      if (typeof AudioContext === 'undefined') return
      const ctx = new AudioContext()
      audioContextRef.current = ctx

      const gain = ctx.createGain()
      gain.gain.value = 0.05 * volume
      gain.connect(ctx.destination)
      gainRef.current = gain

      // Wind noise
      const windBuffer = createNoiseBuffer(ctx, 10)
      const wind = ctx.createBufferSource()
      wind.buffer = windBuffer
      wind.loop = true

      // Low-pass filter for natural wind sound
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 400

      wind.connect(filter)
      filter.connect(gain)
      wind.start()
      windNodeRef.current = wind
    } catch {
      // Audio context not available
    }
  }, [volume])

  // Start ambience on first user interaction (browser autoplay policy)
  useEffect(() => {
    const handleInteraction = () => {
      startAmbience()
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
    document.addEventListener('click', handleInteraction)
    document.addEventListener('keydown', handleInteraction)

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [startAmbience])

  // Adjust volume based on scene state
  useEffect(() => {
    if (!gainRef.current) return

    const targetVolume = sceneState === 'teaching' || sceneState === 'question'
      ? 0.02 * volume
      : sceneState === 'vishwaroop'
        ? 0.08 * volume
        : 0.05 * volume

    gainRef.current.gain.linearRampToValueAtTime(
      targetVolume,
      (audioContextRef.current?.currentTime ?? 0) + 1
    )
  }, [sceneState, volume])

  // Cleanup
  useEffect(() => {
    return () => {
      windNodeRef.current?.stop()
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
    }
  }, [])

  return null
}
