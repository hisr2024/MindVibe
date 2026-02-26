'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

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
    // Defer decorative elements until after first paint to avoid blocking
    // navigation and content rendering. requestIdleCallback ensures particles
    // and overlay load only when the browser is idle.
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
      {/* Divine intro overlay — shown once to first-time visitors */}
      {showDecorations && <IntroOverlay />}
    </>
  )
}
