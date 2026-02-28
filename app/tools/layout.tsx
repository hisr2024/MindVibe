/**
 * Tools Layout
 *
 * Server component wrapper that provides SEO metadata for the
 * spiritual wellness tools section of Sakha.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spiritual Wellness Tools | Sakha',
  description:
    'Discover powerful spiritual wellness tools: Ardha cognitive reframing, Karmic Tree visualization, Emotional Reset, Karma Footprint tracking, and more. Rooted in Bhagavad Gita wisdom.',
  openGraph: {
    title: 'Spiritual Wellness Tools | Sakha',
    description:
      'Discover powerful spiritual wellness tools: Ardha cognitive reframing, Karmic Tree visualization, Emotional Reset, Karma Footprint tracking, and more.',
    url: 'https://kiaanverse.com/tools',
  },
  alternates: {
    canonical: 'https://kiaanverse.com/tools',
  },
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
