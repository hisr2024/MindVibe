'use client'

/**
 * Sidebar — Kiaanverse desktop dashboard sidebar navigation.
 *
 * Visible only at lg (≥1024px). Hidden on mobile via CSS (`hidden lg:flex`),
 * so the component is always in the DOM for SSR but never paints on small
 * viewports — no JS conditional rendering needed.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', sanskrit: '' },
  { href: '/kiaan/chat', label: 'KIAAN', sanskrit: 'सखा' },
  { href: '/journeys', label: 'Journeys', sanskrit: 'यात्रा' },
  { href: '/karmalytix', label: 'KarmaLytix', sanskrit: 'कर्म' },
  { href: '/gita', label: 'Gita', sanskrit: 'गीता' },
  { href: '/sadhana', label: 'Sadhana', sanskrit: 'साधना' },
  { href: '/settings', label: 'Settings', sanskrit: '' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-[220px] lg:shrink-0 border-r overflow-y-auto"
      style={{
        borderColor: 'rgba(180, 140, 60, 0.12)',
        background: '#0b0b1a',
      }}
    >
      <nav className="flex flex-col py-5 gap-0.5" aria-label="Dashboard">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col px-5 py-2.5 font-ui transition-colors duration-200 ${
                active
                  ? 'text-[#D4A017]'
                  : 'text-[#B8AE98] hover:text-[#D4A017]'
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
                  style={{ fontSize: '10px', opacity: 0.4, lineHeight: 1.4 }}
                >
                  {item.sanskrit}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
