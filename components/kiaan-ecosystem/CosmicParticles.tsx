/**
 * CosmicParticles - Divine golden particle system for KIAAN AI ecosystem
 *
 * Renders animated golden cosmic particles floating across a deep void.
 * Uses pure CSS animations for performance - no JS animation loops.
 * Particles are generated at mount time with randomized positions,
 * sizes, and animation delays for organic movement.
 */

'use client'

import { useMemo } from 'react'

interface CosmicParticlesProps {
  /** Number of particles to render (default: 60) */
  count?: number
  /** CSS class to apply to the container */
  className?: string
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  delay: number
  duration: number
  drift: number
}

/**
 * Seeded pseudo-random number generator for deterministic particle placement.
 * Avoids hydration mismatches between server and client renders.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export default function CosmicParticles({
  count = 60,
  className = '',
}: CosmicParticlesProps) {
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: seededRandom(i * 7 + 1) * 100,
      y: seededRandom(i * 13 + 3) * 100,
      size: seededRandom(i * 3 + 5) * 3 + 1,
      opacity: seededRandom(i * 11 + 7) * 0.5 + 0.1,
      delay: seededRandom(i * 17 + 11) * 12,
      duration: seededRandom(i * 19 + 13) * 8 + 6,
      drift: (seededRandom(i * 23 + 17) - 0.5) * 40,
    }))
  }, [count])

  return (
    <div
      className={`kiaan-cosmic-particles pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="kiaan-particle absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--particle-drift' as string]: `${p.drift}px`,
            background:
              p.size > 2.5
                ? 'radial-gradient(circle, rgba(212,164,76,0.9) 0%, rgba(212,164,76,0) 70%)'
                : 'rgba(212,164,76,0.8)',
            boxShadow:
              p.size > 2.5
                ? '0 0 6px rgba(212,164,76,0.4), 0 0 12px rgba(212,164,76,0.15)'
                : 'none',
          }}
        />
      ))}
    </div>
  )
}
