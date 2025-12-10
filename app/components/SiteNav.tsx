'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ui'
import { MindVibeLockup } from '@/components/branding'

const links = [
  { href: '/', label: 'Home' },
  { href: '/kiaan/chat', label: 'KIAAN Chat', highlight: true },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/wisdom-rooms', label: 'Wisdom Rooms' },
  { href: '/sacred-reflections', label: 'Sacred Reflections' },
  { href: '/karmic-tree', label: 'Karmic Tree' },
  { href: '/profile', label: 'Profile' },
]

export default function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[var(--brand-surface)]/95 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 text-slate-100 transition hover:text-white"
          aria-label="MindVibe home"
        >
          <MindVibeLockup theme="sunrise" animated className="drop-shadow-[0_10px_40px_rgba(255,147,89,0.28)]" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            const isHighlight = 'highlight' in link && link.highlight
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  active
                    ? isHighlight
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white/10 text-white shadow-glowSunrise'
                    : isHighlight
                    ? 'bg-gradient-to-r from-orange-500/80 to-amber-500/80 text-white hover:from-orange-500 hover:to-amber-500 shadow-md shadow-orange-500/20'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/subscription"
            className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            Subscriptions
          </Link>
          <Link
            href="/account"
            className="hidden rounded-full bg-mvGradientSunrise px-4 py-2 text-sm font-semibold text-slate-950 shadow-glowSunrise transition hover:scale-[1.02] md:inline-flex"
          >
            Account Access
          </Link>
          <button
            onClick={() => setOpen(value => !value)}
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-white/80 md:hidden"
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            <span className="text-sm font-semibold">Menu</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-slate-950/95 px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-2">
            {links.map(link => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-mv.ocean focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    active ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="flex items-center justify-between rounded-xl px-3 py-2">
              <span className="text-sm text-white/80">Theme</span>
              <ThemeToggle />
            </div>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="rounded-full bg-mvGradientSunrise px-3 py-2 text-center text-sm font-semibold text-slate-950 shadow-glowSunrise"
            >
              Account Access
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
