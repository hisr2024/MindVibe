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

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-orange-50">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition placeholder:text-orange-100/50 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-400 focus:border-red-400 focus:ring-red-500/40' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-orange-100/60">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
