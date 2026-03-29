'use client'

/**
 * MobileAppShell Component
 *
 * The main container for the mobile app experience. Provides:
 * - Bottom navigation with haptic feedback
 * - Safe area handling for notched devices
 * - Network status awareness
 * - Offline mode banner
 * - Pull-to-refresh via native touch events
 *
 * SCROLL FIX: Uses a plain <main> element instead of motion.main with
 * onPan handlers. Framer Motion's pan gesture intercepts pointer events and
 * blocks native scroll on mobile.
 *
 * PADDING FIX: MobileHeader renders its own spacer div when sticky=true, so
 * we do NOT add paddingTop to <main>. Only paddingBottom is needed for tab bar.
 */

import { forwardRef, ReactNode, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import {
  Bell,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { GopuramIcon } from '@/components/sacred/icons/GopuramIcon'
import { LotusSpeechIcon } from '@/components/sacred/icons/LotusSpeechIcon'
import { ManuscriptIcon } from '@/components/sacred/icons/ManuscriptIcon'
import { ChakraColumnIcon } from '@/components/sacred/icons/ChakraColumnIcon'
import { MeditatorIcon } from '@/components/sacred/icons/MeditatorIcon'

import dynamic from 'next/dynamic'
import { MobileTabBar, TabItem } from './MobileTabBar'
import { MobileHeader, HeaderAction } from './MobileHeader'
import { MobileToolsOverlay } from './MobileToolsOverlay'
import { MobileVibePlayer } from './MobileVibePlayer'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

/**
 * ShankhaVoiceCompanion (Shankha FAB) is loaded dynamically because it
 * is a client-only interactive widget that depends on browser APIs (haptics,
 * Web Speech API, VAD). Lazy-loading prevents SSR issues and keeps initial
 * mobile JS bundle small.
 */
const ShankhaVoiceCompanion = dynamic(
  () => import('@/components/mobile/ShankhaVoiceCompanion').then(mod => mod.ShankhaVoiceCompanion),
  { ssr: false }
)

// Tab configuration — sacred icons for Kiaanverse divine mobile experience
const DEFAULT_TABS: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <GopuramIcon width={22} height={22} />,
    activeIcon: <GopuramIcon width={22} height={22} />,
  },
  {
    id: 'kiaan',
    label: 'Chat',
    icon: <LotusSpeechIcon width={22} height={22} />,
    activeIcon: <LotusSpeechIcon width={22} height={22} />,
  },
  {
    id: 'tools',
    label: 'Shlokas',
    icon: <ManuscriptIcon width={22} height={22} />,
    activeIcon: <ManuscriptIcon width={22} height={22} />,
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: <ChakraColumnIcon width={22} height={22} />,
    activeIcon: <ChakraColumnIcon width={22} height={22} />,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <MeditatorIcon width={22} height={22} />,
    activeIcon: <MeditatorIcon width={22} height={22} />,
  },
]

// Route mapping for navigation — "tools" tab is handled via overlay, not a route
const TAB_ROUTES: Record<string, string> = {
  home: '/m',
  kiaan: '/m/kiaan',
  journal: '/m/journal',
  profile: '/m/profile',
}

// Reverse mapping for determining active tab from route
const ROUTE_TO_TAB: Record<string, string> = {
  '/m': 'home',
  '/m/kiaan': 'kiaan',
  '/m/companion': 'kiaan',
  '/m/journal': 'journal',
  '/m/profile': 'profile',
  '/m/tools': 'tools',
  '/m/journeys': 'tools',
  '/m/wisdom': 'home',
  '/m/wisdom-rooms': 'home',
}

export interface MobileAppShellProps {
  children: ReactNode
  tabs?: TabItem[]
  title?: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  rightActions?: ReactNode
  showHeader?: boolean
  showTabBar?: boolean
  largeTitle?: boolean
  transparentHeader?: boolean
  hideHeaderOnScroll?: boolean
  enablePullToRefresh?: boolean
  onRefresh?: () => Promise<void>
  className?: string
}

export const MobileAppShell = forwardRef<HTMLDivElement, MobileAppShellProps>(
  function MobileAppShell(
    {
      children,
      tabs = DEFAULT_TABS,
      title,
      subtitle,
      showBack = false,
      onBack,
      rightActions,
      showHeader = true,
      showTabBar = true,
      largeTitle = false,
      transparentHeader = false,
      hideHeaderOnScroll = false,
      enablePullToRefresh = false,
      onRefresh,
      className = '',
    },
    ref
  ) {
    const router = useRouter()
    const pathname = usePathname()
    const { triggerHaptic } = useHapticFeedback()
    const { isOnline, connectionType } = useNetworkStatus()

    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showOfflineBanner, setShowOfflineBanner] = useState(false)
    const [isToolsOverlayOpen, setIsToolsOverlayOpen] = useState(false)

    // Determine active tab from current route
    const activeTab = useMemo(() => {
      if (ROUTE_TO_TAB[pathname]) {
        return ROUTE_TO_TAB[pathname]
      }
      for (const [route, tab] of Object.entries(ROUTE_TO_TAB)) {
        if (pathname.startsWith(route) && route !== '/m') {
          return tab
        }
      }
      return 'home'
    }, [pathname])

    // Handle tab change — "tools" tab opens overlay instead of navigating
    const handleTabChange = useCallback((tabId: string) => {
      if (tabId === 'tools') {
        triggerHaptic('selection')
        setIsToolsOverlayOpen(true)
        return
      }
      const route = TAB_ROUTES[tabId]
      if (route && route !== pathname) {
        triggerHaptic('selection')
        router.push(route)
      }
    }, [pathname, router, triggerHaptic])

    // Handle back navigation
    const handleBack = useCallback(() => {
      triggerHaptic('light')
      if (onBack) {
        onBack()
      } else {
        router.back()
      }
    }, [onBack, router, triggerHaptic])

    // Show offline banner when network status changes
    useEffect(() => {
      if (!isOnline) {
        setShowOfflineBanner(true)
      } else {
        const timer = setTimeout(() => setShowOfflineBanner(false), 2000)
        return () => clearTimeout(timer)
      }
    }, [isOnline])

    // Pull progress for visual indicator
    const [pullProgress, setPullProgress] = useState(0)

    // Pull-to-refresh via native touch events (NOT Framer onPan which kills scroll)
    useEffect(() => {
      if (!enablePullToRefresh || !onRefresh) return

      let startY = 0
      let pulling = false
      const PULL_THRESHOLD = 80

      const onTouchStart = (e: TouchEvent) => {
        if (window.scrollY <= 0) {
          startY = e.touches[0].clientY
        }
      }

      const onTouchMove = (e: TouchEvent) => {
        if (window.scrollY > 0) {
          setPullProgress(0)
          return
        }
        const diff = e.touches[0].clientY - startY
        if (diff > 0 && !isRefreshing) {
          const progress = Math.min(diff / PULL_THRESHOLD, 1)
          setPullProgress(progress)
          if (diff > PULL_THRESHOLD && !pulling) {
            pulling = true
            triggerHaptic('selection')
          }
        }
      }

      const onTouchEnd = async () => {
        setPullProgress(0)
        if (pulling && !isRefreshing) {
          pulling = false
          setIsRefreshing(true)
          triggerHaptic('medium')
          try {
            await onRefresh()
          } finally {
            setIsRefreshing(false)
          }
        }
        pulling = false
      }

      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchmove', onTouchMove, { passive: true })
      window.addEventListener('touchend', onTouchEnd, { passive: true })

      return () => {
        window.removeEventListener('touchstart', onTouchStart)
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('touchend', onTouchEnd)
      }
    }, [enablePullToRefresh, onRefresh, isRefreshing, triggerHaptic])

    return (
      <div
        ref={ref}
        className={`mobile-app-root bg-[var(--sacred-cosmic-void,#050714)] text-white min-h-[100dvh] flex flex-col ${className}`.trim()}
      >
        {/* Offline Banner */}
        <AnimatePresence>
          {showOfflineBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`
                fixed top-0 left-0 right-0 z-[100]
                ${isOnline ? 'bg-green-500' : 'bg-[var(--sacred-divine-gold)]'}
              `}
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>Back online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>You&apos;re offline - Some features may be limited</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header — MobileHeader is position:fixed and renders its own spacer div */}
        {showHeader && (
          <MobileHeader
            title={title}
            subtitle={subtitle}
            showBack={showBack}
            onBack={handleBack}
            largeTitle={largeTitle}
            transparent={transparentHeader}
            hideOnScroll={hideHeaderOnScroll}
            rightActions={
              <>
                {rightActions}
                <HeaderAction
                  icon={<Bell className="w-5 h-5" />}
                  aria-label="Notifications"
                  onClick={() => router.push('/m/notifications')}
                />
              </>
            }
          />
        )}

        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {(isRefreshing || pullProgress > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              style={{ top: showHeader ? (largeTitle ? 108 : 64) : 8 }}
            >
              <div className="w-9 h-9 rounded-full bg-[var(--sacred-yamuna-mid)]/90 border border-[var(--sacred-divine-gold)]/20 flex items-center justify-center shadow-lg shadow-black/20">
                {isRefreshing ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-[var(--sacred-divine-gold)] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" className="text-[var(--sacred-divine-gold)]">
                    <circle
                      cx="10"
                      cy="10"
                      r="7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${pullProgress * 44} 44`}
                      transform="rotate(-90 10 10)"
                      opacity={pullProgress}
                    />
                  </svg>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          Main Content Area
          - NO paddingTop: MobileHeader already renders a spacer <div>.
          - paddingBottom: accounts for the fixed bottom tab bar + safe area.
          - Plain <main> instead of motion.main: onPan blocks native scroll.
          - NO AnimatePresence keyed on pathname: causes scroll-killing remounts.
        */}
        <main
          className="relative flex-1 flex flex-col min-h-0"
          style={{
            paddingBottom: showTabBar
              ? 'calc(80px + env(safe-area-inset-bottom, 0px))'
              : undefined,
          }}
        >
          {children}
        </main>

        {/* Bottom Tab Bar */}
        {showTabBar && (
          <MobileTabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="default"
            showLabels={true}
          />
        )}

        {/* Network quality indicator (for slow connections) */}
        {isOnline && connectionType && ['slow-2g', '2g'].includes(connectionType) && (
          <div className="fixed bottom-20 left-4 right-4 z-40">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/90 text-black text-xs font-medium py-2 px-4 rounded-lg text-center"
            >
              Slow connection detected - Content may load slowly
            </motion.div>
          </div>
        )}

        {/* KIAAN Vibe floating player — visible across all mobile pages */}
        {showTabBar && <MobileVibePlayer />}

        {/* Shankha Voice Companion — KIAAN's always-awake voice assistant with
            wake word detection, Gita wisdom, and ecosystem navigation */}
        <ShankhaVoiceCompanion />


        {/* Tools overlay — slides up from bottom with spiritual wellness tools */}
        <MobileToolsOverlay
          isOpen={isToolsOverlayOpen}
          onClose={() => setIsToolsOverlayOpen(false)}
        />
      </div>
    )
  }
)

/**
 * Mobile page wrapper for consistent page structure
 */
export interface MobilePageProps {
  children: ReactNode
  title?: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  rightActions?: ReactNode
  largeTitle?: boolean
  transparentHeader?: boolean
  hideHeaderOnScroll?: boolean
  enablePullToRefresh?: boolean
  onRefresh?: () => Promise<void>
  showTabBar?: boolean
  className?: string
}

export function MobilePage({
  children,
  title,
  subtitle,
  showBack,
  onBack,
  rightActions,
  largeTitle,
  transparentHeader,
  hideHeaderOnScroll,
  enablePullToRefresh,
  onRefresh,
  showTabBar = true,
  className,
}: MobilePageProps) {
  return (
    <MobileAppShell
      title={title}
      subtitle={subtitle}
      showBack={showBack}
      onBack={onBack}
      rightActions={rightActions}
      largeTitle={largeTitle}
      transparentHeader={transparentHeader}
      hideHeaderOnScroll={hideHeaderOnScroll}
      enablePullToRefresh={enablePullToRefresh}
      onRefresh={onRefresh}
      showTabBar={showTabBar}
      className={className}
    >
      {children}
    </MobileAppShell>
  )
}

export default MobileAppShell
