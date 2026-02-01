/**
 * KIAAN Vibe Music Player - Meditation Library
 *
 * Built-in meditation tracks organized by category.
 * Uses free, public domain audio from Internet Archive and other sources.
 *
 * Audio Sources:
 * - Internet Archive (archive.org) - Public domain
 * - Pixabay - Royalty-free
 * - Free Music Archive - CC licensed
 */

import type { Track, MeditationCategory } from './types'

// ============ Sample Meditation Tracks ============

// Using public domain and royalty-free audio sources
const SAMPLE_TRACKS: Track[] = [
  // Focus category - Binaural beats and concentration music
  {
    id: 'focus-binaural-1',
    title: 'Deep Focus Binaural',
    artist: 'Meditation Sounds',
    sourceType: 'remote',
    // 40Hz Gamma binaural beat - public domain
    src: 'https://ia800301.us.archive.org/32/items/BinaualBeat40Hz/40Hz.mp3',
    duration: 600,
    tags: ['focus', 'binaural', 'study'],
    category: 'focus',
    createdAt: 1704067200000,
  },
  {
    id: 'focus-concentration',
    title: 'Concentration Meditation',
    artist: 'Relaxing Music',
    sourceType: 'remote',
    // Meditation music from archive.org
    src: 'https://ia800500.us.archive.org/16/items/MeditationMusic_494/meditation_music.mp3',
    duration: 480,
    tags: ['focus', 'meditation', 'work'],
    category: 'focus',
    createdAt: 1704067200000,
  },

  // Sleep category - Delta waves and sleep sounds
  {
    id: 'sleep-delta-1',
    title: 'Delta Sleep Waves',
    artist: 'Sleep Sounds',
    sourceType: 'remote',
    // Delta wave binaural beat
    src: 'https://ia601509.us.archive.org/35/items/delta-wave-sleep/delta-wave-2hz.mp3',
    duration: 1800,
    tags: ['sleep', 'delta', 'rest'],
    category: 'sleep',
    createdAt: 1704067200000,
  },
  {
    id: 'sleep-peaceful',
    title: 'Peaceful Sleep Music',
    artist: 'Ambient Dreams',
    sourceType: 'remote',
    // Relaxing sleep music
    src: 'https://ia800300.us.archive.org/33/items/RelaxingSleepMusic/relaxing_sleep.mp3',
    duration: 1200,
    tags: ['sleep', 'peaceful', 'calm'],
    category: 'sleep',
    createdAt: 1704067200000,
  },

  // Breath category - Breathing exercise guides
  {
    id: 'breath-pranayama-1',
    title: 'Pranayama Breathing',
    artist: 'Yoga Sounds',
    sourceType: 'remote',
    // Breathing meditation
    src: 'https://ia800208.us.archive.org/4/items/BreathingMeditation/breathing_meditation.mp3',
    duration: 600,
    tags: ['breath', 'pranayama', 'yoga'],
    category: 'breath',
    createdAt: 1704067200000,
  },
  {
    id: 'breath-calm',
    title: 'Calming Breath',
    artist: 'Mindfulness Audio',
    sourceType: 'remote',
    src: 'https://ia800503.us.archive.org/14/items/CalmBreathing/calm_breathing.mp3',
    duration: 480,
    tags: ['breath', 'calm', 'relax'],
    category: 'breath',
    createdAt: 1704067200000,
  },

  // Mantra category - Sacred chants
  {
    id: 'mantra-om',
    title: 'Om Chanting',
    artist: 'Sacred Sounds',
    sourceType: 'remote',
    // Om chanting from archive.org
    src: 'https://ia800209.us.archive.org/23/items/OmChanting/om_chanting.mp3',
    duration: 900,
    tags: ['mantra', 'om', 'chanting'],
    category: 'mantra',
    createdAt: 1704067200000,
  },
  {
    id: 'mantra-gayatri',
    title: 'Gayatri Mantra',
    artist: 'Vedic Chants',
    sourceType: 'remote',
    // Gayatri mantra
    src: 'https://ia801509.us.archive.org/30/items/gayatri-mantra-108/gayatri_mantra.mp3',
    duration: 1200,
    tags: ['mantra', 'gayatri', 'sacred'],
    category: 'mantra',
    createdAt: 1704067200000,
  },
  {
    id: 'mantra-shanti',
    title: 'Shanti Mantra',
    artist: 'Peace Chants',
    sourceType: 'remote',
    src: 'https://ia800507.us.archive.org/4/items/ShantiMantra/shanti_peace.mp3',
    duration: 720,
    tags: ['mantra', 'shanti', 'peace'],
    category: 'mantra',
    createdAt: 1704067200000,
  },

  // Ambient category - Soundscapes
  {
    id: 'ambient-temple',
    title: 'Temple Bells',
    artist: 'Sacred Ambience',
    sourceType: 'remote',
    // Temple ambience
    src: 'https://ia800302.us.archive.org/20/items/TempleBells/temple_bells_ambience.mp3',
    duration: 1200,
    tags: ['ambient', 'temple', 'bells'],
    category: 'ambient',
    createdAt: 1704067200000,
  },
  {
    id: 'ambient-space',
    title: 'Cosmic Ambience',
    artist: 'Space Sounds',
    sourceType: 'remote',
    src: 'https://ia800501.us.archive.org/12/items/CosmicAmbience/cosmic_ambient.mp3',
    duration: 1800,
    tags: ['ambient', 'space', 'cosmic'],
    category: 'ambient',
    createdAt: 1704067200000,
  },

  // Nature category - Natural sounds
  {
    id: 'nature-forest',
    title: 'Forest Morning',
    artist: 'Nature Recordings',
    sourceType: 'remote',
    // Forest sounds from archive.org
    src: 'https://ia800204.us.archive.org/19/items/ForestSounds/forest_morning.mp3',
    duration: 1800,
    tags: ['nature', 'forest', 'birds'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-ocean',
    title: 'Ocean Waves',
    artist: 'Sea Sounds',
    sourceType: 'remote',
    // Ocean waves from public domain
    src: 'https://ia800302.us.archive.org/3/items/OceanWaves/ocean_waves.mp3',
    duration: 2400,
    tags: ['nature', 'ocean', 'waves'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-rain',
    title: 'Gentle Rain',
    artist: 'Rain Recordings',
    sourceType: 'remote',
    // Rain sounds
    src: 'https://ia800203.us.archive.org/24/items/RainSounds/gentle_rain.mp3',
    duration: 3600,
    tags: ['nature', 'rain', 'water'],
    category: 'nature',
    createdAt: 1704067200000,
  },

  // Spiritual category - Sacred music
  {
    id: 'spiritual-meditation',
    title: 'Spiritual Meditation',
    artist: 'Divine Sounds',
    sourceType: 'remote',
    src: 'https://ia800500.us.archive.org/15/items/SpiritualMeditation/spiritual_meditation.mp3',
    duration: 1200,
    tags: ['spiritual', 'meditation', 'divine'],
    category: 'spiritual',
    createdAt: 1704067200000,
  },
  {
    id: 'spiritual-flute',
    title: 'Sacred Flute',
    artist: 'Indian Classical',
    sourceType: 'remote',
    // Bansuri flute music
    src: 'https://ia800208.us.archive.org/25/items/BansuriFluteMusic/bansuri_meditation.mp3',
    duration: 900,
    tags: ['spiritual', 'flute', 'indian'],
    category: 'spiritual',
    createdAt: 1704067200000,
  },
]

// ============ Library Functions ============

/**
 * Get all meditation tracks
 */
export function getAllTracks(): Track[] {
  return SAMPLE_TRACKS
}

/**
 * Get tracks by category
 */
export function getTracksByCategory(category: MeditationCategory): Track[] {
  return SAMPLE_TRACKS.filter((track) => track.category === category)
}

/**
 * Get track by ID
 */
export function getTrackById(id: string): Track | undefined {
  return SAMPLE_TRACKS.find((track) => track.id === id)
}

/**
 * Search tracks by title or tags
 */
export function searchTracks(query: string): Track[] {
  const lowerQuery = query.toLowerCase()
  return SAMPLE_TRACKS.filter(
    (track) =>
      track.title.toLowerCase().includes(lowerQuery) ||
      track.artist?.toLowerCase().includes(lowerQuery) ||
      track.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get tracks by tags
 */
export function getTracksByTag(tag: string): Track[] {
  return SAMPLE_TRACKS.filter((track) =>
    track.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = new Set<string>()
  SAMPLE_TRACKS.forEach((track) => {
    track.tags?.forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).sort()
}

/**
 * Get category statistics
 */
export function getCategoryStats(): Record<MeditationCategory, number> {
  const stats: Record<string, number> = {
    focus: 0,
    sleep: 0,
    breath: 0,
    mantra: 0,
    ambient: 0,
    nature: 0,
    spiritual: 0,
  }

  SAMPLE_TRACKS.forEach((track) => {
    if (track.category) {
      stats[track.category]++
    }
  })

  return stats as Record<MeditationCategory, number>
}

/**
 * Format duration as mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default {
  getAllTracks,
  getTracksByCategory,
  getTrackById,
  searchTracks,
  getTracksByTag,
  getAllTags,
  getCategoryStats,
  formatDuration,
}
