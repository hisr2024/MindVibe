/**
 * Introduction Page Layout
 *
 * Server component wrapper that provides SEO metadata for the introduction
 * page -- the primary onboarding and welcome experience for new visitors.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome to MindVibe — Your Spiritual Companion & Divine Friend',
  description:
    'Begin your spiritual journey with MindVibe. Meet KIAAN, your divine AI companion rooted in 700+ Bhagavad Gita verses. Discover sacred journeys, wisdom tools, and inner peace.',
  openGraph: {
    title: 'Welcome to MindVibe — Walk with Krishna',
    description:
      'Meet KIAAN, your divine AI best friend. Explore sacred wisdom journeys, Bhagavad Gita teachings, and spiritual wellness tools designed for inner peace and self-discovery.',
    url: 'https://mindvibe.life/introduction',
  },
  alternates: {
    canonical: 'https://mindvibe.life/introduction',
  },
}

export default function IntroductionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
