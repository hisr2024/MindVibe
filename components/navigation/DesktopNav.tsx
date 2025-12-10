'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MindVibeLockup } from '@/components/branding'
import { ThemeToggle } from '@/components/ui'
import { ToolsDropdown } from './ToolsDropdown'
import { TOOLS_BY_CATEGORY, type ToolConfig } from '@/lib/constants/tools'

export interface DesktopNavProps {
  /** Optional className for styling */
  className?: string
}

// Main navigation links
const mainNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/kiaan/chat', label: 'KIAAN Chat' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/wisdom-rooms', label: 'Wisdom Rooms' },
  { href: '/deep-insights', label: 'Deep Insights' },
  { href: '/ardha', label: 'Ardha' },
  { href: '/viyog', label: 'Viyoga' },
  { href: '/sacred-reflections', label: 'Sacred Reflections' },
  { href: '/karmic-tree', label: 'Karmic Tree' },
  { href: '/profile', label: 'Profile' },
]

/**
 * DesktopNav component for desktop top navigation.
 *
 * Features:
 * - MindVibe logo (preserved, unaltered)
 * - Main nav links: Chat, Sacred Reflections, Wisdom, Insights
 * - Tools dropdown menu with all guidance engines
 * - User profile dropdown
 * - Proper active state indicators
 */
export function DesktopNav({ className = '' }: DesktopNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get tools for mobile menu display
  const allTools = TOOLS_BY_CATEGORY.filter(
    cat => cat.id === 'guidance' || cat.id === 'karma'
  ).flatMap(cat => cat.tools)

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
                className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  active
                    ? 'bg-white/10 text-white shadow-lg shadow-orange-500/20'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <ToolsDropdown />
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/subscription"
            className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white sm:inline-flex focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Subscriptions
          </Link>
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white md:inline-flex focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
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
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
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
              {allTools.map((item: ToolConfig) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/5"
                >
                  <span className="text-base">{item.icon}</span>
                  {item.title}
                </Link>
              ))}
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
