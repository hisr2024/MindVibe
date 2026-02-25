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
  title: 'MindVibe — Your Spiritual Companion & Best Divine Friend | Bhagavad Gita Wisdom',
  description: 'Discover inner peace through Bhagavad Gita wisdom. KIAAN, your AI spiritual guide, offers sacred journeys, voice companionship, and tools for self-discovery in 17 languages.',
  metadataBase: new URL('https://mindvibe.life'),
  keywords: ['spiritual companion', 'divine friend', 'Bhagavad Gita', 'KIAAN', 'spiritual growth', 'inner peace', 'Krishna wisdom', 'sacred journeys', 'Gita verses', 'self-discovery', 'spiritual guide', 'MindVibe'],
  openGraph: {
    title: 'MindVibe — Your Spiritual Companion & Best Divine Friend',
    description: 'Walk with Krishna. 700+ Bhagavad Gita verses, KIAAN AI spiritual guide, sacred wisdom journeys, and divine tools for inner peace and self-discovery.',
    url: 'https://mindvibe.life',
    siteName: 'MindVibe',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MindVibe - Your Spiritual Companion' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MindVibe — Your Spiritual Companion & Divine Friend',
    description: 'Discover inner peace through Bhagavad Gita wisdom. KIAAN, your AI spiritual guide, offers sacred journeys, voice companionship, and tools for self-discovery.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://mindvibe.life',
    languages: {
      'en': 'https://mindvibe.life',
      'hi': 'https://mindvibe.life?lang=hi',
      'ta': 'https://mindvibe.life?lang=ta',
      'te': 'https://mindvibe.life?lang=te',
      'bn': 'https://mindvibe.life?lang=bn',
      'mr': 'https://mindvibe.life?lang=mr',
      'gu': 'https://mindvibe.life?lang=gu',
      'kn': 'https://mindvibe.life?lang=kn',
      'ml': 'https://mindvibe.life?lang=ml',
      'pa': 'https://mindvibe.life?lang=pa',
      'sa': 'https://mindvibe.life?lang=sa',
      'es': 'https://mindvibe.life?lang=es',
      'fr': 'https://mindvibe.life?lang=fr',
      'de': 'https://mindvibe.life?lang=de',
      'pt': 'https://mindvibe.life?lang=pt',
      'ja': 'https://mindvibe.life?lang=ja',
      'zh-CN': 'https://mindvibe.life?lang=zh-CN',
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
    title: 'MindVibe',
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
        {/* Crimson Text (sacred font) — loaded via preconnect + stylesheet for
            broadest build compatibility. The Google Fonts stylesheet injects
            @font-face rules that make 'Crimson Text' available globally.
            Tailwind's font-sacred stack: var(--font-sacred) → 'Crimson Text' → Georgia → serif */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap"
        />
        {/* JSON-LD structured data for search engine rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://mindvibe.life/#website',
                  url: 'https://mindvibe.life',
                  name: 'MindVibe',
                  description:
                    'Your Spiritual Companion & Best Divine Friend — powered by Bhagavad Gita Wisdom',
                  publisher: {
                    '@id': 'https://mindvibe.life/#organization',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://mindvibe.life/#organization',
                  name: 'MindVibe',
                  url: 'https://mindvibe.life',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://mindvibe.life/icons/icon.svg',
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
