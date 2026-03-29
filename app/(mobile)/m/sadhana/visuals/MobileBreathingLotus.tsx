'use client'

/**
 * MobileBreathingLotus — Full-screen SVG lotus that breathes with the user.
 * 16 petals (8 outer + 8 inner) animate according to the breathing pattern.
 * Uses Framer Motion for smooth petal scaling and color transitions.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import type { BreathingPattern } from '@/types/sadhana.types'

type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut'

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale:  '#06B6D4',
  holdIn:  '#D4A017',
  exhale:  '#F97316',
  holdOut: '#1B4FBB',
}

const PHASE_LABELS: Record<BreathPhase, { sanskrit: string; english: string }> = {
  inhale:  { sanskrit: 'श्वास लो', english: 'Breathe In' },
  holdIn:  { sanskrit: 'रोको', english: 'Hold' },
  exhale:  { sanskrit: 'छोड़ो', english: 'Release' },
  holdOut: { sanskrit: '·', english: '' },
}

interface MobileBreathingLotusProps {
  pattern: BreathingPattern
  onComplete: () => void
  onSkip?: () => void
}

export function MobileBreathingLotus({ pattern, onComplete, onSkip }: MobileBreathingLotusProps) {
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale')
  const [currentCycle, setCurrentCycle] = useState(0)
  const [cycleProgress, setCycleProgress] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const completedRef = useRef(false)

  const totalCycleDuration = (pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut) * 1000

  const runBreathCycle = useCallback((cycle: number) => {
    if (completedRef.current) return
    if (cycle >= pattern.cycles) {
      completedRef.current = true
      onComplete()
      return
    }

    setCurrentCycle(cycle)

    const phases: { phase: BreathPhase; duration: number }[] = [
      { phase: 'inhale', duration: pattern.inhale * 1000 },
      { phase: 'holdIn', duration: pattern.holdIn * 1000 },
      { phase: 'exhale', duration: pattern.exhale * 1100 },
      { phase: 'holdOut', duration: pattern.holdOut * 1000 },
    ].filter(p => p.duration > 0)

    let elapsed = 0
    const runPhase = (index: number) => {
      if (completedRef.current || index >= phases.length) {
        if (!completedRef.current) runBreathCycle(cycle + 1)
        return
      }
      const { phase, duration } = phases[index]
      setBreathPhase(phase)
      setCycleProgress(elapsed / totalCycleDuration)
      elapsed += duration
      timeoutRef.current = setTimeout(() => runPhase(index + 1), duration)
    }

    runPhase(0)
  }, [pattern, totalCycleDuration, onComplete])

  useEffect(() => {
    completedRef.current = false
    runBreathCycle(0)
    return () => {
      completedRef.current = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [runBreathCycle])

  const petalScale = breathPhase === 'inhale' || breathPhase === 'holdIn'
    ? { scaleX: 1, scaleY: 1.1 }
    : { scaleX: 0.5, scaleY: 0.55 }

  const holdPulse = breathPhase === 'holdIn'
    ? { scale: [1, 1.03, 1] }
    : {}

  const phaseDuration = breathPhase === 'inhale'
    ? pattern.inhale
    : breathPhase === 'holdIn'
    ? 0.5
    : breathPhase === 'exhale'
    ? pattern.exhale * 1.1
    : pattern.holdOut

  const currentColor = PHASE_COLORS[breathPhase]
  const label = PHASE_LABELS[breathPhase]

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh]">
      {/* Progress arc around lotus */}
      <svg
        className="absolute"
        width="320"
        height="320"
        viewBox="0 0 320 320"
      >
        <circle
          cx="160" cy="160" r="155"
          fill="none"
          stroke="rgba(212,160,23,0.15)"
          strokeWidth="1.5"
        />
        <motion.circle
          cx="160" cy="160" r="155"
          fill="none"
          stroke="#D4A017"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 155}
          animate={{
            strokeDashoffset: 2 * Math.PI * 155 * (1 - cycleProgress),
          }}
          transition={{ duration: 0.3 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '160px 160px' }}
          opacity={0.4}
        />
      </svg>

      {/* Lotus container */}
      <div className="relative w-[280px] h-[280px]">
        {/* Outer petals (8) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8
          return (
            <motion.div
              key={`outer-${i}`}
              className="absolute left-1/2 top-1/2 origin-bottom"
              style={{
                width: 36,
                height: 100,
                marginLeft: -18,
                marginTop: -100,
                rotate: angle,
              }}
              animate={{
                ...petalScale,
                ...holdPulse,
              }}
              transition={{
                duration: phaseDuration,
                ease: 'easeInOut',
                ...(breathPhase === 'holdIn' ? { repeat: Infinity, duration: 0.5 } : {}),
              }}
            >
              <motion.div
                className="w-full h-full rounded-full"
                animate={{ backgroundColor: currentColor }}
                transition={{ duration: 0.8 }}
                style={{
                  opacity: 0.6,
                  filter: 'blur(1px)',
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                }}
              />
            </motion.div>
          )
        })}

        {/* Inner petals (8, offset 22.5deg, smaller) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8 + 22.5
          return (
            <motion.div
              key={`inner-${i}`}
              className="absolute left-1/2 top-1/2 origin-bottom"
              style={{
                width: 24,
                height: 65,
                marginLeft: -12,
                marginTop: -65,
                rotate: angle,
              }}
              animate={{
                ...petalScale,
                ...holdPulse,
              }}
              transition={{
                duration: phaseDuration,
                ease: 'easeInOut',
                delay: 0.08,
                ...(breathPhase === 'holdIn' ? { repeat: Infinity, duration: 0.5, delay: 0.1 } : {}),
              }}
            >
              <motion.div
                className="w-full h-full rounded-full"
                animate={{ backgroundColor: currentColor }}
                transition={{ duration: 0.8, delay: 0.1 }}
                style={{
                  opacity: 0.45,
                  filter: 'blur(0.5px)',
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                }}
              />
            </motion.div>
          )
        })}

        {/* Center golden circle */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#D4A017]"
          animate={{
            boxShadow: [
              '0 0 8px rgba(212,160,23,0.4)',
              '0 0 20px rgba(212,160,23,0.7)',
              '0 0 8px rgba(212,160,23,0.4)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Phase indicator text */}
      <div className="mt-8 text-center">
        <motion.p
          key={breathPhase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-[family-name:var(--font-divine)] italic text-lg"
          style={{ color: currentColor }}
        >
          {label.sanskrit}
        </motion.p>
        <p className="text-xs text-[#B8AE98] mt-1 font-[family-name:var(--font-ui)]">
          {label.english}
        </p>
      </div>

      {/* Cycle counter dots */}
      <div className="flex items-center gap-2 mt-6">
        {Array.from({ length: pattern.cycles }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            animate={{
              backgroundColor: i < currentCycle ? '#D4A017' : i === currentCycle ? currentColor : 'rgba(212,160,23,0.25)',
              scale: i === currentCycle ? 1.3 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Skip button */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="absolute bottom-4 right-4 text-[10px] text-[#6B6355] font-[family-name:var(--font-ui)] opacity-60 hover:opacity-100 transition-opacity"
        >
          Skip
        </button>
      )}
    </div>
  )
}
