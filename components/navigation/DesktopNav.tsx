'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MindVibeLockup } from '@/components/branding'
import { ThemeToggle } from '@/components/ui'
import { ToolsDropdown, type ToolCategory } from './ToolsDropdown'

export interface DesktopNavProps {
  /** Optional className for styling */
  className?: string
}

// Default tool categories for the dropdown
const defaultToolCategories: ToolCategory[] = [
  {
    id: 'guidance',
    name: 'Guidance Engines',
    items: [
      {
        id: 'viyog',
        name: 'Viyog',
        description: 'Detachment & mindfulness guidance',
        href: '/viyog',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        ),
      },
      {
        id: 'ardha',
        name: 'Ardha',
        description: 'Balance & harmony insights',
        href: '/ardha',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ),
      },
      {
        id: 'compass',
        name: 'Relationship Compass',
        description: 'Navigate relationship dynamics',
        href: '/relationship-compass',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'karma',
    name: 'Karma & Growth',
    items: [
      {
        id: 'tree',
        name: 'Karmic Tree',
        description: 'Visualize your growth journey',
        href: '/karmic-tree',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22V8" />
            <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
            <path d="M12 2v4" />
            <path d="M12 8a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6z" />
          </svg>
        ),
      },
      {
        id: 'footprint',
        name: 'Karma Footprint',
        description: 'Track your karmic actions',
        href: '/karma-footprint',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22a10 10 0 1 0-8.48-4.7" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M2 12h4M12 22v-4M22 12h-4" />
          </svg>
        ),
      },
      {
        id: 'reset',
        name: 'Karma Reset',
        description: 'Start fresh with intention',
        href: '/karma-reset',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v6h6" />
            <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
            <path d="M21 22v-6h-6" />
            <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
          </svg>
        ),
      },
      {
        id: 'emotional-reset',
        name: 'Emotional Reset',
        description: 'Reset your emotional state',
        href: '/emotional-reset',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        ),
      },
    ],
  },
]

// Main navigation links
const mainNavLinks = [
  { href: '/kiaan', label: 'Chat' },
  { href: '/sacred-reflections', label: 'Journal' },
  { href: '/wisdom-rooms', label: 'Wisdom' },
  { href: '/dashboard', label: 'Insights' },
]

/**
 * DesktopNav component for desktop top navigation.
 *
 * Features:
 * - MindVibe logo (preserved, unaltered)
 * - Main nav links: Chat, Journal, Wisdom, Insights
 * - Tools dropdown menu with all guidance engines
 * - User profile dropdown
 * - Proper active state indicators
 */
export function DesktopNav({ className = '' }: DesktopNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-950/95 shadow-lg shadow-black/20 backdrop-blur-xl ${className}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 text-slate-100 transition hover:text-white"
          aria-label="MindVibe home"
        >
          <MindVibeLockup
            theme="sunrise"
            animated
            className="drop-shadow-[0_10px_40px_rgba(255,147,89,0.28)]"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {mainNavLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  active
                    ? 'bg-white/10 text-white shadow-lg shadow-orange-500/20'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <ToolsDropdown categories={defaultToolCategories} />
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white md:inline-flex focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-white/80 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="text-sm font-semibold">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="border-t border-white/5 bg-slate-950/95 px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-2">
            {mainNavLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="border-t border-white/5 pt-2 mt-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                Tools
              </span>
              {defaultToolCategories.flatMap((cat) =>
                cat.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/5"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))
              )}
            </div>
            <div className="flex items-center justify-between rounded-xl px-3 py-2 border-t border-white/5 mt-2 pt-2">
              <span className="text-sm text-white/80">Theme</span>
              <ThemeToggle />
            </div>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-3 py-2 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25"
            >
              Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default DesktopNav
