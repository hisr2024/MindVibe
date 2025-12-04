'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface BreathingPattern {
  inhale: number
  hold_in: number
  exhale: number
  hold_out: number
}

interface BreathingAnimationProps {
  pattern: BreathingPattern
  durationSeconds: number
  narration: string[]
  onComplete?: () => void
  className?: string
}

type Phase = 'inhale' | 'hold_in' | 'exhale' | 'hold_out'

const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Breathe In',
  hold_in: 'Hold',
  exhale: 'Breathe Out',
  hold_out: 'Rest',
}

const PHASE_COLORS: Record<Phase, string> = {
  inhale: 'from-orange-400 to-amber-300',
  hold_in: 'from-amber-400 to-yellow-300',
  exhale: 'from-blue-400 to-cyan-300',
  hold_out: 'from-purple-400 to-indigo-300',
}

export function BreathingAnimation({
  pattern,
  durationSeconds,
  narration,
  onComplete,
  className = '',
}: BreathingAnimationProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale')
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [currentNarration, setCurrentNarration] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const phaseStartTimeRef = useRef<number>(0)

  // Calculate total cycle duration
  const cycleDuration = pattern.inhale + pattern.hold_in + pattern.exhale + pattern.hold_out

  // Get current phase duration
  const getPhaseDuration = useCallback((phase: Phase) => {
    switch (phase) {
      case 'inhale': return pattern.inhale
      case 'hold_in': return pattern.hold_in
      case 'exhale': return pattern.exhale
      case 'hold_out': return pattern.hold_out
    }
  }, [pattern])

  // Get next phase
  const getNextPhase = (phase: Phase): Phase => {
    switch (phase) {
      case 'inhale': return 'hold_in'
      case 'hold_in': return 'exhale'
      case 'exhale': return 'hold_out'
      case 'hold_out': return 'inhale'
    }
  }

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!isActive || isPaused) return

    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp
      phaseStartTimeRef.current = timestamp
    }

    const deltaTime = (timestamp - lastTimeRef.current) / 1000
    lastTimeRef.current = timestamp

    // Update total elapsed time
    setTotalElapsed(prev => {
      const newElapsed = prev + deltaTime
      if (newElapsed >= durationSeconds) {
        setIsComplete(true)
        setIsActive(false)
        onComplete?.()
        return durationSeconds
      }
      return newElapsed
    })

    // Update phase progress
    const phaseElapsed = (timestamp - phaseStartTimeRef.current) / 1000
    const phaseDuration = getPhaseDuration(currentPhase)
    const progress = Math.min(phaseElapsed / phaseDuration, 1)
    setPhaseProgress(progress)

    // Check if phase is complete
    if (progress >= 1) {
      const nextPhase = getNextPhase(currentPhase)
      setCurrentPhase(nextPhase)
      phaseStartTimeRef.current = timestamp
      setPhaseProgress(0)

      // Update narration periodically
      if (nextPhase === 'inhale') {
        setCurrentNarration(prev => (prev + 1) % narration.length)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [isActive, isPaused, currentPhase, getPhaseDuration, durationSeconds, narration.length, onComplete])

  // Start/stop animation
  useEffect(() => {
    if (isActive && !isPaused) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, isPaused, animate])

  const handleStart = () => {
    setIsActive(true)
    setIsPaused(false)
    setCurrentPhase('inhale')
    setPhaseProgress(0)
    setTotalElapsed(0)
    lastTimeRef.current = 0
    phaseStartTimeRef.current = 0
  }

  const handlePause = () => {
    setIsPaused(true)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const handleResume = () => {
    setIsPaused(false)
    lastTimeRef.current = 0
  }

  // Calculate circle scale based on phase
  const getCircleScale = () => {
    switch (currentPhase) {
      case 'inhale':
        return 0.6 + (phaseProgress * 0.4) // 0.6 -> 1.0
      case 'hold_in':
        return 1.0
      case 'exhale':
        return 1.0 - (phaseProgress * 0.4) // 1.0 -> 0.6
      case 'hold_out':
        return 0.6
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingTime = Math.max(0, durationSeconds - totalElapsed)
  const overallProgress = (totalElapsed / durationSeconds) * 100

  if (isComplete) {
    return (
      <div className={`flex flex-col items-center py-8 ${className}`}>
        <div className="relative h-48 w-48 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-300/30 animate-pulse" />
          <div className="relative flex flex-col items-center">
            <span className="text-4xl mb-2">✨</span>
            <span className="text-lg font-semibold text-green-400">Complete</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isActive) {
    return (
      <div className={`flex flex-col items-center py-8 ${className}`}>
        <div className="relative h-48 w-48 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/20 to-amber-300/20" />
          <button
            onClick={handleStart}
            className="relative h-32 w-32 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-slate-900 font-semibold shadow-lg shadow-orange-500/30 hover:scale-105 transition-transform"
            aria-label="Start breathing exercise"
          >
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        <p className="mt-4 text-orange-100/70 text-center">
          Tap to begin the 2-minute breathing exercise
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center py-6 ${className}`}>
      {/* Main breathing circle */}
      <div className="relative h-56 w-56 flex items-center justify-center">
        {/* Outer glow */}
        <div
          className={`absolute rounded-full bg-gradient-to-br ${PHASE_COLORS[currentPhase]} blur-xl opacity-30`}
          style={{
            width: `${180 * getCircleScale()}px`,
            height: `${180 * getCircleScale()}px`,
            transition: 'width 0.3s ease-out, height 0.3s ease-out',
          }}
        />

        {/* Main circle */}
        <div
          className={`relative rounded-full bg-gradient-to-br ${PHASE_COLORS[currentPhase]} flex items-center justify-center shadow-lg`}
          style={{
            width: `${160 * getCircleScale()}px`,
            height: `${160 * getCircleScale()}px`,
            transition: 'width 0.3s ease-out, height 0.3s ease-out',
          }}
          role="img"
          aria-label={`Breathing circle: ${PHASE_LABELS[currentPhase]}`}
        >
          {/* Inner content */}
          <div className="text-center text-slate-900">
            <p className="text-lg font-bold">{PHASE_LABELS[currentPhase]}</p>
            <p className="text-2xl font-bold">
              {Math.ceil(getPhaseDuration(currentPhase) * (1 - phaseProgress))}
            </p>
          </div>
        </div>
      </div>

      {/* Timer and controls */}
      <div className="mt-6 flex items-center gap-4">
        <span className="text-2xl font-semibold text-orange-50">
          {formatTime(remainingTime)}
        </span>
        <button
          onClick={isPaused ? handleResume : handlePause}
          className="p-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
          aria-label={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <svg className="w-5 h-5 text-orange-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-orange-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          )}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full max-w-xs">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Narration */}
      <p className="mt-4 text-sm text-orange-100/70 text-center max-w-sm italic">
        {narration[currentNarration]}
      </p>

      {isPaused && (
        <p className="mt-2 text-xs text-orange-100/50">
          Paused - tap play to continue
        </p>
      )}
    </div>
  )
}

export default BreathingAnimation
