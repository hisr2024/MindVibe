'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

/**
 * IntroOverlay is loaded eagerly (not behind requestIdleCallback) because:
 * - It's the first thing a new visitor sees — deferring it causes a visible
 *   content flash where page content appears then gets covered by the overlay
 * - The component is now CSS-first (no Framer Motion), so its JS payload is small
 * - It checks localStorage synchronously and bails early for returning visitors,
 *   so the cost for repeat visits is near zero
 */
const IntroOverlay = dynamic(
  () => import('@/components/divine/IntroOverlay').then(mod => mod.IntroOverlay),
  { ssr: false }
)

const GodParticles = dynamic(
  () => import('@/components/divine/GodParticles').then(mod => mod.GodParticles),
  { ssr: false }
)

const PageTransitionWrapper = dynamic(
  () => import('@/components/divine/PageTransitionWrapper').then(mod => mod.PageTransitionWrapper),
  { ssr: false }
)

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showDecorations, setShowDecorations] = useState(false)

  useEffect(() => {
    // Defer decorative particles until after first paint to avoid blocking
    // navigation and content rendering. The IntroOverlay is NOT deferred —
    // it must appear immediately for first-time visitors to prevent the
    // flash of content-then-overlay.
    const id = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(() => setShowDecorations(true))
      : setTimeout(() => setShowDecorations(true), 50) as unknown as number

    return () => {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(id)
      } else {
        clearTimeout(id)
      }
    }
  }, [])

  return (
    <>
      {/* Decorative particles — deferred to avoid blocking navigation */}
      {showDecorations && <GodParticles count={20} />}
      {/* Page transition wrapper — animates content entrance without remounting */}
      <PageTransitionWrapper>
        {children}
      </PageTransitionWrapper>
      {/* Divine intro overlay — shown once to first-time visitors.
          Loaded eagerly (not deferred) to prevent content flash. */}
      <IntroOverlay />
    </>
  )
}
