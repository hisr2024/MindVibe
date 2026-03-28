'use client'

/**
 * SacredButton — Divine button system with three variants
 *
 * - divine: Primary CTA (krishna-blue → peacock-teal gradient, gold border)
 * - ghost: Secondary (transparent, gold outline)
 * - icon: Circular 44px icon button
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

type ButtonVariant = 'divine' | 'ghost' | 'icon'

interface SacredButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  /** Full width (for primary CTAs) */
  fullWidth?: boolean
}

export const SacredButton = forwardRef<HTMLButtonElement, SacredButtonProps>(
  function SacredButton({ variant = 'divine', children, fullWidth = false, className = '', onClick, ...props }, ref) {
    const { triggerHaptic } = useHapticFeedback()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      triggerHaptic('selection')
      onClick?.(e)
    }

    const baseClass = variant === 'divine'
      ? 'sacred-btn-divine sacred-shimmer-on-tap'
      : variant === 'ghost'
        ? 'sacred-btn-ghost'
        : 'sacred-btn-icon'

    const widthClass = fullWidth && variant !== 'icon' ? 'w-full' : ''

    return (
      <button
        ref={ref}
        className={`${baseClass} ${widthClass} ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)

export default SacredButton
