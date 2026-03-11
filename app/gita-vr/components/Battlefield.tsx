/**
 * Battlefield — Cinematic Kurukshetra backdrop
 *
 * Multi-layered parallax scene:
 * Layer 0: Celestial gradient sky (deep purple → warm orange → horizon gold)
 * Layer 1: Twinkling star field
 * Layer 2: Cosmic sun/orb with corona
 * Layer 3: Distant mountain silhouettes
 * Layer 4: Army silhouettes on both sides (very subtle)
 * Layer 5: Ground/earth plane with dust
 * Layer 6: Volumetric golden fog at bottom
 *
 * The scene radiates divine warmth — sunset on the battlefield,
 * the moment before Krishna speaks eternal wisdom.
 */

'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function Battlefield() {
  const prefersReduced = useReducedMotion()

  /* Twinkling stars */
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        x: (i * 7.919) % 100,
        y: (i * 3.571) % 45,
        size: 0.8 + (i % 4) * 0.5,
        dur: 2 + (i % 5) * 1.5,
        delay: (i * 0.37) % 4,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ═══ LAYER 0: CELESTIAL SKY GRADIENT ═══ */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            #0a0618 0%,
            #1a0a2e 12%,
            #2d1245 22%,
            #4a1a3d 32%,
            #7a2e3a 42%,
            #b8512d 55%,
            #d4772a 65%,
            #e8a43a 75%,
            #f0c050 85%,
            #e8a030 92%,
            #c07828 100%
          )`,
        }}
      />

      {/* ═══ LAYER 1: STARS ═══ */}
      <div className="absolute inset-0">
        {stars.map((s, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: s.size,
              height: s.size,
              left: `${s.x}%`,
              top: `${s.y}%`,
            }}
            animate={
              prefersReduced
                ? { opacity: 0.4 }
                : { opacity: [0.2, 0.8, 0.2] }
            }
            transition={{
              duration: s.dur,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: s.delay,
            }}
          />
        ))}
      </div>

      {/* ═══ LAYER 2: COSMIC SUN/ORB ═══ */}
      <div className="absolute left-1/2 top-[25%] -translate-x-1/2 -translate-y-1/2">
        {/* Outer corona */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 300,
            height: 300,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,200,60,0.2) 0%, rgba(255,160,40,0.08) 40%, transparent 70%)',
          }}
          animate={prefersReduced ? {} : { scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Inner orb */}
        <motion.div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,240,180,0.9) 0%, rgba(255,200,80,0.6) 40%, rgba(255,160,40,0.2) 70%, transparent 100%)',
            boxShadow: '0 0 60px rgba(255,200,60,0.4), 0 0 120px rgba(255,160,40,0.2)',
          }}
          animate={prefersReduced ? {} : { scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ═══ LAYER 3: DISTANT MOUNTAINS ═══ */}
      <svg
        className="absolute bottom-[15%] left-0 h-[25%] w-full"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Far range (lighter) */}
        <path
          d="M0,200 L0,140 Q100,80 200,120 Q300,60 400,100 Q500,40 600,90 Q700,50 800,110 Q900,70 1000,100 Q1100,60 1200,130 L1200,200 Z"
          fill="rgba(60,30,20,0.5)"
        />
        {/* Near range (darker) */}
        <path
          d="M0,200 L0,160 Q150,110 300,145 Q450,100 600,135 Q750,90 900,140 Q1050,105 1200,155 L1200,200 Z"
          fill="rgba(40,20,12,0.7)"
        />
      </svg>

      {/* ═══ LAYER 4: ARMY SILHOUETTES (very subtle) ═══ */}
      <svg
        className="absolute bottom-[8%] left-0 h-[14%] w-full"
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left army (Pandava) — spear tips */}
        <g opacity="0.15" fill="#1a2a4a">
          {Array.from({ length: 12 }, (_, i) => {
            const x = 30 + i * 28
            return (
              <g key={`lw-${i}`}>
                <rect x={x} y={55 - (i % 3) * 4} width="3" height={45 + (i % 3) * 4} />
                <polygon points={`${x - 2},${55 - (i % 3) * 4} ${x + 1.5},${42 - (i % 3) * 4} ${x + 5},${55 - (i % 3) * 4}`} />
              </g>
            )
          })}
        </g>
        {/* Right army (Kaurava) — spear tips */}
        <g opacity="0.15" fill="#3a1a1a">
          {Array.from({ length: 12 }, (_, i) => {
            const x = 870 + i * 28
            return (
              <g key={`rw-${i}`}>
                <rect x={x} y={55 - (i % 3) * 4} width="3" height={45 + (i % 3) * 4} />
                <polygon points={`${x - 2},${55 - (i % 3) * 4} ${x + 1.5},${42 - (i % 3) * 4} ${x + 5},${55 - (i % 3) * 4}`} />
              </g>
            )
          })}
        </g>
      </svg>

      {/* ═══ LAYER 5: GROUND PLANE ═══ */}
      <div
        className="absolute bottom-0 left-0 h-[12%] w-full"
        style={{
          background: 'linear-gradient(180deg, rgba(60,30,15,0.8) 0%, rgba(40,20,10,0.95) 100%)',
        }}
      />

      {/* ═══ LAYER 6: GOLDEN FOG ═══ */}
      <motion.div
        className="absolute bottom-0 left-0 h-[20%] w-full"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(200,160,80,0.06) 40%, rgba(180,140,60,0.1) 100%)',
        }}
        animate={prefersReduced ? {} : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle vignette overlay for cinematic feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  )
}
