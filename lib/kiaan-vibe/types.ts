/**
 * KIAAN Vibe Music Player - Type Definitions
 *
 * Core data models for the music player.
 */

// ============ Track Types ============

export type TrackSourceType = 'builtIn' | 'remote' | 'upload'

export interface Track {
  id: string
  title: string
  artist?: string
  sourceType: TrackSourceType
  src: string // URL or IndexedDB blob key
  duration?: number // in seconds
  tags?: string[]
  category?: MeditationCategory
  createdAt: number // timestamp
  albumArt?: string
  /**
   * TTS fallback metadata for Gita voice tracks.
   * When the backend TTS API is unavailable, the player uses browser
   * Speech Synthesis API to read the verse text stored here.
   */
  ttsMetadata?: {
    text: string       // Text to speak (Sanskrit, translation, etc.)
    language: string   // BCP-47 language code for Speech Synthesis
    rate?: number      // Speech rate (0.5-2.0)
    pitch?: number     // Speech pitch (0-2)
  }
}

// ============ Playlist Types ============

export interface Playlist {
  id: string
  name: string
  trackIds: string[]
  createdAt: number
  updatedAt: number
  description?: string
  coverImage?: string
}

// ============ Meditation Categories ============

export type MeditationCategory =
  | 'focus'
  | 'sleep'
  | 'breath'
  | 'mantra'
  | 'ambient'
  | 'nature'
  | 'spiritual'

export const MEDITATION_CATEGORIES: Record<MeditationCategory, {
  name: string
  description: string
  icon: string
  gradient: string
}> = {
  focus: {
    name: 'Focus',
    description: 'Concentration and productivity',
    icon: 'Brain',
    gradient: 'from-yellow-500 to-amber-600',
  },
  sleep: {
    name: 'Sleep',
    description: 'Deep rest and relaxation',
    icon: 'Moon',
    gradient: 'from-indigo-500 to-purple-600',
  },
  breath: {
    name: 'Breath',
    description: 'Pranayama and breathing exercises',
    icon: 'Wind',
    gradient: 'from-cyan-500 to-blue-600',
  },
  mantra: {
    name: 'Mantra',
    description: 'Sacred chants and mantras',
    icon: 'Om',
    gradient: 'from-[#d4a44c] to-red-600',
  },
  ambient: {
    name: 'Ambient',
    description: 'Background soundscapes',
    icon: 'Waves',
    gradient: 'from-teal-500 to-emerald-600',
  },
  nature: {
    name: 'Nature',
    description: 'Natural sounds and environments',
    icon: 'TreePine',
    gradient: 'from-green-500 to-lime-600',
  },
  spiritual: {
    name: 'Spiritual',
    description: 'Divine and sacred music',
    icon: 'Sparkles',
    gradient: 'from-purple-500 to-pink-600',
  },
}

// ============ Player State Types ============

export type RepeatMode = 'off' | 'one' | 'all'

export interface PlayerState {
  // Current playback
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number

  // Playback state
  isPlaying: boolean
  isLoading: boolean
  position: number // current position in seconds
  duration: number // total duration in seconds

  // Settings
  volume: number // 0-1
  playbackRate: number // 0.5-2.0
  repeatMode: RepeatMode
  shuffle: boolean
  muted: boolean

  // History
  playHistory: string[] // track IDs

  // Error state for user-friendly error handling
  audioError: string | null
  hasAudioIssues: boolean
}

export interface PlayerActions {
  // Playback control
  play: (track?: Track) => Promise<void>
  pause: () => void
  toggle: () => void
  stop: () => void

  // Navigation
  next: () => Promise<void>
  previous: () => Promise<void>
  seek: (position: number) => void

  // Queue management
  setQueue: (tracks: Track[], startIndex?: number) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  shuffleQueue: () => void

  // Settings
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
  setRepeatMode: (mode: RepeatMode) => void
  toggleShuffle: () => void
  toggleMute: () => void

  // Error handling
  clearAudioError: () => void
  retryPlayback: () => Promise<void>

  // State loading
  loadPersistedState: () => Promise<void>
}

export type PlayerStore = PlayerState & PlayerActions

// ============ Gita Types ============

export interface GitaVerse {
  verseNumber: number
  sanskrit?: string
  transliteration?: string
  translations: Record<string, string> // langCode -> translation
}

export interface GitaChapter {
  number: number // Chapter number (1-18)
  chapterNumber?: number // Alias for number
  nameSanskrit: string
  nameEnglish: string
  nameHindi?: string
  description?: string
  theme?: string
  yogaType?: string // e.g., "Karma Yoga", "Bhakti Yoga"
  verseCount: number
  duration?: string // Duration for audio (e.g., "15:30")
  color?: string // Tailwind gradient class (e.g., "from-orange-500 to-amber-600")
  verses: GitaVerse[]
  audioSrc?: string // URL to audio file
}

export interface GitaData {
  chapters: GitaChapter[]
  availableLanguages: string[]
}

// ============ Learning Settings ============

export interface GitaLearningSettings {
  showTransliteration: boolean
  showMeaning: boolean
  showCommentary: boolean
  playbackSpeed: number
  pauseDuration: number
  autoAdvance: boolean
}

// ============ Soundscape Types ============

export interface GitaSoundscape {
  id: string
  name: string
  nameHindi?: string
  description: string
  icon: string
  gradient: string
  theme?: string
  recommendedTime?: string
  benefits: string[]
  ambientSounds: string[]
}

// ============ Persistence Types ============

export interface PersistedPlayerState {
  currentTrackId: string | null
  position: number
  volume: number
  playbackRate: number
  repeatMode: RepeatMode
  shuffle: boolean
  queueTrackIds: string[]
  queueIndex: number
}

export interface UploadedTrackMeta {
  id: string
  title: string
  artist?: string
  duration?: number
  fileName: string
  fileSize: number
  mimeType: string
  createdAt: number
}
