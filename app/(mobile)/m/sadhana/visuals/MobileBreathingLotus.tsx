'use client'

/**
 * MobileBreathingLotus — Full-screen SVG lotus that breathes with the user.
 * 16 petals (8 outer + 8 inner) animate according to the breathing pattern.
 * Uses Framer Motion for smooth petal scaling and color transitions.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { BreathingPattern } from '@/types/sadhana.types'

type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut'

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale:  '#06B6D4',
  holdIn:  '#D4A017',
  exhale:  '#F97316',
  holdOut: '#1B4FBB',
}

/** Darker shades for gradient base (3D depth effect) */
const PHASE_COLORS_DARK: Record<BreathPhase, string> = {
  inhale:  '#065F73',
  holdIn:  '#8B6914',
  exhale:  '#C25E12',
  holdOut: '#0E2F7A',
}

/** Warmer inner-petal tint (mixed toward gold) */
const PHASE_COLORS_INNER: Record<BreathPhase, string> = {
  inhale:  '#1A9FB5',
  holdIn:  '#D4A017',
  exhale:  '#E8943A',
  holdOut: '#2A5FBB',
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
}

export function MobileBreathingLotus({ pattern, onComplete }: MobileBreathingLotusProps) {
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale')
  const [currentCycle, setCurrentCycle] = useState(0)
  const [cycleProgress, setCycleProgress] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const cycleStartRef = useRef(Date.now())
  const rafRef = useRef<number>()

  useEffect(() => { onCompleteRef.current = onComplete })

  const totalCycleDuration = Math.max(1, (pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut) * 1000)

  // Smooth progress arc via requestAnimationFrame
  const updateProgress = useCallback(() => {
    if (completedRef.current) return
    const elapsed = Date.now() - cycleStartRef.current
    const progress = Math.min(elapsed / totalCycleDuration, 1)
    setCycleProgress(progress)
    rafRef.current = requestAnimationFrame(updateProgress)
  }, [totalCycleDuration])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(updateProgress)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [updateProgress])

  useEffect(() => {
    completedRef.current = false

    const runBreathCycle = (cycle: number) => {
      if (completedRef.current) return
      if (cycle >= pattern.cycles) {
        completedRef.current = true
        onCompleteRef.current()
        return
      }

      setCurrentCycle(cycle)
      cycleStartRef.current = Date.now()

      const allPhases: { phase: BreathPhase; duration: number }[] = [
        { phase: 'inhale' as const, duration: pattern.inhale * 1000 },
        { phase: 'holdIn' as const, duration: pattern.holdIn * 1000 },
        { phase: 'exhale' as const, duration: pattern.exhale * 1000 },
        { phase: 'holdOut' as const, duration: pattern.holdOut * 1000 },
      ]
      const phases = allPhases.filter(p => p.duration > 0)

      const runPhase = (index: number) => {
        if (completedRef.current || index >= phases.length) {
          if (!completedRef.current) runBreathCycle(cycle + 1)
          return
        }
        const { phase, duration } = phases[index]
        setBreathPhase(phase)
        timeoutRef.current = setTimeout(() => runPhase(index + 1), duration)
      }

      runPhase(0)
    }

    runBreathCycle(0)
    return () => {
      completedRef.current = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [pattern, totalCycleDuration])

  // Containment math: outer petal is 110px tall, container is 300px (radius 150px).
  // Gold ring SVG radius=155 in 320 viewBox ≈ 145px in 300px container coords.
  // Safe max: (145 * 0.92) / 110 ≈ 1.21. Use 1.08 for comfortable margin.
  // Hold pulse adds 2% on top → 110 * 1.08 * 1.02 = 121.2px < 145px ✓
  const petalScale = breathPhase === 'inhale' || breathPhase === 'holdIn'
    ? { scaleX: 1, scaleY: 1.08 }
    : { scaleX: 0.85, scaleY: 0.65 }

  const holdPulse = breathPhase === 'holdIn'
    ? { scale: [1, 1.02, 1] }
    : {}

  const phaseDuration = breathPhase === 'inhale'
    ? pattern.inhale
    : breathPhase === 'holdIn'
    ? pattern.holdIn
    : breathPhase === 'exhale'
    ? pattern.exhale
    : pattern.holdOut

  const currentColor = PHASE_COLORS[breathPhase]
  const currentColorDark = PHASE_COLORS_DARK[breathPhase]
  const currentColorInner = PHASE_COLORS_INNER[breathPhase]
  const label = PHASE_LABELS[breathPhase]

  return (
    <div className="relative flex flex-col items-center justify-center">
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
          transition={{ duration: 0.05, ease: 'linear' }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '160px 160px' }}
          opacity={0.4}
        />
      </svg>

      {/* Lotus container — overflow clipped to gold ring boundary */}
      <div className="relative w-[300px] h-[300px]" style={{ borderRadius: '50%', overflow: 'hidden' }}>
        {/* Outer petals (8) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8
          return (
            <motion.div
              key={`outer-${i}`}
              className="absolute left-1/2 top-1/2 origin-bottom"
              style={{
                width: 40,
                height: 110,
                marginLeft: -20,
                marginTop: -110,
                rotate: angle,
              }}
              animate={{
                ...petalScale,
                ...holdPulse,
              }}
              transition={{
                type: 'tween',
                duration: phaseDuration,
                ease: 'easeInOut',
                ...(breathPhase === 'holdIn' ? { repeat: Infinity, duration: 0.5 } : {}),
              }}
            >
              <motion.div
                className="w-full h-full"
                animate={{
                  background: `linear-gradient(to top, ${currentColorDark}, ${currentColor})`,
                }}
                transition={{ duration: 0.8 }}
                style={{
                  opacity: 0.88,
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                  background: `linear-gradient(to top, ${currentColorDark}, ${currentColor})`,
                  boxShadow: `0 0 6px ${currentColor}30`,
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
                width: 28,
                height: 72,
                marginLeft: -14,
                marginTop: -72,
                rotate: angle,
              }}
              animate={{
                ...petalScale,
                ...holdPulse,
              }}
              transition={{
                type: 'tween',
                duration: phaseDuration,
                ease: 'easeInOut',
                delay: 0.08,
                ...(breathPhase === 'holdIn' ? { repeat: Infinity, duration: 0.5, delay: 0.1 } : {}),
              }}
            >
              <motion.div
                className="w-full h-full"
                animate={{
                  background: `linear-gradient(to top, ${currentColorDark}, ${currentColorInner})`,
                }}
                transition={{ duration: 0.8, delay: 0.1 }}
                style={{
                  opacity: 0.7,
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                  background: `linear-gradient(to top, ${currentColorDark}, ${currentColorInner})`,
                  boxShadow: `0 0 4px ${currentColorInner}25`,
                }}
              />
            </motion.div>
          )
        })}

        {/* Center golden circle */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#D4A017]"
          animate={{
            boxShadow: [
              '0 0 10px rgba(212,160,23,0.5), 0 0 20px rgba(212,160,23,0.2)',
              '0 0 24px rgba(212,160,23,0.8), 0 0 40px rgba(212,160,23,0.3)',
              '0 0 10px rgba(212,160,23,0.5), 0 0 20px rgba(212,160,23,0.2)',
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
    </div>
  )
}
