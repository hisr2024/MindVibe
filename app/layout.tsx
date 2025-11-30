import './globals.css'
import { Inter } from 'next/font/google'
import SiteFooter from './components/SiteFooter'
import SiteNav from './components/SiteNav'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'MindVibe - Mental Health App',
  description: 'Calm, privacy-first mental health companion with journaling, guided chats, and dashboards.',
  metadataBase: new URL('https://mindvibe.app'),
  themeColor: '#0b0b0f',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    shortcut: '/icons/icon.svg',
    apple: '/icons/icon.svg'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        <SiteNav />
        <div className="pt-20 lg:pt-24">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
