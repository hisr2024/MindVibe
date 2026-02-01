/**
 * useUISound Hook
 *
 * Provides UI sound feedback for components.
 * A lightweight alternative to the full audio context.
 */

'use client'

import { useCallback, useRef } from 'react'

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

// Sound file mappings
const SOUND_FILES: Record<UISound, string> = {
  click: '/sounds/click.mp3',
  toggle: '/sounds/toggle.mp3',
  select: '/sounds/select.mp3',
  deselect: '/sounds/deselect.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  notification: '/sounds/notification.mp3',
  transition: '/sounds/transition.mp3',
  open: '/sounds/open.mp3',
  close: '/sounds/close.mp3',
  complete: '/sounds/complete.mp3',
}

// Fallback to click sound for missing files
const FALLBACK_SOUND = '/sounds/click.mp3'

export interface UseUISoundReturn {
  playSound: (sound: UISound) => void
  playBell: () => void
  playSingingBowl: () => void
  playOm: () => void
  playGong: () => void
  playChime: () => void
}

export function useUISound(): UseUISoundReturn {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map())

  const playSound = useCallback((sound: UISound) => {
    try {
      const soundPath = SOUND_FILES[sound] || FALLBACK_SOUND
      let audio = audioCache.current.get(soundPath)

      if (!audio) {
        audio = new Audio(soundPath)
        audio.volume = 0.3
        audioCache.current.set(soundPath, audio)
      }

      audio.currentTime = 0
      audio.play().catch(() => {
        // Silently fail if audio can't play
      })
    } catch {
      // Silently fail
    }
  }, [])

  const playBell = useCallback(() => {
    try {
      const audio = new Audio('/sounds/bell.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {
      // Silently fail
    }
  }, [])

  const playSingingBowl = useCallback(() => {
    try {
      const audio = new Audio('/sounds/singing-bowl.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {
      // Silently fail
    }
  }, [])

  const playOm = useCallback(() => {
    try {
      const audio = new Audio('/sounds/om.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {
      // Silently fail
    }
  }, [])

  const playGong = useCallback(() => {
    try {
      const audio = new Audio('/sounds/gong.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {
      // Silently fail
    }
  }, [])

  const playChime = useCallback(() => {
    try {
      const audio = new Audio('/sounds/chime.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {
      // Silently fail
    }
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
