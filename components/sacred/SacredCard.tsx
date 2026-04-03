'use client'

/**
 * SacredCard — Card system with two variants
 *
 * - sacred: Base card with golden shimmer top border
 * - divine: Prestige/featured card with enhanced glow
 */

import { useCallback, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'

interface SacredCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'sacred' | 'divine'
  children: ReactNode
  /** Enable peacock shimmer on tap */
  interactive?: boolean
}

export function SacredCard({
  variant = 'sacred',
  children,
  interactive = false,
  className = '',
  onClick,
  onKeyDown,
  ...props
}: SacredCardProps) {
  const cardClass = variant === 'divine' ? 'sacred-card-divine' : 'sacred-card'
  const interactiveClass = interactive ? 'sacred-shimmer-on-tap active:scale-[0.98] transition-transform' : ''
  const isClickable = interactive && !!onClick

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onClick(e as unknown as React.MouseEvent<HTMLDivElement>)
      }
      onKeyDown?.(e)
    },
    [onClick, onKeyDown],
  )

  return (
    <div
      className={`${cardClass} ${interactiveClass} p-4 ${className}`}
      onClick={onClick}
      onKeyDown={isClickable ? handleKeyDown : onKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

export default SacredCard
