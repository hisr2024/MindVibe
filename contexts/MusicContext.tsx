'use client'

/**
 * Global Music Context Provider
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Provides professional music functionality throughout the entire MindVibe app:
 * - App-wide ambient music with multiple modes
 * - Meditation music for brainwave entrainment
 * - Time-based raga music (morning, evening, night)
 * - Spiritual Gita-based soundscapes
 * - Krishna flute and temple atmospheres
 *
 * Based on Bhagavad Gita Chapter 10.25:
 * "गीतं सामास्मि" - "Among hymns, I am the Sama Veda"
 *
 * Usage:
 *   import { useMusic } from '@/contexts/MusicContext'
 *   const { startAmbient, startMeditation, startSpiritual } = useMusic()
 *   startAmbient('serene')
 *   startMeditation('transcendental')
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
  musicSystem,
  type MusicSystemState,
  type AmbientMusicMode,
  type MeditationType,
  type SpiritualMode,
  type TimeOfDay,
  type RagaTime,
  type BrainwaveState,
  BRAINWAVE_CONFIGS,
  RAGA_DEFINITIONS,
  SACRED_FREQUENCIES
} from '@/utils/audio/MusicSystem'

// Re-export types for consumers
export type {
  MusicSystemState,
  AmbientMusicMode,
  MeditationType,
  SpiritualMode,
  TimeOfDay,
  RagaTime,
  BrainwaveState
}

// ============ Types ============

interface MusicContextValue {
  // State
  state: MusicSystemState
  isInitialized: boolean
  isPlaying: boolean

  // Ambient Music
  startAmbient: (mode: AmbientMusicMode) => Promise<void>
  stopAmbient: () => void
  setAmbientVolume: (volume: number) => void

  // Meditation Music
  startMeditation: (type: MeditationType) => Promise<void>
  stopMeditation: () => void
  setMeditationVolume: (volume: number) => void

  // Spiritual Music
  startSpiritual: (mode: SpiritualMode) => Promise<void>
  stopSpiritual: () => void
  setSpiritualVolume: (volume: number) => void

  // Time-Based Music (Ragas)
  startTimeMusic: (timeOfDay?: TimeOfDay) => Promise<void>
  stopTimeMusic: () => void
  setRagaVolume: (volume: number) => void

  // Master Controls
  setMasterVolume: (volume: number) => void
  stopAll: () => void

  // Quick presets
  startMorningMusic: () => Promise<void>
  startEveningMusic: () => Promise<void>
  startNightMusic: () => Promise<void>
  startDeepMeditation: () => Promise<void>
  startFocusMusic: () => Promise<void>
  startSleepMusic: () => Promise<void>
  startKrishnaFlute: () => Promise<void>
  startOmMeditation: () => Promise<void>

  // Info helpers
  getBrainwaveInfo: (state: BrainwaveState) => typeof BRAINWAVE_CONFIGS[BrainwaveState]
  getRagaInfo: (raga: RagaTime) => typeof RAGA_DEFINITIONS[RagaTime]
  getCurrentTimeRaga: () => RagaTime
}

// ============ Ambient Mode Details ============

export const AMBIENT_MODES: Record<AmbientMusicMode, {
  name: string
  nameHindi: string
  description: string
  icon: string
  color: string
}> = {
  serene: {
    name: 'Serene',
    nameHindi: 'शांत',
    description: 'Calm and peaceful ambient sounds for relaxation',
    icon: '🌸',
    color: 'from-pink-500 to-rose-500'
  },
  ethereal: {
    name: 'Ethereal',
    nameHindi: 'आकाशीय',
    description: 'Dreamy, floating soundscapes for transcendence',
    icon: '✨',
    color: 'from-violet-500 to-purple-500'
  },
  cosmic: {
    name: 'Cosmic',
    nameHindi: 'ब्रह्मांडीय',
    description: 'Deep space sounds with Schumann resonance',
    icon: '🌌',
    color: 'from-indigo-500 to-blue-500'
  },
  nature: {
    name: 'Nature',
    nameHindi: 'प्रकृति',
    description: 'Organic sounds of wind, water, and life',
    icon: '🌿',
    color: 'from-green-500 to-emerald-500'
  },
  divine: {
    name: 'Divine',
    nameHindi: 'दिव्य',
    description: 'Sacred Om-based frequencies for spiritual practice',
    icon: '🙏',
    color: 'from-amber-500 to-orange-500'
  },
  healing: {
    name: 'Healing',
    nameHindi: 'उपचार',
    description: '528 Hz based frequencies for cellular healing',
    icon: '💫',
    color: 'from-teal-500 to-cyan-500'
  },
  energizing: {
    name: 'Energizing',
    nameHindi: 'ऊर्जावान',
    description: 'Uplifting sounds for energy and motivation',
    icon: '⚡',
    color: 'from-yellow-500 to-amber-500'
  }
}

// ============ Meditation Type Details ============

export const MEDITATION_TYPES: Record<MeditationType, {
  name: string
  nameHindi: string
  description: string
  brainwave: BrainwaveState
  gitaReference?: string
  icon: string
  color: string
  duration: string
}> = {
  deep_sleep: {
    name: 'Deep Sleep',
    nameHindi: 'गहरी निद्रा',
    description: 'Delta waves for restorative Yoga Nidra',
    brainwave: 'delta',
    gitaReference: 'BG 6.17 - युक्तस्वप्नावबोधस्य',
    icon: '🌙',
    color: 'from-indigo-600 to-purple-700',
    duration: '20-45 min'
  },
  lucid_dreaming: {
    name: 'Lucid Dreaming',
    nameHindi: 'स्वप्न योग',
    description: 'Theta-Delta for dream consciousness',
    brainwave: 'theta',
    icon: '🌠',
    color: 'from-purple-600 to-pink-600',
    duration: '30-60 min'
  },
  transcendental: {
    name: 'Transcendental',
    nameHindi: 'पार करना',
    description: 'Deep Theta for transcendental meditation',
    brainwave: 'theta',
    gitaReference: 'BG 6.10-13 - Dhyana Yoga',
    icon: '🕉️',
    color: 'from-violet-600 to-indigo-600',
    duration: '20-40 min'
  },
  mindfulness: {
    name: 'Mindfulness',
    nameHindi: 'सजगता',
    description: 'Alpha-Theta for present moment awareness',
    brainwave: 'alpha',
    icon: '🧘',
    color: 'from-cyan-500 to-blue-500',
    duration: '10-30 min'
  },
  zen: {
    name: 'Zen',
    nameHindi: 'ध्यान',
    description: 'Alpha waves for Zazen meditation',
    brainwave: 'alpha',
    icon: '☯️',
    color: 'from-slate-500 to-gray-600',
    duration: '15-45 min'
  },
  loving_kindness: {
    name: 'Loving Kindness',
    nameHindi: 'मैत्री',
    description: 'Heart-centered Alpha for Metta practice',
    brainwave: 'alpha',
    gitaReference: 'BG 12.13-14 - Bhakti Yoga',
    icon: '💗',
    color: 'from-rose-500 to-pink-500',
    duration: '15-30 min'
  },
  focus: {
    name: 'Focus',
    nameHindi: 'एकाग्रता',
    description: 'Alpha-Beta for concentration',
    brainwave: 'beta',
    gitaReference: 'BG 6.12 - एकाग्रं मनः',
    icon: '🎯',
    color: 'from-blue-500 to-cyan-500',
    duration: '25-90 min'
  },
  flow_state: {
    name: 'Flow State',
    nameHindi: 'प्रवाह',
    description: 'Beta-Gamma for peak performance',
    brainwave: 'beta',
    gitaReference: 'BG 2.48 - योगस्थः कुरु कर्माणि',
    icon: '🌊',
    color: 'from-emerald-500 to-teal-500',
    duration: '45-120 min'
  },
  cosmic: {
    name: 'Cosmic Consciousness',
    nameHindi: 'समाधि',
    description: 'Gamma waves for highest awareness',
    brainwave: 'gamma',
    gitaReference: 'BG 6.29 - सर्वभूतस्थमात्मानं',
    icon: '🌟',
    color: 'from-amber-400 to-yellow-500',
    duration: '15-30 min'
  }
}

// ============ Spiritual Mode Details ============

export const SPIRITUAL_MODES: Record<SpiritualMode, {
  name: string
  nameHindi: string
  description: string
  gitaReference?: string
  icon: string
  color: string
}> = {
  om_meditation: {
    name: 'Om Meditation',
    nameHindi: 'ॐ ध्यान',
    description: 'Sacred Om vibration at 136.1 Hz',
    gitaReference: 'BG 8.13 - ओमित्येकाक्षरं ब्रह्म',
    icon: '🕉️',
    color: 'from-orange-500 to-amber-500'
  },
  gayatri: {
    name: 'Gayatri Essence',
    nameHindi: 'गायत्री',
    description: 'Sacred vibrations of the Gayatri mantra',
    icon: '☀️',
    color: 'from-yellow-500 to-orange-500'
  },
  mahamrityunjaya: {
    name: 'Healing Vibrations',
    nameHindi: 'महामृत्युंजय',
    description: 'Healing and protection frequencies',
    icon: '🙏',
    color: 'from-emerald-500 to-green-500'
  },
  gita_dhyana: {
    name: 'Gita Contemplation',
    nameHindi: 'गीता ध्यान',
    description: 'Atmosphere for Bhagavad Gita study',
    gitaReference: 'Based on Raga Yaman',
    icon: '📖',
    color: 'from-violet-500 to-purple-500'
  },
  krishna_flute: {
    name: 'Krishna Flute',
    nameHindi: 'कृष्ण बांसुरी',
    description: 'Divine flute melodies of Lord Krishna',
    gitaReference: 'BG 10.35 - वेणुं च',
    icon: '🪈',
    color: 'from-blue-500 to-indigo-500'
  },
  temple_bells: {
    name: 'Temple Bells',
    nameHindi: 'मंदिर घंटी',
    description: 'Sacred temple bell atmosphere',
    icon: '🔔',
    color: 'from-amber-600 to-yellow-500'
  },
  vedic_chant: {
    name: 'Vedic Ambiance',
    nameHindi: 'वैदिक',
    description: 'Deep resonant Vedic drone sounds',
    icon: '📿',
    color: 'from-rose-600 to-red-500'
  },
  chakra_journey: {
    name: 'Chakra Journey',
    nameHindi: 'चक्र यात्रा',
    description: 'All seven chakra frequencies layered',
    icon: '🌈',
    color: 'from-red-500 via-yellow-500 to-violet-500'
  },
  kundalini: {
    name: 'Kundalini Awakening',
    nameHindi: 'कुंडलिनी',
    description: 'Rising energy from root to crown',
    icon: '🐍',
    color: 'from-red-600 to-orange-500'
  }
}

// ============ Time-Based Music Details ============

export const TIME_MUSIC_INFO: Record<TimeOfDay, {
  name: string
  nameHindi: string
  description: string
  raga: RagaTime
  timeRange: string
  icon: string
  color: string
}> = {
  brahma_muhurta: {
    name: 'Brahma Muhurta',
    nameHindi: 'ब्रह्म मुहूर्त',
    description: 'Sacred pre-dawn hours for spiritual practice',
    raga: 'bhairav',
    timeRange: '4:00 - 6:00 AM',
    icon: '🌅',
    color: 'from-indigo-600 to-purple-600'
  },
  morning: {
    name: 'Morning',
    nameHindi: 'प्रातःकाल',
    description: 'Awakening energy for the new day',
    raga: 'todi',
    timeRange: '6:00 AM - 12:00 PM',
    icon: '🌄',
    color: 'from-amber-500 to-orange-500'
  },
  afternoon: {
    name: 'Afternoon',
    nameHindi: 'दोपहर',
    description: 'Balanced energy for productivity',
    raga: 'bhimpalasi',
    timeRange: '12:00 - 4:00 PM',
    icon: '☀️',
    color: 'from-yellow-500 to-amber-500'
  },
  evening: {
    name: 'Evening',
    nameHindi: 'संध्या',
    description: 'Peaceful transition to relaxation',
    raga: 'yaman',
    timeRange: '4:00 - 8:00 PM',
    icon: '🌆',
    color: 'from-orange-500 to-rose-500'
  },
  night: {
    name: 'Night',
    nameHindi: 'रात्रि',
    description: 'Deep and majestic night ambiance',
    raga: 'darbari',
    timeRange: '8:00 PM - 12:00 AM',
    icon: '🌙',
    color: 'from-blue-600 to-indigo-600'
  },
  late_night: {
    name: 'Late Night',
    nameHindi: 'रात्रि ध्यान',
    description: 'Mysterious tones for night meditation',
    raga: 'malkauns',
    timeRange: '12:00 - 4:00 AM',
    icon: '🌌',
    color: 'from-slate-700 to-gray-800'
  }
}

// ============ Context ============

const MusicContext = createContext<MusicContextValue | null>(null)

// ============ Provider ============

interface MusicProviderProps {
  children: ReactNode
  autoInitialize?: boolean
  defaultMasterVolume?: number
  autoTimeSwitch?: boolean
}

export function MusicProvider({
  children,
  autoInitialize = true,
  defaultMasterVolume = 0.6,
  autoTimeSwitch = true
}: MusicProviderProps) {
  const [state, setState] = useState<MusicSystemState>({
    initialized: false,
    isPlaying: false,
    masterVolume: defaultMasterVolume,
    currentAmbientMode: null,
    currentMeditationType: null,
    currentSpiritualMode: null,
    currentTimeMusic: null,
    currentRaga: null,
    currentBrainwave: null,
    ambientVolume: 0.5,
    meditationVolume: 0.6,
    spiritualVolume: 0.5,
    ragaVolume: 0.4,
    ambientEnabled: false,
    meditationEnabled: false,
    spiritualEnabled: false,
    timeAwareEnabled: false,
    autoTimeSwitch: autoTimeSwitch
  })

  // Initialize music system
  useEffect(() => {
    if (autoInitialize && typeof window !== 'undefined') {
      musicSystem.initialize({
        masterVolume: defaultMasterVolume,
        autoTimeSwitch: autoTimeSwitch,
        onStateChange: setState
      })

      // Resume on first user interaction
      const handleInteraction = () => {
        musicSystem.resume()
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
  }, [autoInitialize, defaultMasterVolume, autoTimeSwitch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't dispose on unmount - keep playing across page navigations
    }
  }, [])

  // ============ Ambient Music ============

  const startAmbient = useCallback(async (mode: AmbientMusicMode) => {
    await musicSystem.startAmbientMusic(mode)
  }, [])

  const stopAmbient = useCallback(() => {
    musicSystem.stopAmbientMusic()
  }, [])

  const setAmbientVolume = useCallback((volume: number) => {
    musicSystem.setAmbientVolume(volume)
  }, [])

  // ============ Meditation Music ============

  const startMeditation = useCallback(async (type: MeditationType) => {
    await musicSystem.startMeditationMusic(type)
  }, [])

  const stopMeditation = useCallback(() => {
    musicSystem.stopMeditationMusic()
  }, [])

  const setMeditationVolume = useCallback((volume: number) => {
    musicSystem.setMeditationVolume(volume)
  }, [])

  // ============ Spiritual Music ============

  const startSpiritual = useCallback(async (mode: SpiritualMode) => {
    await musicSystem.startSpiritualMusic(mode)
  }, [])

  const stopSpiritual = useCallback(() => {
    musicSystem.stopSpiritualMusic()
  }, [])

  const setSpiritualVolume = useCallback((volume: number) => {
    musicSystem.setSpiritualVolume(volume)
  }, [])

  // ============ Time-Based Music ============

  const startTimeMusic = useCallback(async (timeOfDay?: TimeOfDay) => {
    await musicSystem.startTimeMusic(timeOfDay)
  }, [])

  const stopTimeMusic = useCallback(() => {
    musicSystem.stopTimeMusic()
  }, [])

  const setRagaVolume = useCallback((volume: number) => {
    musicSystem.setRagaVolume(volume)
  }, [])

  // ============ Master Controls ============

  const setMasterVolume = useCallback((volume: number) => {
    musicSystem.setMasterVolume(volume)
  }, [])

  const stopAll = useCallback(() => {
    musicSystem.stopAll()
  }, [])

  // ============ Quick Presets ============

  const startMorningMusic = useCallback(async () => {
    await musicSystem.startTimeMusic('morning')
    await musicSystem.startAmbientMusic('nature')
  }, [])

  const startEveningMusic = useCallback(async () => {
    await musicSystem.startTimeMusic('evening')
    await musicSystem.startAmbientMusic('serene')
  }, [])

  const startNightMusic = useCallback(async () => {
    await musicSystem.startTimeMusic('night')
    await musicSystem.startAmbientMusic('cosmic')
  }, [])

  const startDeepMeditation = useCallback(async () => {
    await musicSystem.startMeditationMusic('transcendental')
    await musicSystem.startSpiritualMusic('om_meditation')
  }, [])

  const startFocusMusic = useCallback(async () => {
    await musicSystem.startMeditationMusic('focus')
    await musicSystem.startAmbientMusic('serene')
  }, [])

  const startSleepMusic = useCallback(async () => {
    await musicSystem.startMeditationMusic('deep_sleep')
    await musicSystem.startAmbientMusic('cosmic')
  }, [])

  const startKrishnaFlute = useCallback(async () => {
    await musicSystem.startSpiritualMusic('krishna_flute')
  }, [])

  const startOmMeditation = useCallback(async () => {
    await musicSystem.startSpiritualMusic('om_meditation')
    await musicSystem.startMeditationMusic('transcendental')
  }, [])

  // ============ Info Helpers ============

  const getBrainwaveInfo = useCallback((brainwaveState: BrainwaveState) => {
    return BRAINWAVE_CONFIGS[brainwaveState]
  }, [])

  const getRagaInfo = useCallback((raga: RagaTime) => {
    return RAGA_DEFINITIONS[raga]
  }, [])

  const getCurrentTimeRaga = useCallback((): RagaTime => {
    const hour = new Date().getHours()
    if (hour >= 4 && hour < 7) return 'bhairav'
    if (hour >= 7 && hour < 10) return 'todi'
    if (hour >= 10 && hour < 13) return 'sarang'
    if (hour >= 13 && hour < 16) return 'bhimpalasi'
    if (hour >= 16 && hour < 17) return 'multani'
    if (hour >= 17 && hour < 19) return 'puriya'
    if (hour >= 19 && hour < 22) return 'yaman'
    if (hour >= 22 || hour < 1) return 'darbari'
    return 'malkauns'
  }, [])

  // ============ Context Value ============

  const value: MusicContextValue = {
    state,
    isInitialized: state.initialized,
    isPlaying: state.isPlaying,

    startAmbient,
    stopAmbient,
    setAmbientVolume,

    startMeditation,
    stopMeditation,
    setMeditationVolume,

    startSpiritual,
    stopSpiritual,
    setSpiritualVolume,

    startTimeMusic,
    stopTimeMusic,
    setRagaVolume,

    setMasterVolume,
    stopAll,

    startMorningMusic,
    startEveningMusic,
    startNightMusic,
    startDeepMeditation,
    startFocusMusic,
    startSleepMusic,
    startKrishnaFlute,
    startOmMeditation,

    getBrainwaveInfo,
    getRagaInfo,
    getCurrentTimeRaga
  }

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  )
}

// ============ Hook ============

export function useMusic(): MusicContextValue {
  const context = useContext(MusicContext)

  if (!context) {
    // Return a no-op version if provider is missing
    return {
      state: {
        initialized: false,
        isPlaying: false,
        masterVolume: 0.6,
        currentAmbientMode: null,
        currentMeditationType: null,
        currentSpiritualMode: null,
        currentTimeMusic: null,
        currentRaga: null,
        currentBrainwave: null,
        ambientVolume: 0.5,
        meditationVolume: 0.6,
        spiritualVolume: 0.5,
        ragaVolume: 0.4,
        ambientEnabled: false,
        meditationEnabled: false,
        spiritualEnabled: false,
        timeAwareEnabled: false,
        autoTimeSwitch: true
      },
      isInitialized: false,
      isPlaying: false,

      startAmbient: async () => {},
      stopAmbient: () => {},
      setAmbientVolume: () => {},

      startMeditation: async () => {},
      stopMeditation: () => {},
      setMeditationVolume: () => {},

      startSpiritual: async () => {},
      stopSpiritual: () => {},
      setSpiritualVolume: () => {},

      startTimeMusic: async () => {},
      stopTimeMusic: () => {},
      setRagaVolume: () => {},

      setMasterVolume: () => {},
      stopAll: () => {},

      startMorningMusic: async () => {},
      startEveningMusic: async () => {},
      startNightMusic: async () => {},
      startDeepMeditation: async () => {},
      startFocusMusic: async () => {},
      startSleepMusic: async () => {},
      startKrishnaFlute: async () => {},
      startOmMeditation: async () => {},

      getBrainwaveInfo: () => BRAINWAVE_CONFIGS.alpha,
      getRagaInfo: () => RAGA_DEFINITIONS.yaman,
      getCurrentTimeRaga: () => 'yaman'
    }
  }

  return context
}

// ============ Convenience Hooks ============

/**
 * Hook for ambient music with auto-cleanup
 */
export function useAmbientMusic(mode: AmbientMusicMode | null, autoStart = false) {
  const { startAmbient, stopAmbient, state } = useMusic()

  useEffect(() => {
    if (autoStart && mode) {
      startAmbient(mode)
    }

    return () => {
      if (autoStart && state.ambientEnabled) {
        stopAmbient()
      }
    }
  }, [autoStart, mode, startAmbient, stopAmbient, state.ambientEnabled])

  return {
    isPlaying: state.ambientEnabled,
    currentMode: state.currentAmbientMode,
    start: startAmbient,
    stop: stopAmbient
  }
}

/**
 * Hook for meditation music with auto-cleanup
 */
export function useMeditationMusic(type: MeditationType | null, autoStart = false) {
  const { startMeditation, stopMeditation, state } = useMusic()

  useEffect(() => {
    if (autoStart && type) {
      startMeditation(type)
    }

    return () => {
      if (autoStart && state.meditationEnabled) {
        stopMeditation()
      }
    }
  }, [autoStart, type, startMeditation, stopMeditation, state.meditationEnabled])

  return {
    isPlaying: state.meditationEnabled,
    currentType: state.currentMeditationType,
    currentBrainwave: state.currentBrainwave,
    start: startMeditation,
    stop: stopMeditation
  }
}

/**
 * Hook for spiritual music with auto-cleanup
 */
export function useSpiritualMusic(mode: SpiritualMode | null, autoStart = false) {
  const { startSpiritual, stopSpiritual, state } = useMusic()

  useEffect(() => {
    if (autoStart && mode) {
      startSpiritual(mode)
    }

    return () => {
      if (autoStart && state.spiritualEnabled) {
        stopSpiritual()
      }
    }
  }, [autoStart, mode, startSpiritual, stopSpiritual, state.spiritualEnabled])

  return {
    isPlaying: state.spiritualEnabled,
    currentMode: state.currentSpiritualMode,
    start: startSpiritual,
    stop: stopSpiritual
  }
}

/**
 * Hook for time-based music with auto-cleanup
 */
export function useTimeMusic(autoStart = false) {
  const { startTimeMusic, stopTimeMusic, state, getCurrentTimeRaga } = useMusic()

  useEffect(() => {
    if (autoStart) {
      startTimeMusic()
    }

    return () => {
      if (autoStart && state.timeAwareEnabled) {
        stopTimeMusic()
      }
    }
  }, [autoStart, startTimeMusic, stopTimeMusic, state.timeAwareEnabled])

  return {
    isPlaying: state.timeAwareEnabled,
    currentTime: state.currentTimeMusic,
    currentRaga: state.currentRaga,
    suggestedRaga: getCurrentTimeRaga(),
    start: startTimeMusic,
    stop: stopTimeMusic
  }
}

export default MusicContext
export { SACRED_FREQUENCIES }
