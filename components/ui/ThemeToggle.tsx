'use client'

import { useEffect } from 'react'
import { applyThemeTokens, darkTheme } from '@/brand/theme/tokens'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  useEffect(() => {
    localStorage.setItem('mindvibe-theme', 'dark')
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
    applyThemeTokens(darkTheme)
  }, [])

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-black/40 px-3 py-1 text-xs font-medium text-orange-100 ${className}`}
      role="status"
      aria-label="Dark theme enabled"
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-orange-100"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
      Dark theme
    </div>
  )
}

export default ThemeToggle
