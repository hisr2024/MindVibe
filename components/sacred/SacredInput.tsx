'use client'

/**
 * SacredInput — Form input with sacred styling
 *
 * Yamuna-surface background, golden border, divine focus glow.
 */

import { forwardRef, type InputHTMLAttributes } from 'react'

interface SacredInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Full-width mode */
  fullWidth?: boolean
}

export const SacredInput = forwardRef<HTMLInputElement, SacredInputProps>(
  function SacredInput({ fullWidth = true, className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`sacred-input px-4 py-3 text-[15px] placeholder:italic placeholder:text-[var(--sacred-text-muted)] ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      />
    )
  }
)

export default SacredInput
