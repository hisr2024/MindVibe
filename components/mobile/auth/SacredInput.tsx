'use client'

/**
 * SacredInput (Mobile Auth) — Styled input with label, icon slot, and error display
 *
 * Extends the base sacred-input styling with label, focus states,
 * and optional trailing icon (e.g. password visibility toggle).
 */

import { useState, forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface SacredInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'number'
  error?: string
  icon?: ReactNode
  onIconPress?: () => void
}

export const SacredAuthInput = forwardRef<HTMLInputElement, SacredInputProps>(
  function SacredAuthInput(
    { label, type = 'text', error, icon, onIconPress, className = '', ...props },
    ref
  ) {
    const [focused, setFocused] = useState(false)
    const inputId = props.id || label.toLowerCase().replace(/\s+/g, '-')
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className="w-full mb-4">
        <label htmlFor={inputId} className="block sacred-text-ui text-xs text-[var(--sacred-text-secondary)] mb-1.5 ml-1">
          {label}{props.required && <span className="ml-0.5 text-[var(--sacred-divine-gold)]" aria-hidden="true">*</span>}
        </label>
        <div
          className={`relative flex items-center rounded-[14px] transition-all duration-300 ${
            focused
              ? 'border-[rgba(212,160,23,0.6)] shadow-[0_0_0_3px_rgba(212,160,23,0.08)]'
              : error
                ? 'border-red-500/60'
                : 'border-[rgba(212,160,23,0.18)]'
          } border bg-[rgba(22,26,66,0.55)]`}
        >
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            aria-required={props.required || undefined}
            className={`w-full bg-transparent px-4 py-[13px] text-sm text-[var(--sacred-text-primary)] sacred-text-ui placeholder:text-[var(--sacred-text-muted)] placeholder:italic outline-none ${
              icon ? 'pr-12' : ''
            } ${className}`}
            autoCapitalize="none"
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          {icon && (
            <button
              type="button"
              onClick={onIconPress}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--sacred-text-muted)] hover:text-[var(--sacred-divine-gold)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sacred-divine-gold)]/80 rounded"
              aria-label="Toggle visibility"
            >
              {icon}
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} className="sacred-text-ui text-xs text-red-400 mt-1 ml-1" role="alert">{error}</p>
        )}
      </div>
    )
  }
)

export default SacredAuthInput
