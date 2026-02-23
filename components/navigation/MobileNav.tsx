'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ToolsSheet } from './ToolsSheet'
import { useLanguage } from '@/hooks/useLanguage'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useUISound } from '@/hooks/useUISound'

export interface NavTab {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  isToolsButton?: boolean
  isHighlighted?: boolean
}

export interface MobileNavProps {
  /** Optional custom tabs configuration */
  tabs?: NavTab[]
  /** Optional className for styling */
  className?: string
}

// Translation key mapping for tab labels (constant)
const TAB_TRANSLATION_KEYS: Record<string, string> = {
  'introduction': 'navigation.mainNav.introduction',
  'kiaan-chat': 'navigation.mobileNav.chat',
  'home': 'navigation.mainNav.home',
  'journal': 'navigation.mobileNav.journal',
  'wisdom': 'navigation.features.wisdomRooms',
  'tools': 'common.buttons.tools',
  'profile': 'navigation.mainNav.profile',
}

// Default navigation tabs - Optimized for mobile (5 tabs max for usability)
const defaultTabs: NavTab[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'journal',
    label: 'Journal',
    href: '/sacred-reflections',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    id: 'kiaan-chat',
    label: 'KIAAN',
    href: '/kiaan/chat',
    isHighlighted: true,
    icon: (
      <span className="text-xl font-black">K</span>
    ),
  },
  {
    id: 'tools',
    label: 'Tools',
    href: '#',
    isToolsButton: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

// Animation variants for polished interactions
const navItemVariants = {
  rest: { scale: 1 },
  pressed: { scale: 0.92 },
  hover: { scale: 1.02 },
}

const activeIndicatorVariants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    }
  },
  exit: {
    scaleX: 0,
    opacity: 0,
    transition: { duration: 0.15 }
  },
}

const iconGlowVariants = {
  inactive: {
    scale: 1,
    boxShadow: '0 0 0 rgba(212, 164, 76, 0)',
  },
  active: {
    scale: 1.1,
    boxShadow: '0 0 20px rgba(212, 164, 76, 0.35)',
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    }
  },
}

/**
 * MobileNav component for bottom tab navigation on mobile devices.
 *
 * Features:
 * - Premium polished animations with Framer Motion
 * - Haptic feedback on interactions
 * - Smooth spring-based transitions
 * - Active state with glow effects
 * - Touch-friendly (min 44x44px touch targets)
 * - Fixed to bottom of viewport with safe area support
 */
export function MobileNav({ tabs = defaultTabs, className = '' }: MobileNavProps) {
  const pathname = usePathname()
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false)
  const { t } = useLanguage()
  const { triggerHaptic } = useHapticFeedback()
  const { playSound } = useUISound()

  // Get translated label for tab
  const getTabLabel = useMemo(() => {
    return (tabId: string, defaultLabel: string): string => {
      return TAB_TRANSLATION_KEYS[tabId] ? t(TAB_TRANSLATION_KEYS[tabId], defaultLabel) : defaultLabel
    }
  }, [t])

  // Handle tab press with haptic feedback AND SOUND
  const handleTabPress = useCallback((isActive: boolean, tabId: string) => {
    if (!isActive) {
      triggerHaptic('light')
      // Play different sounds based on tab
      if (tabId === 'kiaan-chat') {
        playSound('notification')  // Special sound for KIAAN
      } else {
        playSound('click')  // Standard navigation click
      }
    }
  }, [triggerHaptic, playSound])

  // Handle tools button press with sound
  const handleToolsPress = useCallback(() => {
    triggerHaptic('medium')
    playSound('open')  // Play open sound for tools sheet
    setToolsSheetOpen(true)
  }, [triggerHaptic, playSound])

  return (
    <>
      <motion.nav
        className={`fixed inset-x-0 bottom-0 z-50 md:hidden ${className}`}
        aria-label="Mobile navigation"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          delay: 0.1,
        }}
        style={{
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }}
      >
        {/* Gradient fade overlay for content behind nav */}
        <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-[#0b0b0f] to-transparent pointer-events-none" />

        {/* Main nav container with glass effect - Enhanced mobile UX */}
        <div
          className="relative border-t border-white/10 bg-[#0a0a0e]/98 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Subtle top glow line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/40 to-transparent" />

          <div className="flex items-stretch justify-evenly px-2">
            {tabs.map((tab) => {
              const isActive = tab.href !== '#' && (pathname === tab.href || pathname.startsWith(`${tab.href}/`))

              // Tools button opens sheet instead of navigating
              if (tab.isToolsButton) {
                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    onClick={handleToolsPress}
                    variants={navItemVariants}
                    initial="rest"
                    whileTap="pressed"
                    whileHover="hover"
                    className={`relative flex min-h-[68px] min-w-[60px] flex-1 flex-col items-center justify-center gap-1.5 py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d4a44c]/60 ${
                      toolsSheetOpen
                        ? 'text-[#d4a44c]'
                        : 'text-white/50'
                    }`}
                    aria-expanded={toolsSheetOpen}
                    aria-haspopup="dialog"
                  >
                    <motion.span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
                        toolsSheetOpen ? 'bg-[#d4a44c]/20 text-[#d4a44c]' : 'bg-white/5'
                      }`}
                      variants={iconGlowVariants}
                      animate={toolsSheetOpen ? 'active' : 'inactive'}
                    >
                      {tab.icon}
                    </motion.span>
                    <span
                      className={`text-[11px] leading-tight ${
                        toolsSheetOpen ? 'font-bold text-[#d4a44c]' : 'font-medium text-white/50'
                      }`}
                    >
                      {getTabLabel(tab.id, tab.label)}
                    </span>
                  </motion.button>
                )
              }

              // Special styling for KIAAN (highlighted central tab)
              if (tab.isHighlighted) {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={() => handleTabPress(isActive, tab.id)}
                    className="relative flex min-h-[68px] min-w-[70px] flex-col items-center justify-center gap-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d4a44c]/60 -mt-4"
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <motion.div
                      variants={navItemVariants}
                      initial="rest"
                      whileTap="pressed"
                      whileHover="hover"
                      className="flex flex-col items-center gap-1"
                    >
                      {/* Highlighted KIAAN button - Prominent floating design */}
                      <motion.span
                        className="relative flex h-14 w-14 items-center justify-center rounded-full text-[#0a0a0f] shadow-xl border-4 border-[#0a0a0e]"
                        style={{ background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 50%, #f0c96d 100%)' }}
                        animate={{
                          boxShadow: isActive
                            ? [
                                '0 6px 24px rgba(212, 164, 76, 0.4)',
                                '0 6px 32px rgba(212, 164, 76, 0.6)',
                                '0 6px 24px rgba(212, 164, 76, 0.4)',
                              ]
                            : '0 6px 20px rgba(212, 164, 76, 0.35)',
                          scale: isActive ? 1.08 : 1,
                        }}
                        transition={{
                          boxShadow: {
                            duration: 2,
                            repeat: isActive ? Infinity : 0,
                            ease: 'easeInOut',
                          },
                          scale: {
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          },
                        }}
                      >
                        {/* Inner ring glow */}
                        <motion.span
                          className="absolute inset-0 rounded-full"
                          animate={{
                            boxShadow: isActive
                              ? 'inset 0 0 14px rgba(255, 255, 255, 0.35)'
                              : 'inset 0 0 10px rgba(255, 255, 255, 0.25)',
                          }}
                        />
                        {tab.icon}
                      </motion.span>
                      <span
                        className={`text-[11px] leading-tight font-bold ${
                          isActive ? 'text-[#d4a44c]' : 'text-[#d4a44c]/80'
                        }`}
                      >
                        {getTabLabel(tab.id, tab.label)}
                      </span>
                    </motion.div>
                  </Link>
                )
              }

              // Regular tab item - Enhanced mobile UX
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => handleTabPress(isActive, tab.id)}
                  className="relative flex min-h-[68px] min-w-[60px] flex-1 flex-col items-center justify-center gap-1.5 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d4a44c]/60"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <motion.div
                    variants={navItemVariants}
                    initial="rest"
                    whileTap="pressed"
                    whileHover="hover"
                    className="flex flex-col items-center gap-1.5"
                  >
                    <motion.span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
                        isActive ? 'text-[#d4a44c] bg-[#d4a44c]/15' : 'text-white/50 bg-white/5'
                      }`}
                      variants={iconGlowVariants}
                      animate={isActive ? 'active' : 'inactive'}
                    >
                      {tab.icon}
                    </motion.span>
                    <span
                      className={`text-[11px] leading-tight ${
                        isActive ? 'font-bold text-[#d4a44c]' : 'font-medium text-white/50'
                      }`}
                    >
                      {getTabLabel(tab.id, tab.label)}
                    </span>
                  </motion.div>

                  {/* Active indicator bar */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        className="absolute bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#c8943a] to-[#e8b54a] shadow-[0_0_12px_rgba(212,164,76,0.5)]"
                        variants={activeIndicatorVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      />
                    )}
                  </AnimatePresence>
                </Link>
              )
            })}
          </div>
        </div>
      </motion.nav>

      {/* Tools Bottom Sheet */}
      <ToolsSheet isOpen={toolsSheetOpen} onClose={() => {
        playSound('close')  // Play close sound
        setToolsSheetOpen(false)
      }} />
    </>
  )
}

export default MobileNav
