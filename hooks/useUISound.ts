/**
 * useUISound Hook
 *
 * Provides UI sound feedback for components using Web Audio API synthesis.
 * No external MP3 files needed — sounds are generated in the browser.
 */

'use client'

import { useCallback } from 'react'
import { playSynthSound, type SynthSoundType } from '@/utils/audio/webAudioSounds'

export type UISound =
  | 'click'
  | 'toggle'
  | 'select'
  | 'deselect'
  | 'success'
  | 'error'
  | 'notification'
  | 'transition'
  | 'open'
  | 'close'
  | 'complete'

export interface UseUISoundReturn {
  playSound: (sound: UISound) => void
  playBell: () => void
  playSingingBowl: () => void
  playOm: () => void
  playGong: () => void
  playChime: () => void
}

export function useUISound(): UseUISoundReturn {
  const playSound = useCallback((sound: UISound) => {
    playSynthSound(sound as SynthSoundType, 0.3)
  }, [])

  const playBell = useCallback(() => {
    playSynthSound('bell', 0.5)
  }, [])

  const playSingingBowl = useCallback(() => {
    playSynthSound('singing-bowl', 0.5)
  }, [])

  const playOm = useCallback(() => {
    playSynthSound('om', 0.5)
  }, [])

  const playGong = useCallback(() => {
    playSynthSound('gong', 0.5)
  }, [])

  const playChime = useCallback(() => {
    playSynthSound('chime', 0.5)
  }, [])

  return {
    playSound,
    playBell,
    playSingingBowl,
    playOm,
    playGong,
    playChime,
  }
}

// Re-export UISound type for backward compatibility
export type { UISound as UIAudioSound }

export default useUISound
