/**
 * KIAAN Vibe Layout
 *
 * Server component wrapper that provides SEO metadata for the KIAAN Vibe
 * music and meditation player section -- sacred audio, Gita chanting,
 * and meditation tracks.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KIAAN Vibe — Sacred Music & Meditation | Sakha',
  description:
    'Listen to sacred meditation tracks, Bhagavad Gita chanting, and calming soundscapes. KIAAN Vibe is your divine audio companion for focus, sleep, breath work, and mantra practice.',
  openGraph: {
    title: 'KIAAN Vibe — Sacred Music & Meditation',
    description:
      'Sacred audio for your spiritual practice. Gita chanting, meditation tracks, and calming soundscapes curated by KIAAN.',
    url: 'https://kiaanverse.com/kiaan-vibe',
  },
  alternates: {
    canonical: 'https://kiaanverse.com/kiaan-vibe',
  },
}

export default function KiaanVibeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
