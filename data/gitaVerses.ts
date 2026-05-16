/**
 * Bhagavad Gita Verses — placeholder pending PD-baseline replacement.
 *
 * The original content of this file was a TS mirror of derivative
 * translations that have been removed pending a clean-source rebuild
 * (Telang 1882 modernization).
 *
 * Until the rebuild lands, all lookup functions return undefined/empty
 * results — consumers (e.g. `components/chat/VerseCitationChip.tsx`)
 * already handle the "verse not found" case gracefully.
 *
 * See internal IP-drafts/W_quantum_scan_findings_and_tier1_plan.md.
 */

export interface GitaVerse {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  translation: string
  practicalWisdom?: string
  themes?: string[]
  keywords?: string[]
  applies_to?: string[]
}

export interface ChapterInfo {
  chapter: number
  sanskritName: string
  englishName: string
  verseCount: number
  themes?: string[]
}

const CHAPTER_NAMES: ReadonlyArray<readonly [number, string, string, number]> = [
  [1, 'अर्जुनविषादयोग', "Arjuna's Grief", 47],
  [2, 'सांख्ययोग', 'Sankhya Yoga', 72],
  [3, 'कर्मयोग', 'Karma Yoga', 43],
  [4, 'ज्ञानकर्मसंन्यासयोग', 'Jnana Karma Sannyasa Yoga', 42],
  [5, 'कर्मसंन्यासयोग', 'Karma Sannyasa Yoga', 29],
  [6, 'ध्यानयोग', 'Dhyana Yoga', 47],
  [7, 'ज्ञानविज्ञानयोग', 'Jnana Vijnana Yoga', 30],
  [8, 'अक्षरब्रह्मयोग', 'Akshara Brahma Yoga', 28],
  [9, 'राजविद्याराजगुह्ययोग', 'Raja Vidya Raja Guhya Yoga', 34],
  [10, 'विभूतियोग', 'Vibhuti Yoga', 42],
  [11, 'विश्वरूपदर्शनयोग', 'Vishwarupa Darshana Yoga', 55],
  [12, 'भक्तियोग', 'Bhakti Yoga', 20],
  [13, 'क्षेत्रक्षेत्रज्ञविभागयोग', 'Kshetra Kshetrajna Vibhaga Yoga', 34],
  [14, 'गुणत्रयविभागयोग', 'Gunatraya Vibhaga Yoga', 27],
  [15, 'पुरुषोत्तमयोग', 'Purushottama Yoga', 20],
  [16, 'दैवासुरसम्पद्विभागयोग', 'Daivasura Sampad Vibhaga Yoga', 24],
  [17, 'श्रद्धात्रयविभागयोग', 'Shraddhatraya Vibhaga Yoga', 28],
  [18, 'मोक्षसंन्यासयोग', 'Moksha Sannyasa Yoga', 78],
]

export const CHAPTERS: ChapterInfo[] = CHAPTER_NAMES.map(([num, sa, en, vc]) => ({
  chapter: num,
  sanskritName: sa,
  englishName: en,
  verseCount: vc,
}))

export const KEY_VERSES: GitaVerse[] = []

export function getTotalVerses(): number {
  return CHAPTERS.reduce((sum, c) => sum + c.verseCount, 0)
}

export function getVerse(_chapter: number, _verse: number): GitaVerse | undefined {
  return undefined
}

export function getChapterVerses(_chapter: number): GitaVerse[] {
  return []
}

export function getVersesByTheme(_theme: string): GitaVerse[] {
  return []
}

export function getVersesByKeyword(_keyword: string): GitaVerse[] {
  return []
}

export function getRandomVerses(_count: number): GitaVerse[] {
  return []
}

export default { CHAPTERS, KEY_VERSES, getVerse, getChapterVerses, getRandomVerses, getTotalVerses, getVersesByTheme, getVersesByKeyword }
