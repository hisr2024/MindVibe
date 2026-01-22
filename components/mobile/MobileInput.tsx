'use client'

import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface MobileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label for the input */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Left icon/element */
  leftElement?: ReactNode
  /** Right icon/element */
  rightElement?: ReactNode
  /** Input size */
  size?: 'sm' | 'md' | 'lg'
  /** Visual variant */
  variant?: 'default' | 'filled' | 'outlined'
  /** Additional CSS classes */
  className?: string
  /** Container CSS classes */
  containerClassName?: string
}

/**
 * MobileInput - Premium mobile-optimized input component
 *
 * Features:
 * - Multiple variants and sizes
 * - Floating label animation
 * - Error states with animation
 * - Icon support
 * - Prevents iOS zoom (16px min font size)
 * - Full accessibility
 */
export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  function MobileInput(
    {
      label,
      error,
      helperText,
      leftElement,
      rightElement,
      size = 'md',
      variant = 'default',
      className = '',
      containerClassName = '',
      disabled,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false)
    const hasValue = Boolean(props.value || props.defaultValue)

    // Size styles
    const sizeStyles: Record<string, { input: string; text: string }> = {
      sm: {
        input: 'px-3 py-2 min-h-[40px]',
        text: 'text-[14px]',
      },
      md: {
        input: 'px-4 py-3 min-h-[48px]',
        text: 'text-[16px]',
      },
      lg: {
        input: 'px-5 py-4 min-h-[56px]',
        text: 'text-[16px]',
      },
    }

    // Variant styles
    const getVariantStyles = () => {
      const base = 'rounded-xl transition-all duration-200'

      if (error) {
        return `${base} bg-red-500/10 border-2 border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`
      }

      switch (variant) {
        case 'filled':
          return `${base} bg-white/[0.06] border-2 border-transparent focus:bg-white/[0.08] focus:border-orange-500/40 focus:ring-2 focus:ring-orange-400/15`
        case 'outlined':
          return `${base} bg-transparent border-2 border-white/[0.12] focus:border-orange-500/50 focus:ring-2 focus:ring-orange-400/15`
        case 'default':
        default:
          return `${base} bg-white/[0.04] border border-orange-500/20 focus:border-orange-400/40 focus:ring-2 focus:ring-orange-400/15 focus:bg-white/[0.06]`
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {/* Label */}
        {label && (
          <motion.label
            className={`block text-sm font-medium ${
              error ? 'text-red-400' : isFocused ? 'text-orange-400' : 'text-orange-100/70'
            } transition-colors duration-200`}
            initial={false}
            animate={{ y: 0, opacity: 1 }}
          >
            {label}
          </motion.label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left element */}
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              {leftElement}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            className={`
              w-full outline-none
              text-orange-50 placeholder:text-orange-100/35
              disabled:opacity-50 disabled:cursor-not-allowed
              ${getVariantStyles()}
              ${sizeStyles[size].input}
              ${sizeStyles[size].text}
              ${leftElement ? 'pl-10' : ''}
              ${rightElement ? 'pr-10' : ''}
              ${className}
            `.trim()}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* Right element */}
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
              {rightElement}
            </div>
          )}

          {/* Focus ring animation */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                style={{
                  boxShadow: '0 0 0 3px rgba(255, 145, 89, 0.1)',
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error or helper text */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              className="text-xs text-red-400 flex items-center gap-1"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </motion.p>
          )}
          {!error && helperText && (
            <motion.p
              key="helper"
              className="text-xs text-orange-100/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

/**
 * MobileTextarea - Mobile-optimized textarea component
 */
export interface MobileTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  /** Label for the textarea */
  label?: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Minimum rows */
  minRows?: number
  /** Maximum rows for auto-resize */
  maxRows?: number
  /** Additional CSS classes */
  className?: string
  /** Container CSS classes */
  containerClassName?: string
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  function MobileTextarea(
    {
      label,
      error,
      helperText,
      minRows = 3,
      maxRows = 8,
      className = '',
      containerClassName = '',
      disabled,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const getStyles = () => {
      const base = 'rounded-xl transition-all duration-200'
      if (error) {
        return `${base} bg-red-500/10 border-2 border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`
      }
      return `${base} bg-white/[0.04] border border-orange-500/20 focus:border-orange-400/40 focus:ring-2 focus:ring-orange-400/15 focus:bg-white/[0.06]`
    }

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            className={`block text-sm font-medium ${
              error ? 'text-red-400' : isFocused ? 'text-orange-400' : 'text-orange-100/70'
            } transition-colors duration-200`}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          rows={minRows}
          className={`
            w-full px-4 py-3 outline-none resize-none
            text-[16px] text-orange-50 placeholder:text-orange-100/35
            disabled:opacity-50 disabled:cursor-not-allowed
            ${getStyles()}
            ${className}
          `.trim()}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              className="text-xs text-red-400 flex items-center gap-1"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </motion.p>
          )}
          {!error && helperText && (
            <motion.p
              key="helper"
              className="text-xs text-orange-100/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

export default MobileInput
