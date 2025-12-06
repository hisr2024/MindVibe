import './globals.css'
import SiteFooter from './components/SiteFooter'
import SiteNav from './components/SiteNav'
import Providers from './providers'
import { MobileNav } from '@/components/navigation'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  title: 'MindVibe - Mental Health App',
  description: 'Calm, privacy-first mental health companion with journaling, guided chats, and dashboards.',
  metadataBase: new URL('https://mindvibe.app'),
  themeColor: '#0b0b0f',
  manifest: '/manifest.json',
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased font-sans">
        <Providers>
          <SiteNav />
          <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-24 pt-16 sm:px-6 md:pb-0 lg:px-8 lg:pt-24">
            {children}
          </main>
          <SiteFooter />
          <MobileNav />
        </Providers>
      </body>
    </html>
  )
}
