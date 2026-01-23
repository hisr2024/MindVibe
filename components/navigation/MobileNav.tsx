'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ToolsSheet } from './ToolsSheet'
import { useLanguage } from '@/hooks/useLanguage'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

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

// Default navigation tabs
const defaultTabs: NavTab[] = [
  {
    id: 'introduction',
    label: 'Introduction',
    href: '/introduction',
    icon: (
      <span className="text-lg">🙏</span>
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
    id: 'kiaan-chat',
    label: 'KIAAN',
    href: '/kiaan/chat',
    isHighlighted: true,
    icon: (
      <span className="text-lg font-bold">K</span>
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
    boxShadow: '0 0 0 rgba(255, 145, 89, 0)',
  },
  active: {
    scale: 1.1,
    boxShadow: '0 0 20px rgba(255, 145, 89, 0.4)',
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

  // Get translated label for tab
  const getTabLabel = useMemo(() => {
    return (tabId: string, defaultLabel: string): string => {
      return TAB_TRANSLATION_KEYS[tabId] ? t(TAB_TRANSLATION_KEYS[tabId], defaultLabel) : defaultLabel
    }
  }, [t])

  // Handle tab press with haptic feedback
  const handleTabPress = useCallback((isActive: boolean) => {
    if (!isActive) {
      triggerHaptic('light')
    }
  }, [triggerHaptic])

  // Handle tools button press
  const handleToolsPress = useCallback(() => {
    triggerHaptic('medium')
    setToolsSheetOpen(true)
  }, [triggerHaptic])

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

        {/* Main nav container with glass effect */}
        <div
          className="relative border-t border-orange-500/20 bg-[#0b0b0f]/95 backdrop-blur-xl shadow-mobile-nav"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Subtle top glow line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

          <div className="flex items-stretch justify-around px-1">
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
                    className={`relative flex min-h-[64px] min-w-[48px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400 ${
                      toolsSheetOpen
                        ? 'text-orange-400'
                        : 'text-white/60'
                    }`}
                    aria-expanded={toolsSheetOpen}
                    aria-haspopup="dialog"
                  >
                    <motion.span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ${
                        toolsSheetOpen ? 'bg-orange-500/20' : ''
                      }`}
                      variants={iconGlowVariants}
                      animate={toolsSheetOpen ? 'active' : 'inactive'}
                    >
                      {tab.icon}
                    </motion.span>
                    <span
                      className={`text-[10px] leading-tight tracking-wide ${
                        toolsSheetOpen ? 'font-semibold text-orange-400' : 'font-medium'
                      }`}
                    >
                      {getTabLabel(tab.id, tab.label)}
                    </span>
                  </motion.button>
                )
              }

              // Special styling for KIAAN (highlighted tab)
              if (tab.isHighlighted) {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={() => handleTabPress(isActive)}
                    className="relative flex min-h-[64px] min-w-[48px] flex-1 flex-col items-center justify-center gap-1 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400"
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <motion.div
                      variants={navItemVariants}
                      initial="rest"
                      whileTap="pressed"
                      whileHover="hover"
                      className="flex flex-col items-center gap-1"
                    >
                      {/* Highlighted KIAAN button with pulsing glow */}
                      <motion.span
                        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 text-white shadow-lg"
                        animate={{
                          boxShadow: isActive
                            ? [
                                '0 4px 20px rgba(255, 145, 89, 0.5)',
                                '0 4px 30px rgba(255, 145, 89, 0.7)',
                                '0 4px 20px rgba(255, 145, 89, 0.5)',
                              ]
                            : '0 4px 16px rgba(255, 145, 89, 0.4)',
                          scale: isActive ? 1.05 : 1,
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
                              ? 'inset 0 0 12px rgba(255, 255, 255, 0.3)'
                              : 'inset 0 0 8px rgba(255, 255, 255, 0.2)',
                          }}
                        />
                        {tab.icon}
                      </motion.span>
                      <span
                        className={`text-[10px] leading-tight tracking-wide font-semibold ${
                          isActive ? 'text-orange-400' : 'text-orange-300/80'
                        }`}
                      >
                        {getTabLabel(tab.id, tab.label)}
                      </span>
                    </motion.div>

                    {/* Active indicator dot */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          className="absolute bottom-1 left-1/2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 shadow-[0_0_8px_rgba(255,145,89,0.6)]"
                          initial={{ scale: 0, x: '-50%' }}
                          animate={{ scale: 1, x: '-50%' }}
                          exit={{ scale: 0, x: '-50%' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        />
                      )}
                    </AnimatePresence>
                  </Link>
                )
              }

              // Regular tab item
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={() => handleTabPress(isActive)}
                  className="relative flex min-h-[64px] min-w-[48px] flex-1 flex-col items-center justify-center gap-1 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <motion.div
                    variants={navItemVariants}
                    initial="rest"
                    whileTap="pressed"
                    whileHover="hover"
                    className="flex flex-col items-center gap-1"
                  >
                    <motion.span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ${
                        isActive ? 'text-orange-400' : 'text-white/60'
                      }`}
                      variants={iconGlowVariants}
                      animate={isActive ? 'active' : 'inactive'}
                      style={{
                        backgroundColor: isActive ? 'rgba(255, 145, 89, 0.15)' : 'transparent',
                      }}
                    >
                      {tab.icon}
                    </motion.span>
                    <span
                      className={`text-[10px] leading-tight tracking-wide ${
                        isActive ? 'font-semibold text-orange-400' : 'font-medium text-white/60'
                      }`}
                    >
                      {getTabLabel(tab.id, tab.label)}
                    </span>
                  </motion.div>

                  {/* Active indicator bar */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        className="absolute bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 shadow-[0_0_10px_rgba(255,145,89,0.5)]"
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
      <ToolsSheet isOpen={toolsSheetOpen} onClose={() => setToolsSheetOpen(false)} />
    </>
  )
}

export default MobileNav
