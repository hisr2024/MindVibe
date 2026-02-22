import './globals.css'
import type { Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter, Crimson_Text } from 'next/font/google'
import dynamic from 'next/dynamic'
import SiteFooter from './components/SiteFooter'
import SiteNav from './components/SiteNav'
import Providers from './providers'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { ClientLayout } from './ClientLayout'
import { OverlayRoot } from '@/components/ui/OverlayRoot'
import { MobileRouteGuard, MobileContentWrapper } from '@/components/mobile/MobileRouteGuard'
import { WebVitalsReporter } from '@/components/WebVitalsReporter'

// Dynamic imports for framer-motion components to reduce initial bundle size
const MobileNav = dynamic(() => import('@/components/navigation/MobileNav').then(mod => mod.MobileNav), { ssr: false })
const OfflineStatusBanner = dynamic(() => import('@/components/OfflineStatusBanner').then(mod => mod.OfflineStatusBanner), { ssr: false })
const KiaanFooter = dynamic(() => import('@/components/layout/KiaanFooter').then(mod => mod.KiaanFooter), { ssr: false })
const GlobalWakeWordListener = dynamic(() => import('@/components/wake-word/GlobalWakeWordListener').then(mod => mod.GlobalWakeWordListener), { ssr: false })
const KiaanVoiceFAB = dynamic(() => import('@/components/voice/KiaanVoiceFAB'), { ssr: false })

/**
 * Self-hosted Inter via next/font/google.
 * Used as the primary UI font across the entire application.
 * The CSS variable --font-inter is consumed by Tailwind's `font-sans` family
 * and the global --font-sans custom property, so every element inherits it
 * without an extra network request to Google Fonts.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

/**
 * Self-hosted Crimson Text via next/font/google.
 * Replaces the external Google Fonts <link> tag so the font files are served
 * from the same origin, eliminating the render-blocking cross-origin request
 * and improving LCP / CLS scores.
 */
const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-sacred',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0b0b0f',
}

export const metadata = {
  title: 'MindVibe — Your Spiritual Companion & Best Divine Friend | Bhagavad Gita Wisdom',
  description: 'MindVibe is the best spiritual companion and divine friend — powered by 700+ Bhagavad Gita verses, KIAAN AI guide, sacred wisdom journeys, and tools for inner peace, self-discovery, and spiritual growth. Walk with Krishna.',
  metadataBase: new URL('https://mindvibe.life'),
  keywords: ['spiritual companion', 'divine friend', 'Bhagavad Gita', 'KIAAN', 'spiritual growth', 'inner peace', 'Krishna wisdom', 'sacred journeys', 'Gita verses', 'self-discovery', 'spiritual guide', 'MindVibe'],
  openGraph: {
    title: 'MindVibe — Your Spiritual Companion & Best Divine Friend',
    description: 'Walk with Krishna. 700+ Bhagavad Gita verses, KIAAN AI spiritual guide, sacred wisdom journeys, and divine tools for inner peace and self-discovery.',
    url: 'https://mindvibe.life',
    siteName: 'MindVibe',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MindVibe — Your Spiritual Companion & Divine Friend',
    description: 'The best spiritual companion rooted in the Bhagavad Gita. KIAAN AI guide, sacred wisdom journeys, and tools for inner peace.',
  },
  alternates: {
    canonical: 'https://mindvibe.life',
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
    ],
    shortcut: '/favicon.ico',
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
                  sameAs: [],
                },
              ],
            }),
          }}
        />
        {/* Set language from localStorage before hydration to prevent flash */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: languageScript }} />
      </head>
      <body className={`${inter.variable} ${crimsonText.variable} font-sans min-h-screen bg-slate-950 text-slate-50 antialiased mobile-viewport-fix overscroll-none`}>
        <ClientLayout>
          <Providers>
            {/* Skip to content link for keyboard accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              Skip to content
            </a>
            {/* Overlay root for Portal-based modals/sheets - must be early in tree */}
            <OverlayRoot />
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
              <div className="hidden md:block">
                <SiteFooter />
              </div>
              {/* Mobile bottom navigation (for standard non /m/* routes) */}
              <MobileNav />
              {/* OM floating chat widget */}
              <KiaanFooter />
              {/* Global voice FAB - tap to talk to KIAAN */}
              <KiaanVoiceFAB />
            </MobileRouteGuard>
            {/* Global wake word listener - "Hey KIAAN" from anywhere */}
            <GlobalWakeWordListener />
            {/* Core Web Vitals monitoring */}
            <WebVitalsReporter />
          </Providers>
        </ClientLayout>
      </body>
    </html>
  )
}
