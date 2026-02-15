import './globals.css'
import type { Viewport } from 'next'
import SiteFooter from './components/SiteFooter'
import SiteNav from './components/SiteNav'
import Providers from './providers'
import { MobileNav } from '@/components/navigation'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner'
import { KiaanFooter } from '@/components/layout/KiaanFooter'
import { GlobalWakeWordListener } from '@/components/wake-word/GlobalWakeWordListener'
import { ClientLayout } from './ClientLayout'
import { OverlayRoot } from '@/components/ui/OverlayRoot'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b0b0f',
}

export const metadata = {
  title: 'MindVibe - Your Spiritual Companion',
  description: 'A divine friend rooted in the Bhagavad Gita — 700+ verses, spiritual tools, guided wisdom journeys, and KIAAN, your AI companion for inner peace.',
  metadataBase: new URL('https://mindvibe.app'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MindVibe',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/icons/icon.svg',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set language from localStorage before hydration to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: languageScript }} />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased mobile-viewport-fix overscroll-none">
        <ClientLayout>
          <Providers>
            {/* Overlay root for Portal-based modals/sheets - must be early in tree */}
            <OverlayRoot />
            <ServiceWorkerRegistration />
            <OfflineStatusBanner />
            {/* Fixed header navigation */}
            <SiteNav />
            {/* Main content with proper spacing for fixed header and mobile nav */}
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-32 pt-20 sm:px-6 md:pb-8 lg:px-8 lg:pt-24 mobile-content-area">
              {children}
            </main>
            {/* Footer - hidden on mobile due to MobileNav */}
            <div className="hidden md:block">
              <SiteFooter />
            </div>
            {/* Mobile bottom navigation */}
            <MobileNav />
            {/* OM floating chat widget - unified for mobile and desktop */}
            <KiaanFooter />
            {/* Global wake word listener - "Hey KIAAN" from anywhere */}
            <GlobalWakeWordListener />
          </Providers>
        </ClientLayout>
      </body>
    </html>
  )
}
