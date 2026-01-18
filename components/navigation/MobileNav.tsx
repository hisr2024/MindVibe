'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ToolsSheet } from './ToolsSheet'
import { useLanguage } from '@/hooks/useLanguage'

export interface NavTab {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  isToolsButton?: boolean
}

export interface MobileNavProps {
  /** Optional custom tabs configuration */
  tabs?: NavTab[]
  /** Optional className for styling */
  className?: string
}

// Translation key mapping for tab labels (constant)
const TAB_TRANSLATION_KEYS: Record<string, string> = {
  'kiaan-chat': 'navigation.mobileNav.chat',
  'home': 'navigation.mainNav.home',
  'journal': 'navigation.mobileNav.journal',
  'wisdom': 'navigation.features.wisdomRooms',
  'tools': 'common.buttons.tools',
  'profile': 'navigation.mainNav.profile',
}

// Default navigation tabs
const defaultTabs: NavTab[] = [
  {
    id: 'kiaan-chat',
    label: 'KIAAN Chat',
    href: '/kiaan/chat',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
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
    id: 'journal',
    label: 'Sacred Reflections',
    href: '/sacred-reflections',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
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
    href: '#',
    isToolsButton: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'You',
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
 * - 6 tabs: Chat, Sacred Reflections, Home, Wisdom, Tools, Profile
 * - Icon + label for each tab
 * - Active state indicator
 * - Touch-friendly (min 44x44px touch targets)
 * - Fixed to bottom of viewport
 * - Tools tab opens bottom sheet with all tools
 */
export function MobileNav({ tabs = defaultTabs, className = '' }: MobileNavProps) {
  const pathname = usePathname()
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false)
  const { t } = useLanguage()

  // Get translated label for tab
  const getTabLabel = useMemo(() => {
    return (tabId: string, defaultLabel: string): string => {
      return TAB_TRANSLATION_KEYS[tabId] ? t(TAB_TRANSLATION_KEYS[tabId], defaultLabel) : defaultLabel
    }
  }, [t])

  return (
    <>
      <nav
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-orange-500/20 bg-[#0b0b0f]/98 backdrop-blur-xl md:hidden ${className}`}
        aria-label="Mobile navigation"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around px-1">
          {tabs.map((tab) => {
            const isActive = tab.href !== '#' && (pathname === tab.href || pathname.startsWith(`${tab.href}/`))

            // Tools button opens sheet instead of navigating
            if (tab.isToolsButton) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setToolsSheetOpen(true)}
                  className={`flex min-h-[64px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400 active:scale-95 ${
                    toolsSheetOpen
                      ? 'text-orange-400'
                      : 'text-white/60 hover:text-white/80 active:text-orange-300'
                  }`}
                  aria-expanded={toolsSheetOpen}
                  aria-haspopup="dialog"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                      toolsSheetOpen ? 'bg-orange-500/25 scale-110' : 'hover:bg-white/5'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span
                    className={`text-[11px] leading-tight ${
                      toolsSheetOpen ? 'font-semibold text-orange-400' : 'font-medium'
                    }`}
                  >
                    {getTabLabel(tab.id, tab.label)}
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`relative flex min-h-[64px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400 active:scale-95 ${
                  isActive
                    ? 'text-orange-400'
                    : 'text-white/60 hover:text-white/80 active:text-orange-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-orange-500/25 scale-110' : 'hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                </span>
                <span
                  className={`text-[11px] leading-tight ${
                    isActive ? 'font-semibold text-orange-400' : 'font-medium'
                  }`}
                >
                  {getTabLabel(tab.id, tab.label)}
                </span>
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Tools Bottom Sheet */}
      <ToolsSheet isOpen={toolsSheetOpen} onClose={() => setToolsSheetOpen(false)} />
    </>
  )
}

export default MobileNav
