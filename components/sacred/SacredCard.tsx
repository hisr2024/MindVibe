'use client'

/**
 * SacredCard — Card system with two variants
 *
 * - sacred: Base card with golden shimmer top border
 * - divine: Prestige/featured card with enhanced glow
 */

import { type HTMLAttributes, type ReactNode } from 'react'

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
  ...props
}: SacredCardProps) {
  const cardClass = variant === 'divine' ? 'sacred-card-divine' : 'sacred-card'
  const interactiveClass = interactive ? 'sacred-shimmer-on-tap active:scale-[0.98] transition-transform' : ''

  return (
    <div
      className={`${cardClass} ${interactiveClass} p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default SacredCard
