/**
 * Journeys Layout
 *
 * Server component wrapper that provides SEO metadata for the
 * sacred wisdom journeys section of MindVibe.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sacred Wisdom Journeys | MindVibe',
  description:
    'Embark on transformative spiritual journeys rooted in Bhagavad Gita wisdom. Multi-day guided paths for anger, attachment, purpose, and inner peace.',
  openGraph: {
    title: 'Sacred Wisdom Journeys | MindVibe',
    description:
      'Embark on transformative spiritual journeys rooted in Bhagavad Gita wisdom. Multi-day guided paths for anger, attachment, purpose, and inner peace.',
    url: 'https://mindvibe.life/journeys',
  },
  alternates: {
    canonical: 'https://mindvibe.life/journeys',
  },
}

export default function JourneysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
