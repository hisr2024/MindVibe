'use client'

/**
 * MobileBreathMandala — A Living Lotus That Breathes With You
 *
 * An 8-petal SVG lotus mandala that expands on inhale, holds,
 * contracts on exhale, and rests — creating a full pranayama
 * cycle. Teal on inhale, golden-teal on hold, saffron on exhale.
 *
 * Extends the BreathingLotus pattern from sadhana visuals
 * with sacred mobile enhancements: haptics, particle bursts,
 * color transitions, and round completion lotus icons.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'pause'

interface BreathPattern {
  inhale: number
  hold_in: number
  exhale: number
  hold_out: number
}

interface MobileBreathMandalaProps {
  /** Breathing pattern in seconds per phase */
  pattern?: BreathPattern
  /** Number of full rounds to complete */
  rounds?: number
  /** Auto-start breathing */
  autoStart?: boolean
  /** Called when all rounds complete */
  onComplete?: () => void
  className?: string
}

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Release',
  pause: '',
}

/** Phase color themes */
const PHASE_COLORS: Record<BreathPhase, { petal: string; glow: string; center: string }> = {
  inhale: {
    petal: 'rgba(14, 116, 144, 0.6)',   // teal — ocean air
    glow: 'rgba(6, 182, 212, 0.3)',
    center: '#06B6D4',
  },
  hold: {
    petal: 'rgba(212, 160, 23, 0.5)',    // golden-teal blend
    glow: 'rgba(240, 192, 64, 0.3)',
    center: '#F0C040',
  },
  exhale: {
    petal: 'rgba(249, 115, 22, 0.5)',    // saffron — releasing fire
    glow: 'rgba(212, 160, 23, 0.3)',
    center: '#F97316',
  },
  pause: {
    petal: 'rgba(255, 255, 255, 0.08)',  // nearly invisible
    glow: 'rgba(255, 255, 255, 0.02)',
    center: '#6B6355',
  },
}

/** Petal angles for the 8-petal lotus */
const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
const INNER_PETAL_ANGLES = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]

export function MobileBreathMandala({
  pattern = { inhale: 4, hold_in: 7, exhale: 8, hold_out: 1 },
  rounds = 4,
  autoStart = false,
  onComplete,
  className = '',
}: MobileBreathMandalaProps) {
  const reduceMotion = useReducedMotion()
  const { triggerHaptic } = useHapticFeedback()

  const [isActive, setIsActive] = useState(autoStart)
  const [phase, setPhase] = useState<BreathPhase>('inhale')
  const [timer, setTimer] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  /** Current phase duration in seconds */
  const phaseDuration = (() => {
    switch (phase) {
      case 'inhale': return pattern.inhale
      case 'hold': return pattern.hold_in
      case 'exhale': return pattern.exhale
      case 'pause': return pattern.hold_out
    }
  })()

  /** Advance to next phase */
  const advancePhase = useCallback(() => {
    setPhase(current => {
      let next: BreathPhase
      if (current === 'inhale') next = pattern.hold_in > 0 ? 'hold' : 'exhale'
      else if (current === 'hold') next = 'exhale'
      else if (current === 'exhale') next = pattern.hold_out > 0 ? 'pause' : 'inhale'
      else {
        // pause → inhale = cycle complete
        setCycleCount(c => {
          const nextCount = c + 1
          if (nextCount >= rounds) {
            setIsComplete(true)
            setIsActive(false)
            triggerHaptic('success')
            onCompleteRef.current?.()
          }
          return nextCount
        })
        next = 'inhale'
      }

      // Haptic at each phase transition
      triggerHaptic('light')
      return next
    })
    setTimer(0)
  }, [pattern, rounds, triggerHaptic])

  /** Main timer */
  useEffect(() => {
    if (!isActive || isComplete) return

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev + 1 >= phaseDuration) {
          advancePhase()
          return 0
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isComplete, phaseDuration, advancePhase])

  const handleStart = () => {
    triggerHaptic('medium')
    setIsActive(true)
    setPhase('inhale')
    setTimer(0)
    setCycleCount(0)
    setIsComplete(false)
  }

  const handlePause = () => {
    triggerHaptic('selection')
    setIsActive(false)
  }

  const handleResume = () => {
    triggerHaptic('selection')
    setIsActive(true)
  }

  // Scale for petals based on breath phase
  const petalScale = (() => {
    const progress = phaseDuration > 0 ? timer / phaseDuration : 0
    switch (phase) {
      case 'inhale': return 0.55 + progress * 0.45 // 0.55 → 1.0
      case 'hold': return 1.0 + Math.sin(progress * Math.PI * 2) * 0.02 // gentle pulse
      case 'exhale': return 1.0 - progress * 0.45 // 1.0 → 0.55
      case 'pause': return 0.55
    }
  })()

  const colors = PHASE_COLORS[phase]

  // Completion view
  if (isComplete) {
    return (
      <div className={`flex flex-col items-center py-8 ${className}`}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative"
          style={{ width: '70vw', maxWidth: 280, aspectRatio: '1' }}
        >
          <svg viewBox="0 0 300 300" className="w-full h-full">
            {/* All petals fully bloomed in gold */}
            {PETAL_ANGLES.map(angle => (
              <ellipse
                key={angle}
                cx="150" cy="85" rx="22" ry="55"
                fill="rgba(212, 160, 23, 0.4)"
                stroke="rgba(212, 160, 23, 0.3)"
                strokeWidth="0.5"
                transform={`rotate(${angle} 150 150)`}
              />
            ))}
            {INNER_PETAL_ANGLES.map(angle => (
              <ellipse
                key={`inner-${angle}`}
                cx="150" cy="100" rx="14" ry="35"
                fill="rgba(255, 215, 0, 0.15)"
                stroke="rgba(255, 215, 0, 0.2)"
                strokeWidth="0.5"
                transform={`rotate(${angle} 150 150)`}
              />
            ))}
            <circle cx="150" cy="150" r="18" fill="rgba(212, 160, 23, 0.6)" />
          </svg>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
          style={{
            color: 'var(--sacred-divine-gold, #D4A017)',
            fontSize: '18px',
            fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
            fontStyle: 'italic',
          }}
        >
          Pranayama Complete
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs mt-1"
          style={{ color: 'var(--sacred-text-muted, #6B6355)' }}
        >
          {rounds} sacred rounds completed
        </motion.p>
      </div>
    )
  }

  // Start screen
  if (!isActive && cycleCount === 0) {
    return (
      <div className={`flex flex-col items-center py-8 ${className}`}>
        <div className="relative" style={{ width: '70vw', maxWidth: 280, aspectRatio: '1' }}>
          <svg viewBox="0 0 300 300" className="w-full h-full">
            {/* Dim petals */}
            {PETAL_ANGLES.map(angle => (
              <ellipse
                key={angle}
                cx="150" cy="85" rx="22" ry="45"
                fill="rgba(14, 116, 144, 0.15)"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.5"
                transform={`rotate(${angle} 150 150)`}
              />
            ))}
            <circle cx="150" cy="150" r="18" fill="rgba(212, 160, 23, 0.3)" />
          </svg>

          {/* Start button overlay */}
          <motion.button
            className="absolute inset-0 m-auto rounded-full flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, rgba(14,116,144,0.6), rgba(6,182,212,0.4))',
              border: '1px solid rgba(212,160,23,0.3)',
              boxShadow: '0 0 32px rgba(6,182,212,0.2)',
            }}
            whileTap={{ scale: 0.9 }}
            onClick={handleStart}
            aria-label="Begin breathing exercise"
          >
            <svg className="w-8 h-8" fill="none" stroke="var(--sacred-text-primary, #EDE8DC)" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          </motion.button>
        </div>

        <p
          className="mt-4 text-center text-sm"
          style={{
            color: 'var(--sacred-text-secondary, #B8AE98)',
            fontFamily: 'var(--font-ui, Outfit, sans-serif)',
          }}
        >
          Follow the sacred mandala. Let it breathe you.
        </p>
      </div>
    )
  }

  // Active breathing view
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* The Living Breath Mandala */}
      <div className="relative" style={{ width: '80vw', maxWidth: 320, aspectRatio: '1' }}>
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          }}
          animate={{ scale: petalScale * 1.15, opacity: phase === 'pause' ? 0.1 : 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        <motion.svg
          viewBox="0 0 300 300"
          className="w-full h-full relative"
          animate={{ scale: reduceMotion ? 1 : petalScale }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <defs>
            <radialGradient id="breath-center">
              <stop offset="0%" stopColor={colors.center} stopOpacity="0.8" />
              <stop offset="100%" stopColor={colors.center} stopOpacity="0.2" />
            </radialGradient>
          </defs>

          {/* Inner geometry ring — rotates during inhale */}
          <motion.circle
            cx="150" cy="150" r="42"
            fill="none"
            stroke={colors.center}
            strokeWidth="0.5"
            strokeOpacity="0.2"
            strokeDasharray="4 8"
            animate={!reduceMotion ? { rotate: phase === 'inhale' ? 360 : 0 } : {}}
            transition={{ duration: phaseDuration, ease: 'linear' }}
            style={{ transformOrigin: '150px 150px' }}
          />

          {/* Outer petals */}
          {PETAL_ANGLES.map((angle, i) => (
            <motion.ellipse
              key={angle}
              cx="150"
              cy="85"
              rx="22"
              ry={phase === 'inhale' || phase === 'hold' ? 55 : 40}
              fill={colors.petal}
              stroke={`${colors.center}40`}
              strokeWidth="0.5"
              transform={`rotate(${angle} 150 150)`}
              transition={{ duration: phaseDuration * 0.8, delay: i * 0.02, ease: 'easeInOut' }}
            />
          ))}

          {/* Inner petals */}
          {INNER_PETAL_ANGLES.map(angle => (
            <ellipse
              key={`inner-${angle}`}
              cx="150" cy="100" rx="14" ry="32"
              fill={`${colors.center}15`}
              stroke={`${colors.center}20`}
              strokeWidth="0.5"
              transform={`rotate(${angle} 150 150)`}
            />
          ))}

          {/* Center circle */}
          <circle cx="150" cy="150" r="18" fill="url(#breath-center)" />
          <motion.circle
            cx="150" cy="150" r="8"
            fill={colors.center}
            animate={!reduceMotion ? { opacity: [0.4, 0.8, 0.4] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Duration arc around center */}
          <circle
            cx="150" cy="150" r="28"
            fill="none"
            stroke={colors.center}
            strokeWidth="2"
            strokeOpacity="0.3"
            strokeDasharray={`${(timer / phaseDuration) * 175.9} 175.9`}
            strokeLinecap="round"
            transform="rotate(-90 150 150)"
          />
        </motion.svg>
      </div>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-4 text-center"
        >
          <p
            style={{
              color: colors.center,
              fontSize: '22px',
              fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
              fontWeight: 300,
            }}
          >
            {PHASE_LABELS[phase]}
          </p>
          {phase !== 'pause' && (
            <p
              className="mt-1"
              style={{
                color: `${colors.center}80`,
                fontSize: '14px',
                fontFamily: 'var(--font-ui, Outfit, sans-serif)',
              }}
            >
              {timer + 1} / {phaseDuration}s
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pause/Resume control */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={isActive ? handlePause : handleResume}
        className="mt-4 w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        aria-label={isActive ? 'Pause' : 'Resume'}
      >
        {isActive ? (
          <svg className="w-5 h-5" fill="none" stroke="var(--sacred-text-primary,#EDE8DC)" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="var(--sacred-text-primary,#EDE8DC)" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
        )}
      </motion.button>

      {/* Round counter — lotus icons */}
      <div className="flex gap-2 mt-4">
        {Array.from({ length: rounds }, (_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{
              background: i < cycleCount
                ? 'var(--sacred-divine-gold, #D4A017)'
                : 'rgba(212, 160, 23, 0.2)',
              boxShadow: i < cycleCount
                ? '0 0 8px rgba(212, 160, 23, 0.5)'
                : 'none',
            }}
            animate={
              i === cycleCount && isActive && !reduceMotion
                ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  )
}

export default MobileBreathMandala
