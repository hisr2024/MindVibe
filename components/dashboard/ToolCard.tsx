'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ToolBadge } from '@/lib/constants/tools'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useCallback } from 'react'

export interface ToolCardProps {
  /** Icon emoji or text to display */
  icon: string
  /** Title of the tool */
  title: string
  /** Description of the tool (1 line) */
  description: string
  /** Tailwind gradient classes for icon background */
  gradient: string
  /** Link destination */
  href: string
  /** Optional badge indicator */
  badge?: ToolBadge
  /** Whether the tool is disabled */
  disabled?: boolean
  /** Optional className for styling */
  className?: string
  /** Animation delay for stagger effect */
  delay?: number
}

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 25,
      delay: delay * 0.05,
    },
  }),
  hover: {
    y: -3,
    scale: 1.01,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.97,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 25,
    },
  },
}

// Icon animation variants
const iconVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.12,
    rotate: [0, -3, 3, 0],
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
    },
  },
  tap: { scale: 0.95 },
}

// Badge animation variants
const badgeVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 20,
    },
  },
}

/**
 * ToolCard component for displaying dashboard tools.
 *
 * Features:
 * - Premium mobile-optimized animations
 * - Haptic feedback on tap
 * - Icon with gradient background (emoji)
 * - Staggered entrance animations
 * - Optional status badge (New, Premium, Beta)
 * - MindVibe brand styling (dark theme)
 */
export function ToolCard({
  icon,
  title,
  description,
  gradient,
  href,
  badge,
  disabled = false,
  className = '',
  delay = 0,
}: ToolCardProps) {
  const { triggerHaptic } = useHapticFeedback()

  const badgeStyles: Record<ToolBadge, string> = {
    new: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    premium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    beta: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }

  const handleTap = useCallback(() => {
    if (!disabled) {
      triggerHaptic('light')
    }
  }, [disabled, triggerHaptic])

  const cardContent = (
    <>
      {/* Header with icon and badge */}
      <div className="flex items-start justify-between gap-2">
        {/* Icon with gradient background */}
        <motion.div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-xl shadow-lg`}
          variants={iconVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          {icon}
        </motion.div>

        {/* Badge */}
        {badge && (
          <motion.span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeStyles[badge]}`}
            variants={badgeVariants}
            initial="rest"
            whileHover="hover"
          >
            {badge}
          </motion.span>
        )}
      </div>

      {/* Title and description */}
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-orange-50 transition-colors duration-200 group-hover:text-white">
          {title}
        </h3>
        <p className="mt-1 text-xs text-orange-100/60 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        whileHover={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </>
  )

  if (disabled) {
    return (
      <motion.div
        className={`group relative cursor-not-allowed rounded-[18px] border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-4 opacity-50 ${className}`}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={delay}
        aria-disabled="true"
      >
        {cardContent}
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      custom={delay}
    >
      <Link
        href={href}
        onClick={handleTap}
        className={`group relative block overflow-hidden rounded-[18px] border border-orange-500/15 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 shadow-mobile-card transition-all duration-200 hover:border-orange-500/30 hover:shadow-[0_8px_32px_rgba(255,115,39,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0f] active:opacity-95 ${className}`}
      >
        {cardContent}
      </Link>
    </motion.div>
  )
}

export default ToolCard
