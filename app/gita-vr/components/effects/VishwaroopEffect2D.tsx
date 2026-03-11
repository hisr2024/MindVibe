/**
 * VishwaroopEffect2D — Cinematic cosmic form (Chapter 11)
 *
 * When sceneState === 'vishwaroop', displays the Universal Form
 * with Disney-level Framer Motion choreography:
 *
 * Phase 1 (0–1s): Blinding flash — screen whiteout fading to gold
 * Phase 2 (1–3s): Cosmic burst — radial light rays expand outward
 * Phase 3 (ongoing): Cosmic sustained scene:
 *   - Orbiting celestial orbs with trails
 *   - Multiple Krishna echoes at varying scales (cosmic form illusion)
 *   - Swirling nebula rings with iridescent gradients
 *   - Rising energy particles
 *   - Deep cosmic color palette (indigo → violet → gold)
 *
 * AnimatePresence for mount/unmount transitions.
 * Framer Motion springs for organic motion.
 */

'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function VishwaroopEffect2D() {
  const sceneState = useGitaVRStore((s) => s.sceneState)
  const reduceMotion = useReducedMotion()

  const isActive = sceneState === 'vishwaroop'

  /* Cosmic ray configuration */
  const cosmicRays = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      angle: (i / 20) * 360,
      length: 500 + (i % 4) * 150,
      width: 2 + (i % 3) * 1.5,
      opacity: 0.06 + (i % 4) * 0.025,
      color: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#9B30FF' : '#FF69B4',
    })),
  [])

  /* Orbiting celestial bodies */
  const orbs = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      radius: 120 + i * 35,
      size: 5 + (i % 4) * 4,
      duration: 10 + i * 3,
      startAngle: (i / 10) * 360,
      color: ['#FFD700', '#8A2BE2', '#FF69B4', '#00CED1', '#FF6347', '#7B68EE', '#FFD700', '#FF1493', '#00FA9A', '#DDA0DD'][i],
      glowSize: 10 + (i % 3) * 8,
    })),
  [])

  /* Rising energy particles */
  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      x: ((i * 197) % 100),
      startY: 80 + (i % 30),
      size: 1 + (i % 4) * 0.8,
      duration: 4 + (i % 5) * 1.5,
      delay: (i % 8) * 0.5,
      color: ['#FFD700', '#9B30FF', '#FF69B4', '#00CED1'][i % 4],
    })),
  [])

  /* Krishna cosmic echoes */
  const echoes = useMemo(() =>
    [
      { scale: 0.6, rotate: -12, opacity: 0.08, delay: 0.2 },
      { scale: 1.0, rotate: 6, opacity: 0.06, delay: 0.5 },
      { scale: 1.5, rotate: -4, opacity: 0.04, delay: 0.8 },
      { scale: 2.2, rotate: 10, opacity: 0.025, delay: 1.1 },
      { scale: 3.0, rotate: -8, opacity: 0.015, delay: 1.4 },
    ],
  [])

  /* Nebula rings */
  const rings = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => ({
      rx: 180 + i * 80,
      ry: 100 + i * 45,
      rotation: i * 35 - 20,
      duration: 25 + i * 8,
      opacity: 0.08 - i * 0.015,
      color: i % 2 === 0 ? 'rgba(138,43,226,0.15)' : 'rgba(255,215,0,0.1)',
    })),
  [])

  if (reduceMotion && isActive) {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 40% 50%, rgba(138,43,226,0.2) 0%, rgba(75,0,130,0.1) 50%, transparent 100%)',
        }} />
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          {/* === PHASE 1: BLINDING FLASH === */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6, 0.1, 0] }}
            transition={{ duration: 3, times: [0, 0.1, 0.3, 0.7, 1], ease: 'easeOut' }}
            style={{
              background: 'radial-gradient(circle at 40% 50%, rgba(255,255,255,0.9) 0%, rgba(255,215,0,0.5) 30%, transparent 70%)',
            }}
          />

          {/* === PHASE 2: COSMIC BURST RAYS === */}
          <motion.div
            className="absolute"
            style={{ left: '40%', top: '50%', transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: [0, 360] }}
            transition={{
              scale: { duration: 2, ease: 'easeOut' },
              opacity: { duration: 1.5 },
              rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
            }}
          >
            <svg width="1200" height="1200" viewBox="-600 -600 1200 1200" className="overflow-visible">
              <defs>
                <filter id="cosmic-glow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {cosmicRays.map((ray, i) => {
                const rad = (ray.angle * Math.PI) / 180
                const x2 = Math.cos(rad) * ray.length
                const y2 = Math.sin(rad) * ray.length
                return (
                  <motion.line
                    key={`cray-${i}`}
                    x1={0} y1={0} x2={x2} y2={y2}
                    stroke={ray.color}
                    strokeWidth={ray.width}
                    filter="url(#cosmic-glow)"
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{
                      opacity: [0, ray.opacity, ray.opacity * 2, ray.opacity],
                      pathLength: [0, 1],
                    }}
                    transition={{
                      opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 },
                      pathLength: { duration: 2, delay: 0.5 + i * 0.05 },
                    }}
                  />
                )
              })}
            </svg>
          </motion.div>

          {/* === NEBULA RINGS === */}
          {rings.map((ring, i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute"
              style={{
                left: '40%',
                top: '50%',
                width: ring.rx * 2,
                height: ring.ry * 2,
                marginLeft: -ring.rx,
                marginTop: -ring.ry,
                borderRadius: '50%',
                border: `1.5px solid ${ring.color}`,
                boxShadow: `0 0 20px ${ring.color}, inset 0 0 15px ${ring.color}`,
              }}
              initial={{ opacity: 0, scale: 0.5, rotate: ring.rotation }}
              animate={{
                opacity: ring.opacity,
                scale: [1, 1.05, 1],
                rotate: [ring.rotation, ring.rotation + 360],
              }}
              transition={{
                opacity: { duration: 2, delay: 1 + i * 0.3 },
                scale: { duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: ring.duration, repeat: Infinity, ease: 'linear' },
              }}
            />
          ))}

          {/* === ORBITING CELESTIAL ORBS === */}
          {orbs.map((orb, i) => (
            <motion.div
              key={`orb-${i}`}
              className="absolute"
              style={{
                left: '40%',
                top: '50%',
                width: orb.size,
                height: orb.size,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                boxShadow: `0 0 ${orb.glowSize}px ${orb.color}, 0 0 ${orb.glowSize * 2}px ${orb.color}40`,
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.4, 0.8, 0.4],
                x: [
                  Math.cos((orb.startAngle * Math.PI) / 180) * orb.radius,
                  Math.cos(((orb.startAngle + 120) * Math.PI) / 180) * orb.radius,
                  Math.cos(((orb.startAngle + 240) * Math.PI) / 180) * orb.radius,
                  Math.cos((orb.startAngle * Math.PI) / 180) * orb.radius,
                ],
                y: [
                  Math.sin((orb.startAngle * Math.PI) / 180) * orb.radius * 0.6,
                  Math.sin(((orb.startAngle + 120) * Math.PI) / 180) * orb.radius * 0.6,
                  Math.sin(((orb.startAngle + 240) * Math.PI) / 180) * orb.radius * 0.6,
                  Math.sin((orb.startAngle * Math.PI) / 180) * orb.radius * 0.6,
                ],
              }}
              transition={{
                opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
                x: { duration: orb.duration, repeat: Infinity, ease: 'linear' },
                y: { duration: orb.duration, repeat: Infinity, ease: 'linear' },
              }}
            />
          ))}

          {/* === KRISHNA COSMIC ECHOES === */}
          {echoes.map((echo, i) => (
            <motion.div
              key={`echo-${i}`}
              className="absolute rounded-full"
              style={{
                left: '40%',
                top: '50%',
                width: '280px',
                height: '500px',
                marginLeft: '-140px',
                marginTop: '-250px',
                background: `radial-gradient(ellipse,
                  rgba(255,215,0,0.08) 0%,
                  rgba(138,43,226,0.05) 30%,
                  rgba(75,0,130,0.02) 60%,
                  transparent 80%
                )`,
              }}
              initial={{ opacity: 0, scale: echo.scale * 0.5, rotate: echo.rotate }}
              animate={{
                opacity: [0, echo.opacity, echo.opacity * 0.6, echo.opacity],
                scale: [echo.scale, echo.scale * 1.08, echo.scale],
                rotate: [echo.rotate, echo.rotate + 3, echo.rotate],
              }}
              transition={{
                opacity: { duration: 5 + i * 2, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 8 + i * 3, repeat: Infinity, ease: 'easeInOut' },
                delay: echo.delay,
              }}
            />
          ))}

          {/* === RISING ENERGY PARTICLES === */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {particles.map((p, i) => (
              <motion.circle
                key={`cp-${i}`}
                cx={p.x}
                r={p.size}
                fill={p.color}
                initial={{ cy: p.startY, opacity: 0 }}
                animate={{
                  cy: [p.startY, p.startY - 40, p.startY - 80],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: p.delay,
                }}
              />
            ))}
          </svg>

          {/* === COSMIC AMBIENT OVERLAY === */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 3 }}
            style={{
              background: 'radial-gradient(ellipse at 40% 45%, rgba(138,43,226,0.2) 0%, rgba(75,0,130,0.1) 40%, transparent 70%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
