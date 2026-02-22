/**
 * Introduction Page Layout
 *
 * Server component wrapper that provides SEO metadata for the introduction
 * page -- the primary onboarding and welcome experience for new visitors.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Divine Introduction | MindVibe',
  description:
    'Begin your spiritual journey with Krishna. Experience divine guidance, sacred tools, and AI-powered wisdom from the Bhagavad Gita.',
  openGraph: {
    title: 'Divine Introduction | MindVibe',
    description:
      'Begin your spiritual journey with Krishna. Experience divine guidance, sacred tools, and AI-powered wisdom from the Bhagavad Gita.',
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
