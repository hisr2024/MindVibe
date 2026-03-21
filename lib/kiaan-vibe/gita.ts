/**
 * KIAAN Vibe Music Player - Gita Data System
 *
 * Multi-language Bhagavad Gita verse system.
 * To add a new language, simply drop a JSON file in data/gita/{languageCode}.json
 */

import type { GitaChapter, GitaVerse } from './types'

// ============ Types for JSON data ============

interface GitaLanguageFile {
  languageCode: string
  languageName: string
  chapters: Array<{
    chapterNumber: number
    nameSanskrit: string
    nameEnglish: string
    description?: string
    verseCount: number
    verses: Array<{
      verseNumber: number
      sanskrit?: string
      transliteration?: string
      translation: string
    }>
  }>
}

// ============ Language Configuration ============

export interface LanguageInfo {
  code: string
  name: string
  nativeName: string
  flag: string
  direction: 'ltr' | 'rtl'
}

// Only languages with actual data files in data/gita/ are listed here.
// To add a new language, create data/gita/{code}.json and add entry below.
export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    direction: 'ltr',
  },
  sa: {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृत',
    flag: '🕉️',
    direction: 'ltr',
  },
}

// ============ Chapter Metadata ============

export const GITA_CHAPTERS_META = [
  { number: 1, name: 'Arjuna Vishada Yoga', nameSanskrit: 'अर्जुनविषादयोग', verseCount: 47 },
  { number: 2, name: 'Sankhya Yoga', nameSanskrit: 'सांख्ययोग', verseCount: 72 },
  { number: 3, name: 'Karma Yoga', nameSanskrit: 'कर्मयोग', verseCount: 43 },
  { number: 4, name: 'Jnana Karma Sanyasa Yoga', nameSanskrit: 'ज्ञानकर्मसंन्यासयोग', verseCount: 42 },
  { number: 5, name: 'Karma Sanyasa Yoga', nameSanskrit: 'कर्मसंन्यासयोग', verseCount: 29 },
  { number: 6, name: 'Dhyana Yoga', nameSanskrit: 'ध्यानयोग', verseCount: 47 },
  { number: 7, name: 'Jnana Vijnana Yoga', nameSanskrit: 'ज्ञानविज्ञानयोग', verseCount: 30 },
  { number: 8, name: 'Aksara Brahma Yoga', nameSanskrit: 'अक्षरब्रह्मयोग', verseCount: 28 },
  { number: 9, name: 'Raja Vidya Raja Guhya Yoga', nameSanskrit: 'राजविद्याराजगुह्ययोग', verseCount: 34 },
  { number: 10, name: 'Vibhuti Yoga', nameSanskrit: 'विभूतियोग', verseCount: 42 },
  { number: 11, name: 'Vishvarupa Darshana Yoga', nameSanskrit: 'विश्वरूपदर्शनयोग', verseCount: 55 },
  { number: 12, name: 'Bhakti Yoga', nameSanskrit: 'भक्तियोग', verseCount: 20 },
  { number: 13, name: 'Kshetra Kshetrajna Vibhaga Yoga', nameSanskrit: 'क्षेत्रक्षेत्रज्ञविभागयोग', verseCount: 34 },
  { number: 14, name: 'Gunatraya Vibhaga Yoga', nameSanskrit: 'गुणत्रयविभागयोग', verseCount: 27 },
  { number: 15, name: 'Purushottama Yoga', nameSanskrit: 'पुरुषोत्तमयोग', verseCount: 20 },
  { number: 16, name: 'Daivasura Sampad Vibhaga Yoga', nameSanskrit: 'दैवासुरसम्पद्विभागयोग', verseCount: 24 },
  { number: 17, name: 'Shraddhatraya Vibhaga Yoga', nameSanskrit: 'श्रद्धात्रयविभागयोग', verseCount: 28 },
  { number: 18, name: 'Moksha Sanyasa Yoga', nameSanskrit: 'मोक्षसंन्यासयोग', verseCount: 78 },
]

// ============ Data Loading ============

const languageDataCache: Map<string, GitaLanguageFile> = new Map()

/**
 * Validate that a loaded Gita language file has the required structure.
 * Each verse must have at minimum: verseNumber and translation.
 * Each chapter must have: chapterNumber, nameSanskrit, nameEnglish, verseCount, and verses array.
 *
 * JSON Schema (for reference):
 * {
 *   "languageCode": string (required),
 *   "languageName": string (required),
 *   "chapters": [{
 *     "chapterNumber": number (required, 1-18),
 *     "nameSanskrit": string (required),
 *     "nameEnglish": string (required),
 *     "verseCount": number (required),
 *     "verses": [{
 *       "verseNumber": number (required),
 *       "translation": string (required),
 *       "sanskrit": string (optional),
 *       "transliteration": string (optional)
 *     }] (required)
 *   }] (required)
 * }
 */
function validateGitaData(data: unknown): data is GitaLanguageFile {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (typeof d.languageCode !== 'string' || typeof d.languageName !== 'string') return false
  if (!Array.isArray(d.chapters) || d.chapters.length === 0) return false

  for (const chapter of d.chapters) {
    if (typeof chapter.chapterNumber !== 'number') return false
    if (typeof chapter.nameSanskrit !== 'string') return false
    if (typeof chapter.nameEnglish !== 'string') return false
    if (typeof chapter.verseCount !== 'number') return false
    if (!Array.isArray(chapter.verses)) return false

    for (const verse of chapter.verses) {
      if (typeof verse.verseNumber !== 'number') return false
      if (typeof verse.translation !== 'string') return false
    }
  }

  return true
}

/**
 * Load Gita data for a specific language
 */
export async function loadGitaLanguage(languageCode: string): Promise<GitaLanguageFile | null> {
  // Check cache
  const cached = languageDataCache.get(languageCode)
  if (cached) return cached

  try {
    // Dynamic import of JSON data
    const data = await import(`@/data/gita/${languageCode}.json`)
    const parsed = data.default as GitaLanguageFile

    // Validate required fields before caching
    if (!validateGitaData(parsed)) {
      console.warn(`[Gita] Invalid data structure for language: ${languageCode}. Missing required fields.`)
      return null
    }

    languageDataCache.set(languageCode, parsed)
    return parsed
  } catch {
    console.warn(`[Gita] Language not available: ${languageCode}`)
    return null
  }
}

/**
 * Get available languages (languages that have data files)
 */
export async function getAvailableLanguages(): Promise<string[]> {
  const available: string[] = []

  for (const code of Object.keys(SUPPORTED_LANGUAGES)) {
    try {
      await import(`@/data/gita/${code}.json`)
      available.push(code)
    } catch {
      // Language not available
    }
  }

  return available
}

/**
 * Get chapter data for a specific language
 */
export async function getChapter(
  chapterNumber: number,
  languageCode: string
): Promise<GitaChapter | null> {
  const langData = await loadGitaLanguage(languageCode)
  if (!langData) return null

  const chapter = langData.chapters.find((c) => c.chapterNumber === chapterNumber)
  if (!chapter) return null

  return {
    number: chapter.chapterNumber,
    chapterNumber: chapter.chapterNumber,
    nameSanskrit: chapter.nameSanskrit,
    nameEnglish: chapter.nameEnglish,
    description: chapter.description,
    verseCount: chapter.verseCount,
    verses: chapter.verses.map((v) => ({
      verseNumber: v.verseNumber,
      sanskrit: v.sanskrit,
      transliteration: v.transliteration,
      translations: {
        [languageCode]: v.translation,
      },
    })),
  }
}

/**
 * Get a specific verse
 */
export async function getVerse(
  chapterNumber: number,
  verseNumber: number,
  languageCode: string
): Promise<GitaVerse | null> {
  const chapter = await getChapter(chapterNumber, languageCode)
  if (!chapter) return null

  return chapter.verses.find((v) => v.verseNumber === verseNumber) || null
}

/**
 * Get verse with multiple translations
 */
export async function getVerseMultiLang(
  chapterNumber: number,
  verseNumber: number,
  languages: string[]
): Promise<GitaVerse | null> {
  let baseVerse: GitaVerse | null = null
  const translations: Record<string, string> = {}

  for (const lang of languages) {
    const langData = await loadGitaLanguage(lang)
    if (!langData) continue

    const chapter = langData.chapters.find((c) => c.chapterNumber === chapterNumber)
    if (!chapter) continue

    const verse = chapter.verses.find((v) => v.verseNumber === verseNumber)
    if (!verse) continue

    // Use first found verse as base
    if (!baseVerse) {
      baseVerse = {
        verseNumber: verse.verseNumber,
        sanskrit: verse.sanskrit,
        transliteration: verse.transliteration,
        translations: {},
      }
    }

    translations[lang] = verse.translation
  }

  if (!baseVerse) return null

  return {
    ...baseVerse,
    translations,
  }
}

/**
 * Get all chapters metadata
 */
export function getAllChapters(): typeof GITA_CHAPTERS_META {
  return GITA_CHAPTERS_META
}

/**
 * Detect user's preferred language from browser
 */
export function detectBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en'

  const browserLang = navigator.language.split('-')[0]

  // Check if we support this language
  if (SUPPORTED_LANGUAGES[browserLang]) {
    return browserLang
  }

  return 'en' // Fallback to English
}

const gita = {
  loadGitaLanguage,
  getAvailableLanguages,
  getChapter,
  getVerse,
  getVerseMultiLang,
  getAllChapters,
  detectBrowserLanguage,
  SUPPORTED_LANGUAGES,
  GITA_CHAPTERS_META,
}
export default gita
