/**
 * Deep Insights Page Layout
 *
 * Server component wrapper that provides SEO metadata for the Deep Insights
 * page -- AI-powered spiritual analysis tools.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deep Insights — Spiritual Analysis | Sakha',
  description:
    'Unlock deeper self-understanding with AI-powered spiritual analysis. Explore your inner patterns, emotional tendencies, and growth path through the lens of Bhagavad Gita wisdom.',
  openGraph: {
    title: 'Deep Insights — Sakha Spiritual Analysis',
    description:
      'AI-powered spiritual analysis tools. Discover your inner patterns and growth path through Bhagavad Gita wisdom.',
    url: 'https://mindvibe.life/deep-insights',
  },
  alternates: {
    canonical: 'https://mindvibe.life/deep-insights',
  },
}

export default function DeepInsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
