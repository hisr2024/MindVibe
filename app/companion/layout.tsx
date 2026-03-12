/**
 * KIAAN Companion Page Layout
 *
 * Server component wrapper that provides SEO metadata for the KIAAN
 * Companion -- the orb-based voice best friend interface.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KIAAN Voice — Always-Awake Divine Companion | Sakha',
  description:
    'Meet KIAAN, your always-awake divine voice companion with three engines: Guidance (Gita wisdom), Friend (best friend), and Voice Guide (ecosystem navigation). Speak naturally, navigate anywhere, input to any tool.',
  openGraph: {
    title: 'KIAAN Voice — Always-Awake Divine Companion',
    description:
      'Talk to KIAAN, your always-awake voice companion. Three engines: Guidance, Friend, and Voice Guide. Navigate the entire spiritual wellness ecosystem by voice.',
    url: 'https://kiaanverse.com/companion',
  },
  alternates: {
    canonical: 'https://kiaanverse.com/companion',
  },
}

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
