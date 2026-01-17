import './globals.css'
import SiteFooter from './components/SiteFooter'
import SiteNav from './components/SiteNav'
import Providers from './providers'
import { MobileNav } from '@/components/navigation'
import { MinimalLanguageSelector } from '@/components/MinimalLanguageSelector'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner'
import { ChatFooter } from '@/components/layout/ChatFooter'
import { KiaanFooter } from '@/components/layout/KiaanFooter'
import { ClientLayout } from './ClientLayout'

export const metadata = {
  title: 'MindVibe - Mental Health App',
  description: 'Calm, privacy-first mental health companion with journaling, guided chats, and dashboards.',
  metadataBase: new URL('https://mindvibe.app'),
  themeColor: '#0b0b0f',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
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
            <div className="flex items-center justify-between px-4 pt-4 sm:px-6 lg:px-8">
              <div className="flex-1">
                <SiteNav />
              </div>
              <MinimalLanguageSelector />
            </div>
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-24 pt-8 sm:px-6 md:pb-0 lg:px-8 lg:pt-16">
              {children}
            </main>
            <SiteFooter />
            <MobileNav />
            <ChatFooter />
            <KiaanFooter />
          </Providers>
        </ClientLayout>
      </body>
    </html>
  )
}
