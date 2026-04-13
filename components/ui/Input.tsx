'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = error ? `${inputId}-error` : undefined
    const hintId = hint && !error ? `${inputId}-hint` : undefined
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-caption font-semibold text-divine-cream">
            {label}{props.required && <span className="ml-0.5 text-[#d4a44c]" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={props.required || undefined}
          className={`w-full rounded-xl border border-[#d4a44c]/20 bg-[var(--mv-input-bg)] px-3 py-3 text-body text-divine-cream outline-none transition placeholder:text-divine-cream/50 focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/80 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-400 focus:border-red-400 focus:ring-red-500/40' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-caption text-red-400" role="alert">{error}</p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-caption text-divine-cream/75">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
