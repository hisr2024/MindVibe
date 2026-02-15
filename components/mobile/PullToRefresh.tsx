'use client'

import { ReactNode, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePullToRefresh, type UsePullToRefreshOptions } from '@/hooks/usePullToRefresh'

export interface PullToRefreshProps extends Omit<UsePullToRefreshOptions, 'onPullChange'> {
  children: ReactNode
  /** Custom loading indicator */
  loadingIndicator?: ReactNode
  /** Custom pull indicator */
  pullIndicator?: ReactNode
  /** Additional CSS classes for the container */
  className?: string
  /** Additional CSS classes for the content wrapper */
  contentClassName?: string
}

/**
 * PullToRefresh - A mobile-optimized pull-to-refresh container
 *
 * Features:
 * - Smooth pull animation with rubber-band effect
 * - Customizable indicators
 * - Haptic feedback
 * - Works with any scrollable content
 */
export const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(
  function PullToRefresh(
    {
      children,
      onRefresh,
      threshold = 80,
      maxPull = 150,
      enabled = true,
      loadingIndicator,
      pullIndicator,
      className = '',
      contentClassName = '',
    },
    ref
  ) {
    const {
      pullDistance,
      progress,
      isRefreshing,
      isPulling,
      setContainerRef,
      containerProps,
    } = usePullToRefresh({
      onRefresh,
      threshold,
      maxPull,
      enabled,
    })

    // Default loading indicator
    const defaultLoadingIndicator = (
      <div className="flex items-center gap-2 text-orange-400">
        <motion.div
          className="h-5 w-5 border-2 border-orange-400/30 border-t-orange-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        <span className="text-sm font-medium">Refreshing...</span>
      </div>
    )

    // Default pull indicator
    const defaultPullIndicator = (
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: progress * 180 }}
          className="text-orange-400"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>
        <span className="text-sm font-medium text-orange-100/80">
          {progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
    )

    return (
      <div
        ref={(node) => {
          // Handle both refs
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
          }
          setContainerRef(node)
        }}
        className={`relative overflow-y-auto h-full ${className}`}
        {...containerProps}
      >
        {/* Pull indicator */}
        <AnimatePresence>
          {(isPulling || isRefreshing) && (
            <motion.div
              className="absolute inset-x-0 top-0 z-10 flex justify-center pointer-events-none"
              initial={{ opacity: 0, y: -20 }}
              animate={{
                opacity: 1,
                y: Math.max(pullDistance - 40, 0),
              }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="rounded-full bg-slate-900/95 px-4 py-2 shadow-lg border border-orange-500/20">
                {isRefreshing
                  ? (loadingIndicator || defaultLoadingIndicator)
                  : (pullIndicator || defaultPullIndicator)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content with transform for pull effect */}
        <motion.div
          className={contentClassName}
          animate={{
            y: isPulling || isRefreshing ? pullDistance * 0.5 : 0,
          }}
          transition={{
            type: isPulling ? 'tween' : 'spring',
            duration: isPulling ? 0 : undefined,
            stiffness: 300,
            damping: 30,
          }}
        >
          {children}
        </motion.div>
      </div>
    )
  }
)

export default PullToRefresh
