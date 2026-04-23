/**
 * KIAAN Vibe Music Player - Meditation Library
 *
 * Built-in meditation, mantra and nature tracks.
 *
 * Each track has two sources:
 *   - `src`         : in-browser Web Audio synth URL (synth://preset) — ALWAYS works
 *   - `remoteSrc`   : optional remote fallback (Internet Archive / CDN) — best-quality
 *
 * The store prefers synth:// for reliability on mobile networks. Users who add
 * their own files via /kiaan-vibe/uploads get a third source (blob://) that
 * always takes precedence.
 *
 * This removes the previous failure mode where every track in the grid was a
 * direct archive.org URL — any network or CORS hiccup produced a silent
 * player. The synth guarantees the Vibe Player has sound.
 */

import type { Track, MeditationCategory } from './types'

const SAMPLE_TRACKS: Track[] = [
  // ===== FOCUS CATEGORY =====
  {
    id: 'focus-ambient-study',
    title: 'Ambient Study Music',
    artist: 'Meditation Focus',
    sourceType: 'builtIn',
    src: 'synth://ambient-warm',
    duration: 3600,
    tags: ['focus', 'study', 'concentration'],
    category: 'focus',
    createdAt: 1704067200000,
  },
  {
    id: 'focus-brain-stimulation',
    title: 'Deep Brain Stimulation',
    artist: 'Meditation Focus',
    sourceType: 'builtIn',
    src: 'synth://binaural-focus',
    duration: 1800,
    tags: ['focus', 'binaural', 'brain'],
    category: 'focus',
    createdAt: 1704067200000,
  },

  // ===== SLEEP CATEGORY =====
  {
    id: 'sleep-healing-deep',
    title: 'Healing Deep Sleep',
    artist: 'Meditation Healing',
    sourceType: 'builtIn',
    src: 'synth://binaural-sleep',
    duration: 3600,
    tags: ['sleep', 'healing', 'deep'],
    category: 'sleep',
    createdAt: 1704067200000,
  },
  {
    id: 'sleep-thunderstorm',
    title: 'Thunderstorm for Sleep',
    artist: 'Nature Sounds',
    sourceType: 'builtIn',
    src: 'synth://nature-thunder',
    duration: 2400,
    tags: ['sleep', 'thunder', 'storm'],
    category: 'sleep',
    createdAt: 1704067200000,
  },

  // ===== BREATH CATEGORY =====
  {
    id: 'breath-japanese-garden',
    title: 'Japanese Garden Breathing',
    artist: 'Meditation Music',
    sourceType: 'builtIn',
    src: 'synth://japanese-garden',
    duration: 1200,
    tags: ['breath', 'japanese', 'calm'],
    category: 'breath',
    createdAt: 1704067200000,
  },
  {
    id: 'breath-samurai-relax',
    title: 'Samurai Relaxation',
    artist: 'Meditation Music',
    sourceType: 'builtIn',
    src: 'synth://samurai',
    duration: 1800,
    tags: ['breath', 'samurai', 'relax'],
    category: 'breath',
    createdAt: 1704067200000,
  },

  // ===== MANTRA CATEGORY =====
  {
    id: 'mantra-om',
    title: 'Om — Sacred Sound',
    artist: 'Vedic Mantra',
    sourceType: 'builtIn',
    src: 'synth://om-mantra',
    duration: 1800,
    tags: ['mantra', 'om', 'vedic', 'sacred'],
    category: 'mantra',
    createdAt: 1704067200000,
  },
  {
    id: 'mantra-buddhist-positive',
    title: 'Buddhist Positive Energy',
    artist: 'Buddhist Meditation',
    sourceType: 'builtIn',
    src: 'synth://mantra-chant',
    duration: 2400,
    tags: ['mantra', 'buddhist', 'positive'],
    category: 'mantra',
    createdAt: 1704067200000,
  },
  {
    id: 'mantra-chakra-healing',
    title: 'All 7 Chakras Healing',
    artist: 'Chakra Meditation',
    sourceType: 'builtIn',
    src: 'synth://chakra',
    duration: 1800,
    tags: ['mantra', 'chakra', 'healing'],
    category: 'mantra',
    createdAt: 1704067200000,
  },

  // ===== AMBIENT CATEGORY =====
  {
    id: 'ambient-meditation-main',
    title: 'Meditation Music',
    artist: 'Ambient Meditation',
    sourceType: 'builtIn',
    src: 'synth://ambient-warm',
    duration: 3600,
    tags: ['ambient', 'meditation', 'calm'],
    category: 'ambient',
    createdAt: 1704067200000,
  },
  {
    id: 'ambient-cosmic',
    title: 'Cosmic Ambience',
    artist: 'Ambient Meditation',
    sourceType: 'builtIn',
    src: 'synth://ambient-cosmic',
    duration: 2400,
    tags: ['ambient', 'cosmic', 'space'],
    category: 'ambient',
    createdAt: 1704067200000,
  },
  {
    id: 'ambient-waterfall',
    title: 'Waterfall Ambience',
    artist: 'Nature Sounds',
    sourceType: 'builtIn',
    src: 'synth://nature-stream',
    duration: 1800,
    tags: ['ambient', 'waterfall', 'nature'],
    category: 'ambient',
    createdAt: 1704067200000,
  },

  // ===== NATURE CATEGORY =====
  {
    id: 'nature-birds-ocean',
    title: 'Birds & Ocean Waves',
    artist: 'Nature Sound Therapy',
    sourceType: 'builtIn',
    src: 'synth://nature-ocean',
    duration: 1200,
    tags: ['nature', 'birds', 'ocean'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-gentle-rain',
    title: 'Light Gentle Rain',
    artist: 'Nature Sound Therapy',
    sourceType: 'builtIn',
    src: 'synth://nature-rain',
    duration: 1440,
    tags: ['nature', 'rain', 'gentle'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-birdsong',
    title: 'Relaxing Birdsong',
    artist: 'Nature Sound Therapy',
    sourceType: 'builtIn',
    src: 'synth://nature-forest',
    duration: 600,
    tags: ['nature', 'birds', 'morning'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-stream-birds',
    title: 'Trickling Stream & Birds',
    artist: 'Nature Sound Therapy',
    sourceType: 'builtIn',
    src: 'synth://nature-stream',
    duration: 960,
    tags: ['nature', 'stream', 'water'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-sea-storm',
    title: 'Sea Storm Therapy',
    artist: 'Nature Sound Therapy',
    sourceType: 'builtIn',
    src: 'synth://nature-thunder',
    duration: 2400,
    tags: ['nature', 'sea', 'storm'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-rain-sounds',
    title: 'Rain Sounds',
    artist: 'Relaxing Rain',
    sourceType: 'builtIn',
    src: 'synth://nature-rain',
    duration: 1800,
    tags: ['nature', 'rain', 'relaxing'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-tropical-rain',
    title: 'Tropical Rain',
    artist: 'Relaxing Rain',
    sourceType: 'builtIn',
    src: 'synth://nature-rain',
    duration: 1200,
    tags: ['nature', 'rain', 'tropical'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-summer-forest',
    title: 'Summer Forest',
    artist: 'Nature Sounds',
    sourceType: 'builtIn',
    src: 'synth://nature-forest',
    duration: 1800,
    tags: ['nature', 'forest', 'summer'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-relaxing-ocean',
    title: 'Relaxing Ocean',
    artist: 'Nature Sounds',
    sourceType: 'builtIn',
    src: 'synth://nature-ocean',
    duration: 3600,
    tags: ['nature', 'ocean', 'waves'],
    category: 'nature',
    createdAt: 1704067200000,
  },
  {
    id: 'nature-rain-grass',
    title: 'Rain on Grass',
    artist: 'Nature Sounds',
    sourceType: 'builtIn',
    src: 'synth://nature-rain',
    duration: 2400,
    tags: ['nature', 'rain', 'grass'],
    category: 'nature',
    createdAt: 1704067200000,
  },

  // ===== SPIRITUAL CATEGORY =====
  {
    id: 'spiritual-zen-meditation',
    title: 'Zen Meditation',
    artist: 'Spiritual Sounds',
    sourceType: 'builtIn',
    src: 'synth://zen-bowl',
    duration: 3600,
    tags: ['spiritual', 'zen', 'meditation'],
    category: 'spiritual',
    createdAt: 1704067200000,
  },
]

// Track availability cache to avoid repeated failed requests
const trackAvailabilityCache = new Map<string, boolean>()

// Track consecutive failures to detect systemic issues
let consecutiveFailures = 0
const MAX_CONSECUTIVE_FAILURES = 3

// ============ Library Functions ============

export function getAllTracks(): Track[] {
  return SAMPLE_TRACKS
}

export function isTrackAvailable(trackId: string): boolean | undefined {
  return trackAvailabilityCache.get(trackId)
}

export function markTrackUnavailable(trackId: string): void {
  trackAvailabilityCache.set(trackId, false)
  consecutiveFailures++
  console.warn(`[MeditationLibrary] Track marked unavailable: ${trackId} (consecutive failures: ${consecutiveFailures})`)
}

export function markTrackAvailable(trackId: string): void {
  trackAvailabilityCache.set(trackId, true)
  consecutiveFailures = 0
}

export function hasSystemicAudioIssues(): boolean {
  return consecutiveFailures >= MAX_CONSECUTIVE_FAILURES
}

export function resetFailureCounter(): void {
  consecutiveFailures = 0
}

export function getAvailableTracks(): Track[] {
  return SAMPLE_TRACKS.filter((track) => {
    const availability = trackAvailabilityCache.get(track.id)
    return availability !== false
  })
}

export function getTracksByCategory(category: MeditationCategory): Track[] {
  return SAMPLE_TRACKS.filter((track) => track.category === category)
}

export function getTrackById(id: string): Track | undefined {
  return SAMPLE_TRACKS.find((track) => track.id === id)
}

export function searchTracks(query: string): Track[] {
  const lowerQuery = query.toLowerCase()
  return SAMPLE_TRACKS.filter(
    (track) =>
      track.title.toLowerCase().includes(lowerQuery) ||
      track.artist?.toLowerCase().includes(lowerQuery) ||
      track.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

export function getTracksByTag(tag: string): Track[] {
  return SAMPLE_TRACKS.filter((track) =>
    track.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}

export function getAllTags(): string[] {
  const tags = new Set<string>()
  SAMPLE_TRACKS.forEach((track) => {
    track.tags?.forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).sort()
}

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

const meditationLibrary = {
  getAllTracks,
  getTracksByCategory,
  getTrackById,
  searchTracks,
  getTracksByTag,
  getAllTags,
  getCategoryStats,
  formatDuration,
  isTrackAvailable,
  markTrackUnavailable,
  markTrackAvailable,
  hasSystemicAudioIssues,
  resetFailureCounter,
  getAvailableTracks,
}
export default meditationLibrary
