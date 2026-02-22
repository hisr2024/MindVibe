/**
 * Community Page Layout
 *
 * Server component wrapper that provides SEO metadata for the Wisdom Circles
 * community page -- anonymous peer support spaces for spiritual wellness.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wisdom Circles — Community | MindVibe',
  description:
    'Join anonymous peer support circles for spiritual wellness. Share insights, find compassion, and grow together in moderated spaces rooted in Bhagavad Gita wisdom.',
  openGraph: {
    title: 'Wisdom Circles — MindVibe Community',
    description:
      'Anonymous peer support for spiritual wellness. Share, reflect, and grow with fellow seekers in compassion-centered Wisdom Circles.',
    url: 'https://mindvibe.life/community',
  },
  alternates: {
    canonical: 'https://mindvibe.life/community',
  },
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
