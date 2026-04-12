'use client'

/**
 * Sidebar — Kiaanverse navigation sidebar.
 *
 * Two rendering modes:
 * 1. Desktop (≥1024px): Static sidebar, always visible via `hidden lg:flex`.
 * 2. Mobile drawer: Controlled by `open` / `onClose` props.  The drawer
 *    slides in from the left via CSS transform (styles/layout.module.css).
 *    No JS animation libraries needed.
 *
 * Both modes render the same nav items + user section.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import styles from '@/styles/layout.module.css'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', sanskrit: 'गृह' },
  { href: '/kiaan/chat', label: 'KIAAN', sanskrit: 'सखा' },
  { href: '/journeys', label: 'Journeys', sanskrit: 'यात्रा' },
  { href: '/karmalytix', label: 'KarmaLytix', sanskrit: 'कर्म' },
  { href: '/gita', label: 'Gita', sanskrit: 'गीता' },
  { href: '/sadhana', label: 'Sadhana', sanskrit: 'साधना' },
  { href: '/settings', label: 'Settings', sanskrit: 'व्यवस्था' },
] as const

interface SidebarProps {
  /** Mobile drawer open state. Ignored on desktop (CSS handles visibility). */
  open?: boolean
  /** Callback when mobile drawer requests close (backdrop click, nav click). */
  onClose?: () => void
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: '#0b0b1a' }}
    >
      <nav className="flex flex-col flex-1 py-5 gap-0.5" aria-label="App navigation">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col px-5 py-2.5 font-ui transition-colors duration-200 ${
                active
                  ? 'text-[#c8a84b]'
                  : 'text-[rgba(232,220,200,0.5)] hover:text-[#c8a84b]'
              }`}
              style={{
                fontSize: '13px',
                letterSpacing: '0.02em',
                borderLeft: active
                  ? '2px solid #c8a84b'
                  : '2px solid transparent',
                background: active
                  ? 'rgba(180, 140, 60, 0.08)'
                  : undefined,
              }}
            >
              <span className="font-medium">{item.label}</span>
              {item.sanskrit && (
                <span
                  className="font-devanagari"
                  style={{ fontSize: '10px', opacity: 0.35, lineHeight: 1.4 }}
                >
                  {item.sanskrit}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section — bottom of sidebar */}
      <div
        className="mt-auto px-5 py-4"
        style={{ borderTop: '1px solid rgba(180, 140, 60, 0.1)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, #c8943a, #e8b54a)',
            }}
          >
            <span className="text-xs font-bold text-[#0a0a12]">U</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#e8dcc8]/80 truncate">User</p>
            <span
              className="inline-block rounded-full font-ui"
              style={{
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: '#c8a84b',
                background: 'rgba(200, 168, 75, 0.1)',
                border: '1px solid rgba(200, 168, 75, 0.2)',
                padding: '1px 8px',
                marginTop: '2px',
              }}
            >
              FREE
            </span>
          </div>
        </div>
        <Link
          href="/api/auth/signout"
          onClick={onNavClick}
          className="block text-[11px] font-ui text-[rgba(232,220,200,0.35)] hover:text-[rgba(232,220,200,0.6)] transition-colors"
          style={{ letterSpacing: '0.02em' }}
        >
          Sign out
        </Link>
      </div>
    </div>
  )
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  // Close drawer on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Close drawer on route change
  const pathname = usePathname()
  useEffect(() => {
    if (open) onClose?.()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Desktop sidebar — always visible at lg via CSS */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-[220px] lg:shrink-0 border-r overflow-y-auto"
        style={{
          borderColor: 'rgba(180, 140, 60, 0.12)',
          background: '#0b0b1a',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile drawer — controlled by open prop */}
      <div
        className={styles.drawerBackdrop}
        data-open={open}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={styles.drawerPanel}
        data-open={open}
        role="dialog"
        aria-modal={open}
        aria-label="Navigation menu"
      >
        <SidebarContent onNavClick={onClose} />
      </div>
    </>
  )
}
