'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { colors } from '@/lib/design-tokens'

export interface NavTab {
  id: string
  label: string
  href: string
  icon: React.ReactNode
}

export interface MobileNavProps {
  /** Optional custom tabs configuration */
  tabs?: NavTab[]
  /** Optional className for styling */
  className?: string
}

// Default navigation tabs
const defaultTabs: NavTab[] = [
  {
    id: 'chat',
    label: 'Chat',
    href: '/kiaan',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'journal',
    label: 'Journal',
    href: '/sacred-reflections',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    id: 'home',
    label: 'Home',
    href: '/dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'wisdom',
    label: 'Wisdom',
    href: '/wisdom-rooms',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: 'tools',
    label: 'Tools',
    href: '/karmic-tree',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

/**
 * MobileNav component for bottom tab navigation on mobile devices.
 *
 * Features:
 * - 6 tabs: Chat, Journal, Home, Wisdom, Tools, Profile
 * - Icon + label for each tab
 * - Active state indicator
 * - Touch-friendly (min 44x44px touch targets)
 * - Fixed to bottom of viewport
 */
export function MobileNav({ tabs = defaultTabs, className = '' }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-xl md:hidden ${className}`}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex min-h-[60px] min-w-[60px] flex-1 flex-col items-center justify-center gap-0.5 py-2 transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                  isActive ? 'bg-indigo-100' : ''
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'font-semibold' : ''
                }`}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white/95" />
    </nav>
  )
}

export default MobileNav
