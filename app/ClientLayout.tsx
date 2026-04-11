'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { IntroOverlay } from '@/components/divine/IntroOverlay'
import { MobileRouteGuard } from '@/components/mobile/MobileRouteGuard'

const GodParticles = dynamic(
  () => import('@/components/divine/GodParticles').then(mod => mod.GodParticles),
  { ssr: false }
)

const DivineCelestialBackground = dynamic(
  () => import('@/components/divine/DivineCelestialBackground').then(mod => mod.DivineCelestialBackground),
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
      {/* Immersive celestial backdrop — fixed, pointer-events-none, renders
          on every desktop route. Hidden on /m/* mobile routes which have
          their own shell. Deferred until after first paint to avoid blocking
          navigation and content rendering. */}
      {showDecorations && (
        <MobileRouteGuard>
          <DivineCelestialBackground />
        </MobileRouteGuard>
      )}
      {/* Decorative particles — deferred to avoid blocking navigation */}
      {showDecorations && <GodParticles count={20} />}
      {/* Page transition wrapper — animates content entrance without remounting */}
      <PageTransitionWrapper>
        {children}
      </PageTransitionWrapper>
      {/* Divine intro overlay — shown once to first-time visitors.
          Imported directly (not dynamic) so it's part of the main bundle.
          This is intentional: dynamic() forces async chunk loading which
          creates a multi-frame delay before the overlay can mount,
          causing a visible content flash. The component is CSS-first
          (no Framer Motion) so its bundle cost is negligible, and it
          bails early via localStorage for returning visitors. */}
      <IntroOverlay />
    </>
  )
}
