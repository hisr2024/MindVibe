/**
 * ArjunaFigure — Warrior silhouette of Arjuna
 *
 * Composed SVG shapes creating a recognizable warrior:
 * angular crown, broad pauldrons, Gandiva bow, quiver, sturdy dhoti.
 *
 * Warm bronze/amber silhouette with subtle edge-glow.
 * Secondary to Krishna — slightly smaller, warmer tones.
 *
 * States: idle | distressed | listening | enlightened
 */

'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function ArjunaFigure() {
  const arjunaState = useGitaVRStore((s) => s.arjunaState)
  const prefersReduced = useReducedMotion()

  const isEnlightened = arjunaState === 'enlightened'
  const isDistressed = arjunaState === 'distressed'

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const bodyMotion = useMemo((): any => {
    if (prefersReduced) return {}
    const variants = {
      idle: {
        y: [0, -2, 0],
        transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const },
      },
      distressed: {
        y: [3, 5, 3],
        rotate: [0, -0.5, 0],
        transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
      },
      listening: {
        y: [0, -2, 0],
        rotate: [0, -1, 0],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
      },
      enlightened: {
        y: [0, -3, 0],
        transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const },
      },
    }
    return variants[arjunaState] ?? variants.idle
  }, [arjunaState, prefersReduced])

  const glowIntensity = isEnlightened ? 0.55 : isDistressed ? 0.15 : 0.3
  const glowBlur = isEnlightened ? 10 : isDistressed ? 4 : 6
  const glowColor = isEnlightened ? '#FFD700' : '#C68642'

  return (
    <div className="relative flex h-full items-end justify-center" aria-label="Arjuna">
      {/* ── Subtle back-light ── */}
      <motion.div
        className="pointer-events-none absolute bottom-[10%] left-1/2 -translate-x-1/2"
        style={{ width: '140%', height: '80%' }}
        animate={{
          opacity: isEnlightened ? 0.3 : 0.08,
          scale: [1, 1.03, 1],
        }}
        transition={{
          opacity: { duration: 1.2 },
          scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background: isEnlightened
              ? 'radial-gradient(ellipse at 50% 60%, rgba(255,215,0,0.14) 0%, transparent 65%)'
              : 'radial-gradient(ellipse at 50% 60%, rgba(200,160,100,0.08) 0%, transparent 60%)',
          }}
        />
      </motion.div>

      {/* ── Character SVG ── */}
      <motion.div
        className="relative z-10"
        style={{ width: 190, height: 390, originX: '50%', originY: '95%' }}
        animate={bodyMotion}
      >
        <svg
          viewBox="0 0 300 600"
          className="h-full w-full drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Warm bronze gradient */}
            <linearGradient id="af-fill" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#3d2814" />
              <stop offset="50%" stopColor="#2a1c0c" />
              <stop offset="100%" stopColor="#1a0f06" />
            </linearGradient>

            {/* Amber edge glow */}
            <filter id="af-glow" x="-25%" y="-20%" width="150%" height="140%">
              <feMorphology operator="dilate" radius="1.2" in="SourceAlpha" result="fat" />
              <feGaussianBlur stdDeviation={glowBlur} in="fat" result="blur" />
              <feFlood floodColor={glowColor} floodOpacity={glowIntensity} result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="af-jewel">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ═══ SILHOUETTE GROUP ═══ */}
          <g
            fill="url(#af-fill)"
            filter="url(#af-glow)"
            transform={isDistressed ? 'translate(0, 12) rotate(2, 150, 300)' : ''}
          >
            {/* ── Warrior crown (angular, 5 points) ── */}
            <polygon points="150,8 143,28 157,28" />
            <polygon points="135,16 130,32 143,28" />
            <polygon points="165,16 157,28 170,32" />
            <polygon points="122,24 120,36 132,32" />
            <polygon points="178,24 168,32 180,36" />

            {/* ── Head ── */}
            <ellipse cx="150" cy="56" rx="28" ry="30" />

            {/* ── Neck (slightly thicker — warrior build) ── */}
            <rect x="139" y="84" width="22" height="20" rx="6" />

            {/* ── Broad shoulders with pauldrons ── */}
            <path d="M86,108 C90,96 108,92 130,96 C145,98 155,98 170,96 C192,92 210,96 214,108 L212,126 C196,118 104,118 88,126 Z" />

            {/* ── Upper torso (warrior build — broader) ── */}
            <path d="M94,122 C116,116 184,116 206,122 L200,162 C184,156 116,156 100,162 Z" />

            {/* ── Lower torso ── */}
            <path d="M102,158 C120,152 180,152 198,158 L192,248 C176,242 124,242 108,248 Z" />

            {/* ── Right arm ── */}
            <path d="M210,110 C228,120 234,152 232,196 C231,214 224,220 216,210 C212,192 210,158 206,134 Z" />

            {/* ── Left arm ── */}
            <path d="M90,110 C72,120 66,152 68,196 C69,214 76,220 84,210 C88,192 90,158 94,134 Z" />

            {/* ── Dhoti (warrior style — less flowing) ── */}
            <path
              d="M110,244 C106,288 98,348 94,418
                 C90,475 94,535 112,572
                 L140,576 C147,548 150,528 153,548 L160,576
                 L188,572 C206,535 210,475 206,418
                 C202,348 194,288 190,244 Z"
            />

            {/* ── Feet ── */}
            <ellipse cx="126" cy="576" rx="18" ry="5" />
            <ellipse cx="174" cy="576" rx="18" ry="5" />
          </g>

          {/* ═══ ACCENT DETAILS ═══ */}

          {/* Gandiva bow (tall elegant curve beside him) */}
          <motion.path
            d="M238,55 C260,150 260,380 238,475"
            fill="none"
            stroke="#8B7355"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: isDistressed ? [0.15, 0.25, 0.15] : [0.35, 0.55, 0.35] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Bowstring */}
          <line
            x1="238" y1="55" x2="238" y2="475"
            stroke="#d4a44c" strokeWidth="1" opacity={isDistressed ? 0.1 : 0.25}
          />

          {/* Quiver arrows behind shoulder */}
          <line x1="220" y1="80" x2="226" y2="40" stroke="#8B7355" strokeWidth="1.5" opacity="0.3" />
          <line x1="224" y1="80" x2="231" y2="36" stroke="#8B7355" strokeWidth="1.5" opacity="0.3" />
          <line x1="228" y1="80" x2="236" y2="42" stroke="#8B7355" strokeWidth="1.5" opacity="0.3" />

          {/* Crown sapphire gem */}
          <motion.circle
            cx="150" cy="14" r="2.5"
            fill="#4169E1"
            filter="url(#af-jewel)"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Armor chest-plate highlight */}
          {!isDistressed && (
            <path
              d="M130,135 Q150,130 170,135"
              fill="none" stroke="#8B7355" strokeWidth="1" opacity="0.18"
            />
          )}
        </svg>
      </motion.div>

      {/* ── Enlightened golden particles ── */}
      {isEnlightened && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {Array.from({ length: 8 }, (_, i) => (
            <motion.div
              key={`ep-${i}`}
              className="absolute rounded-full"
              style={{
                width: 2 + (i % 2),
                height: 2 + (i % 2),
                left: 30 + ((i * 97) % 160),
                top: 60 + ((i * 67) % 320),
                background: 'radial-gradient(circle, rgba(255,235,150,0.9) 0%, transparent 70%)',
                boxShadow: '0 0 8px rgba(255,215,0,0.4)',
              }}
              animate={{ y: [0, -14, 0], opacity: [0.2, 0.65, 0.2] }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
