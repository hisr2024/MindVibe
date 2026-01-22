'use client'

import { forwardRef, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

export interface MobileButtonProps {
  children: ReactNode
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Full width button */
  fullWidth?: boolean
  /** Loading state */
  loading?: boolean
  /** Icon on the left */
  leftIcon?: ReactNode
  /** Icon on the right */
  rightIcon?: ReactNode
  /** Disable haptic feedback */
  noHaptic?: boolean
  /** Additional CSS classes */
  className?: string
  /** Disabled state */
  disabled?: boolean
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Button type */
  type?: 'button' | 'submit' | 'reset'
  /** Aria label */
  'aria-label'?: string
}

// Animation variants for different button states
const buttonVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.96,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 25,
    },
  },
}

// Loading spinner animation
const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  },
}

/**
 * MobileButton - Premium mobile-optimized button component
 *
 * Features:
 * - Multiple variants and sizes
 * - Haptic feedback on tap
 * - Smooth spring animations
 * - Loading state with spinner
 * - Icon support
 * - Full accessibility
 */
export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  function MobileButton(
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      noHaptic = false,
      className = '',
      disabled,
      onClick,
      type = 'button',
      'aria-label': ariaLabel,
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()

    // Variant styles
    const variantStyles: Record<string, string> = {
      primary: `
        bg-gradient-to-r from-orange-500 to-amber-500
        text-slate-950 font-semibold
        shadow-mobile-button
        hover:shadow-lg hover:shadow-orange-500/30
      `,
      secondary: `
        bg-white/[0.06] border border-orange-500/20
        text-orange-50 font-medium
        hover:bg-white/[0.1] hover:border-orange-500/30
      `,
      ghost: `
        bg-transparent
        text-orange-50 font-medium
        hover:bg-white/[0.06]
      `,
      danger: `
        bg-gradient-to-r from-red-500 to-red-600
        text-white font-semibold
        shadow-lg shadow-red-500/25
        hover:shadow-red-500/35
      `,
      success: `
        bg-gradient-to-r from-emerald-500 to-green-500
        text-slate-950 font-semibold
        shadow-lg shadow-emerald-500/25
        hover:shadow-emerald-500/35
      `,
    }

    // Size styles
    const sizeStyles: Record<string, string> = {
      sm: 'px-4 py-2 text-sm min-h-[36px] rounded-xl gap-1.5',
      md: 'px-5 py-3 text-sm min-h-[44px] rounded-xl gap-2',
      lg: 'px-6 py-3.5 text-base min-h-[52px] rounded-2xl gap-2.5',
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        if (!noHaptic) {
          triggerHaptic('light')
        }
        onClick?.(e)
      }
    }

    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        type={type}
        variants={buttonVariants}
        initial="rest"
        whileHover={!isDisabled ? 'hover' : undefined}
        whileTap={!isDisabled ? 'tap' : undefined}
        className={`
          inline-flex items-center justify-center
          transition-all duration-200
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `.trim()}
        disabled={isDisabled}
        onClick={handleClick}
        aria-label={ariaLabel}
      >
        {loading ? (
          <>
            <motion.svg
              variants={spinnerVariants}
              animate="animate"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </motion.svg>
            <span className="ml-2">Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  }
)

/**
 * MobileIconButton - Circular icon-only button
 */
export interface MobileIconButtonProps {
  icon: ReactNode
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Accessibility label */
  'aria-label': string
  /** Disable haptic feedback */
  noHaptic?: boolean
  /** Additional CSS classes */
  className?: string
  /** Disabled state */
  disabled?: boolean
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Button type */
  type?: 'button' | 'submit' | 'reset'
}

export const MobileIconButton = forwardRef<HTMLButtonElement, MobileIconButtonProps>(
  function MobileIconButton(
    {
      icon,
      variant = 'secondary',
      size = 'md',
      noHaptic = false,
      className = '',
      disabled,
      onClick,
      type = 'button',
      'aria-label': ariaLabel,
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()

    const variantStyles: Record<string, string> = {
      primary: 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-mobile-button',
      secondary: 'bg-white/[0.06] border border-white/[0.08] text-orange-50 hover:bg-white/[0.1]',
      ghost: 'bg-transparent text-orange-50 hover:bg-white/[0.06]',
    }

    const sizeStyles: Record<string, string> = {
      sm: 'w-9 h-9',
      md: 'w-11 h-11',
      lg: 'w-14 h-14',
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        if (!noHaptic) {
          triggerHaptic('selection')
        }
        onClick?.(e)
      }
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        variants={buttonVariants}
        initial="rest"
        whileHover={!disabled ? 'hover' : undefined}
        whileTap={!disabled ? 'tap' : undefined}
        className={`
          inline-flex items-center justify-center rounded-xl
          transition-all duration-200
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `.trim()}
        disabled={disabled}
        onClick={handleClick}
        aria-label={ariaLabel}
      >
        {icon}
      </motion.button>
    )
  }
)

export default MobileButton
