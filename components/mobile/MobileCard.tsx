'use client'

import { forwardRef, ReactNode } from 'react'
import { motion, MotionProps } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

export interface MobileCardProps extends Omit<MotionProps, 'children'> {
  children: ReactNode
  /** Whether the card is interactive (clickable/tappable) */
  interactive?: boolean
  /** Visual variant of the card */
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  /** Whether to add glow effect on interaction */
  glow?: boolean
  /** Optional onClick handler */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
  /** Disable haptic feedback */
  noHaptic?: boolean
}

/**
 * MobileCard - A polished, mobile-optimized card component
 *
 * Features:
 * - Touch-friendly with proper tap states
 * - Haptic feedback on interaction
 * - Multiple visual variants
 * - Smooth spring animations
 * - Glow effects on interaction
 */
export const MobileCard = forwardRef<HTMLDivElement, MobileCardProps>(
  function MobileCard(
    {
      children,
      interactive = false,
      variant = 'default',
      glow = false,
      onClick,
      className = '',
      noHaptic = false,
      ...motionProps
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()

    // Variant styles
    const variantStyles: Record<string, string> = {
      default:
        'bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06]',
      elevated:
        'bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/[0.08] shadow-mobile-card',
      outlined:
        'bg-transparent border border-orange-500/20 hover:border-orange-500/30',
      glass:
        'mobile-glass',
    }

    // Interactive animation variants
    const cardVariants = {
      rest: {
        scale: 1,
        y: 0,
      },
      hover: {
        scale: 1.01,
        y: -2,
        transition: {
          type: 'spring' as const,
          stiffness: 400,
          damping: 25,
        },
      },
      tap: {
        scale: 0.97,
        y: 0,
        transition: {
          type: 'spring' as const,
          stiffness: 500,
          damping: 30,
        },
      },
    }

    const handleTap = () => {
      if (interactive && !noHaptic) {
        triggerHaptic('light')
      }
      onClick?.()
    }

    const baseClasses = `
      rounded-[18px] p-4 transition-colors duration-200
      ${variantStyles[variant]}
      ${interactive ? 'cursor-pointer active:opacity-95' : ''}
      ${glow && interactive ? 'hover:shadow-mobile-glow' : ''}
      ${className}
    `.trim()

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          className={baseClasses}
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          onTap={handleTap}
          {...motionProps}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        {...motionProps}
      >
        {children}
      </motion.div>
    )
  }
)

export default MobileCard
