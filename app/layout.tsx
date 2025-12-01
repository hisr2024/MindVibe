import './globals.css'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import SiteFooter from './components/SiteFooter'
import SiteNav from './components/SiteNav'
import { LocaleProvider } from './components/LocaleProvider'
import ServiceWorkerRegister from './components/ServiceWorkerRegister'
import { supportedLocales, type SupportedLocale } from '../lib/i18n/messages'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

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
  const cookieLocale = cookies().get('mv-locale')?.value as SupportedLocale | undefined
  const locale: SupportedLocale = cookieLocale && supportedLocales.includes(cookieLocale) ? cookieLocale : 'en'

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-slate-950"
        >
          Skip to content
        </a>
        <LocaleProvider initialLocale={locale}>
          <ServiceWorkerRegister />
          <SiteNav />
          <div id="main-content" className="pt-20 lg:pt-24">
            {children}
          </div>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  )
}
