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
  maximumScale: 5,
  userScalable: true,
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

/** Inline script to apply saved font scale before React hydration (prevents flash of wrong size) */
const fontScaleInitScript = `
(function(){
  try {
    var s = localStorage.getItem('mindvibe_font_scale');
    if (s) {
      var v = parseFloat(s);
      if (!isNaN(v) && v >= 0.875 && v <= 1.25) {
        document.documentElement.style.setProperty('--font-scale', s);
        document.documentElement.style.fontSize = (v * 100) + '%';
      }
    }
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
      <script dangerouslySetInnerHTML={{ __html: fontScaleInitScript }} />
      <MobileErrorBoundary>
        {children}
      </MobileErrorBoundary>
    </div>
  )
}
