'use client'

import React, { ReactNode, useState, useEffect } from 'react'

/**
 * Animation Utilities for MindVibe
 * Provides accessible animations with reduced motion support
 */

/**
 * Hook to detect reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

/**
 * CSS animation keyframes for common animations
 */
export const animations = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,
  slideInUp: `
    @keyframes slideInUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  slideInDown: `
    @keyframes slideInDown {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  slideInLeft: `
    @keyframes slideInLeft {
      from {
        transform: translateX(-20px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from {
        transform: translateX(20px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  bounce: `
    @keyframes bounce {
      0%, 100% {
        transform: translateY(-5%);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
      }
      50% {
        transform: translateY(0);
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }
    }
  `,
}

/**
 * Animated wrapper component
 */
interface AnimatedProps {
  children: ReactNode
  animation: 'fadeIn' | 'slideInUp' | 'slideInDown' | 'slideInLeft' | 'slideInRight' | 'scaleIn'
  duration?: number
  delay?: number
  className?: string
}

export function Animated({
  children,
  animation,
  duration = 300,
  delay = 0,
  className = '',
}: AnimatedProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={className}
      style={{
        animation: `${animation} ${duration}ms ease-out ${delay}ms forwards`,
        opacity: 0,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Fade transition component
 */
interface FadeProps {
  show: boolean
  children: ReactNode
  duration?: number
  className?: string
}

export function Fade({ show, children, duration = 200, className = '' }: FadeProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!shouldRender) return null

  const transitionDuration = prefersReducedMotion ? 0 : duration

  return (
    <div
      className={className}
      style={{
        transition: `opacity ${transitionDuration}ms ease-in-out`,
        opacity: show ? 1 : 0,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Slide transition component
 */
interface SlideProps {
  show: boolean
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
  distance?: number
  className?: string
}

export function Slide({
  show,
  children,
  direction = 'up',
  duration = 200,
  distance = 20,
  className = '',
}: SlideProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!shouldRender) return null

  const transforms = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
  }

  const transitionDuration = prefersReducedMotion ? 0 : duration

  return (
    <div
      className={className}
      style={{
        transition: `transform ${transitionDuration}ms ease-out, opacity ${transitionDuration}ms ease-out`,
        transform: show ? 'translate(0)' : transforms[direction],
        opacity: show ? 1 : 0,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Scale transition component
 */
interface ScaleProps {
  show: boolean
  children: ReactNode
  duration?: number
  initialScale?: number
  className?: string
}

export function Scale({
  show,
  children,
  duration = 200,
  initialScale = 0.95,
  className = '',
}: ScaleProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (!shouldRender) return null

  const transitionDuration = prefersReducedMotion ? 0 : duration

  return (
    <div
      className={className}
      style={{
        transition: `transform ${transitionDuration}ms ease-out, opacity ${transitionDuration}ms ease-out`,
        transform: show ? 'scale(1)' : `scale(${initialScale})`,
        opacity: show ? 1 : 0,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Stagger animation for lists
 */
interface StaggerProps {
  children: ReactNode[]
  animation?: 'fadeIn' | 'slideInUp' | 'slideInLeft'
  delay?: number
  className?: string
}

export function Stagger({ children, animation = 'fadeIn', delay = 50, className = '' }: StaggerProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <>
      {React.Children.map(children, (child, index) => (
        <div
          className={className}
          style={{
            animation: `${animation} 300ms ease-out ${index * delay}ms forwards`,
            opacity: 0,
          }}
        >
          {child}
        </div>
      ))}
    </>
  )
}

/**
 * Loading spinner component
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export function Spinner({ size = 'md', color = 'currentColor', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4" />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Breathing animation (useful for meditation features)
 */
interface BreathingOrbProps {
  size?: number
  color?: string
  duration?: number
  className?: string
}

export function BreathingOrb({
  size = 100,
  color = 'rgb(251, 191, 36)',
  duration = 10,
  className = '',
}: BreathingOrbProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <div
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        animation: prefersReducedMotion ? 'none' : `pulse ${duration}s ease-in-out infinite`,
      }}
      aria-hidden="true"
    />
  )
}
