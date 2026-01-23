'use client'

/**
 * Global Audio Context Provider
 *
 * ॐ श्री गणेशाय नमः
 *
 * Provides audio functionality throughout the entire MindVibe app:
 * - UI sound effects (clicks, toggles, notifications)
 * - Binaural beats and brainwave entrainment
 * - Solfeggio healing frequencies (174-963 Hz)
 * - Chakra alignment frequencies
 * - Gita-based Guna states (Sattva, Rajas, Tamas)
 * - Activity soundscapes (Sleep, Meditation, Reading, Focus, Listening)
 * - Isochronic tones for enhanced entrainment
 * - Ambient soundscapes
 * - Meditation sounds (bells, gongs, singing bowls)
 * - Haptic feedback
 *
 * Based on Bhagavad Gita principles for spiritual well-being
 *
 * Usage:
 *   import { useAudio } from '@/contexts/AudioContext'
 *   const { playSound, startBinaural, startActivity, playChakra } = useAudio()
 *   playSound('click')
 *   startActivity('meditation')
 *   playChakra('anahata')
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
  type AudioManagerState,
  type ActivitySoundscape,
  type SolfeggioFrequency,
  type ChakraFrequency,
  type GunaState
} from '@/utils/audio/AudioManager'

// Re-export types for consumers
export type {
  UISound,
  BrainwavePreset,
  AmbientSoundscape,
  ConsciousnessLayer,
  AudioManagerState,
  ActivitySoundscape,
  SolfeggioFrequency,
  ChakraFrequency,
  GunaState
}

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

  // Gita-Based Activity Soundscapes
  startActivity: (activity: ActivitySoundscape) => Promise<void>
  stopActivity: () => void
  setActivityVolume: (volume: number) => void

  // Solfeggio Frequencies
  playSolfeggio: (frequency: SolfeggioFrequency, duration?: number) => Promise<void>
  stopSolfeggio: () => void

  // Chakra Frequencies
  playChakra: (chakra: ChakraFrequency, withBinaural?: boolean) => Promise<void>
  stopChakra: () => void
  playChakraJourney: (durationPerChakra?: number) => Promise<void>

  // Isochronic Tones
  startIsochronic: (frequency: number, pulseRate: number, dutyCycle?: number) => Promise<void>
  stopIsochronic: () => void
  setIsochronicVolume: (volume: number) => void

  // Guna States (Gita Chapter 14)
  setGuna: (guna: GunaState) => Promise<void>

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
    activityEnabled: false,
    isochronicEnabled: false,
    currentBrainwave: null,
    currentAmbient: null,
    currentSpatialScene: null,
    currentActivity: null,
    currentChakra: null,
    currentGuna: null
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

  // ============ Gita-Based Activity Soundscapes ============

  const startActivity = useCallback(async (activity: ActivitySoundscape) => {
    await audioManager.startActivitySoundscape(activity)
  }, [])

  const stopActivity = useCallback(() => {
    audioManager.stopActivitySoundscape()
  }, [])

  const setActivityVolume = useCallback((volume: number) => {
    audioManager.setActivityVolume(volume)
  }, [])

  // ============ Solfeggio Frequencies ============

  const playSolfeggio = useCallback(async (frequency: SolfeggioFrequency, duration?: number) => {
    await audioManager.playSolfeggioFrequency(frequency, duration)
  }, [])

  const stopSolfeggio = useCallback(() => {
    audioManager.stopSolfeggioFrequency()
  }, [])

  // ============ Chakra Frequencies ============

  const playChakra = useCallback(async (chakra: ChakraFrequency, withBinaural = true) => {
    await audioManager.playChakraFrequency(chakra, withBinaural)
  }, [])

  const stopChakra = useCallback(() => {
    audioManager.stopChakraFrequency()
  }, [])

  const playChakraJourney = useCallback(async (durationPerChakra = 60) => {
    await audioManager.playChakraJourney(durationPerChakra)
  }, [])

  // ============ Isochronic Tones ============

  const startIsochronic = useCallback(async (frequency: number, pulseRate: number, dutyCycle?: number) => {
    await audioManager.startIsochronicTone(frequency, pulseRate, dutyCycle)
  }, [])

  const stopIsochronic = useCallback(() => {
    audioManager.stopIsochronicTone()
  }, [])

  const setIsochronicVolume = useCallback((volume: number) => {
    audioManager.setIsochronicVolume(volume)
  }, [])

  // ============ Guna States (Gita Chapter 14) ============

  const setGuna = useCallback(async (guna: GunaState) => {
    await audioManager.setGunaState(guna)
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

    // Gita-Based Activity Soundscapes
    startActivity,
    stopActivity,
    setActivityVolume,

    // Solfeggio Frequencies
    playSolfeggio,
    stopSolfeggio,

    // Chakra Frequencies
    playChakra,
    stopChakra,
    playChakraJourney,

    // Isochronic Tones
    startIsochronic,
    stopIsochronic,
    setIsochronicVolume,

    // Guna States
    setGuna,

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
        activityEnabled: false,
        isochronicEnabled: false,
        currentBrainwave: null,
        currentAmbient: null,
        currentSpatialScene: null,
        currentActivity: null,
        currentChakra: null,
        currentGuna: null
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
      // Gita-Based Activity Soundscapes
      startActivity: async () => {},
      stopActivity: () => {},
      setActivityVolume: () => {},
      // Solfeggio Frequencies
      playSolfeggio: async () => {},
      stopSolfeggio: () => {},
      // Chakra Frequencies
      playChakra: async () => {},
      stopChakra: () => {},
      playChakraJourney: async () => {},
      // Isochronic Tones
      startIsochronic: async () => {},
      stopIsochronic: () => {},
      setIsochronicVolume: () => {},
      // Guna States
      setGuna: async () => {},
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

// ============ Gita-Based Hooks ============

/**
 * Hook for activity soundscapes with auto-cleanup
 *
 * Usage:
 *   const { isPlaying } = useActivitySoundscape('meditation', true)
 */
export function useActivitySoundscape(activity: ActivitySoundscape | null, autoStart = false) {
  const { startActivity, stopActivity, state } = useAudio()

  useEffect(() => {
    if (autoStart && activity) {
      startActivity(activity)
    }

    return () => {
      if (autoStart && state.activityEnabled) {
        stopActivity()
      }
    }
  }, [autoStart, activity, startActivity, stopActivity, state.activityEnabled])

  return {
    isPlaying: state.activityEnabled,
    currentActivity: state.currentActivity,
    start: startActivity,
    stop: stopActivity
  }
}

/**
 * Hook for chakra frequencies with auto-cleanup
 *
 * Usage:
 *   const { isPlaying } = useChakraFrequency('anahata', true)
 */
export function useChakraFrequency(chakra: ChakraFrequency | null, autoStart = false) {
  const { playChakra, stopChakra, state } = useAudio()

  useEffect(() => {
    if (autoStart && chakra) {
      playChakra(chakra)
    }

    return () => {
      if (autoStart && state.currentChakra) {
        stopChakra()
      }
    }
  }, [autoStart, chakra, playChakra, stopChakra, state.currentChakra])

  return {
    currentChakra: state.currentChakra,
    play: playChakra,
    stop: stopChakra
  }
}

/**
 * Hook for Guna states
 *
 * Usage:
 *   const { setGuna, currentGuna } = useGunaState()
 *   setGuna('sattva') // Pure consciousness
 */
export function useGunaState() {
  const { setGuna, state } = useAudio()

  return {
    currentGuna: state.currentGuna,
    setGuna,
    setSattva: useCallback(() => setGuna('sattva'), [setGuna]),
    setRajas: useCallback(() => setGuna('rajas'), [setGuna]),
    setTamas: useCallback(() => setGuna('tamas'), [setGuna])
  }
}

/**
 * Hook for sleep mode - optimized for deep restorative sleep
 *
 * Based on Bhagavad Gita 6.17:
 * "युक्तस्वप्नावबोधस्य योगो भवति दुःखहा"
 * "Yoga destroys sorrow for one of regulated sleep"
 */
export function useSleepMode(autoStart = false) {
  const { startActivity, stopActivity, state, setGuna } = useAudio()

  useEffect(() => {
    if (autoStart) {
      startActivity('sleep')
    }

    return () => {
      if (autoStart && state.activityEnabled) {
        stopActivity()
      }
    }
  }, [autoStart, startActivity, stopActivity, state.activityEnabled])

  const startSleep = useCallback(async () => {
    await setGuna('tamas')
    await startActivity('sleep')
  }, [setGuna, startActivity])

  return {
    isPlaying: state.currentActivity === 'sleep',
    start: startSleep,
    stop: stopActivity
  }
}

/**
 * Hook for meditation mode - deep dhyana practice
 *
 * Based on Bhagavad Gita Chapter 6 - Dhyana Yoga
 */
export function useMeditationMode(autoStart = false) {
  const { startActivity, stopActivity, state, playSolfeggio } = useAudio()

  useEffect(() => {
    if (autoStart) {
      startActivity('meditation')
    }

    return () => {
      if (autoStart && state.activityEnabled) {
        stopActivity()
      }
    }
  }, [autoStart, startActivity, stopActivity, state.activityEnabled])

  const startMeditation = useCallback(async () => {
    await playSolfeggio('mi_528')  // Heart healing frequency
    await startActivity('meditation')
  }, [playSolfeggio, startActivity])

  return {
    isPlaying: state.currentActivity === 'meditation',
    start: startMeditation,
    stop: stopActivity
  }
}

/**
 * Hook for focus mode - karma yoga (action with awareness)
 *
 * Based on Bhagavad Gita 2.48:
 * "योगस्थः कुरु कर्माणि"
 * "Established in yoga, perform action"
 */
export function useFocusMode(autoStart = false) {
  const { startActivity, stopActivity, state, setGuna } = useAudio()

  useEffect(() => {
    if (autoStart) {
      startActivity('focus')
    }

    return () => {
      if (autoStart && state.activityEnabled) {
        stopActivity()
      }
    }
  }, [autoStart, startActivity, stopActivity, state.activityEnabled])

  const startFocus = useCallback(async () => {
    await setGuna('rajas')  // Active energy state
    await startActivity('focus')
  }, [setGuna, startActivity])

  return {
    isPlaying: state.currentActivity === 'focus',
    start: startFocus,
    stop: stopActivity
  }
}

/**
 * Hook for reading/study mode - jnana yoga (wisdom)
 *
 * Based on Bhagavad Gita 4.38:
 * "न हि ज्ञानेन सदृशं पवित्रमिह विद्यते"
 * "Nothing purifies like knowledge"
 */
export function useStudyMode(autoStart = false) {
  const { startActivity, stopActivity, state, playSolfeggio } = useAudio()

  useEffect(() => {
    if (autoStart) {
      startActivity('reading')
    }

    return () => {
      if (autoStart && state.activityEnabled) {
        stopActivity()
      }
    }
  }, [autoStart, startActivity, stopActivity, state.activityEnabled])

  const startStudy = useCallback(async () => {
    await playSolfeggio('la_852')  // Third eye - intuition
    await startActivity('reading')
  }, [playSolfeggio, startActivity])

  return {
    isPlaying: state.currentActivity === 'reading',
    start: startStudy,
    stop: stopActivity
  }
}

export default AudioContext
