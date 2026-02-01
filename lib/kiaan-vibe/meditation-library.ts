/**
 * KIAAN Vibe Music Player - Meditation Library
 *
 * Built-in meditation tracks organized by category.
 * These are either bundled locally or stream from CDN.
 */

import type { Track, MeditationCategory } from './types'

// ============ Sample Meditation Tracks ============

// Note: These URLs point to royalty-free meditation audio sources
// In production, you'd want to host these on your own CDN
const SAMPLE_TRACKS: Track[] = [
  // Focus category
  {
    id: 'focus-binaural-1',
    title: 'Deep Focus Binaural',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/focus-binaural.mp3',
    duration: 1800, // 30 minutes
    tags: ['focus', 'binaural', 'study'],
    category: 'focus',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/focus.jpg',
  },
  {
    id: 'focus-alpha-waves',
    title: 'Alpha Waves for Concentration',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/alpha-waves.mp3',
    duration: 2400, // 40 minutes
    tags: ['focus', 'alpha', 'work'],
    category: 'focus',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/focus.jpg',
  },

  // Sleep category
  {
    id: 'sleep-delta-1',
    title: 'Delta Sleep Journey',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/delta-sleep.mp3',
    duration: 3600, // 60 minutes
    tags: ['sleep', 'delta', 'rest'],
    category: 'sleep',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/sleep.jpg',
  },
  {
    id: 'sleep-rain',
    title: 'Gentle Rain for Sleep',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/rain-sleep.mp3',
    duration: 7200, // 2 hours
    tags: ['sleep', 'rain', 'nature'],
    category: 'sleep',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/sleep.jpg',
  },

  // Breath category
  {
    id: 'breath-pranayama-1',
    title: 'Pranayama Breathing Guide',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/pranayama.mp3',
    duration: 900, // 15 minutes
    tags: ['breath', 'pranayama', 'yoga'],
    category: 'breath',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/breath.jpg',
  },
  {
    id: 'breath-box',
    title: 'Box Breathing Exercise',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/box-breathing.mp3',
    duration: 600, // 10 minutes
    tags: ['breath', 'box', 'calm'],
    category: 'breath',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/breath.jpg',
  },

  // Mantra category
  {
    id: 'mantra-om',
    title: 'Om Chanting',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/om-chanting.mp3',
    duration: 1200, // 20 minutes
    tags: ['mantra', 'om', 'chanting'],
    category: 'mantra',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/mantra.jpg',
  },
  {
    id: 'mantra-gayatri',
    title: 'Gayatri Mantra',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/gayatri.mp3',
    duration: 1800, // 30 minutes
    tags: ['mantra', 'gayatri', 'sacred'],
    category: 'mantra',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/mantra.jpg',
  },
  {
    id: 'mantra-shanti',
    title: 'Shanti Mantra',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/shanti.mp3',
    duration: 1500, // 25 minutes
    tags: ['mantra', 'shanti', 'peace'],
    category: 'mantra',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/mantra.jpg',
  },

  // Ambient category
  {
    id: 'ambient-temple',
    title: 'Temple Ambience',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/temple-ambient.mp3',
    duration: 3600, // 60 minutes
    tags: ['ambient', 'temple', 'bells'],
    category: 'ambient',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/ambient.jpg',
  },
  {
    id: 'ambient-cave',
    title: 'Sacred Cave Echoes',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/cave-ambient.mp3',
    duration: 2700, // 45 minutes
    tags: ['ambient', 'cave', 'echo'],
    category: 'ambient',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/ambient.jpg',
  },

  // Nature category
  {
    id: 'nature-forest',
    title: 'Forest Morning',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/forest.mp3',
    duration: 3600, // 60 minutes
    tags: ['nature', 'forest', 'birds'],
    category: 'nature',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/nature.jpg',
  },
  {
    id: 'nature-ocean',
    title: 'Ocean Waves',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/ocean.mp3',
    duration: 5400, // 90 minutes
    tags: ['nature', 'ocean', 'waves'],
    category: 'nature',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/nature.jpg',
  },
  {
    id: 'nature-river',
    title: 'Flowing River',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/river.mp3',
    duration: 3600, // 60 minutes
    tags: ['nature', 'river', 'water'],
    category: 'nature',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/nature.jpg',
  },

  // Spiritual category
  {
    id: 'spiritual-gita-1',
    title: 'Bhagavad Gita Chapter 1',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/gita/chapter-1.mp3',
    duration: 1200, // 20 minutes
    tags: ['spiritual', 'gita', 'chapter1'],
    category: 'spiritual',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/spiritual.jpg',
  },
  {
    id: 'spiritual-gita-2',
    title: 'Bhagavad Gita Chapter 2',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/gita/chapter-2.mp3',
    duration: 1800, // 30 minutes
    tags: ['spiritual', 'gita', 'chapter2'],
    category: 'spiritual',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/spiritual.jpg',
  },
  {
    id: 'spiritual-vedic',
    title: 'Vedic Hymns',
    artist: 'KIAAN Vibe',
    sourceType: 'builtIn',
    src: '/audio/meditation/vedic-hymns.mp3',
    duration: 2400, // 40 minutes
    tags: ['spiritual', 'vedic', 'hymns'],
    category: 'spiritual',
    createdAt: 1704067200000,
    albumArt: '/images/meditation/spiritual.jpg',
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
