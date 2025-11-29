import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './components/theme-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'MindVibe - Calming mental health support',
  description: 'Breathe, focus, and grow with calming tools for mood, journaling, and safe conversations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} font-sans bg-[var(--background)] text-[var(--foreground)]`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
