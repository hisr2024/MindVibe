'use client'

/**
 * GodParticles — Global divine golden particle system
 *
 * Renders floating golden motes of light across the entire viewport,
 * creating an immersive divine atmosphere. Uses pure CSS animations
 * for performance (no JS animation loops). Particles are positioned
 * deterministically to avoid hydration mismatches.
 *
 * Renders as a fixed full-screen layer (z-index: 1) behind content.
 * Respects prefers-reduced-motion for accessibility.
 */

import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'

interface GodParticle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  delay: number
  duration: number
  drift: number
  /** 0 = gold, 1 = warm white, 2 = pale gold */
  variant: number
}

/** Seeded PRNG for deterministic particle placement across SSR/CSR */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const PARTICLE_COLORS = [
  // Gold mote
  'radial-gradient(circle, rgba(212,164,76,0.9) 0%, rgba(212,164,76,0) 70%)',
  // Warm white spark
  'radial-gradient(circle, rgba(245,240,232,0.7) 0%, rgba(245,240,232,0) 70%)',
  // Pale gold
  'radial-gradient(circle, rgba(240,201,109,0.8) 0%, rgba(240,201,109,0) 70%)',
]

export function GodParticles({ count = 45 }: { count?: number }) {
  const reduceMotion = useReducedMotion()

  const particles: GodParticle[] = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: seeded(i * 7 + 1) * 100,
      y: seeded(i * 13 + 3) * 100,
      size: seeded(i * 3 + 5) * 3 + 1,
      opacity: seeded(i * 11 + 7) * 0.4 + 0.1,
      delay: seeded(i * 17 + 11) * 14,
      duration: seeded(i * 19 + 13) * 10 + 8,
      drift: (seeded(i * 23 + 17) - 0.5) * 30,
      variant: Math.floor(seeded(i * 29 + 19) * 3),
    }))
  }, [count])

  if (reduceMotion) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
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
            ['--particle-duration' as string]: `${p.duration}s`,
            ['--particle-drift' as string]: `${p.drift}px`,
            background: PARTICLE_COLORS[p.variant],
            boxShadow:
              p.size > 2.5
                ? '0 0 6px rgba(212,164,76,0.3), 0 0 14px rgba(212,164,76,0.1)'
                : 'none',
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </div>
  )
}

export default GodParticles
