'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

/**
 * Accessibility Context for managing global accessibility features
 */

interface AccessibilityContextType {
  // Screen reader announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void

  // Focus management
  focusFirst: (container: HTMLElement) => void
  focusLast: (container: HTMLElement) => void
  trapFocus: (container: HTMLElement) => () => void

  // Reduced motion preference
  prefersReducedMotion: boolean

  // High contrast preference
  prefersHighContrast: boolean

  // Font size scaling
  fontScale: number
  setFontScale: (scale: number) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

interface AccessibilityProviderProps {
  children: ReactNode
}

/**
 * Provider component for accessibility features
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [prefersHighContrast, setPrefersHighContrast] = useState(false)
  const [fontScale, setFontScale] = useState(1)

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Detect high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)')
    setPrefersHighContrast(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersHighContrast(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Load saved font scale from localStorage
  useEffect(() => {
    const savedScale = localStorage.getItem('mindvibe-font-scale')
    if (savedScale) {
      setFontScale(parseFloat(savedScale))
    }
  }, [])

  // Save font scale to localStorage
  useEffect(() => {
    localStorage.setItem('mindvibe-font-scale', fontScale.toString())
    document.documentElement.style.fontSize = `${fontScale * 100}%`
  }, [fontScale])

  /**
   * Announce message to screen readers
   */
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Get all focusable elements within a container
   */
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ]

    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(',')))
  }

  /**
   * Focus the first focusable element in a container
   */
  const focusFirst = (container: HTMLElement) => {
    const focusable = getFocusableElements(container)
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  /**
   * Focus the last focusable element in a container
   */
  const focusLast = (container: HTMLElement) => {
    const focusable = getFocusableElements(container)
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus()
    }
  }

  /**
   * Trap focus within a container (useful for modals)
   */
  const trapFocus = (container: HTMLElement): (() => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusable = getFocusableElements(container)
      if (focusable.length === 0) return

      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }

  const value: AccessibilityContextType = {
    announce,
    focusFirst,
    focusLast,
    trapFocus,
    prefersReducedMotion,
    prefersHighContrast,
    fontScale,
    setFontScale,
  }

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

/**
 * Hook to access accessibility features
 */
export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

/**
 * Screen reader only content - visually hidden but accessible
 */
interface ScreenReaderOnlyProps {
  children: ReactNode
  as?: keyof JSX.IntrinsicElements
}

export function ScreenReaderOnly({ children, as: Component = 'span' }: ScreenReaderOnlyProps) {
  return (
    <Component
      className="sr-only absolute left-[-10000px] top-auto w-px h-px overflow-hidden"
      style={{
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  )
}

/**
 * Skip to main content link
 */
interface SkipLinkProps {
  targetId?: string
  children?: ReactNode
}

export function SkipLink({ targetId = 'main-content', children = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-900 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
    >
      {children}
    </a>
  )
}

/**
 * Live region for dynamic announcements
 */
interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
}

export function LiveRegion({ message, priority = 'polite' }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

/**
 * Focus visible indicator component
 */
interface FocusIndicatorProps {
  children: ReactNode
  className?: string
}

export function FocusIndicator({ children, className = '' }: FocusIndicatorProps) {
  return (
    <div
      className={`focus-within:ring-2 focus-within:ring-amber-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 rounded-md ${className}`}
    >
      {children}
    </div>
  )
}
