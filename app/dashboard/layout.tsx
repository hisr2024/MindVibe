/**
 * Dashboard Layout
 *
 * Server component wrapper that provides SEO metadata for the dashboard.
 * Layout shell (Sidebar + Topbar) is handled by the shared AppShell
 * component, which is a client component imported here.
 *
 * On desktop (≥1024px) the parent MobileContentWrapper switches to
 * flex-row, so AppShell's Sidebar and content area sit side-by-side.
 * On mobile the Sidebar is hidden via CSS; a hamburger drawer provides access.
 */

import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'

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
    <AppShell>
      {children}
    </AppShell>
  )
}
