/**
 * Wisdom Rooms Page Layout
 *
 * Server component wrapper that provides SEO metadata for Wisdom Rooms --
 * themed real-time spaces for grounding, gratitude, courage, clarity,
 * and compassion.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wisdom Rooms — Sacred Spaces | Sakha',
  description:
    'Enter themed sacred spaces for calm grounding, gratitude, courage, clarity, and compassion. Real-time rooms guided by KIAAN and Bhagavad Gita wisdom.',
  openGraph: {
    title: 'Wisdom Rooms — Sacred Spaces for Inner Peace',
    description:
      'Themed sacred spaces for grounding, gratitude, and spiritual clarity. Enter a Wisdom Room and find calm with KIAAN.',
    url: 'https://kiaanverse.com/wisdom-rooms',
  },
  alternates: {
    canonical: 'https://kiaanverse.com/wisdom-rooms',
  },
}

export default function WisdomRoomsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
