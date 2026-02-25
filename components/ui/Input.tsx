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
          <label htmlFor={inputId} className="block text-sm font-semibold text-[#f5f0e8]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition placeholder:text-[#f5f0e8]/50 focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-400 focus:border-red-400 focus:ring-red-500/40' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#f5f0e8]/60">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
