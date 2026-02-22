/**
 * Tools Layout
 *
 * Server component wrapper that provides SEO metadata for the
 * spiritual wellness tools section of MindVibe.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spiritual Wellness Tools | MindVibe',
  description:
    'Discover powerful spiritual wellness tools: Ardha cognitive reframing, Karmic Tree visualization, Emotional Reset, Karma Footprint tracking, and more. Rooted in Bhagavad Gita wisdom.',
  openGraph: {
    title: 'Spiritual Wellness Tools | MindVibe',
    description:
      'Discover powerful spiritual wellness tools: Ardha cognitive reframing, Karmic Tree visualization, Emotional Reset, Karma Footprint tracking, and more.',
    url: 'https://mindvibe.life/tools',
  },
  alternates: {
    canonical: 'https://mindvibe.life/tools',
  },
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
