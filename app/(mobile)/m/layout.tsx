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
  themeColor: '#050714',
}

/** Inline script to apply saved color scheme before React hydration (prevents flash) */
const colorSchemeInitScript = `
(function(){
  try {
    var s = localStorage.getItem('mindvibe_color_scheme');
    if (s && s !== 'default') document.documentElement.setAttribute('data-sacred-scheme', s);
  } catch(e) {}
})();
`

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mobile-layout min-h-screen bg-[var(--sacred-cosmic-void,#050714)]">
      <script dangerouslySetInnerHTML={{ __html: colorSchemeInitScript }} />
      <MobileErrorBoundary>
        {children}
      </MobileErrorBoundary>
    </div>
  )
}
