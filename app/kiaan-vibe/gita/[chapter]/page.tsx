/**
 * Gita Chapter Page - Server Component Wrapper
 *
 * Exports generateStaticParams so Next.js can pre-render all 18 Bhagavad Gita
 * chapters at build time instead of generating them on demand. The actual UI
 * lives in the co-located ChapterVersesClient component.
 */

import ChapterVersesClient from './ChapterVersesClient'

/**
 * Pre-generate pages for all 18 chapters of the Bhagavad Gita.
 * These are known at build time and do not change, making them
 * ideal candidates for static generation.
 */
export function generateStaticParams() {
  return Array.from({ length: 18 }, (_, i) => ({
    chapter: String(i + 1),
  }))
}

export const metadata = {
  title: 'Bhagavad Gita Chapter | Sakha',
  description: 'Explore the sacred verses of the Bhagavad Gita with translations, transliterations, and divine voice narration.',
}

interface PageProps {
  params: Promise<{ chapter: string }>
}

export default function ChapterPage({ params }: PageProps) {
  return <ChapterVersesClient params={params} />
}
