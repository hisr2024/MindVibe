import { GITA_CHAPTERS } from '@/lib/constants/gita-audio'
import { ARCHIVE_SANSKRIT, LIBRIVOX_ENGLISH } from '@/lib/constants/gita-audio-sources'
import type { Track } from '../types'

export type GitaLanguageOption = 'sanskrit' | 'hindi' | 'telugu' | 'more'

export const GITA_LANGUAGES: Array<{
  id: GitaLanguageOption
  label: string
  nativeLabel: string
  available: boolean
}> = [
  { id: 'sanskrit', label: 'Sanskrit', nativeLabel: 'संस्कृत', available: true },
  { id: 'hindi', label: 'Hindi', nativeLabel: 'हिंदी', available: false },
  { id: 'telugu', label: 'Telugu', nativeLabel: 'తెలుగు', available: false },
  { id: 'more', label: 'More', nativeLabel: 'More', available: false }
]

const LANGUAGE_SOURCES = {
  sanskrit: ARCHIVE_SANSKRIT,
  english: LIBRIVOX_ENGLISH
} as const

const LANGUAGE_FALLBACK: Record<GitaLanguageOption, keyof typeof LANGUAGE_SOURCES> = {
  sanskrit: 'sanskrit',
  hindi: 'english',
  telugu: 'english',
  more: 'english'
}

export const GITA_CHAPTER_OPTIONS = GITA_CHAPTERS.map((chapter) => ({
  number: chapter.number,
  name: chapter.nameEnglish,
  nameSanskrit: chapter.nameSanskrit,
  verseCount: chapter.verseCount,
  theme: chapter.theme
}))

const getChapterAudioUrl = (language: GitaLanguageOption, chapterNumber: number) => {
  const fallback = LANGUAGE_FALLBACK[language]
  const source = LANGUAGE_SOURCES[language === 'sanskrit' ? 'sanskrit' : fallback]
  const chapterAudio = source.chapters.find((entry) => entry.chapter === chapterNumber)

  if (!chapterAudio) {
    return {
      url: '',
      actualLanguage: fallback,
      isFallback: true
    }
  }

  return {
    url: chapterAudio.url,
    actualLanguage: language === 'sanskrit' ? 'sanskrit' : fallback,
    isFallback: language !== 'sanskrit' && fallback !== language
  }
}

const getVerseAudioUrl = (language: GitaLanguageOption, chapterNumber: number, verseNumber: number) => {
  // TODO: Replace with real verse-level audio once available for each language.
  // Return null to gracefully fall back to chapter-level audio.
  void language
  void chapterNumber
  void verseNumber
  return null
}

export const buildGitaChapterTrack = (chapterNumber: number, language: GitaLanguageOption): Track => {
  const chapter = GITA_CHAPTERS.find((item) => item.number === chapterNumber)
  const { url, actualLanguage, isFallback } = getChapterAudioUrl(language, chapterNumber)

  return {
    id: `gita-${language}-chapter-${chapterNumber}`,
    title: `Chapter ${chapterNumber}: ${chapter?.nameEnglish ?? 'Bhagavad Gita'}`,
    subtitle: chapter?.nameSanskrit,
    url,
    sourceType: 'gita',
    meta: {
      chapter: chapterNumber,
      verse: null,
      language,
      actualLanguage,
      isFallback
    }
  }
}

export const buildGitaVerseTracks = (chapterNumber: number, language: GitaLanguageOption): Track[] => {
  const chapter = GITA_CHAPTERS.find((item) => item.number === chapterNumber)
  const totalVerses = chapter?.verseCount ?? 0
  const chapterTrack = buildGitaChapterTrack(chapterNumber, language)

  return Array.from({ length: totalVerses }, (_, index) => {
    const verseNumber = index + 1
    const verseUrl = getVerseAudioUrl(language, chapterNumber, verseNumber)

    return {
      id: `gita-${language}-chapter-${chapterNumber}-verse-${verseNumber}`,
      title: `Verse ${verseNumber}`,
      subtitle: chapter?.nameEnglish,
      url: verseUrl ?? chapterTrack.url,
      sourceType: 'gita',
      meta: {
        chapter: chapterNumber,
        verse: verseNumber,
        language,
        actualLanguage: chapterTrack.meta?.actualLanguage ?? language,
        verseFallback: verseUrl === null,
        isFallback: chapterTrack.meta?.isFallback ?? false
      }
    }
  })
}
