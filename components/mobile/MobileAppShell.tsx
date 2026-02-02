'use client'

/**
 * MobileAppShell Component
 *
 * The main container for the mobile app experience. Provides:
 * - Bottom navigation with haptic feedback
 * - Safe area handling for notched devices
 * - Smooth page transitions
 * - Network status awareness
 * - Offline mode banner
 * - Pull-to-refresh support
 *
 * @example
 * <MobileAppShell activeTab="home" onTabChange={handleTabChange}>
 *   <HomeContent />
 * </MobileAppShell>
 */

import { forwardRef, ReactNode, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home,
  MessageCircle,
  BookOpen,
  Heart,
  User,
  Sparkles,
  Compass,
  PenLine,
  Settings,
  Bell,
  Wifi,
  WifiOff,
} from 'lucide-react'

import { MobileTabBar, TabItem } from './MobileTabBar'
import { MobileHeader, HeaderAction } from './MobileHeader'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useAuth } from '@/hooks/useAuth'

// Tab configuration for the app
const DEFAULT_TABS: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
    activeIcon: <Home className="w-5 h-5 fill-current" />,
  },
  {
    id: 'kiaan',
    label: 'KIAAN',
    icon: <Sparkles className="w-5 h-5" />,
    activeIcon: <Sparkles className="w-5 h-5 fill-current" />,
  },
  {
    id: 'journeys',
    label: 'Journeys',
    icon: <Compass className="w-5 h-5" />,
    activeIcon: <Compass className="w-5 h-5 fill-current" />,
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: <PenLine className="w-5 h-5" />,
    activeIcon: <PenLine className="w-5 h-5 fill-current" />,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="w-5 h-5" />,
    activeIcon: <User className="w-5 h-5 fill-current" />,
  },
]

// Route mapping for navigation
const TAB_ROUTES: Record<string, string> = {
  home: '/m',
  kiaan: '/m/kiaan',
  journeys: '/m/journeys',
  journal: '/m/journal',
  profile: '/m/profile',
}

// Reverse mapping for determining active tab from route
const ROUTE_TO_TAB: Record<string, string> = {
  '/m': 'home',
  '/m/kiaan': 'kiaan',
  '/m/journeys': 'journeys',
  '/m/journal': 'journal',
  '/m/profile': 'profile',
}

export interface MobileAppShellProps {
  /** Child content to render */
  children: ReactNode
  /** Custom tab configuration */
  tabs?: TabItem[]
  /** Header title */
  title?: string
  /** Header subtitle */
  subtitle?: string
  /** Show back button */
  showBack?: boolean
  /** Back button handler */
  onBack?: () => void
  /** Right header actions */
  rightActions?: ReactNode
  /** Show header */
  showHeader?: boolean
  /** Show tab bar */
  showTabBar?: boolean
  /** Large title mode (iOS-style) */
  largeTitle?: boolean
  /** Transparent header initially */
  transparentHeader?: boolean
  /** Hide header on scroll */
  hideHeaderOnScroll?: boolean
  /** Enable pull-to-refresh */
  enablePullToRefresh?: boolean
  /** Pull-to-refresh handler */
  onRefresh?: () => Promise<void>
  /** Custom className */
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
    const { isOnline, effectiveType } = useNetworkStatus()
    const { user, isAuthenticated } = useAuth()

    const [isRefreshing, setIsRefreshing] = useState(false)
    const [pullDistance, setPullDistance] = useState(0)
    const [showOfflineBanner, setShowOfflineBanner] = useState(false)

    // Determine active tab from current route
    const activeTab = useMemo(() => {
      // Check for exact match first
      if (ROUTE_TO_TAB[pathname]) {
        return ROUTE_TO_TAB[pathname]
      }
      // Check for prefix match (for nested routes)
      for (const [route, tab] of Object.entries(ROUTE_TO_TAB)) {
        if (pathname.startsWith(route) && route !== '/m') {
          return tab
        }
      }
      return 'home'
    }, [pathname])

    // Handle tab change
    const handleTabChange = useCallback((tabId: string) => {
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
        // Delay hiding to show "Back online" message
        const timer = setTimeout(() => setShowOfflineBanner(false), 2000)
        return () => clearTimeout(timer)
      }
    }, [isOnline])

    // Pull-to-refresh handler
    const handlePan = useCallback((event: PointerEvent, info: PanInfo) => {
      if (!enablePullToRefresh || isRefreshing) return

      const scrollTop = window.scrollY || document.documentElement.scrollTop
      if (scrollTop > 0) return

      const distance = Math.max(0, Math.min(info.offset.y, 150))
      setPullDistance(distance)
    }, [enablePullToRefresh, isRefreshing])

    const handlePanEnd = useCallback(async (event: PointerEvent, info: PanInfo) => {
      if (!enablePullToRefresh || isRefreshing) return

      if (pullDistance > 80 && onRefresh) {
        setIsRefreshing(true)
        triggerHaptic('medium')

        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }
    }, [enablePullToRefresh, isRefreshing, pullDistance, onRefresh, triggerHaptic])

    // Calculate content padding based on visible elements
    const contentPadding = useMemo(() => {
      let paddingTop = 0
      let paddingBottom = 0

      if (showHeader) {
        paddingTop = largeTitle ? 100 : 56
      }

      if (showTabBar) {
        paddingBottom = 80 // Tab bar height + safe area
      }

      return { paddingTop, paddingBottom }
    }, [showHeader, showTabBar, largeTitle])

    return (
      <div
        ref={ref}
        className={`
          min-h-screen
          bg-[#0b0b0f]
          text-white
          ${className}
        `}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
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
                ${isOnline ? 'bg-green-500' : 'bg-orange-500'}
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

        {/* Header */}
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
        {enablePullToRefresh && (
          <motion.div
            className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none"
            style={{
              top: showHeader ? (largeTitle ? 100 : 56) + 8 : 8,
            }}
            animate={{
              y: pullDistance > 0 ? pullDistance - 40 : -40,
              opacity: pullDistance > 40 ? 1 : 0,
              rotate: isRefreshing ? 360 : (pullDistance / 80) * 180,
            }}
            transition={{
              rotate: isRefreshing
                ? { duration: 1, repeat: Infinity, ease: 'linear' }
                : { duration: 0 },
            }}
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <motion.div
                className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Main Content Area */}
        <motion.main
          className="relative min-h-screen"
          style={{
            paddingTop: contentPadding.paddingTop,
            paddingBottom: contentPadding.paddingBottom,
          }}
          onPan={handlePan as any}
          onPanEnd={handlePanEnd as any}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.main>

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
        {isOnline && effectiveType && ['slow-2g', '2g'].includes(effectiveType) && (
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
