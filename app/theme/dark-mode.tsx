'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

/**
 * Dark Mode and Theme Management for MindVibe
 */

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isHighContrast: boolean
  setHighContrast: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

/**
 * Theme Provider Component
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'mindvibe-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')
  const [isHighContrast, setHighContrastState] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null
    const storedHighContrast = localStorage.getItem(`${storageKey}-high-contrast`)

    if (storedTheme) {
      setThemeState(storedTheme)
    }

    if (storedHighContrast === 'true') {
      setHighContrastState(true)
    }

    setMounted(true)
  }, [storageKey])

  // Resolve theme based on system preference
  useEffect(() => {
    if (!mounted) return

    const resolveTheme = (): ResolvedTheme => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return theme
    }

    const resolved = resolveTheme()
    setResolvedTheme(resolved)

    // Update document class
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)

    // Update color scheme meta tag
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', resolved)
  }, [theme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Handle high contrast changes
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    if (isHighContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    localStorage.setItem(`${storageKey}-high-contrast`, String(isHighContrast))
  }, [isHighContrast, mounted, storageKey])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(storageKey, newTheme)
  }

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled)
  }

  // Prevent flash of unstyled content
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        isHighContrast,
        setHighContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Theme Toggle Button Component
 */
interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${className}`}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="flex items-center gap-2">
        {resolvedTheme === 'dark' ? (
          <SunIcon className="w-5 h-5 text-amber-400" />
        ) : (
          <MoonIcon className="w-5 h-5 text-slate-600" />
        )}
        {showLabel && (
          <span className="text-sm">
            {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
          </span>
        )}
      </span>
    </button>
  )
}

/**
 * Theme Selector Component
 */
interface ThemeSelectorProps {
  className?: string
}

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()

  const options: { value: Theme; label: string; icon: ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <SunIcon className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon className="w-4 h-4" /> },
    { value: 'system', label: 'System', icon: <ComputerIcon className="w-4 h-4" /> },
  ]

  return (
    <div className={`flex gap-1 p-1 bg-slate-800 rounded-lg ${className}`} role="radiogroup" aria-label="Theme selector">
      {options.map((option) => (
        <button
          key={option.value}
          role="radio"
          aria-checked={theme === option.value}
          onClick={() => setTheme(option.value)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
            ${theme === option.value
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }
          `}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * High Contrast Toggle Component
 */
interface HighContrastToggleProps {
  className?: string
}

export function HighContrastToggle({ className = '' }: HighContrastToggleProps) {
  const { isHighContrast, setHighContrast } = useTheme()

  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <span className="text-sm text-slate-300">High Contrast</span>
      <button
        role="switch"
        aria-checked={isHighContrast}
        onClick={() => setHighContrast(!isHighContrast)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900
          ${isHighContrast ? 'bg-amber-500' : 'bg-slate-700'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${isHighContrast ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </label>
  )
}

// Icons
function SunIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}

function MoonIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  )
}

function ComputerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )
}

/**
 * CSS custom properties for theming
 */
export const themeVariables = {
  light: {
    '--color-bg-primary': '255 255 255',
    '--color-bg-secondary': '248 250 252',
    '--color-text-primary': '15 23 42',
    '--color-text-secondary': '71 85 105',
    '--color-border': '226 232 240',
    '--color-accent': '251 191 36',
  },
  dark: {
    '--color-bg-primary': '15 23 42',
    '--color-bg-secondary': '30 41 59',
    '--color-text-primary': '248 250 252',
    '--color-text-secondary': '148 163 184',
    '--color-border': '51 65 85',
    '--color-accent': '251 191 36',
  },
  highContrast: {
    '--color-bg-primary': '0 0 0',
    '--color-bg-secondary': '15 23 42',
    '--color-text-primary': '255 255 255',
    '--color-text-secondary': '229 231 235',
    '--color-border': '255 255 255',
    '--color-accent': '251 191 36',
  },
}
