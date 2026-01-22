'use client'

import { forwardRef, ReactNode, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

export interface TabItem {
  id: string
  label: string
  icon: ReactNode
  activeIcon?: ReactNode
  badge?: number | boolean
  disabled?: boolean
}

export interface MobileTabBarProps {
  /** Tab items */
  tabs: TabItem[]
  /** Currently active tab id */
  activeTab: string
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void
  /** Position of the tab bar */
  position?: 'bottom' | 'top'
  /** Variant style */
  variant?: 'default' | 'floating' | 'pill'
  /** Whether to show labels */
  showLabels?: boolean
  /** Hide on scroll down */
  hideOnScroll?: boolean
  /** Scroll container ref */
  scrollContainerRef?: React.RefObject<HTMLElement>
  /** Custom className */
  className?: string
  /** Z-index */
  zIndex?: number
}

export const MobileTabBar = forwardRef<HTMLElement, MobileTabBarProps>(
  function MobileTabBar(
    {
      tabs,
      activeTab,
      onTabChange,
      position = 'bottom',
      variant = 'default',
      showLabels = true,
      hideOnScroll = false,
      scrollContainerRef,
      className = '',
      zIndex = 50,
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()
    const [isHidden, setIsHidden] = useState(false)
    const lastScrollY = { current: 0 }

    // Hide on scroll behavior
    useEffect(() => {
      if (!hideOnScroll) return

      const container = scrollContainerRef?.current || window
      const handleScroll = () => {
        const scrollY = scrollContainerRef?.current
          ? scrollContainerRef.current.scrollTop
          : window.scrollY

        const isScrollingDown = scrollY > lastScrollY.current
        const scrollDelta = Math.abs(scrollY - lastScrollY.current)

        if (scrollDelta > 10) {
          if (isScrollingDown && scrollY > 100) {
            setIsHidden(true)
          } else if (!isScrollingDown) {
            setIsHidden(false)
          }
        }

        lastScrollY.current = scrollY
      }

      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => container.removeEventListener('scroll', handleScroll)
    }, [hideOnScroll, scrollContainerRef])

    const handleTabPress = useCallback(
      (tabId: string, disabled?: boolean) => {
        if (disabled) return
        if (tabId === activeTab) {
          // Double tap on active tab - trigger special feedback
          triggerHaptic('selection')
          return
        }
        triggerHaptic('light')
        onTabChange(tabId)
      },
      [activeTab, onTabChange, triggerHaptic]
    )

    // Find active tab index for indicator
    const activeIndex = tabs.findIndex((t) => t.id === activeTab)

    // Variant styles
    const containerStyles = {
      default: `
        bg-[#0b0b0f]/95 backdrop-blur-xl
        border-t border-white/[0.06]
      `,
      floating: `
        mx-4 mb-4 rounded-2xl
        bg-[#1a2133]/95 backdrop-blur-xl
        border border-white/[0.08]
        shadow-2xl shadow-black/40
      `,
      pill: `
        mx-4 mb-4 rounded-full
        bg-[#1a2133]/95 backdrop-blur-xl
        border border-white/[0.08]
        shadow-xl shadow-black/30
      `,
    }

    const positionStyles = {
      bottom: position === 'bottom' ? 'bottom-0' : 'top-0',
      safeArea:
        position === 'bottom'
          ? 'pb-[env(safe-area-inset-bottom,0px)]'
          : 'pt-[env(safe-area-inset-top,0px)]',
    }

    return (
      <motion.nav
        ref={ref as React.Ref<HTMLElement>}
        initial={false}
        animate={{
          y: isHidden ? (position === 'bottom' ? 100 : -100) : 0,
          opacity: isHidden ? 0 : 1,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`
          fixed left-0 right-0
          ${positionStyles.bottom}
          ${variant === 'default' ? positionStyles.safeArea : ''}
          ${containerStyles[variant]}
          ${className}
        `.trim()}
        style={{ zIndex }}
        role="tablist"
        aria-label="Main navigation"
      >
        <div className="relative flex items-center justify-around h-16 px-2">
          {/* Active indicator (background pill) */}
          {variant !== 'pill' && (
            <motion.div
              className="
                absolute h-10 rounded-xl
                bg-orange-500/10
                pointer-events-none
              "
              layoutId="activeTabIndicator"
              initial={false}
              animate={{
                x: `calc(${activeIndex * 100}% + ${activeIndex * 8}px)`,
                width: `calc(${100 / tabs.length}% - 8px)`,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                left: 4,
              }}
            />
          )}

          {/* Tab items */}
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleTabPress(tab.id, tab.disabled)}
                disabled={tab.disabled}
                className={`
                  relative flex-1 h-full
                  flex flex-col items-center justify-center gap-1
                  transition-colors duration-200
                  ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                `}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                tabIndex={isActive ? 0 : -1}
              >
                {/* Icon */}
                <motion.span
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? '#ff9159' : '#94a3b8',
                  }}
                  transition={{ type: 'spring', stiffness: 500 }}
                  className="relative"
                >
                  {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}

                  {/* Badge */}
                  {tab.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="
                        absolute -top-1 -right-1
                        min-w-4 h-4 px-1
                        rounded-full
                        bg-red-500 text-white text-[10px] font-bold
                        flex items-center justify-center
                      "
                    >
                      {typeof tab.badge === 'number'
                        ? tab.badge > 99
                          ? '99+'
                          : tab.badge
                        : ''}
                    </motion.span>
                  )}
                </motion.span>

                {/* Label */}
                {showLabels && (
                  <motion.span
                    animate={{
                      color: isActive ? '#ff9159' : '#64748b',
                      fontWeight: isActive ? 600 : 500,
                    }}
                    className="text-[10px] leading-tight"
                  >
                    {tab.label}
                  </motion.span>
                )}

                {/* Active dot indicator */}
                {variant === 'pill' && isActive && (
                  <motion.div
                    layoutId="activeDot"
                    className="
                      absolute -bottom-0.5
                      w-1 h-1 rounded-full
                      bg-orange-500
                    "
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Top glow for floating/pill variants */}
        {variant !== 'default' && (
          <div className="
            absolute -top-8 left-1/2 -translate-x-1/2
            w-1/2 h-8
            bg-gradient-to-t from-orange-500/10 to-transparent
            pointer-events-none rounded-t-full
          " />
        )}
      </motion.nav>
    )
  }
)

/**
 * Segmented control for inline tab switching
 */
export interface SegmentedControlProps {
  segments: { id: string; label: string }[]
  activeSegment: string
  onChange: (segmentId: string) => void
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

export function SegmentedControl({
  segments,
  activeSegment,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps) {
  const { triggerHaptic } = useHapticFeedback()
  const activeIndex = segments.findIndex((s) => s.id === activeSegment)

  const sizeStyles = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  }

  return (
    <div
      className={`
        relative inline-flex
        bg-white/[0.04] rounded-xl p-1
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      role="tablist"
    >
      {/* Active background */}
      <motion.div
        className="
          absolute top-1 bottom-1
          bg-white/[0.1] rounded-lg
        "
        layoutId="segmentIndicator"
        initial={false}
        animate={{
          left: `calc(${(activeIndex / segments.length) * 100}% + 4px)`,
          width: `calc(${100 / segments.length}% - 8px)`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      {segments.map((segment) => {
        const isActive = segment.id === activeSegment

        return (
          <button
            key={segment.id}
            onClick={() => {
              if (!isActive) {
                triggerHaptic('selection')
                onChange(segment.id)
              }
            }}
            className={`
              relative flex-1 px-4
              flex items-center justify-center
              rounded-lg
              font-medium
              transition-colors duration-200
              ${sizeStyles[size]}
              ${isActive ? 'text-white' : 'text-slate-400'}
            `}
            role="tab"
            aria-selected={isActive}
          >
            {segment.label}
          </button>
        )
      })}
    </div>
  )
}

export default MobileTabBar
