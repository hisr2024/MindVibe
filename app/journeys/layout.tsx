/**
 * Journeys Layout
 *
 * Server component wrapper that provides SEO metadata for the
 * sacred wisdom journeys section of Sakha.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sacred Wisdom Journeys | Sakha',
  description:
    'Embark on transformative spiritual journeys rooted in Bhagavad Gita wisdom. Multi-day guided paths for anger, attachment, purpose, and inner peace.',
  openGraph: {
    title: 'Sacred Wisdom Journeys | Sakha',
    description:
      'Embark on transformative spiritual journeys rooted in Bhagavad Gita wisdom. Multi-day guided paths for anger, attachment, purpose, and inner peace.',
    url: 'https://kiaanverse.com/journeys',
  },
  alternates: {
    canonical: 'https://kiaanverse.com/journeys',
  },
}

export default function JourneysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
