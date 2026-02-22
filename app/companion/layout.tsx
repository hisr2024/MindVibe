/**
 * KIAAN Companion Page Layout
 *
 * Server component wrapper that provides SEO metadata for the KIAAN
 * Companion -- the orb-based voice best friend interface.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KIAAN Companion — Your Divine Best Friend | MindVibe',
  description:
    'Meet KIAAN, your divine best friend and voice-first spiritual companion. An immersive orb interface with mood-reactive responses, Gita wisdom, and every wellness tool at your fingertips.',
  openGraph: {
    title: 'KIAAN Companion — Your Divine Best Friend',
    description:
      'Talk to KIAAN, your voice-first divine companion. Mood-reactive orb interface with Bhagavad Gita wisdom and sacred wellness tools.',
    url: 'https://mindvibe.life/companion',
  },
  alternates: {
    canonical: 'https://mindvibe.life/companion',
  },
}

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
