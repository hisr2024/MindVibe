'use client'

import { motion } from 'framer-motion'

export interface MobileSkeletonProps {
  /** Type of skeleton to render */
  type?: 'text' | 'title' | 'avatar' | 'card' | 'button' | 'image' | 'custom'
  /** Width of the skeleton (for custom type or override) */
  width?: string | number
  /** Height of the skeleton (for custom type or override) */
  height?: string | number
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  /** Number of skeleton items to render (for text type) */
  count?: number
  /** Additional CSS classes */
  className?: string
  /** Animation delay for stagger effect */
  delay?: number
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-2xl',
  full: 'rounded-full',
}

/**
 * MobileSkeleton - Polished skeleton loader for mobile
 *
 * Features:
 * - Multiple preset types
 * - Smooth shimmer animation
 * - Stagger support for lists
 * - Customizable dimensions
 */
export function MobileSkeleton({
  type = 'text',
  width,
  height,
  rounded = 'md',
  count = 1,
  className = '',
  delay = 0,
}: MobileSkeletonProps) {
  // Default dimensions based on type
  const getDefaults = () => {
    switch (type) {
      case 'text':
        return { w: '100%', h: '1rem', r: 'sm' }
      case 'title':
        return { w: '60%', h: '1.5rem', r: 'md' }
      case 'avatar':
        return { w: '48px', h: '48px', r: 'full' }
      case 'card':
        return { w: '100%', h: '120px', r: 'lg' }
      case 'button':
        return { w: '100px', h: '44px', r: 'lg' }
      case 'image':
        return { w: '100%', h: '200px', r: 'lg' }
      case 'custom':
      default:
        return { w: width || '100%', h: height || '1rem', r: rounded }
    }
  }

  const defaults = getDefaults()
  const finalWidth = width || defaults.w
  const finalHeight = height || defaults.h
  const finalRounded = rounded !== 'md' ? rounded : (defaults.r as typeof rounded)

  // Render multiple skeletons if count > 1
  if (count > 1 && type === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            className={`skeleton ${roundedClasses[finalRounded]}`}
            style={{
              width: index === count - 1 ? '70%' : finalWidth,
              height: finalHeight,
            }}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: delay + index * 0.05,
              duration: 0.3,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={`skeleton ${roundedClasses[finalRounded]} ${className}`}
      style={{
        width: finalWidth,
        height: finalHeight,
      }}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{
        delay,
        duration: 0.3,
      }}
    />
  )
}

/**
 * MobileSkeletonCard - Pre-built skeleton for card layouts
 */
export function MobileSkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-[18px] border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <MobileSkeleton type="avatar" />
        <div className="flex-1 space-y-2">
          <MobileSkeleton type="title" delay={0.05} />
          <MobileSkeleton type="text" count={2} delay={0.1} />
        </div>
      </div>
    </div>
  )
}

/**
 * MobileSkeletonList - Pre-built skeleton for list layouts
 */
export function MobileSkeletonList({
  count = 3,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
        >
          <MobileSkeleton type="avatar" width="40px" height="40px" />
          <div className="flex-1 space-y-1.5">
            <MobileSkeleton width="50%" height="14px" />
            <MobileSkeleton width="80%" height="12px" />
          </div>
          <MobileSkeleton width="24px" height="24px" rounded="full" />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * MobileSkeletonGrid - Pre-built skeleton for grid layouts
 */
export function MobileSkeletonGrid({
  count = 4,
  columns = 2,
  className = '',
}: {
  count?: number
  columns?: 2 | 3 | 4
  className?: string
}) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  return (
    <div className={`grid ${colClasses[columns]} gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="rounded-[18px] border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <MobileSkeleton type="image" height="80px" className="mb-3" />
          <MobileSkeleton type="title" width="70%" height="14px" className="mb-2" />
          <MobileSkeleton type="text" height="12px" />
        </motion.div>
      ))}
    </div>
  )
}

export default MobileSkeleton
