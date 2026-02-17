'use client'

/**
 * DivineCelestialBackground - Immersive cosmic backdrop
 *
 * Creates the feeling of entering Krishna's divine realm (Vaikuntha/Goloka).
 * Multiple layers: starfield, sacred geometry, floating particles, divine light.
 * All animations are GPU-accelerated and respect prefers-reduced-motion.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'

/** Generate deterministic star positions for consistent SSR/CSR rendering */
function generateStars(count: number, seed: number = 42): Array<{ x: number; y: number; size: number; delay: number; duration: number }> {
  const stars: Array<{ x: number; y: number; size: number; delay: number; duration: number }> = []
  let s = seed
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 0) % 2147483647
    const x = (s % 10000) / 100
    s = (s * 16807 + 0) % 2147483647
    const y = (s % 10000) / 100
    s = (s * 16807 + 0) % 2147483647
    const size = 0.5 + ((s % 100) / 100) * 2
    s = (s * 16807 + 0) % 2147483647
    const delay = ((s % 100) / 100) * 8
    s = (s * 16807 + 0) % 2147483647
    const duration = 3 + ((s % 100) / 100) * 5
    stars.push({ x, y, size, delay, duration })
  }
  return stars
}

/** Floating sacred particles - lotus petals, golden motes */
function generateParticles(count: number): Array<{ x: number; yStart: number; size: number; delay: number; duration: number; opacity: number }> {
  const particles: Array<{ x: number; yStart: number; size: number; delay: number; duration: number; opacity: number }> = []
  let s = 137
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 0) % 2147483647
    const x = (s % 10000) / 100
    s = (s * 16807 + 0) % 2147483647
    const yStart = 100 + ((s % 100) / 100) * 20
    s = (s * 16807 + 0) % 2147483647
    const size = 2 + ((s % 100) / 100) * 6
    s = (s * 16807 + 0) % 2147483647
    const delay = ((s % 100) / 100) * 15
    s = (s * 16807 + 0) % 2147483647
    const duration = 12 + ((s % 100) / 100) * 18
    s = (s * 16807 + 0) % 2147483647
    const opacity = 0.15 + ((s % 100) / 100) * 0.4
    particles.push({ x, yStart, size, delay, duration, opacity })
  }
  return particles
}

export function DivineCelestialBackground() {
  const reduceMotion = useReducedMotion()
  const stars = useMemo(() => generateStars(80), [])
  const particles = useMemo(() => generateParticles(16), [])

  return (
    <div className="divine-celestial-bg pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Base cosmic gradient - deep indigo to midnight */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30, 27, 75, 0.7) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(120, 53, 15, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 80% 20%, rgba(30, 58, 138, 0.15) 0%, transparent 50%),
            linear-gradient(180deg, #050510 0%, #0a0e1a 30%, #0d0d14 60%, #080810 100%)
          `,
        }}
      />

      {/* Starfield layer */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        {stars.map((star, i) => (
          <circle
            key={i}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill="#e8dfd0"
            opacity={0.3}
            className={reduceMotion ? '' : 'divine-star-twinkle'}
            style={
              reduceMotion
                ? undefined
                : {
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.duration}s`,
                  }
            }
          />
        ))}
      </svg>

      {/* Sacred divine light emanation from top-center */}
      <motion.div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '120vw',
          height: '70vh',
          background: `
            radial-gradient(ellipse 50% 45% at 50% 0%,
              rgba(212, 164, 76, 0.10) 0%,
              rgba(212, 164, 76, 0.05) 30%,
              transparent 70%)
          `,
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.03, 1],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Sudarshana Chakra - subtle sacred geometry at top */}
      <motion.div
        className="absolute left-1/2 top-[-5%] -translate-x-1/2"
        animate={
          reduceMotion
            ? undefined
            : { rotate: 360 }
        }
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          className="opacity-[0.04]"
        >
          {/* Outer ring */}
          <circle cx="300" cy="300" r="280" stroke="#d4a44c" strokeWidth="0.8" />
          <circle cx="300" cy="300" r="240" stroke="#d4a44c" strokeWidth="0.5" />
          <circle cx="300" cy="300" r="200" stroke="#d4a44c" strokeWidth="0.5" />
          {/* Spokes */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16
            const rad = (angle * Math.PI) / 180
            return (
              <line
                key={i}
                x1={300 + Math.cos(rad) * 160}
                y1={300 + Math.sin(rad) * 160}
                x2={300 + Math.cos(rad) * 280}
                y2={300 + Math.sin(rad) * 280}
                stroke="#d4a44c"
                strokeWidth="0.5"
              />
            )
          })}
          {/* Inner lotus pattern */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8
            const rad = (angle * Math.PI) / 180
            const nextRad = ((angle + 45) * Math.PI) / 180
            return (
              <path
                key={`petal-${i}`}
                d={`M 300 300 Q ${300 + Math.cos(rad) * 140} ${300 + Math.sin(rad) * 140} ${300 + Math.cos(nextRad) * 100} ${300 + Math.sin(nextRad) * 100}`}
                stroke="#d4a44c"
                strokeWidth="0.5"
                fill="none"
              />
            )
          })}
        </svg>
      </motion.div>

      {/* Floating golden particles - ascending like sacred offerings */}
      {!reduceMotion &&
        particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              background: i % 3 === 0
                ? 'radial-gradient(circle, rgba(212, 164, 76, 0.8), rgba(212, 164, 76, 0) 70%)'
                : i % 3 === 1
                  ? 'radial-gradient(circle, rgba(232, 121, 168, 0.6), rgba(232, 121, 168, 0) 70%)'
                  : 'radial-gradient(circle, rgba(106, 215, 255, 0.5), rgba(106, 215, 255, 0) 70%)',
            }}
            animate={{
              y: [`${p.yStart}vh`, '-10vh'],
              x: [0, Math.sin(i) * 30, 0],
              opacity: [0, p.opacity, p.opacity, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

      {/* Soft vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(5, 5, 16, 0.5) 100%)
          `,
        }}
      />
    </div>
  )
}
