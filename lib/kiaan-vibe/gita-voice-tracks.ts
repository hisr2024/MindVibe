/**
 * KIAAN Vibe - Gita Divine Voice Track System
 *
 * Converts Bhagavad Gita verses into Track objects compatible with the
 * KIAAN Vibe Player queue system. Supports multi-language voice synthesis
 * with precise Sanskrit pronunciation via Sarvam AI / Google Neural2.
 *
 * Voice Flow:
 *   Verse Selection → TTS API synthesis → Audio Blob URL → Track object → Player Queue
 *
 * Language Priority for TTS:
 *   Sanskrit: Sarvam AI (9.5/10) → Bhashini AI → Google Neural2 (hi-IN fallback)
 *   Hindi:    Sarvam AI → Bhashini AI → Google Neural2
 *   English:  ElevenLabs (10/10) → Google Neural2 → Browser TTS
 *   Others:   Sarvam AI → Google Neural2 → Browser TTS
 */

import type { Track } from './types'
import { GITA_CHAPTERS_META, SUPPORTED_LANGUAGES, loadGitaLanguage, type LanguageInfo } from './gita'

// ============ Voice Configuration ============

/** Supported divine voice styles for Gita recitation */
export type GitaVoiceStyle = 'divine' | 'calm' | 'wisdom' | 'chanting'

/** Voice language configuration for TTS synthesis */
export interface GitaVoiceConfig {
  language: string
  voiceStyle: GitaVoiceStyle
  speed: number
  includeTransliteration: boolean
  includeMeaning: boolean
}

/** Default voice configuration for divine recitation */
export const DEFAULT_VOICE_CONFIG: GitaVoiceConfig = {
  language: 'sa',
  voiceStyle: 'divine',
  speed: 0.88,
  includeTransliteration: false,
  includeMeaning: true,
}

/** Voice style parameters mapped to TTS settings */
export const VOICE_STYLE_PARAMS: Record<GitaVoiceStyle, { speed: number; pitch: number; voiceType: string }> = {
  divine: { speed: 0.85, pitch: -1.5, voiceType: 'wisdom' },
  calm: { speed: 0.90, pitch: -1.0, voiceType: 'calm' },
  wisdom: { speed: 0.92, pitch: 0.0, voiceType: 'wisdom' },
  chanting: { speed: 0.80, pitch: -2.0, voiceType: 'calm' },
}

/** TTS language code mapping for backend API */
export const TTS_LANGUAGE_CODES: Record<string, string> = {
  sa: 'hi',  // Sanskrit uses Hindi voice (closest phonetic match)
  hi: 'hi',
  en: 'en',
  ta: 'ta',
  te: 'te',
  bn: 'bn',
  mr: 'mr',
  gu: 'gu',
  kn: 'kn',
  ml: 'ml',
  pa: 'pa',
}

// ============ Track Creation ============

/**
 * Generate a unique track ID for a Gita verse voice track.
 * Format: gita-voice-{chapter}-{verse}-{language}-{style}
 */
export function generateGitaTrackId(
  chapter: number,
  verse: number,
  language: string,
  style: GitaVoiceStyle = 'divine'
): string {
  return `gita-voice-${chapter}-${verse}-${language}-${style}`
}

/**
 * Create a Track object for a single Gita verse.
 * The track uses the TTS API endpoint as its audio source.
 */
export function createVerseTrack(
  chapter: number,
  verseNumber: number,
  sanskrit: string,
  transliteration: string,
  translation: string,
  language: string,
  voiceStyle: GitaVoiceStyle = 'divine',
  speed?: number,
): Track {
  const chapterMeta = GITA_CHAPTERS_META.find(c => c.number === chapter)
  const langInfo = SUPPORTED_LANGUAGES[language]
  const styleParams = VOICE_STYLE_PARAMS[voiceStyle]

  const trackId = generateGitaTrackId(chapter, verseNumber, language, voiceStyle)

  // Build the text to synthesize based on language
  let synthesisText: string
  if (language === 'sa') {
    // For Sanskrit, use the original Devanagari text
    synthesisText = sanskrit
  } else {
    // For other languages, use the translation
    synthesisText = translation
  }

  // Build API URL for audio synthesis
  const apiUrl = `/api/voice/gita?${new URLSearchParams({
    chapter: chapter.toString(),
    verse: verseNumber.toString(),
    language,
    style: voiceStyle,
    speed: (speed || styleParams.speed).toString(),
    text: synthesisText,
  }).toString()}`

  return {
    id: trackId,
    title: `${chapterMeta?.nameSanskrit || `Chapter ${chapter}`} - Verse ${verseNumber}`,
    artist: language === 'sa'
      ? 'Bhagavad Gita - Divine Sanskrit'
      : `Bhagavad Gita - ${langInfo?.nativeName || language}`,
    sourceType: 'remote',
    src: apiUrl,
    tags: ['gita', 'divine-voice', `chapter-${chapter}`, language, voiceStyle],
    category: 'spiritual',
    createdAt: Date.now(),
  }
}

/**
 * Create Track objects for all verses in a chapter.
 * Returns an array of Tracks that can be set as the player queue.
 */
export async function createChapterTracks(
  chapterNumber: number,
  language: string = 'sa',
  voiceStyle: GitaVoiceStyle = 'divine',
): Promise<Track[]> {
  const langData = await loadGitaLanguage(language === 'sa' ? 'en' : language)
  const saData = language !== 'sa' ? await loadGitaLanguage('sa') : null

  // Always load Sanskrit data for the original text
  const sanskritData = await loadGitaLanguage('sa')
  if (!sanskritData && !langData) return []

  const primaryData = langData || sanskritData
  if (!primaryData) return []

  const chapter = primaryData.chapters.find(c => c.chapterNumber === chapterNumber)
  if (!chapter) return []

  // Get Sanskrit chapter for original text
  const saChapter = sanskritData?.chapters.find(c => c.chapterNumber === chapterNumber)

  return chapter.verses.map(verse => {
    const saVerse = saChapter?.verses.find(v => v.verseNumber === verse.verseNumber)

    return createVerseTrack(
      chapterNumber,
      verse.verseNumber,
      saVerse?.sanskrit || verse.sanskrit || '',
      saVerse?.transliteration || verse.transliteration || '',
      verse.translation,
      language,
      voiceStyle,
    )
  })
}

/**
 * Create a bilingual track that plays Sanskrit recitation followed by
 * translation in the target language. This is the most immersive mode.
 */
export function createBilingualVerseTrack(
  chapter: number,
  verseNumber: number,
  sanskrit: string,
  transliteration: string,
  translation: string,
  targetLanguage: string,
  voiceStyle: GitaVoiceStyle = 'divine',
): Track {
  const chapterMeta = GITA_CHAPTERS_META.find(c => c.number === chapter)
  const langInfo = SUPPORTED_LANGUAGES[targetLanguage]

  const trackId = `gita-voice-bilingual-${chapter}-${verseNumber}-${targetLanguage}-${voiceStyle}`

  // Bilingual synthesis: Sanskrit + pause + translation
  const bilingualText = `${sanskrit}\n\n${translation}`

  const apiUrl = `/api/voice/gita?${new URLSearchParams({
    chapter: chapter.toString(),
    verse: verseNumber.toString(),
    language: targetLanguage,
    style: voiceStyle,
    mode: 'bilingual',
    text: bilingualText,
    sanskrit: sanskrit,
    translation: translation,
  }).toString()}`

  return {
    id: trackId,
    title: `${chapterMeta?.nameSanskrit || `Ch.${chapter}`} ${verseNumber} (Sanskrit + ${langInfo?.nativeName || targetLanguage})`,
    artist: 'Bhagavad Gita - Bilingual Divine Voice',
    sourceType: 'remote',
    src: apiUrl,
    tags: ['gita', 'divine-voice', 'bilingual', `chapter-${chapter}`, targetLanguage, voiceStyle],
    category: 'spiritual',
    createdAt: Date.now(),
  }
}

// ============ Curated Divine Playlists ============

/** Key verses from the Bhagavad Gita for focused recitation */
export const DIVINE_VERSE_COLLECTIONS = {
  /** Most powerful and widely known verses */
  essential: [
    { chapter: 2, verse: 47, title: 'Karma Yoga Essence' },
    { chapter: 2, verse: 14, title: 'Impermanence of Pain' },
    { chapter: 2, verse: 48, title: 'Equanimity in Action' },
    { chapter: 2, verse: 62, title: 'Chain of Desire' },
    { chapter: 2, verse: 70, title: 'Ocean of Peace' },
    { chapter: 3, verse: 27, title: 'Ego vs Reality' },
    { chapter: 4, verse: 7, title: 'Divine Incarnation' },
    { chapter: 4, verse: 8, title: 'Protection of Dharma' },
    { chapter: 6, verse: 5, title: 'Self as Friend' },
    { chapter: 6, verse: 6, title: 'Mind Mastery' },
    { chapter: 9, verse: 26, title: 'Offering of Love' },
    { chapter: 11, verse: 33, title: 'Time the Destroyer' },
    { chapter: 15, verse: 15, title: 'Seated in All Hearts' },
    { chapter: 18, verse: 66, title: 'Supreme Surrender' },
  ],

  /** Verses for anxiety and stress relief */
  anxietyRelief: [
    { chapter: 2, verse: 14, title: 'This Too Shall Pass' },
    { chapter: 2, verse: 47, title: 'Focus on Action, Not Result' },
    { chapter: 2, verse: 48, title: 'Steadiness in Yoga' },
    { chapter: 2, verse: 56, title: 'Undisturbed by Sorrow' },
    { chapter: 6, verse: 17, title: 'Balance in Life' },
    { chapter: 6, verse: 35, title: 'Training the Restless Mind' },
  ],

  /** Morning meditation verses */
  morningMeditation: [
    { chapter: 2, verse: 47, title: 'Today\'s Purpose' },
    { chapter: 3, verse: 19, title: 'Selfless Work' },
    { chapter: 6, verse: 5, title: 'Elevate Yourself' },
    { chapter: 9, verse: 26, title: 'Simple Devotion' },
    { chapter: 18, verse: 47, title: 'Your Unique Path' },
  ],

  /** Evening reflection verses */
  eveningReflection: [
    { chapter: 2, verse: 70, title: 'Inner Ocean of Peace' },
    { chapter: 2, verse: 56, title: 'Sage of Steady Wisdom' },
    { chapter: 6, verse: 6, title: 'Friend Within' },
    { chapter: 9, verse: 30, title: 'Redemption' },
    { chapter: 18, verse: 66, title: 'Surrender and Rest' },
  ],
} as const

export type DivineCollectionKey = keyof typeof DIVINE_VERSE_COLLECTIONS

/**
 * Create a curated playlist of divine voice tracks from a collection.
 */
export async function createDivinePlaylist(
  collectionKey: DivineCollectionKey,
  language: string = 'sa',
  voiceStyle: GitaVoiceStyle = 'divine',
): Promise<Track[]> {
  const collection = DIVINE_VERSE_COLLECTIONS[collectionKey]
  const tracks: Track[] = []

  // Load language data for translations
  const langData = await loadGitaLanguage(language === 'sa' ? 'en' : language)
  const saData = await loadGitaLanguage('sa')

  for (const ref of collection) {
    const saChapter = saData?.chapters.find(c => c.chapterNumber === ref.chapter)
    const saVerse = saChapter?.verses.find(v => v.verseNumber === ref.verse)

    const langChapter = langData?.chapters.find(c => c.chapterNumber === ref.chapter)
    const langVerse = langChapter?.verses.find(v => v.verseNumber === ref.verse)

    const track = createVerseTrack(
      ref.chapter,
      ref.verse,
      saVerse?.sanskrit || '',
      saVerse?.transliteration || '',
      langVerse?.translation || saVerse?.translation || '',
      language,
      voiceStyle,
    )

    // Override title with collection-specific title
    track.title = `${ref.title} (${ref.chapter}.${ref.verse})`
    tracks.push(track)
  }

  return tracks
}

/**
 * Get display metadata for a divine verse collection.
 */
export function getCollectionMeta(key: DivineCollectionKey): {
  name: string
  description: string
  verseCount: number
  gradient: string
  icon: string
} {
  const meta: Record<DivineCollectionKey, { name: string; description: string; gradient: string; icon: string }> = {
    essential: {
      name: 'Essential Verses',
      description: 'The most powerful and transformative verses from the Bhagavad Gita',
      gradient: 'from-orange-500 to-amber-600',
      icon: 'Sparkles',
    },
    anxietyRelief: {
      name: 'Anxiety Relief',
      description: 'Sacred verses to calm the restless mind and find inner peace',
      gradient: 'from-blue-500 to-cyan-600',
      icon: 'Heart',
    },
    morningMeditation: {
      name: 'Morning Meditation',
      description: 'Begin your day with divine wisdom and sacred purpose',
      gradient: 'from-amber-400 to-orange-500',
      icon: 'Sun',
    },
    eveningReflection: {
      name: 'Evening Reflection',
      description: 'Close your day with gratitude, peace, and surrender',
      gradient: 'from-purple-500 to-indigo-600',
      icon: 'Moon',
    },
  }

  return {
    ...meta[key],
    verseCount: DIVINE_VERSE_COLLECTIONS[key].length,
  }
}

// ============ Audio Synthesis Helpers ============

/**
 * Synthesize audio for a Gita verse via the API and return an audio Blob URL.
 * This is used when we need to pre-fetch audio rather than streaming.
 */
export async function synthesizeVerseAudio(
  text: string,
  language: string,
  voiceStyle: GitaVoiceStyle = 'divine',
  speed?: number,
): Promise<string | null> {
  const styleParams = VOICE_STYLE_PARAMS[voiceStyle]
  const ttsLanguage = TTS_LANGUAGE_CODES[language] || language

  try {
    const response = await fetch('/api/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text,
        language: ttsLanguage,
        voice_type: styleParams.voiceType,
        speed: speed || styleParams.speed,
      }),
    })

    if (response.ok) {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('audio/')) {
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      }
    }

    return null
  } catch (error) {
    console.error('[GitaVoice] Audio synthesis failed:', error)
    return null
  }
}

/**
 * Synthesize Sanskrit shloka with divine pronunciation via the backend
 * shloka-specific endpoint that handles Vedic meter and phonology.
 */
export async function synthesizeSanskritShloka(
  shloka: string,
  withMeaning: boolean = false,
  meaningText?: string,
): Promise<string | null> {
  try {
    const response = await fetch('/api/voice/gita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        shloka,
        chandas: 'anushtubh',
        with_meaning: withMeaning,
        meaning_text: meaningText,
        mode: 'shloka',
      }),
    })

    if (response.ok) {
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('audio/')) {
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      }
    }

    return null
  } catch (error) {
    console.error('[GitaVoice] Shloka synthesis failed:', error)
    return null
  }
}
