'use client'

/**
 * Topbar — Kiaanverse app-shell top bar (desktop only).
 *
 * Desktop (≥1024px): OM symbol + "KIAAN" wordmark left, "SACRED" badge
 * + user avatar right.  56px tall, #0b0b1a background.
 *
 * Hidden on mobile — the root layout's SiteNav and MobileNav already
 * handle mobile navigation. Rendering a second nav bar on mobile would
 * cause a double-hamburger / double-header conflict.
 */

import Link from 'next/link'
import styles from '@/styles/layout.module.css'

export function Topbar() {
  return (
    <div className={styles.topbar}>
      {/* Left: OM symbol + KIAAN wordmark */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        aria-label="Dashboard home"
      >
        <span
          className="font-devanagari select-none"
          style={{ fontSize: '20px', color: '#c8a84b', lineHeight: 1 }}
        >
          ॐ
        </span>
        <span
          className="font-ui font-semibold tracking-wide"
          style={{ fontSize: '16px', color: '#e8dcc8', letterSpacing: '0.06em' }}
        >
          KIAAN
        </span>
        <span
          className="font-ui"
          style={{ fontSize: '10px', color: 'rgba(200, 168, 75, 0.5)', letterSpacing: '0.04em' }}
        >
          verse
        </span>
      </Link>

      {/* Right: SACRED badge + user avatar */}
      <div className="flex items-center gap-3">
        <span
          className="rounded-full font-ui uppercase select-none"
          style={{
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: '#c8a84b',
            border: '1px solid rgba(200, 168, 75, 0.25)',
            background: 'rgba(200, 168, 75, 0.06)',
            padding: '4px 10px',
          }}
        >
          Sacred
        </span>
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #c8943a, #e8b54a)',
          }}
        >
          <span className="text-xs font-bold text-[#0a0a12]">U</span>
        </div>
      </div>
    </div>
  )
}
