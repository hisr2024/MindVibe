/**
 * Gita Verse Detail Page - Server Component Wrapper
 *
 * Exports generateStaticParams so Next.js can pre-render every verse
 * across all 18 chapters of the Bhagavad Gita at build time (700 verses total).
 * The actual interactive UI lives in the co-located VerseDetailClient component.
 */

import VerseDetailClient from './VerseDetailClient'

/**
 * Verse counts per chapter (1-indexed).
 * Source: GITA_CHAPTERS_META in lib/kiaan-vibe/gita.ts
 */
const VERSE_COUNTS: Record<number, number> = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47,
  7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20,
  13: 34, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
}

/**
 * Pre-generate pages for every verse in every chapter.
 * The Bhagavad Gita has a fixed corpus of 700 verses across 18 chapters,
 * so all combinations are known at build time.
 */
export function generateStaticParams() {
  const params: Array<{ chapter: string; verse: string }> = []

  for (let chapter = 1; chapter <= 18; chapter++) {
    const verseCount = VERSE_COUNTS[chapter] ?? 0
    for (let verse = 1; verse <= verseCount; verse++) {
      params.push({
        chapter: String(chapter),
        verse: String(verse),
      })
    }
  }

  return params
}

export const metadata = {
  title: 'Bhagavad Gita Verse | Sakha',
  description: 'Read and listen to a sacred verse of the Bhagavad Gita with Sanskrit, transliteration, translations, and divine voice narration.',
}

interface PageProps {
  params: Promise<{ chapter: string; verse: string }>
}

export default function VersePage({ params }: PageProps) {
  return <VerseDetailClient params={params} />
}
