'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
import { ThemeToggle } from '@/components/ui'
import { ToolsDropdown } from './ToolsDropdown'
import { LanguageSelector } from './LanguageSelector'
import { TOOLS_BY_CATEGORY, type ToolConfig } from '@/lib/constants/tools'
import { useLanguage } from '@/hooks/useLanguage'

export interface DesktopNavProps {
  /** Optional className for styling */
  className?: string
}

/**
 * DesktopNav — Kiaanverse desktop top navigation.
 *
 * Styled per the P3-E Phase 3 spec:
 *   - Header: rgba(5,7,20,0.85) with backdrop-filter: blur(20px), 1px gold
 *     border-bottom rgba(212,160,23,0.1).
 *   - Logo: "Sakha" in Cormorant Garamond italic, divine-gold (#D4A017).
 *   - Nav links: Outfit 13px, #B8AE98 at rest, #D4A017 when active.
 *   - CTA (Subscriptions): gold gradient button.
 *   - Hamburger dropdown: rgba(11,14,42,0.98) + blur + gold border.
 */
export function DesktopNav({ className = '' }: DesktopNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useLanguage()

  // Main navigation links with translations
  const mainNavLinks = useMemo(
    () => [
      { href: '/', label: t('navigation.mainNav.home', 'Home') },
      { href: '/sadhana', label: t('navigation.features.sadhana', 'Sadhana') },
      { href: '/kiaan/chat', label: t('navigation.features.kiaan', 'KIAAN'), purposeDescKey: 'kiaan' },
      { href: '/companion', label: t('navigation.features.companion', 'Companion'), purposeDescKey: 'kiaan' },
      { href: '/dashboard', label: t('navigation.mainNav.dashboard', 'Dashboard') },
      {
        href: '/journeys',
        label: t('navigation.features.wisdomJourneys', 'Journeys'),
        premium: true,
        purposeDescKey: 'journey',
      },
      { href: '/sacred-reflections', label: t('navigation.features.sacredReflections', 'Sacred Reflections') },
      { href: '/tools/karmic-tree', label: t('navigation.features.karmicTree', 'Karmic Tree') },
      { href: '/profile', label: t('navigation.mainNav.profile', 'Profile') },
      { href: '/account', label: t('navigation.mainNav.account', 'Account') },
    ],
    [t],
  )

  // Get tools for mobile menu display
  const allTools = TOOLS_BY_CATEGORY.filter(
    (cat) => cat.id === 'guidance' || cat.id === 'karma',
  ).flatMap((cat) => cat.tools)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 ${className}`}
      style={{
        backgroundColor: 'rgba(5, 7, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(212, 160, 23, 0.1)',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo — Cormorant Garamond italic gold wordmark */}
        <Link
          href="/"
          className="font-divine italic transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:ring-offset-2 focus:ring-offset-[rgba(5,7,20,0.85)]"
          style={{
            color: '#D4A017',
            fontSize: '28px',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
          aria-label="Sakha home"
        >
          Sakha
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {mainNavLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 rounded-full px-3 py-2 font-ui transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:ring-offset-2 focus:ring-offset-[rgba(5,7,20,0.85)]"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  color: active ? '#D4A017' : '#B8AE98',
                }}
              >
                {link.label}
              </Link>
            )
          })}
          <ToolsDropdown />
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Language Selector — dropdown on desktop, auto-hidden below sm */}
          <LanguageSelector variant="dropdown" className="hidden sm:block" />

          {/* CTA: Subscriptions — gold gradient button */}
          <Link
            href="/dashboard/subscription"
            className="hidden items-center gap-2 rounded-full font-ui transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] sm:inline-flex focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:ring-offset-2 focus:ring-offset-[rgba(5,7,20,0.85)]"
            style={{
              background: 'linear-gradient(135deg, #D4A017 0%, #F0C040 50%, #D4A017 100%)',
              color: '#050714',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              padding: '9px 18px',
              boxShadow: '0 4px 14px rgba(212, 160, 23, 0.35)',
            }}
          >
            {t('navigation.mainNav.pricing', 'Subscriptions')}
          </Link>

          {/* Hamburger menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-full border px-3 py-2 font-ui transition-colors duration-200 md:hidden focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#B8AE98',
              borderColor: 'rgba(212, 160, 23, 0.3)',
            }}
            aria-expanded={mobileMenuOpen}
            aria-label={t('navigation.actions.toggleMenu', 'Toggle navigation menu')}
          >
            <span>{t('navigation.actions.menu', 'Menu')}</span>
          </button>
        </div>
      </div>

      {/* Hamburger dropdown */}
      {mobileMenuOpen && (
        <div
          className="px-4 py-3 md:hidden"
          style={{
            backgroundColor: 'rgba(11, 14, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(212, 160, 23, 0.3)',
            borderBottom: '1px solid rgba(212, 160, 23, 0.3)',
          }}
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
                  className="rounded-xl px-3 py-2 font-ui transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4A017]"
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    color: active ? '#D4A017' : '#B8AE98',
                  }}
                >
                  {link.label}
                  {'purposeDescKey' in link && link.purposeDescKey && (
                    <span
                      className="block font-ui truncate"
                      style={{ fontSize: '10px', color: 'rgba(184, 174, 152, 0.7)', fontWeight: 400 }}
                    >
                      {t(`dashboard.tool_desc.${link.purposeDescKey}`, '')}
                    </span>
                  )}
                </Link>
              )
            })}
            <div
              className="pt-2 mt-2"
              style={{ borderTop: '1px solid rgba(212, 160, 23, 0.15)' }}
            >
              <span
                className="px-3 py-1 font-ui uppercase"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  fontWeight: 600,
                  color: '#D4A017',
                }}
              >
                {t('common.buttons.tools', 'Tools')}
              </span>
              {allTools.map((item: ToolConfig) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 font-ui transition-colors duration-200"
                  style={{ fontSize: '13px', color: '#B8AE98', fontWeight: 500 }}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="min-w-0">
                    <span className="block">{t(`dashboard.tools.${item.id}.title`, item.title)}</span>
                    {item.purposeDescKey && (
                      <span
                        className="block font-ui truncate"
                        style={{ fontSize: '10px', color: 'rgba(184, 174, 152, 0.7)', fontWeight: 400 }}
                      >
                        {t(`dashboard.tool_desc.${item.purposeDescKey}`, '')}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2 mt-2 pt-2"
              style={{ borderTop: '1px solid rgba(212, 160, 23, 0.15)' }}
            >
              <span className="font-ui" style={{ fontSize: '13px', color: '#B8AE98', fontWeight: 500 }}>
                {t('navigation.mainNav.theme', 'Theme')}
              </span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between rounded-xl px-3 py-2">
              <span className="font-ui" style={{ fontSize: '13px', color: '#B8AE98', fontWeight: 500 }}>
                {t('navigation.mainNav.language', 'Language')}
              </span>
              <LanguageSelector variant="sheet" />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default DesktopNav
