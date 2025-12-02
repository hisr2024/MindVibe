'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ui'

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/flows', label: 'Flows' },
  { href: '/features', label: 'Features' },
  { href: '/about', label: 'About' },
]

export default function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-orange-500/10 bg-slate-950/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 text-orange-100 transition hover:text-orange-200" aria-label="MindVibe home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-200 text-slate-900 font-black">
            MV
          </span>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.24em] text-orange-100/80">MindVibe</p>
            <p className="text-sm font-semibold text-orange-50">Mental Health Companion</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map(link => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition hover:bg-orange-500/15 hover:text-orange-50 ${
                  active ? 'bg-orange-500/20 text-orange-50' : 'text-orange-100/80'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            href="/account"
            className="hidden rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] md:inline-flex"
          >
            Account Access
          </Link>
          <button
            onClick={() => setOpen(value => !value)}
            className="inline-flex items-center justify-center rounded-xl border border-orange-500/20 px-3 py-2 text-orange-100/90 md:hidden"
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            <span className="text-sm font-semibold">Menu</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-orange-500/10 bg-slate-950/95 px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-2">
            {links.map(link => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-orange-500/15 ${
                    active ? 'bg-orange-500/20 text-orange-50' : 'text-orange-100/80'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="flex items-center justify-between rounded-xl px-3 py-2">
              <span className="text-sm text-orange-100/80">Theme</span>
              <ThemeToggle />
            </div>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-3 py-2 text-center text-sm font-semibold text-slate-950 shadow-md shadow-orange-500/25"
            >
              Account Access
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
