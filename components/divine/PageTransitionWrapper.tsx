'use client'

/**
 * PageTransitionWrapper — Fluid page transition layer
 *
 * Animates page content entrance with a subtle fade-slide using the
 * Web Animations API. Critically, this does NOT use key={pathname}
 * which would unmount and remount the entire React tree on every
 * navigation — the primary cause of navigation lag.
 *
 * Instead, we trigger a lightweight re-entrance animation when the
 * pathname changes. This preserves the React tree (no destroy/create
 * cycle) while still providing visual feedback of page transitions.
 *
 * Performance: GPU-accelerated transforms only (opacity + translateY).
 * Respects prefers-reduced-motion.
 */

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const prevPathname = useRef(pathname)
  const animationRef = useRef<Animation | null>(null)

  const animate = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    // Respect reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    // Cancel any in-flight animation to avoid stacking
    animationRef.current?.cancel()

    // Web Animations API — lightweight, non-blocking, GPU-accelerated
    animationRef.current = el.animate(
      [
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 220,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    )
  }, [])

  // Animate on route change without remounting
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      animate()
    }
  }, [pathname, animate])

  // Initial entrance animation
  useEffect(() => {
    animate()
  }, [animate])

  return (
    <div
      ref={containerRef}
      style={{
        willChange: 'opacity, transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

export default PageTransitionWrapper
