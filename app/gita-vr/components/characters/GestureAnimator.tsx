/**
 * GestureAnimator — Krishna's hand/body gesture system
 *
 * Manages predefined gesture animations triggered by KIAAN AI response cues.
 * Smooth transitions between gesture states using interpolation.
 */

'use client'

import { useRef, useCallback } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'
import type { GestureCue, GestureType } from '@/types/gitaVR.types'

interface GestureState {
  currentGesture: GestureType
  transitionProgress: number
  queue: GestureCue[]
  startTime: number
}

export function useGestureAnimator() {
  const stateRef = useRef<GestureState>({
    currentGesture: 'idle',
    transitionProgress: 0,
    queue: [],
    startTime: 0,
  })

  const setKrishnaState = useGitaVRStore((s) => s.setKrishnaState)

  const playGestures = useCallback((gestures: GestureCue[]) => {
    if (gestures.length === 0) return

    stateRef.current.queue = [...gestures].sort((a, b) => a.timestamp_ms - b.timestamp_ms)
    stateRef.current.startTime = Date.now()

    // Map gesture type to Krishna state
    const firstGesture = gestures[0]
    if (firstGesture.type === 'blessing') {
      setKrishnaState('blessing')
    } else {
      setKrishnaState('speaking')
    }

    // Schedule gesture transitions
    gestures.forEach((cue) => {
      setTimeout(() => {
        stateRef.current.currentGesture = cue.type
        if (cue.type === 'blessing') {
          setKrishnaState('blessing')
        } else if (cue.type === 'namaste') {
          setKrishnaState('speaking')
        }
      }, cue.timestamp_ms)

      // Return to idle after gesture duration
      setTimeout(() => {
        if (stateRef.current.currentGesture === cue.type) {
          stateRef.current.currentGesture = 'idle'
        }
      }, cue.timestamp_ms + cue.duration_ms)
    })
  }, [setKrishnaState])

  const getCurrentGesture = useCallback((): GestureType => {
    return stateRef.current.currentGesture
  }, [])

  const resetGestures = useCallback(() => {
    stateRef.current = {
      currentGesture: 'idle',
      transitionProgress: 0,
      queue: [],
      startTime: 0,
    }
    setKrishnaState('idle')
  }, [setKrishnaState])

  return {
    playGestures,
    getCurrentGesture,
    resetGestures,
  }
}

export default function GestureAnimator() {
  return null
}
