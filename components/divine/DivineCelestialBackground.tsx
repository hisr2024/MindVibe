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

/** God Particles - tiny luminous golden specks drifting across screen */
function generateGodParticles(count: number): Array<{ x: number; y: number; size: number; delay: number; duration: number; drift: number }> {
  const particles: Array<{ x: number; y: number; size: number; delay: number; duration: number; drift: number }> = []
  let s = 293
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 0) % 2147483647
    const x = (s % 10000) / 100
    s = (s * 16807 + 0) % 2147483647
    const y = (s % 10000) / 100
    s = (s * 16807 + 0) % 2147483647
    const size = 1 + ((s % 100) / 100) * 3
    s = (s * 16807 + 0) % 2147483647
    const delay = ((s % 100) / 100) * 20
    s = (s * 16807 + 0) % 2147483647
    const duration = 6 + ((s % 100) / 100) * 12
    s = (s * 16807 + 0) % 2147483647
    const drift = -20 + ((s % 100) / 100) * 40
    particles.push({ x, y, size, delay, duration, drift })
  }
  return particles
}

export function DivineCelestialBackground() {
  const reduceMotion = useReducedMotion()
  const stars = useMemo(() => generateStars(35), [])
  const particles = useMemo(() => generateParticles(6), [])
  const godParticles = useMemo(() => generateGodParticles(18), [])

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

      {/* Sacred divine light emanation from top-center (CSS animation for zero JS overhead) */}
      <div
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
          ...(reduceMotion ? {} : {
            animation: 'calmBreath 8s ease-in-out infinite',
          }),
        }}
      />

      {/* Sudarshana Chakra - subtle sacred geometry at top (pure CSS rotation for zero JS overhead) */}
      <div
        className="absolute left-1/2 top-[-5%] -translate-x-1/2"
        style={reduceMotion ? undefined : {
          animation: 'spin 120s linear infinite',
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
      </div>

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

      {/* God Particles — luminous golden specks floating across the sacred space */}
      {!reduceMotion &&
        godParticles.map((p, i) => (
          <motion.div
            key={`god-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: 'radial-gradient(circle, rgba(240, 201, 109, 0.9), rgba(212, 164, 76, 0) 70%)',
              boxShadow: `0 0 ${p.size * 2}px rgba(240, 201, 109, 0.4)`,
            }}
            animate={{
              y: [0, -30 - p.drift, 0],
              x: [0, p.drift, 0],
              opacity: [0, 0.7, 0.5, 0],
              scale: [0.5, 1, 0.8, 0.3],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Krishna Shadow — subtle divine silhouette presence */}
      <div
        className="absolute bottom-0 right-[8%] opacity-[0.025]"
        style={{
          filter: 'blur(1.5px)',
          ...(reduceMotion ? {} : {
            animation: 'kiaanDivineBreath 15s ease-in-out infinite',
          }),
        }}
      >
        <svg
          viewBox="0 0 400 700"
          className="h-[55vh] w-auto max-w-[300px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g fill="#d4a44c">
            {/* Head with crown */}
            <ellipse cx="200" cy="115" rx="32" ry="38" />
            <path d="M175 90 L185 55 L195 80 L200 45 L205 80 L215 55 L225 90" />
            <ellipse cx="200" cy="90" rx="28" ry="6" />
            {/* Peacock feather */}
            <path d="M210 60 Q225 25 215 10 Q230 30 228 55" />
            <ellipse cx="220" cy="22" rx="6" ry="10" opacity="0.7" />
            {/* Neck */}
            <rect x="190" y="148" width="20" height="18" rx="8" />
            {/* Shoulders and torso — tribhanga pose */}
            <path d="M160 170 Q180 160 200 166 Q220 160 240 170 L245 190 Q230 185 200 192 Q170 185 155 190 Z" />
            <path d="M162 190 Q170 250 180 310 Q190 320 200 318 Q210 320 220 310 Q230 250 238 190 Z" opacity="0.9" />
            {/* Dhoti */}
            <path d="M175 310 Q165 400 155 500 Q150 550 160 600 Q170 650 185 680 L200 685 L215 680 Q230 650 240 600 Q250 550 245 500 Q235 400 225 310 Z" opacity="0.85" />
            {/* Arms with flute */}
            <path d="M162 190 Q140 210 125 225 Q115 235 110 240 Q108 245 112 248 L140 235 Q150 225 158 210" opacity="0.85" />
            <path d="M238 190 Q255 215 265 240 Q270 250 268 255 L248 248 Q242 230 235 210" opacity="0.85" />
            {/* Flute */}
            <rect x="100" y="238" width="170" height="5" rx="2.5" transform="rotate(-8 100 240)" opacity="0.7" />
            {/* Feet */}
            <ellipse cx="185" cy="685" rx="16" ry="6" opacity="0.7" />
            <ellipse cx="215" cy="685" rx="16" ry="6" opacity="0.7" />
          </g>
        </svg>
      </div>

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
