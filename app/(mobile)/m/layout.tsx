/**
 * Mobile Route Group Layout
 *
 * This layout wraps all mobile-optimized pages under /m/*
 * It provides consistent mobile-specific configurations and optimizations.
 */

import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | MindVibe',
    default: 'MindVibe - Your Mental Wellness Companion',
  },
  description: 'Find inner peace with AI-powered wisdom guidance, journaling, and transformational journeys.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MindVibe',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b0b0f',
}

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mobile-layout min-h-screen bg-[#0b0b0f]">
      {children}
    </div>
  )
}
