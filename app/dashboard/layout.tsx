/**
 * Dashboard Layout
 *
 * Server component wrapper that provides SEO metadata and the desktop
 * sidebar shell for the user's sacred dashboard in Sakha.
 *
 * On desktop (≥1024px) the parent MobileContentWrapper switches to
 * flex-row, so <Sidebar> and the content <div> sit side-by-side.
 * On mobile the Sidebar is hidden via CSS (`hidden lg:flex`).
 */

import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Your Sacred Dashboard | Sakha',
  description:
    'Your personal spiritual dashboard. Track journey progress, access wisdom tools, review reflections, and continue your path to inner peace with Sakha.',
  openGraph: {
    title: 'Your Sacred Dashboard | Sakha',
    description:
      'Your personal spiritual dashboard. Track journey progress, access wisdom tools, review reflections, and continue your path to inner peace.',
    url: 'https://kiaanverse.com/dashboard',
  },
  alternates: {
    canonical: 'https://kiaanverse.com/dashboard',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Sidebar />
      <div className="flex-1 min-w-0 lg:overflow-y-auto">
        {children}
      </div>
    </>
  )
}
