/**
 * Dashboard Layout
 *
 * Server component wrapper that provides SEO metadata for the
 * user's sacred dashboard in MindVibe.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Sacred Dashboard | MindVibe',
  description:
    'Your personal spiritual dashboard. Track journey progress, access wisdom tools, review reflections, and continue your path to inner peace with MindVibe.',
  openGraph: {
    title: 'Your Sacred Dashboard | MindVibe',
    description:
      'Your personal spiritual dashboard. Track journey progress, access wisdom tools, review reflections, and continue your path to inner peace.',
    url: 'https://mindvibe.life/dashboard',
  },
  alternates: {
    canonical: 'https://mindvibe.life/dashboard',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
