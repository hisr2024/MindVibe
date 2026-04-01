'use client'

/**
 * SacredMovementShell — Wrapper for each movement/chamber screen
 *
 * Provides deep cosmic background gradient, floating golden particles
 * with slow ascent, an optional progress indicator slot at top, and
 * AnimatePresence-wrapped content area for smooth transitions.
 *
 * Used by: Viyoga movements, Ardha chambers, Relationship Compass stages
 */

import { type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'

interface SacredMovementShellProps {
  children: ReactNode
  progressIndicator?: ReactNode
  className?: string
}

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  left: `${10 + (i * 15) % 80}%`,
  delay: i * 1.2,
  duration: 8 + (i % 3) * 2,
  size: i % 2 === 0 ? 2.5 : 1.5,
}))

export function SacredMovementShell({
  children,
  progressIndicator,
  className = '',
}: SacredMovementShellProps) {
  return (
    <div
      className={`relative min-h-screen overflow-hidden ${className}`}
      style={{
        background:
          'linear-gradient(180deg, #050714 0%, #0B0E2A 40%, #111435 100%)',
      }}
    >
      {/* Floating golden particles — slow ascent (CSS animation for compositor-thread perf) */}
      <style>{`
        @keyframes sacred-particle-float {
          0%   { transform: translateY(0) scale(0.3); opacity: 0; }
          15%  { opacity: 0.55; }
          50%  { transform: translateY(-200px) scale(1); opacity: 0.35; }
          100% { transform: translateY(-400px) scale(0.1); opacity: 0; }
        }
      `}</style>
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              bottom: -10,
              background:
                'radial-gradient(circle, rgba(212,160,23,0.85) 0%, rgba(212,160,23,0) 70%)',
              boxShadow:
                p.size > 2 ? '0 0 8px rgba(212,160,23,0.25)' : 'none',
              animation: `sacred-particle-float ${p.duration}s ease-out ${p.delay}s infinite`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* Progress indicator slot */}
      {progressIndicator && (
        <div className="relative z-10 px-4 pt-4">{progressIndicator}</div>
      )}

      {/* Content area with AnimatePresence for transitions */}
      <div className="relative z-10 px-5 pt-4 pb-8">
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </div>
    </div>
  )
}

export default SacredMovementShell
