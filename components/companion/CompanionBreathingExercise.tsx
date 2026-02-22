'use client'

/**
 * CompanionBreathingExercise - In-chat guided breathing for KIAAN.
 *
 * When KIAAN detects anxiety/stress/overwhelm, this component renders
 * inline within the chat as an interactive breathing exercise.
 * Circular animation guides inhale → hold → exhale → rest.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface BreathingExerciseProps {
  /** Total cycles to complete */
  cycles?: number
  /** Called when exercise completes */
  onComplete?: () => void
  /** Optional mood for color adaptation */
  mood?: string
}

type Phase = 'ready' | 'inhale' | 'hold' | 'exhale' | 'rest' | 'complete'

const PHASE_CONFIG: Record<string, { label: string; duration: number; color: string }> = {
  ready: { label: 'Tap to begin', duration: 0, color: 'from-violet-500 to-indigo-500' },
  inhale: { label: 'Breathe in...', duration: 4000, color: 'from-sky-400 to-blue-500' },
  hold: { label: 'Hold gently...', duration: 4000, color: 'from-blue-500 to-indigo-500' },
  exhale: { label: 'Slowly release...', duration: 6000, color: 'from-indigo-500 to-violet-500' },
  rest: { label: 'Rest...', duration: 2000, color: 'from-violet-500 to-purple-500' },
  complete: { label: 'Well done', duration: 0, color: 'from-emerald-400 to-teal-500' },
}

const PHASE_ORDER: Phase[] = ['inhale', 'hold', 'exhale', 'rest']

export default function CompanionBreathingExercise({
  cycles = 3,
  onComplete,
  mood: _mood = 'neutral',
}: BreathingExerciseProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [currentCycle, setCurrentCycle] = useState(0)
  const [_phaseIndex, setPhaseIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const advancePhase = useCallback(() => {
    cleanup()

    setPhaseIndex(prev => {
      const next = prev + 1

      if (next >= PHASE_ORDER.length) {
        // End of one cycle
        setCurrentCycle(c => {
          const nextCycle = c + 1
          if (nextCycle >= cycles) {
            setPhase('complete')
            onComplete?.()
            return nextCycle
          }
          // Start next cycle
          setPhase(PHASE_ORDER[0])
          return nextCycle
        })
        return 0
      }

      setPhase(PHASE_ORDER[next])
      return next
    })
  }, [cleanup, cycles, onComplete])

  // Progress animation and phase timer
  useEffect(() => {
    if (phase === 'ready' || phase === 'complete') return

    const config = PHASE_CONFIG[phase]
    if (!config || config.duration === 0) return

    // Animate progress bar
    const startTime = Date.now()
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min(1, elapsed / config.duration))
    }, 50)

    // Auto-advance after duration
    timerRef.current = setTimeout(advancePhase, config.duration)

    return cleanup
  }, [phase, advancePhase, cleanup])

  const startExercise = () => {
    setPhase(PHASE_ORDER[0])
    setCurrentCycle(0)
    setPhaseIndex(0)
    setProgress(0)
  }

  const config = PHASE_CONFIG[phase]

  // Scale factor for breathing circle
  const scale =
    phase === 'inhale' ? 1.0 + progress * 0.4 :
    phase === 'hold' ? 1.4 :
    phase === 'exhale' ? 1.4 - progress * 0.4 :
    phase === 'rest' ? 1.0 :
    1.0

  return (
    <div className="flex flex-col items-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm">
      {/* Breathing circle */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Glow */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} blur-xl opacity-30 transition-transform duration-1000`}
          style={{ transform: `scale(${scale})` }}
        />

        {/* Main circle */}
        <div
          className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center transition-transform duration-1000 ease-in-out shadow-lg`}
          style={{ transform: `scale(${scale})` }}
          onClick={phase === 'ready' ? startExercise : undefined}
          role={phase === 'ready' ? 'button' : undefined}
        >
          {phase === 'complete' ? (
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-white/90 text-xs font-medium text-center px-2 leading-tight">
              {config.label}
            </span>
          )}
        </div>

        {/* Progress ring */}
        {phase !== 'ready' && phase !== 'complete' && (
          <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
              className="transition-all duration-100"
            />
          </svg>
        )}
      </div>

      {/* Cycle counter */}
      {phase !== 'ready' && phase !== 'complete' && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: cycles }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i < currentCycle
                  ? 'bg-emerald-400'
                  : i === currentCycle
                  ? 'bg-white/80 scale-125'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      )}

      {/* Status text */}
      <p className="text-[10px] text-white/40">
        {phase === 'ready' && 'Take a moment to breathe with me'}
        {phase === 'complete' && 'How do you feel now?'}
        {phase !== 'ready' && phase !== 'complete' &&
          `Cycle ${currentCycle + 1} of ${cycles}`
        }
      </p>
    </div>
  )
}
