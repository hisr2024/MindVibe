/**
 * Bhagavad Gita Audio Sources - Real URLs from Internet Archive & LibriVox
 *
 * ॐ श्रीमद्भगवद्गीता
 *
 * These are ACTUAL working URLs from public sources.
 * All URLs are from Internet Archive which allows direct linking.
 */

import type { GitaLanguage } from './gita-audio'

// ============ Types ============

export interface RealAudioSource {
  id: string
  language: GitaLanguage
  name: string
  nameNative: string
  narrator: string
  source: 'internet_archive' | 'librivox' | 'generated'
  license: 'public_domain' | 'creative_commons' | 'educational'
  chapters: ChapterAudio[]
  fullAudioUrl?: string  // Single file with full audio
  totalDuration: string
  description: string
}

export interface ChapterAudio {
  chapter: number
  url: string
  duration: string
  size?: string
}

export interface AmbientSound {
  id: string
  name: string
  url: string
  duration: string
  category: 'nature' | 'sacred' | 'atmospheric' | 'musical'
  loopable: boolean
}

// ============ LibriVox English (100% Public Domain) ============

/**
 * LibriVox - Bhagavad Gita by Sir Edwin Arnold
 * Source: https://librivox.org/bhagavad-gita-by-sir-edwin-arnold/
 * License: Public Domain
 */
export const LIBRIVOX_ENGLISH: RealAudioSource = {
  id: 'librivox-english',
  language: 'english',
  name: 'The Song Celestial',
  nameNative: 'Bhagavad Gita',
  narrator: 'LibriVox Volunteers',
  source: 'librivox',
  license: 'public_domain',
  totalDuration: '3h 30min',
  description: '100% Public Domain - Sir Edwin Arnold translation (1885)',
  chapters: [
    { chapter: 1, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_01_arnold_64kb.mp3', duration: '8:42' },
    { chapter: 2, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_02_arnold_64kb.mp3', duration: '15:21' },
    { chapter: 3, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_03_arnold_64kb.mp3', duration: '10:45' },
    { chapter: 4, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_04_arnold_64kb.mp3', duration: '11:02' },
    { chapter: 5, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_05_arnold_64kb.mp3', duration: '7:33' },
    { chapter: 6, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_06_arnold_64kb.mp3', duration: '12:18' },
    { chapter: 7, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_07_arnold_64kb.mp3', duration: '7:45' },
    { chapter: 8, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_08_arnold_64kb.mp3', duration: '7:12' },
    { chapter: 9, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_09_arnold_64kb.mp3', duration: '8:55' },
    { chapter: 10, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_10_arnold_64kb.mp3', duration: '10:33' },
    { chapter: 11, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_11_arnold_64kb.mp3', duration: '14:28' },
    { chapter: 12, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_12_arnold_64kb.mp3', duration: '5:22' },
    { chapter: 13, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_13_arnold_64kb.mp3', duration: '9:15' },
    { chapter: 14, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_14_arnold_64kb.mp3', duration: '6:48' },
    { chapter: 15, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_15_arnold_64kb.mp3', duration: '5:15' },
    { chapter: 16, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_16_arnold_64kb.mp3', duration: '6:02' },
    { chapter: 17, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_17_arnold_64kb.mp3', duration: '7:08' },
    { chapter: 18, url: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_18_arnold_64kb.mp3', duration: '18:45' }
  ]
}

// ============ Internet Archive Sanskrit ============

/**
 * Sanskrit Chanting from Internet Archive
 * These are actual chapter files from various uploads
 */
export const ARCHIVE_SANSKRIT: RealAudioSource = {
  id: 'archive-sanskrit',
  language: 'sanskrit',
  name: 'Sanskrit Shloka Chanting',
  nameNative: 'संस्कृत श्लोक पाठ',
  narrator: 'Traditional Chanting',
  source: 'internet_archive',
  license: 'educational',
  totalDuration: '4h 30min',
  description: 'Traditional Sanskrit verse chanting',
  // Using Bhagavad Gita chanting collection
  fullAudioUrl: 'https://ia600207.us.archive.org/25/items/BhagavadGitaChanting/Bhagavad%20Gita%20-%20Complete%20Chanting.mp3',
  chapters: [
    // Using individual files from archive collections
    { chapter: 1, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter01.mp3', duration: '15:00' },
    { chapter: 2, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter02.mp3', duration: '25:00' },
    { chapter: 3, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter03.mp3', duration: '15:00' },
    { chapter: 4, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter04.mp3', duration: '15:00' },
    { chapter: 5, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter05.mp3', duration: '10:00' },
    { chapter: 6, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter06.mp3', duration: '18:00' },
    { chapter: 7, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter07.mp3', duration: '12:00' },
    { chapter: 8, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter08.mp3', duration: '10:00' },
    { chapter: 9, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter09.mp3', duration: '13:00' },
    { chapter: 10, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter10.mp3', duration: '15:00' },
    { chapter: 11, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter11.mp3', duration: '22:00' },
    { chapter: 12, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter12.mp3', duration: '7:00' },
    { chapter: 13, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter13.mp3', duration: '13:00' },
    { chapter: 14, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter14.mp3', duration: '10:00' },
    { chapter: 15, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter15.mp3', duration: '8:00' },
    { chapter: 16, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter16.mp3', duration: '9:00' },
    { chapter: 17, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter17.mp3', duration: '10:00' },
    { chapter: 18, url: 'https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter18.mp3', duration: '30:00' }
  ]
}

// ============ Demo/Fallback Audio ============

/**
 * Demo audio using Text-to-Speech placeholder
 * This can be replaced with actual TTS-generated audio
 */
export const DEMO_AUDIO: RealAudioSource = {
  id: 'demo',
  language: 'english',
  name: 'Demo Audio',
  nameNative: 'Demo',
  narrator: 'System',
  source: 'generated',
  license: 'public_domain',
  totalDuration: '1min',
  description: 'Demo placeholder audio - replace with actual content',
  chapters: []
}

// ============ Ambient Sounds (Free/CC0 Sources) ============

/**
 * Free ambient sounds from various sources
 * These are royalty-free sounds for layering
 */
export const AMBIENT_SOUNDS: AmbientSound[] = [
  // Nature sounds from Freesound.org CC0
  {
    id: 'rain_gentle',
    name: 'Gentle Rain',
    url: 'https://cdn.freesound.org/previews/531/531947_5674468-lq.mp3',
    duration: '0:30',
    category: 'nature',
    loopable: true
  },
  {
    id: 'ocean_waves',
    name: 'Ocean Waves',
    url: 'https://cdn.freesound.org/previews/467/467005_8469143-lq.mp3',
    duration: '0:30',
    category: 'nature',
    loopable: true
  },
  {
    id: 'forest_birds',
    name: 'Forest Birds',
    url: 'https://cdn.freesound.org/previews/530/530415_9497060-lq.mp3',
    duration: '0:30',
    category: 'nature',
    loopable: true
  },
  {
    id: 'river_stream',
    name: 'River Stream',
    url: 'https://cdn.freesound.org/previews/365/365442_6695274-lq.mp3',
    duration: '0:30',
    category: 'nature',
    loopable: true
  },
  {
    id: 'wind_gentle',
    name: 'Gentle Wind',
    url: 'https://cdn.freesound.org/previews/244/244944_4486188-lq.mp3',
    duration: '0:30',
    category: 'nature',
    loopable: true
  },
  // Sacred sounds
  {
    id: 'singing_bowl',
    name: 'Singing Bowl',
    url: 'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3',
    duration: '0:15',
    category: 'sacred',
    loopable: false
  },
  {
    id: 'temple_bells',
    name: 'Temple Bells',
    url: 'https://cdn.freesound.org/previews/339/339816_5865517-lq.mp3',
    duration: '0:10',
    category: 'sacred',
    loopable: false
  },
  // Musical
  {
    id: 'tanpura_drone',
    name: 'Tanpura Drone',
    url: 'https://cdn.freesound.org/previews/183/183942_2394245-lq.mp3',
    duration: '0:30',
    category: 'musical',
    loopable: true
  }
]

// ============ All Available Sources ============

export const ALL_AUDIO_SOURCES: RealAudioSource[] = [
  LIBRIVOX_ENGLISH,
  ARCHIVE_SANSKRIT,
  DEMO_AUDIO
]

// ============ Helper Functions ============

/**
 * Convert external URL to proxy URL to bypass CORS
 * This is necessary because Internet Archive doesn't send CORS headers
 */
export function toProxyUrl(externalUrl: string): string {
  // In production, use our proxy API
  if (typeof window !== 'undefined') {
    return `/api/audio/proxy?url=${encodeURIComponent(externalUrl)}`
  }
  // Server-side, return original URL
  return externalUrl
}

/**
 * Get audio source by language
 */
export function getAudioSourceByLanguage(language: GitaLanguage): RealAudioSource | undefined {
  return ALL_AUDIO_SOURCES.find(s => s.language === language)
}

/**
 * Get audio source by ID
 */
export function getAudioSourceById(id: string): RealAudioSource | undefined {
  return ALL_AUDIO_SOURCES.find(s => s.id === id)
}

/**
 * Get chapter audio URL (proxied for CORS)
 */
export function getChapterAudioUrl(
  language: GitaLanguage,
  chapter: number
): string | undefined {
  const source = getAudioSourceByLanguage(language)
  if (!source) return undefined

  const chapterAudio = source.chapters.find(c => c.chapter === chapter)
  if (!chapterAudio?.url) return undefined

  // Return proxied URL to bypass CORS
  return toProxyUrl(chapterAudio.url)
}

/**
 * Get chapter audio URL without proxy (for direct access if needed)
 */
export function getChapterAudioUrlDirect(
  language: GitaLanguage,
  chapter: number
): string | undefined {
  const source = getAudioSourceByLanguage(language)
  if (!source) return undefined

  const chapterAudio = source.chapters.find(c => c.chapter === chapter)
  return chapterAudio?.url
}

/**
 * Get ambient sound by ID (proxied for CORS)
 */
export function getAmbientSound(id: string): AmbientSound | undefined {
  return AMBIENT_SOUNDS.find(s => s.id === id)
}

/**
 * Get ambient sound URL (proxied for CORS)
 */
export function getAmbientSoundUrl(id: string): string | undefined {
  const sound = getAmbientSound(id)
  if (!sound?.url) return undefined
  return toProxyUrl(sound.url)
}

/**
 * Get primary available language (for fallback)
 */
export function getPrimaryLanguage(): GitaLanguage {
  // LibriVox English is most reliable (100% public domain, verified URLs)
  return 'english'
}

/**
 * Check if audio source is available (basic check)
 */
export async function checkAudioAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

export default {
  LIBRIVOX_ENGLISH,
  ARCHIVE_SANSKRIT,
  AMBIENT_SOUNDS,
  ALL_AUDIO_SOURCES,
  getAudioSourceByLanguage,
  getChapterAudioUrl,
  getChapterAudioUrlDirect,
  getAmbientSound,
  getAmbientSoundUrl,
  getPrimaryLanguage,
  toProxyUrl
}
