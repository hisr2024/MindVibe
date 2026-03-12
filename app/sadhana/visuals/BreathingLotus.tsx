'use client'

/**
 * BreathingLotus — SVG lotus flower that pulses in sync with breath timing.
 * Expands on inhale, contracts on exhale. Warm golden tones.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BreathingPattern } from '@/types/sadhana.types'

interface BreathingLotusProps {
  pattern: BreathingPattern
  isActive: boolean
  onCycleComplete?: () => void
}

type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut'

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Breathe In',
  holdIn: 'Hold',
  exhale: 'Breathe Out',
  holdOut: 'Hold',
}

export function BreathingLotus({ pattern, isActive, onCycleComplete }: BreathingLotusProps) {
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale')
  const [cycleCount, setCycleCount] = useState(0)
  const [timer, setTimer] = useState(0)

  const currentDuration = (() => {
    switch (breathPhase) {
      case 'inhale': return pattern.inhale
      case 'holdIn': return pattern.holdIn
      case 'exhale': return pattern.exhale
      case 'holdOut': return pattern.holdOut
    }
  })()

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev + 1 >= currentDuration) {
          /* Advance to next breath phase */
          setBreathPhase((phase) => {
            if (phase === 'inhale') return pattern.holdIn > 0 ? 'holdIn' : 'exhale'
            if (phase === 'holdIn') return 'exhale'
            if (phase === 'exhale') return pattern.holdOut > 0 ? 'holdOut' : 'inhale'
            /* holdOut → inhale, cycle complete */
            setCycleCount((c) => {
              const next = c + 1
              if (next >= pattern.cycles) onCycleComplete?.()
              return next
            })
            return 'inhale'
          })
          return 0
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, currentDuration, pattern, onCycleComplete])

  const scale = breathPhase === 'inhale' || breathPhase === 'holdIn' ? 1.15 : 0.9
  const glowOpacity = breathPhase === 'inhale' || breathPhase === 'holdIn' ? 0.6 : 0.25

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Lotus SVG */}
      <div className="relative">
        {/* Glow behind lotus */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,164,76,0.3) 0%, transparent 70%)',
            width: 280,
            height: 280,
            left: -15,
            top: -15,
          }}
          animate={{ opacity: glowOpacity, scale: scale * 1.1 }}
          transition={{ duration: currentDuration, ease: 'easeInOut' }}
        />

        <motion.svg
          width="250"
          height="250"
          viewBox="0 0 250 250"
          animate={{ scale }}
          transition={{ duration: currentDuration, ease: 'easeInOut' }}
        >
          <defs>
            <radialGradient id="lotus-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d4a44c" stopOpacity="0.4" />
            </radialGradient>
            <linearGradient id="lotus-petal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4a44c" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#F4A460" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Petals arranged radially */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <motion.ellipse
              key={angle}
              cx="125"
              cy="85"
              rx="22"
              ry="50"
              fill="url(#lotus-petal)"
              stroke="rgba(212,164,76,0.3)"
              strokeWidth="0.5"
              transform={`rotate(${angle} 125 125)`}
              animate={{ ry: breathPhase === 'inhale' || breathPhase === 'holdIn' ? 55 : 45 }}
              transition={{ duration: currentDuration, ease: 'easeInOut' }}
            />
          ))}

          {/* Inner petals */}
          {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
            <motion.ellipse
              key={`inner-${angle}`}
              cx="125"
              cy="100"
              rx="14"
              ry="32"
              fill="rgba(255,215,0,0.15)"
              stroke="rgba(255,215,0,0.2)"
              strokeWidth="0.5"
              transform={`rotate(${angle} 125 125)`}
            />
          ))}

          {/* Center circle */}
          <circle cx="125" cy="125" r="18" fill="url(#lotus-center)" />
          <circle cx="125" cy="125" r="8" fill="rgba(255,215,0,0.5)" />
        </motion.svg>
      </div>

      {/* Phase label + timer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={breathPhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center"
        >
          <p className="text-2xl font-light text-[#d4a44c]">
            {PHASE_LABELS[breathPhase]}
          </p>
          <p className="text-sm text-[#d4a44c]/60 mt-1">
            {timer + 1} / {currentDuration}s
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Cycle counter */}
      <div className="flex gap-1.5">
        {Array.from({ length: pattern.cycles }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              i < cycleCount ? 'bg-[#d4a44c]' : 'bg-[#d4a44c]/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
