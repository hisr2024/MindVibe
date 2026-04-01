'use client'

/**
 * AarohaMovement — Movement I: The Ascending Entry
 *
 * A tender, sequenced intro animation for the Viyoga sacred journey.
 * Phases: diya flame appears, Sanskrit title rises letter-by-letter,
 * English subtitle fades in, then auto-advances to the next movement.
 *
 * Tap anywhere to skip the animation and proceed immediately.
 */

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface AarohaMovementProps {
  onComplete: () => void
}

const SANSKRIT_LETTERS = ['वि', 'यो', 'ग']
const AUTO_ADVANCE_MS = 2500

export function AarohaMovement({ onComplete }: AarohaMovementProps) {
  const completedRef = useRef(false)

  const handleComplete = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  useEffect(() => {
    const timer = setTimeout(handleComplete, AUTO_ADVANCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
      style={{
        background: 'linear-gradient(180deg, #020510 0%, #070B20 100%)',
      }}
      onClick={handleComplete}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
      aria-label="Skip intro animation"
    >
      {/* Phase 1: Diya flame (0-600ms) */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <svg
          width="20"
          height="28"
          viewBox="0 0 20 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 2C10 2 4 10 4 16C4 19.3 6.7 22 10 22C13.3 22 16 19.3 16 16C16 10 10 2 10 2Z"
            fill="#D4A017"
          />
          <path
            d="M10 6C10 6 7 11 7 15C7 16.7 8.3 18 10 18C11.7 18 13 16.7 13 15C13 11 10 6 10 6Z"
            fill="#F5D060"
          />
        </svg>
        {/* Radial glow behind the flame */}
        <div
          className="absolute inset-0 -m-4 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(212,160,23,0.3) 0%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
        {/* Subtle flicker via CSS animation */}
        <style jsx>{`
          @keyframes flicker {
            0%, 100% { opacity: 1; }
            25% { opacity: 0.85; }
            50% { opacity: 0.95; }
            75% { opacity: 0.8; }
          }
          svg {
            animation: flicker 1.5s ease-in-out infinite;
          }
        `}</style>
      </motion.div>

      {/* Phase 2: Sanskrit "वियोग" letter-by-letter (600-1200ms) */}
      <motion.div
        className="flex justify-center mb-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              delayChildren: 0.6,
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {SANSKRIT_LETTERS.map((letter, i) => (
          <motion.span
            key={i}
            className="font-divine text-[36px] text-[#D4A017]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>

      {/* Phase 3: English subtitle (1200-1800ms) */}
      <motion.p
        className="font-sacred italic text-[14px] text-[#B8AE98] mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6, ease: 'easeOut' }}
      >
        The Sacred Space of Longing
      </motion.p>

      {/* Phase 4: Secondary subtitle (1800-2500ms) */}
      <motion.p
        className="font-sacred italic text-[12px] text-[#B8AE98]/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.8, duration: 0.7, ease: 'easeOut' }}
      >
        Even in separation, there is union
      </motion.p>
    </div>
  )
}

export default AarohaMovement
