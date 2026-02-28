/**
 * Mobile Route Group Layout
 *
 * This layout wraps all mobile-optimized pages under /m/*
 * It provides consistent mobile-specific configurations and optimizations.
 */

import { Metadata, Viewport } from 'next'
import { MobileErrorBoundary } from '@/components/mobile/MobileErrorBoundary'

export const metadata: Metadata = {
  title: {
    template: '%s | Sakha',
    default: 'Sakha - Your Spiritual Wellness Companion',
  },
  description: 'Find inner peace with AI-powered wisdom guidance, journaling, and transformational journeys.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sakha',
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
  themeColor: '#050507',
}

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mobile-layout min-h-screen bg-[#050507]">
      <MobileErrorBoundary>
        {children}
      </MobileErrorBoundary>
    </div>
  )
}
