'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
import { MindVibeLockup } from '@/components/branding'
import { ThemeToggle } from '@/components/ui'
import { ToolsDropdown } from './ToolsDropdown'
import { GlobalLanguageSelector } from './GlobalLanguageSelector'
import { TOOLS_BY_CATEGORY, type ToolConfig } from '@/lib/constants/tools'
import { useLanguage } from '@/hooks/useLanguage'

export interface DesktopNavProps {
  /** Optional className for styling */
  className?: string
}

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
  const { t } = useLanguage()

  // Main navigation links with translations
  const mainNavLinks = useMemo(() => [
    { href: '/introduction', label: t('navigation.mainNav.introduction', 'Introduction'), divine: true },
    { href: '/', label: t('navigation.mainNav.home', 'Home') },
    { href: '/kiaan/chat', label: t('navigation.features.kiaan', 'KIAAN'), purposeDescKey: 'kiaan' },
    { href: '/companion', label: t('navigation.features.companion', 'Companion'), purposeDescKey: 'kiaan' },
    { href: '/dashboard', label: t('navigation.mainNav.dashboard', 'Dashboard') },
    { href: '/journeys', label: t('navigation.features.wisdomJourneys', 'Journeys'), premium: true, purposeDescKey: 'journey' },
    { href: '/sacred-reflections', label: t('navigation.features.sacredReflections', 'Sacred Reflections') },
    { href: '/karmic-tree', label: t('navigation.features.karmicTree', 'Karmic Tree') },
    { href: '/profile', label: t('navigation.mainNav.profile', 'Profile') },
  ], [t])

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
            const isDivine = 'divine' in link && link.divine
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center gap-1 ${
                  active
                    ? isDivine
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/20'
                      : 'bg-white/10 text-white shadow-lg shadow-orange-500/20'
                    : isDivine
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-200 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isDivine && <span className="text-xs">🙏</span>}
                {link.label}
              </Link>
            )
          })}
          <ToolsDropdown />
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <GlobalLanguageSelector className="hidden sm:block" />

          <Link
            href="/dashboard/subscription"
            className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white sm:inline-flex focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {t('navigation.mainNav.pricing', 'Subscriptions')}
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
            {t('navigation.mainNav.profile', 'Profile')}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-white/80 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={t('navigation.actions.toggleMenu', 'Toggle navigation menu')}
          >
            <span className="text-sm font-semibold">{t('navigation.actions.menu', 'Menu')}</span>
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
                  {'purposeDescKey' in link && link.purposeDescKey && (
                    <span className="block text-[10px] font-normal text-white/40 truncate">
                      {t(`dashboard.tool_desc.${link.purposeDescKey}`, '')}
                    </span>
                  )}
                </Link>
              )
            })}
            <div className="border-t border-white/5 pt-2 mt-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                {t('common.buttons.tools', 'Tools')}
              </span>
              {allTools.map((item: ToolConfig) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/5"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="min-w-0">
                    <span className="block">{t(`dashboard.tools.${item.id}.title`, item.title)}</span>
                    {item.purposeDescKey && (
                      <span className="block text-[10px] text-white/40 truncate">
                        {t(`dashboard.tool_desc.${item.purposeDescKey}`, '')}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl px-3 py-2 border-t border-white/5 mt-2 pt-2">
              <span className="text-sm text-white/80">{t('navigation.mainNav.theme', 'Theme')}</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between rounded-xl px-3 py-2">
              <span className="text-sm text-white/80">{t('navigation.mainNav.language', 'Language')}</span>
              <GlobalLanguageSelector />
            </div>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-3 py-2 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25"
            >
              {t('navigation.mainNav.profile', 'Profile')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default DesktopNav
