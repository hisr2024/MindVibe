/**
 * Sacred Reflections Page Layout
 *
 * Server component wrapper that provides SEO metadata for the Sacred
 * Reflections (encrypted private journal) page.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sacred Reflections — Private Journal | Sakha',
  description:
    'Your encrypted private journal for spiritual growth. Capture reflections, KIAAN insights, and sacred moments with AES-GCM encryption -- your words remain yours.',
  openGraph: {
    title: 'Sacred Reflections — Encrypted Spiritual Journal',
    description:
      'Capture your spiritual journey in an encrypted private journal. Save KIAAN insights, reflections, and sacred moments securely.',
    url: 'https://mindvibe.life/sacred-reflections',
  },
  alternates: {
    canonical: 'https://mindvibe.life/sacred-reflections',
  },
}

export default function SacredReflectionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
