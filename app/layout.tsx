import './globals.css'
import type { Viewport } from 'next'
import SiteFooter from './components/SiteFooter'
import SiteNav from './components/SiteNav'
import Providers from './providers'
import { MobileNav } from '@/components/navigation'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner'
import { KiaanFooter } from '@/components/layout/KiaanFooter'
import { ClientLayout } from './ClientLayout'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0b0b0f',
}

export const metadata = {
  title: 'MindVibe - Mental Health App',
  description: 'Calm, privacy-first mental health companion with journaling, guided chats, and dashboards.',
  metadataBase: new URL('https://mindvibe.app'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MindVibe',
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/icon.png',
    apple: '/apple-icon.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <ClientLayout>
          <Providers>
            <ServiceWorkerRegistration />
            <OfflineStatusBanner />
            {/* Fixed header navigation */}
            <SiteNav />
            {/* Main content with proper spacing for fixed header and mobile nav */}
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-32 pt-20 sm:px-6 md:pb-8 lg:px-8 lg:pt-24">
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
          </Providers>
        </ClientLayout>
      </body>
    </html>
  )
}
