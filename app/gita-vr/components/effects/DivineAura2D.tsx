/**
 * DivineAura2D — Cinematic divine radiance behind Krishna
 *
 * Multi-layered Framer Motion aura system:
 * - Outer halo: Large diffuse golden glow with slow breathing
 * - Inner halo: Concentrated warm light with faster pulse
 * - Sacred ring: Thin luminous ring with rotation
 * - Light rays: Radial god-ray beams fanning outward
 * - Particle sparkles: Tiny floating light motes
 *
 * State-driven intensity:
 * - idle: Subtle, gentle breathing glow
 * - speaking: Intensified radiance, faster pulse
 * - blessing: Maximum radiance with expanded rays
 * - listening: Warm attentive glow
 *
 * Framer Motion spring physics for smooth transitions.
 */

'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function DivineAura2D() {
  const krishnaState = useGitaVRStore((s) => s.krishnaState)
  const reduceMotion = useReducedMotion()

  const isActive = krishnaState === 'speaking' || krishnaState === 'blessing'
  const isBlessing = krishnaState === 'blessing'

  /* Light ray configuration */
  const rays = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      angle: (i / 16) * 360 - 90,
      length: 200 + (i % 3) * 80,
      width: 1.5 + (i % 4) * 0.8,
      opacity: 0.03 + (i % 3) * 0.015,
      delay: i * 0.15,
    })),
  [])

  /* Sparkle particles */
  const sparkles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      x: -80 + (i % 4) * 50 + ((i * 37) % 30),
      y: -150 + (i % 3) * 120 + ((i * 53) % 40),
      size: 2 + (i % 3) * 1.5,
      dur: 3 + (i % 4) * 1.2,
      delay: i * 0.4,
    })),
  [])

  if (reduceMotion) return null

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* === OUTER HALO — large diffuse glow === */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        animate={{
          width: isBlessing ? '620px' : isActive ? '520px' : '400px',
          height: isBlessing ? '720px' : isActive ? '620px' : '500px',
          x: '-60%',
          y: '-50%',
          opacity: isBlessing ? 0.35 : isActive ? 0.25 : 0.12,
          scale: [1, 1.04, 1],
        }}
        transition={{
          width: { duration: 1.2, ease: 'easeOut' },
          height: { duration: 1.2, ease: 'easeOut' },
          opacity: { duration: 1, ease: 'easeOut' },
          scale: { duration: isActive ? 2 : 4, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          background: `radial-gradient(ellipse,
            rgba(255, 223, 100, 0.2) 0%,
            rgba(212, 164, 76, 0.12) 25%,
            rgba(212, 164, 76, 0.06) 50%,
            transparent 100%
          )`,
        }}
      />

      {/* === INNER HALO — concentrated warm light === */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        animate={{
          width: isActive ? '320px' : '240px',
          height: isActive ? '400px' : '320px',
          x: '-60%',
          y: '-50%',
          opacity: isBlessing ? 0.4 : isActive ? 0.3 : 0.15,
          scale: [1, 1.06, 1],
        }}
        transition={{
          width: { duration: 1, ease: 'easeOut' },
          height: { duration: 1, ease: 'easeOut' },
          opacity: { duration: 0.8, ease: 'easeOut' },
          scale: { duration: isActive ? 1.5 : 3.5, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          background: `radial-gradient(ellipse,
            rgba(255, 235, 150, 0.25) 0%,
            rgba(255, 215, 0, 0.1) 40%,
            transparent 80%
          )`,
        }}
      />

      {/* === SACRED RING — thin luminous circle === */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        animate={{
          width: isActive ? '360px' : '280px',
          height: isActive ? '440px' : '360px',
          x: '-60%',
          y: '-50%',
          opacity: isBlessing ? 0.25 : isActive ? 0.15 : 0.06,
          rotate: [0, 360],
        }}
        transition={{
          width: { duration: 1.2 },
          height: { duration: 1.2 },
          opacity: { duration: 1 },
          rotate: { duration: 60, repeat: Infinity, ease: 'linear' },
        }}
        style={{
          borderRadius: '50%',
          border: '1px solid rgba(255, 215, 0, 0.15)',
          boxShadow: 'inset 0 0 30px rgba(255, 215, 0, 0.05), 0 0 20px rgba(255, 215, 0, 0.03)',
        }}
      />

      {/* === GOD RAYS — radial light beams === */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ transform: 'translate(-60%, -50%)' }}
        animate={{
          opacity: isBlessing ? 0.5 : isActive ? 0.35 : 0.15,
          rotate: [0, 4, -4, 0],
        }}
        transition={{
          opacity: { duration: 1 },
          rotate: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <svg width="600" height="600" viewBox="-300 -300 600 600" className="overflow-visible">
          {rays.map((ray, i) => {
            const rad = (ray.angle * Math.PI) / 180
            const x2 = Math.cos(rad) * ray.length
            const y2 = Math.sin(rad) * ray.length
            return (
              <motion.line
                key={`ray-${i}`}
                x1={0} y1={0} x2={x2} y2={y2}
                stroke="#FFD700"
                strokeWidth={ray.width}
                animate={{ opacity: [ray.opacity, ray.opacity * 2.5, ray.opacity] }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: ray.delay,
                }}
              />
            )
          })}
        </svg>
      </motion.div>

      {/* === SPARKLE PARTICLES — floating light motes === */}
      <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-60%, -50%)' }}>
        {sparkles.map((sp, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute rounded-full"
            style={{
              width: sp.size,
              height: sp.size,
              left: sp.x,
              top: sp.y,
              background: 'radial-gradient(circle, rgba(255,235,150,0.8) 0%, transparent 70%)',
              boxShadow: `0 0 ${sp.size * 3}px rgba(255,215,0,0.3)`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: isActive ? [0.3, 0.7, 0.3] : [0.1, 0.3, 0.1],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: sp.dur,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: sp.delay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
