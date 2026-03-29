'use client'

/**
 * MobileGoldenParticles — Sacred particle system for Sadhana.
 * Gold, teal, and white particles float upward with gentle motion.
 * Density and speed adapt to the current phase intensity.
 */

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ParticleConfig {
  id: number
  x: number
  delay: number
  duration: number
  size: number
  color: string
  drift: number
}

interface MobileGoldenParticlesProps {
  /** 0-1 density multiplier */
  density?: number
  /** Whether to show burst effect (completion) */
  burst?: boolean
}

const PARTICLE_COLORS = [
  '#D4A017', '#D4A017', '#D4A017', '#D4A017', '#D4A017', '#D4A017',
  '#06B6D4', '#06B6D4', '#06B6D4',
  '#FFFFFF',
]

export function MobileGoldenParticles({ density = 0.5, burst = false }: MobileGoldenParticlesProps) {
  const [viewHeight, setViewHeight] = useState(800)

  useEffect(() => {
    setViewHeight(window.innerHeight)
    const handleResize = () => setViewHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const particles = useMemo(() => {
    const count = burst ? 60 : Math.round(20 * density)
    const configs: ParticleConfig[] = []
    for (let i = 0; i < count; i++) {
      const seed = ((i * 2654435761) >>> 0) / 4294967296
      const seed2 = (((i + 7) * 2654435761) >>> 0) / 4294967296
      const seed3 = (((i + 13) * 2654435761) >>> 0) / 4294967296
      configs.push({
        id: i,
        x: seed * 100,
        delay: burst ? seed2 * 0.5 : seed2 * 12,
        duration: burst ? 1.5 + seed3 * 1.5 : 6 + seed3 * 8,
        size: 1.5 + seed * 3,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        drift: (seed2 - 0.5) * 30,
      })
    }
    return configs
  }, [density, burst])

  if (density <= 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            bottom: burst ? '50%' : '-2%',
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}40`,
          }}
          initial={burst ? { opacity: 0, scale: 0 } : { opacity: 0 }}
          animate={burst ? {
            opacity: [0, 0.8, 0],
            y: [0, -(100 + p.drift * 4)],
            x: [0, p.drift * 3],
            scale: [0, 1, 0.5],
          } : {
            opacity: [0, 0.6, 0.3, 0],
            y: [0, -viewHeight * 0.4, -viewHeight * 0.7, -viewHeight],
            x: [0, p.drift, p.drift * 0.5, p.drift * 1.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: burst ? 0 : Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
