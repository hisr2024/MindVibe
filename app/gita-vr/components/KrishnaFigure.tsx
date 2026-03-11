/**
 * KrishnaFigure — Divine silhouette of Lord Krishna
 *
 * Built from composed SVG shapes (head, crown, torso, arms, dhoti)
 * unified by a shared deep-blue gradient fill. Golden edge-glow filter
 * creates the luminous divine presence.
 *
 * Art direction: Elegant shadow-puppet meets celestial light.
 * Identity comes from recognizable silhouette elements:
 * triple-peaked crown, peacock feather, flute, tribhanga pose, flowing dhoti.
 *
 * States: idle | speaking | listening | blessing
 */

'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function KrishnaFigure() {
  const krishnaState = useGitaVRStore((s) => s.krishnaState)
  const prefersReduced = useReducedMotion()

  const isActive = krishnaState === 'speaking' || krishnaState === 'blessing'
  const isBlessing = krishnaState === 'blessing'

  /* Breathing / posture animation per state */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const bodyMotion = useMemo((): any => {
    if (prefersReduced) return {}
    const variants = {
      idle: {
        y: [0, -3, 0],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
      },
      speaking: {
        y: [0, -2, -1, -2, 0],
        rotate: [0, 0.3, -0.2, 0.15, 0],
        transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const },
      },
      listening: {
        y: [0, -2, 0],
        rotate: [0, 1, 0],
        transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
      },
      blessing: {
        y: [0, -4, 0],
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
      },
    }
    return variants[krishnaState] ?? variants.idle
  }, [krishnaState, prefersReduced])

  /* Golden particles around the figure */
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        x: 30 + ((i * 137.508) % 240),
        y: 60 + ((i * 97.31) % 480),
        size: 1.5 + (i % 3),
        dur: 3 + (i % 4) * 1.2,
        delay: i * 0.35,
      })),
    []
  )

  const glowIntensity = isBlessing ? 0.7 : isActive ? 0.5 : 0.3
  const glowBlur = isBlessing ? 14 : isActive ? 10 : 7

  return (
    <div className="relative flex h-full items-end justify-center" aria-label="Lord Krishna">
      {/* ── Golden back-light aura ── */}
      <motion.div
        className="pointer-events-none absolute bottom-[10%] left-1/2 -translate-x-1/2"
        style={{ width: '160%', height: '90%' }}
        animate={{
          opacity: isBlessing ? 0.45 : isActive ? 0.3 : 0.15,
          scale: [1, 1.04, 1],
        }}
        transition={{
          opacity: { duration: 1 },
          scale: { duration: isActive ? 2.5 : 5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at 50% 60%, rgba(255,215,0,0.18) 0%, rgba(212,164,76,0.06) 40%, transparent 70%)',
          }}
        />
      </motion.div>

      {/* ── Character SVG ── */}
      <motion.div
        className="relative z-10"
        style={{ width: 220, height: 440, originX: '50%', originY: '95%' }}
        animate={bodyMotion}
      >
        <svg
          viewBox="0 0 300 600"
          className="h-full w-full drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Deep divine-blue gradient */}
            <linearGradient id="kf-fill" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#1e3a6e" />
              <stop offset="50%" stopColor="#132952" />
              <stop offset="100%" stopColor="#0b1a38" />
            </linearGradient>

            {/* Golden edge-glow: dilate → blur → colorize → merge */}
            <filter id="kf-glow" x="-25%" y="-20%" width="150%" height="140%">
              <feMorphology operator="dilate" radius="1.5" in="SourceAlpha" result="fat" />
              <feGaussianBlur stdDeviation={glowBlur} in="fat" result="blur" />
              <feFlood floodColor="#FFD700" floodOpacity={glowIntensity} result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Jewel sparkle filter */}
            <filter id="kf-jewel">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ═══ SILHOUETTE GROUP ═══ */}
          <g fill="url(#kf-fill)" filter="url(#kf-glow)">
            {/* ── Crown: three elegant spires ── */}
            <polygon points="150,5 142,30 158,30" />
            <polygon points="130,14 126,34 142,30" />
            <polygon points="170,14 158,30 174,34" />

            {/* ── Peacock feather crest ── */}
            <path d="M170,16 C180,4 192,6 186,18 C182,26 174,24 172,18 Z" />

            {/* ── Head ── */}
            <ellipse cx="150" cy="56" rx="29" ry="31" />

            {/* ── Neck ── */}
            <rect x="141" y="84" width="18" height="20" rx="7" />

            {/* ── Shoulders & upper torso ── */}
            <path d="M96,108 C115,98 185,98 204,108 L200,148 C182,142 118,142 100,148 Z" />

            {/* ── Torso ── */}
            <path d="M104,144 C122,138 178,138 196,144 L190,244 C172,238 128,238 110,244 Z" />

            {isBlessing ? (
              <>
                {/* ── Right arm raised (Abhaya mudra — blessing) ── */}
                <path d="M200,110 C218,105 236,88 244,66 C248,54 246,44 238,42 C230,40 226,50 228,62 C230,76 222,94 210,106 Z" />
                {/* ── Blessing palm ── */}
                <ellipse cx="240" cy="42" rx="10" ry="14" />
              </>
            ) : (
              /* ── Right arm relaxed ── */
              <path d="M200,110 C216,118 224,148 222,190 C221,208 214,214 208,206 C204,188 202,155 198,132 Z" />
            )}

            {/* ── Left arm holding flute (extends outward) ── */}
            <path d="M100,110 C84,102 68,92 54,80 C44,72 40,64 46,60 C52,56 60,64 70,76 C82,90 94,104 100,110 Z" />

            {/* ── Dhoti (flowing lower garment) ── */}
            <path
              d="M112,240 C108,285 96,345 90,415
                 C84,475 88,535 108,574
                 L138,578 C146,548 150,525 154,548 L162,578
                 L192,574 C212,535 216,475 210,415
                 C204,345 192,285 188,240 Z"
            />

            {/* ── Feet ── */}
            <ellipse cx="123" cy="578" rx="19" ry="5" />
            <ellipse cx="177" cy="578" rx="19" ry="5" />
          </g>

          {/* ═══ ACCENT DETAILS (on top of silhouette) ═══ */}

          {/* Flute — golden line across left arm area */}
          <motion.line
            x1="48" y1="62" x2="120" y2="76"
            stroke="#d4a44c"
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Crown jewels — tiny glowing points */}
          <motion.circle
            cx="150" cy="10" r="3.5"
            fill="#FFD700"
            filter="url(#kf-jewel)"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <motion.circle
            cx="133" cy="20" r="2"
            fill="#FF4500"
            filter="url(#kf-jewel)"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
          />
          <motion.circle
            cx="167" cy="20" r="2"
            fill="#4169E1"
            filter="url(#kf-jewel)"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
          />

          {/* Kaustubha gem — glowing pink point on chest */}
          <motion.circle
            cx="150" cy="170" r="4.5"
            fill="#FF69B4"
            filter="url(#kf-jewel)"
            animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Golden waist sash */}
          <path
            d="M114,242 Q132,234 150,237 Q168,234 186,242"
            fill="none"
            stroke="#d4a44c"
            strokeWidth="1.8"
            opacity="0.35"
          />

          {/* Subtle dhoti fold lines */}
          <path d="M140,300 Q142,400 138,500" fill="none" stroke="#2a4a80" strokeWidth="0.8" opacity="0.12" />
          <path d="M160,300 Q158,400 162,500" fill="none" stroke="#2a4a80" strokeWidth="0.8" opacity="0.12" />
        </svg>
      </motion.div>

      {/* ── Floating golden particles ── */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {particles.map((p, i) => (
          <motion.div
            key={`kp-${i}`}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: p.x,
              top: p.y,
              background: 'radial-gradient(circle, rgba(255,235,150,0.9) 0%, transparent 70%)',
              boxShadow: `0 0 ${p.size * 4}px rgba(255,215,0,0.4)`,
            }}
            animate={{
              y: [0, -18, 0],
              opacity: isActive ? [0.3, 0.8, 0.3] : [0.1, 0.4, 0.1],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
