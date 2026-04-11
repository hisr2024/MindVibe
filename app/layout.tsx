import './globals.css'
import type { Viewport } from 'next'
import { headers } from 'next/headers'
import SiteFooter from './components/SiteFooter'
import SiteNav from './components/SiteNav'
import Providers from './providers'
import { MobileNav } from '@/components/navigation'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner'
import { KiaanVoiceCompanionFooter } from '@/components/layout/KiaanVoiceCompanionFooter'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ClientLayout } from './ClientLayout'
import { OverlayRoot } from '@/components/ui/OverlayRoot'
import { MobileRouteGuard, MobileContentWrapper } from '@/components/mobile/MobileRouteGuard'
import { WebVitalsReporter } from '@/components/WebVitalsReporter'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

/**
 * Kiaanverse Unified Font Loading — Google Fonts CDN
 *
 * Five fonts loaded via CDN with display=swap for optimal LCP.
 * CDN is used instead of next/font because the codebase has 50+
 * hardcoded font-family inline styles (e.g. fontFamily: '"Cormorant
 * Garamond"') that rely on @font-face rules using the original font
 * names. next/font registers hashed names which would break these.
 *
 * CSS variables are defined in styles/typography.css on :root and
 * consumed by Tailwind utilities (font-divine, font-scripture, etc.)
 * and the T CSS-in-JS style objects in lib/design-tokens/typography.ts.
 */

/** Google Fonts CDN URL — all five unified fonts in a single request */
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Outfit:wght@300;400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#050714',
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

// Inline script to recover from stale Next.js chunks after a new deployment.
// When Vercel deploys, old cached HTML references chunk hashes that no longer
// exist on the CDN (404). This listener catches those script-load failures and
// reloads the page once so the browser fetches fresh HTML with correct chunks.
// A sessionStorage flag prevents infinite reload loops.
const chunkErrorRecoveryScript = `
(function() {
  try {
    var KEY = '__chunk_reload';
    if (sessionStorage.getItem(KEY)) {
      sessionStorage.removeItem(KEY);
      return;
    }
    window.addEventListener('error', function(e) {
      var t = e.target;
      if (
        t && t.tagName === 'SCRIPT' &&
        t.src && t.src.indexOf('/_next/') !== -1
      ) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      }
    }, true);
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
        {/* Preconnect + load unified Kiaanverse font system via Google Fonts CDN */}
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
          rel="preload"
          as="style"
          href={GOOGLE_FONTS_URL}
        />
        <link
          rel="stylesheet"
          href={GOOGLE_FONTS_URL}
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
        {/* Auto-reload on stale chunk 404s after new deployments */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: chunkErrorRecoveryScript }} />
      </head>
      <body className="min-h-screen bg-[#050714] text-[#f5f0e8] antialiased mobile-viewport-fix overscroll-none">
        <ClientLayout>
          <Providers>
            {/* Skip to content link for keyboard accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[#d4a44c] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#050714] focus:outline-none focus:ring-2 focus:ring-[#e8b54a]"
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
              <ErrorBoundary fallback={null}>
                <KiaanVoiceCompanionFooter />
              </ErrorBoundary>
            </MobileRouteGuard>
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
