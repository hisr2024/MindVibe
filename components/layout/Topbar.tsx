'use client'

/**
 * Topbar — Kiaanverse unified app-shell header (desktop only).
 *
 * Desktop (>=1024px): Sakha logo + inline nav links + Language Selector
 * + Subscriptions CTA + SACRED badge + user avatar. 56px tall.
 * Styled to match SiteNav's golden translucent theme for visual consistency.
 *
 * Hidden on mobile — the root layout's SiteNav and MobileNav already
 * handle mobile navigation.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import styles from '@/styles/layout.module.css'
import { SakhaSymbol } from '@/components/branding/SakhaSymbol'
import { LanguageSelector } from '@/components/navigation/LanguageSelector'
import { useLanguage } from '@/hooks/useLanguage'

const NAV_LINKS = [
  { href: '/', key: 'home' },
  { href: '/sadhana', key: 'sadhana' },
  { href: '/kiaan/chat', key: 'kiaan' },
  { href: '/dashboard', key: 'dashboard' },
  { href: '/journeys', key: 'journeys' },
  { href: '/sacred-reflections', key: 'sacredReflections' },
  { href: '/tools/karmic-tree', key: 'karmicTree' },
  { href: '/profile', key: 'profile' },
  { href: '/account', key: 'account' },
] as const

const LABEL_MAP: Record<string, [string, string]> = {
  home: ['navigation.mainNav.home', 'Home'],
  sadhana: ['navigation.features.sadhana', 'Sadhana'],
  kiaan: ['navigation.features.kiaan', 'KIAAN'],
  dashboard: ['navigation.mainNav.dashboard', 'Dashboard'],
  journeys: ['navigation.features.wisdomJourneys', 'Journeys'],
  sacredReflections: ['navigation.features.sacredReflections', 'Sacred Reflections'],
  karmicTree: ['navigation.features.karmicTree', 'Karmic Tree'],
  profile: ['navigation.mainNav.profile', 'Profile'],
  account: ['navigation.mainNav.account', 'Account'],
}

export function Topbar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const links = useMemo(() =>
    NAV_LINKS.map(link => ({
      ...link,
      label: t(LABEL_MAP[link.key][0], LABEL_MAP[link.key][1]),
    })),
    [t]
  )

  return (
    <div className={styles.topbar}>
      {/* Left: Sakha logo */}
      <Link
        href="/"
        className="flex items-center gap-2 font-divine italic transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/60 focus-visible:ring-offset-2"
        style={{
          color: '#D4A017',
          fontSize: '22px',
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}
        aria-label="Sakha home"
      >
        <SakhaSymbol variant="icon" size={28} animated={false} />
        <span>Sakha</span>
      </Link>

      {/* Center: Nav links — equally spaced */}
      <nav className="flex items-center gap-1.5" aria-label="Primary">
        {links.map(link => {
          const active = link.href === '/'
            ? pathname === '/'
            : (pathname === link.href || pathname.startsWith(link.href + '/'))
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-full px-2.5 py-1.5 font-ui transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/60 ${
                active
                  ? 'text-[#F0C040] border border-[#D4A017]/50'
                  : 'text-[#B8AE98] hover:text-[#D4A017]'
              }`}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Right: Language + CTA + SACRED badge + Avatar */}
      <div className="flex items-center gap-2.5">
        <LanguageSelector />

        <Link
          href="/dashboard/subscription"
          className="rounded-full font-ui transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/60"
          style={{
            background: 'linear-gradient(135deg, #D4A017 0%, #F0C040 50%, #D4A017 100%)',
            color: '#050714',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            padding: '6px 14px',
            boxShadow: '0 4px 14px rgba(212, 160, 23, 0.35)',
          }}
        >
          {t('navigation.mainNav.pricing', 'Subscriptions')}
        </Link>

        <span
          className="rounded-full font-ui uppercase select-none"
          style={{
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: '#D4A017',
            border: '1px solid rgba(212, 160, 23, 0.25)',
            background: 'rgba(212, 160, 23, 0.06)',
            padding: '4px 10px',
          }}
        >
          Sacred
        </span>

        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 30,
            height: 30,
            background: 'linear-gradient(135deg, #D4A017, #F0C040)',
          }}
        >
          <span className="text-xs font-bold text-[#0a0a12]">U</span>
        </div>
      </div>
    </div>
  )
}
