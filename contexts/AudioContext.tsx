'use client'

/**
 * Global Audio Context Provider
 *
 * Provides audio functionality throughout the entire MindVibe app:
 * - UI sound effects (clicks, toggles, notifications)
 * - Binaural beats and brainwave entrainment
 * - Ambient soundscapes
 * - Meditation sounds (bells, gongs, singing bowls)
 * - Haptic feedback
 *
 * Usage:
 *   import { useAudio } from '@/contexts/AudioContext'
 *   const { playSound, startBinaural } = useAudio()
 *   playSound('click')
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode
} from 'react'
import {
  audioManager,
  type UISound,
  type BrainwavePreset,
  type AmbientSoundscape,
  type ConsciousnessLayer,
  type AudioManagerState
} from '@/utils/audio/AudioManager'

// Re-export types for consumers
export type { UISound, BrainwavePreset, AmbientSoundscape, ConsciousnessLayer, AudioManagerState }

// ============ Types ============

interface AudioContextValue {
  // State
  state: AudioManagerState
  isInitialized: boolean
  isReady: boolean

  // UI Sounds
  playSound: (sound: UISound) => void
  setUISoundsEnabled: (enabled: boolean) => void

  // Binaural Beats
  startBinaural: (preset: BrainwavePreset) => Promise<void>
  stopBinaural: () => void
  setBinauralForLayer: (layer: ConsciousnessLayer) => Promise<void>
  setBinauralVolume: (volume: number) => void

  // Ambient Soundscapes
  startAmbient: (soundscape: AmbientSoundscape) => Promise<void>
  stopAmbient: () => void
  setAmbientVolume: (volume: number) => void

  // Master Controls
  setMasterVolume: (volume: number) => void
  stopAll: () => void

  // Special Sounds
  playMeditationStart: () => void
  playMeditationEnd: () => void
  playGong: () => void
  playBell: () => void
  playChime: () => void
  playOm: () => void
  playSingingBowl: () => void

  // Navigation Sounds
  playClick: () => void
  playToggle: () => void
  playSuccess: () => void
  playError: () => void
  playNotification: () => void
  playTransition: () => void
  playOpen: () => void
  playClose: () => void

  // Achievement Sounds
  playLevelUp: () => void
  playAchievement: () => void
  playStreak: () => void

  // Breathing Sounds
  playBreathIn: () => void
  playBreathOut: () => void
  playBreathHold: () => void
}

// ============ Context ============

const AudioContext = createContext<AudioContextValue | null>(null)

// ============ Provider ============

interface AudioProviderProps {
  children: ReactNode
  autoInitialize?: boolean
  defaultUISoundsEnabled?: boolean
  defaultMasterVolume?: number
}

export function AudioProvider({
  children,
  autoInitialize = true,
  defaultUISoundsEnabled = true,
  defaultMasterVolume = 0.7
}: AudioProviderProps) {
  const [state, setState] = useState<AudioManagerState>({
    initialized: false,
    masterVolume: defaultMasterVolume,
    uiSoundsEnabled: defaultUISoundsEnabled,
    binauralEnabled: false,
    spatialEnabled: false,
    ambientEnabled: false,
    currentBrainwave: null,
    currentAmbient: null,
    currentSpatialScene: null
  })
  const [isReady, setIsReady] = useState(false)

  // Initialize audio manager on mount
  useEffect(() => {
    if (autoInitialize && typeof window !== 'undefined') {
      audioManager.initialize({
        masterVolume: defaultMasterVolume,
        uiSoundsEnabled: defaultUISoundsEnabled,
        onStateChange: setState
      }).then((success) => {
        if (success) {
          setIsReady(true)
        }
      })

      // Resume on first user interaction
      const handleInteraction = () => {
        audioManager.resume()
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
        document.removeEventListener('keydown', handleInteraction)
      }

      document.addEventListener('click', handleInteraction)
      document.addEventListener('touchstart', handleInteraction)
      document.addEventListener('keydown', handleInteraction)

      return () => {
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
        document.removeEventListener('keydown', handleInteraction)
      }
    }
  }, [autoInitialize, defaultMasterVolume, defaultUISoundsEnabled])

  // ============ UI Sounds ============

  const playSound = useCallback((sound: UISound) => {
    audioManager.playUISound(sound)
  }, [])

  const setUISoundsEnabled = useCallback((enabled: boolean) => {
    audioManager.setUISoundsEnabled(enabled)
  }, [])

  // ============ Binaural Beats ============

  const startBinaural = useCallback(async (preset: BrainwavePreset) => {
    await audioManager.startBinauralBeats(preset)
  }, [])

  const stopBinaural = useCallback(() => {
    audioManager.stopBinauralBeats()
  }, [])

  const setBinauralForLayer = useCallback(async (layer: ConsciousnessLayer) => {
    await audioManager.setBinauralForLayer(layer)
  }, [])

  const setBinauralVolume = useCallback((volume: number) => {
    audioManager.setBinauralVolume(volume)
  }, [])

  // ============ Ambient Soundscapes ============

  const startAmbient = useCallback(async (soundscape: AmbientSoundscape) => {
    await audioManager.startAmbientSoundscape(soundscape)
  }, [])

  const stopAmbient = useCallback(() => {
    audioManager.stopAmbientSoundscape()
  }, [])

  const setAmbientVolume = useCallback((volume: number) => {
    audioManager.setAmbientVolume(volume)
  }, [])

  // ============ Master Controls ============

  const setMasterVolume = useCallback((volume: number) => {
    audioManager.setMasterVolume(volume)
  }, [])

  const stopAll = useCallback(() => {
    audioManager.stopAll()
  }, [])

  // ============ Convenience Methods ============

  const playMeditationStart = useCallback(() => playSound('meditation_start'), [playSound])
  const playMeditationEnd = useCallback(() => playSound('meditation_end'), [playSound])
  const playGong = useCallback(() => playSound('gong'), [playSound])
  const playBell = useCallback(() => playSound('bell'), [playSound])
  const playChime = useCallback(() => playSound('chime'), [playSound])
  const playOm = useCallback(() => playSound('om'), [playSound])
  const playSingingBowl = useCallback(() => playSound('singing_bowl'), [playSound])

  const playClick = useCallback(() => playSound('click'), [playSound])
  const playToggle = useCallback(() => playSound('toggle'), [playSound])
  const playSuccess = useCallback(() => playSound('success'), [playSound])
  const playError = useCallback(() => playSound('error'), [playSound])
  const playNotification = useCallback(() => playSound('notification'), [playSound])
  const playTransition = useCallback(() => playSound('transition'), [playSound])
  const playOpen = useCallback(() => playSound('open'), [playSound])
  const playClose = useCallback(() => playSound('close'), [playSound])

  const playLevelUp = useCallback(() => playSound('levelUp'), [playSound])
  const playAchievement = useCallback(() => playSound('achievement'), [playSound])
  const playStreak = useCallback(() => playSound('streak'), [playSound])

  const playBreathIn = useCallback(() => playSound('breath_in'), [playSound])
  const playBreathOut = useCallback(() => playSound('breath_out'), [playSound])
  const playBreathHold = useCallback(() => playSound('breath_hold'), [playSound])

  // ============ Context Value ============

  const value: AudioContextValue = {
    state,
    isInitialized: state.initialized,
    isReady,

    playSound,
    setUISoundsEnabled,

    startBinaural,
    stopBinaural,
    setBinauralForLayer,
    setBinauralVolume,

    startAmbient,
    stopAmbient,
    setAmbientVolume,

    setMasterVolume,
    stopAll,

    playMeditationStart,
    playMeditationEnd,
    playGong,
    playBell,
    playChime,
    playOm,
    playSingingBowl,

    playClick,
    playToggle,
    playSuccess,
    playError,
    playNotification,
    playTransition,
    playOpen,
    playClose,

    playLevelUp,
    playAchievement,
    playStreak,

    playBreathIn,
    playBreathOut,
    playBreathHold
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

// ============ Hook ============

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext)

  if (!context) {
    // Return a no-op version if provider is missing
    return {
      state: {
        initialized: false,
        masterVolume: 0.7,
        uiSoundsEnabled: true,
        binauralEnabled: false,
        spatialEnabled: false,
        ambientEnabled: false,
        currentBrainwave: null,
        currentAmbient: null,
        currentSpatialScene: null
      },
      isInitialized: false,
      isReady: false,
      playSound: () => {},
      setUISoundsEnabled: () => {},
      startBinaural: async () => {},
      stopBinaural: () => {},
      setBinauralForLayer: async () => {},
      setBinauralVolume: () => {},
      startAmbient: async () => {},
      stopAmbient: () => {},
      setAmbientVolume: () => {},
      setMasterVolume: () => {},
      stopAll: () => {},
      playMeditationStart: () => {},
      playMeditationEnd: () => {},
      playGong: () => {},
      playBell: () => {},
      playChime: () => {},
      playOm: () => {},
      playSingingBowl: () => {},
      playClick: () => {},
      playToggle: () => {},
      playSuccess: () => {},
      playError: () => {},
      playNotification: () => {},
      playTransition: () => {},
      playOpen: () => {},
      playClose: () => {},
      playLevelUp: () => {},
      playAchievement: () => {},
      playStreak: () => {},
      playBreathIn: () => {},
      playBreathOut: () => {},
      playBreathHold: () => {}
    }
  }

  return context
}

// ============ Sound-Enabled Components ============

/**
 * Button with built-in click sound
 */
interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  sound?: UISound
  children: ReactNode
}

export function SoundButton({
  sound = 'click',
  onClick,
  children,
  ...props
}: SoundButtonProps) {
  const { playSound } = useAudio()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playSound(sound)
    onClick?.(e)
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

/**
 * Link with built-in navigation sound
 */
interface SoundLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  sound?: UISound
  children: ReactNode
}

export function SoundLink({
  sound = 'click',
  onClick,
  children,
  ...props
}: SoundLinkProps) {
  const { playSound } = useAudio()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    playSound(sound)
    onClick?.(e)
  }

  return (
    <a onClick={handleClick} {...props}>
      {children}
    </a>
  )
}

/**
 * Toggle with built-in sound
 */
interface SoundToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function SoundToggle({
  checked,
  onChange,
  className = ''
}: SoundToggleProps) {
  const { playToggle } = useAudio()

  const handleChange = () => {
    playToggle()
    onChange(!checked)
  }

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={handleChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-600'
      } ${className}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

/**
 * Hook for adding sound to any element
 */
export function useSoundEffect(sound: UISound) {
  const { playSound } = useAudio()

  return useCallback(() => {
    playSound(sound)
  }, [playSound, sound])
}

/**
 * Hook for playing sounds on mount (e.g., page transitions)
 */
export function useSoundOnMount(sound: UISound) {
  const { playSound, isReady } = useAudio()

  useEffect(() => {
    if (isReady) {
      playSound(sound)
    }
  }, [isReady, playSound, sound])
}

/**
 * Hook for binaural beats with auto-cleanup
 */
export function useBinauralBeats(preset: BrainwavePreset | null, autoStart = false) {
  const { startBinaural, stopBinaural, state } = useAudio()

  useEffect(() => {
    if (autoStart && preset) {
      startBinaural(preset)
    }

    return () => {
      if (autoStart && state.binauralEnabled) {
        stopBinaural()
      }
    }
  }, [autoStart, preset, startBinaural, stopBinaural, state.binauralEnabled])

  return {
    isPlaying: state.binauralEnabled,
    currentPreset: state.currentBrainwave,
    start: startBinaural,
    stop: stopBinaural
  }
}

/**
 * Hook for ambient soundscapes with auto-cleanup
 */
export function useAmbientSoundscape(soundscape: AmbientSoundscape | null, autoStart = false) {
  const { startAmbient, stopAmbient, state } = useAudio()

  useEffect(() => {
    if (autoStart && soundscape) {
      startAmbient(soundscape)
    }

    return () => {
      if (autoStart && state.ambientEnabled) {
        stopAmbient()
      }
    }
  }, [autoStart, soundscape, startAmbient, stopAmbient, state.ambientEnabled])

  return {
    isPlaying: state.ambientEnabled,
    currentSoundscape: state.currentAmbient,
    start: startAmbient,
    stop: stopAmbient
  }
}

export default AudioContext
