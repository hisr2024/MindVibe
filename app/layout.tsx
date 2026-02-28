import './globals.css'
import type { Viewport } from 'next'
import { headers } from 'next/headers'
import SiteFooter from './components/SiteFooter'
import SiteNav from './components/SiteNav'
import Providers from './providers'
import { MobileNav } from '@/components/navigation'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner'
import { KiaanFooter } from '@/components/layout/KiaanFooter'
import { GlobalWakeWordListener } from '@/components/wake-word/GlobalWakeWordListener'
import KiaanVoiceFAB from '@/components/voice/KiaanVoiceFAB'
import { ClientLayout } from './ClientLayout'
import { OverlayRoot } from '@/components/ui/OverlayRoot'
import { MobileRouteGuard, MobileContentWrapper } from '@/components/mobile/MobileRouteGuard'
import { WebVitalsReporter } from '@/components/WebVitalsReporter'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

/**
 * The CSS variable --font-sacred is set on <body> via globals.css and
 * consumed by Tailwind's `font-sacred` utility (see tailwind.config.ts).
 * Uses a system serif fallback stack (Georgia, Times New Roman) so the
 * build doesn't require fetching from Google Fonts at build time.
 * In production, Crimson Text can be loaded via CDN at runtime.
 */

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#050507',
}

export const metadata = {
  title: 'Sakha — The Spiritual Companion & Your Divine Friend | Bhagavad Gita Wisdom',
  description: 'Discover inner peace through Bhagavad Gita wisdom. KIAAN, your AI spiritual guide, offers sacred journeys, voice companionship, and tools for self-discovery in 17 languages.',
  metadataBase: new URL('https://kiaanverse.com'),
  keywords: ['spiritual companion', 'divine friend', 'Bhagavad Gita', 'KIAAN', 'spiritual growth', 'inner peace', 'Krishna wisdom', 'sacred journeys', 'Gita verses', 'self-discovery', 'spiritual guide', 'Sakha'],
  openGraph: {
    title: 'Sakha — The Spiritual Companion & Your Divine Friend',
    description: 'Walk with Krishna. 700+ Bhagavad Gita verses, KIAAN AI spiritual guide, sacred wisdom journeys, and divine tools for inner peace and self-discovery.',
    url: 'https://kiaanverse.com',
    siteName: 'Sakha',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Sakha - The Spiritual Companion' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sakha — The Spiritual Companion & Your Divine Friend',
    description: 'Discover inner peace through Bhagavad Gita wisdom. KIAAN, your AI spiritual guide, offers sacred journeys, voice companionship, and tools for self-discovery.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://kiaanverse.com',
    languages: {
      'en': 'https://kiaanverse.com',
      'hi': 'https://kiaanverse.com?lang=hi',
      'ta': 'https://kiaanverse.com?lang=ta',
      'te': 'https://kiaanverse.com?lang=te',
      'bn': 'https://kiaanverse.com?lang=bn',
      'mr': 'https://kiaanverse.com?lang=mr',
      'gu': 'https://kiaanverse.com?lang=gu',
      'kn': 'https://kiaanverse.com?lang=kn',
      'ml': 'https://kiaanverse.com?lang=ml',
      'pa': 'https://kiaanverse.com?lang=pa',
      'sa': 'https://kiaanverse.com?lang=sa',
      'es': 'https://kiaanverse.com?lang=es',
      'fr': 'https://kiaanverse.com?lang=fr',
      'de': 'https://kiaanverse.com?lang=de',
      'pt': 'https://kiaanverse.com?lang=pt',
      'ja': 'https://kiaanverse.com?lang=ja',
      'zh-CN': 'https://kiaanverse.com?lang=zh-CN',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sakha',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icons/icon.svg'
  }
}

// Inline script to set language before hydration - prevents flash of wrong language
const languageScript = `
(function() {
  try {
    var stored = localStorage.getItem('preferredLocale');
    var validLocales = ['en','hi','ta','te','bn','mr','gu','kn','ml','pa','sa','es','fr','de','pt','ja','zh-CN'];
    if (stored && validLocales.indexOf(stored) !== -1) {
      document.documentElement.lang = stored;
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') ?? ''

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data for search engine rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://kiaanverse.com/#website',
                  url: 'https://kiaanverse.com',
                  name: 'Sakha',
                  description:
                    'The Spiritual Companion & Your Divine Friend — powered by Bhagavad Gita Wisdom',
                  publisher: {
                    '@id': 'https://kiaanverse.com/#organization',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://kiaanverse.com/#organization',
                  name: 'Sakha',
                  url: 'https://kiaanverse.com',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://kiaanverse.com/icons/icon.svg',
                  },
                },
              ],
            }),
          }}
        />
        {/* Set language from localStorage before hydration to prevent flash */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: languageScript }} />
      </head>
      <body className="min-h-screen bg-[#050507] text-[#f5f0e8] antialiased mobile-viewport-fix overscroll-none">
        <ClientLayout>
          <Providers>
            {/* Skip to content link for keyboard accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[#d4a44c] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#050507] focus:outline-none focus:ring-2 focus:ring-[#e8b54a]"
            >
              Skip to content
            </a>
            {/* Overlay root for Portal-based modals/sheets - must be early in tree */}
            <OverlayRoot />
            {/* Screen reader announcements for dynamic content */}
            <div
              id="sr-announcements"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            />
            <ServiceWorkerRegistration />
            <OfflineStatusBanner />
            {/* Desktop/standard navigation - hidden on /m/* mobile routes to avoid duplication */}
            <MobileRouteGuard>
              <SiteNav />
            </MobileRouteGuard>
            {/* Content wrapper: full-width for /m/* routes, constrained <main> for desktop */}
            <MobileContentWrapper>
              {children}
            </MobileContentWrapper>
            {/* Footer, nav, FABs - hidden on /m/* routes where MobileAppShell handles these */}
            <MobileRouteGuard>
              <SiteFooter />
              {/* Mobile bottom navigation (for standard non /m/* routes) */}
              <MobileNav />
              {/* OM floating chat widget */}
              <KiaanFooter />
              {/* Global voice FAB - tap to talk to KIAAN */}
              <KiaanVoiceFAB />
            </MobileRouteGuard>
            {/* Global wake word listener - "Hey KIAAN" from anywhere */}
            <GlobalWakeWordListener />
            {/* BreadcrumbList structured data for SERP display */}
            <BreadcrumbSchema />
            {/* Core Web Vitals monitoring */}
            <WebVitalsReporter />
          </Providers>
        </ClientLayout>
      </body>
    </html>
  )
}
