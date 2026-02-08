/**
 * BreathingRing - Circular breathing timer with animated progress ring
 *
 * Replaces the simple text-based timer with a beautiful radial progress
 * visualization. The ring expands on inhale, holds steady, and contracts
 * on exhale — creating a visual breathing guide.
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
/** A single step in a breathing exercise sequence */
interface BreathingStep {
  phase: 'inhale' | 'hold' | 'exhale' | 'rest'
  duration: number
  instruction?: string
}

interface BreathingRingProps {
  steps: BreathingStep[]
  onComplete: () => void
}

const PHASE_CONFIG = {
  inhale: { label: 'Breathe In', color: '#60a5fa', bgGlow: 'shadow-blue-500/20' },
  hold: { label: 'Hold', color: '#a78bfa', bgGlow: 'shadow-purple-500/20' },
  exhale: { label: 'Release', color: '#fbbf24', bgGlow: 'shadow-amber-500/20' },
  rest: { label: 'Rest', color: '#34d399', bgGlow: 'shadow-emerald-500/20' },
}

export default function BreathingRing({ steps, onComplete }: BreathingRingProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(steps[0]?.duration || 4)
  const [isActive, setIsActive] = useState(true)

  const totalSteps = steps.length
  const step = steps[stepIndex]
  const phase = step?.phase || 'rest'
  const config = PHASE_CONFIG[phase]

  // Progress through the entire exercise (0 to 1)
  const completedSteps = stepIndex
  const globalProgress = totalSteps > 0 ? completedSteps / totalSteps : 0

  // Progress within current step (1 to 0 countdown)
  const stepProgress = step ? timeLeft / step.duration : 0

  const handleComplete = useCallback(() => {
    setIsActive(false)
    onComplete()
  }, [onComplete])

  useEffect(() => {
    if (!isActive || stepIndex >= totalSteps) {
      if (stepIndex >= totalSteps) handleComplete()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const next = stepIndex + 1
          if (next >= totalSteps) {
            setIsActive(false)
            clearInterval(timer)
            handleComplete()
            return 0
          }
          setStepIndex(next)
          return steps[next].duration
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [stepIndex, isActive, totalSteps, steps, handleComplete])

  if (stepIndex >= totalSteps && !isActive) return null

  // SVG ring calculations
  const size = 200
  const strokeWidth = 4
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius

  // Outer ring: overall progress
  const outerOffset = circumference * (1 - globalProgress)

  // Scale factor: expands on inhale, contracts on exhale
  const scaleMap = {
    inhale: 0.85 + 0.15 * (1 - stepProgress), // Grows from 0.85 to 1.0
    hold: 1.0,
    exhale: 0.85 + 0.15 * stepProgress, // Shrinks from 1.0 to 0.85
    rest: 0.85,
  }
  // Respect prefers-reduced-motion: keep timer/labels, simplify animations
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  }, [])

  const breathScale = prefersReducedMotion ? 1.0 : scaleMap[phase]

  return (
    <div className="flex flex-col items-center">
      {/* Breathing Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Ambient glow */}
        <div
          className={`absolute inset-4 rounded-full blur-2xl ${prefersReducedMotion ? '' : 'transition-all duration-1000'} ${config.bgGlow}`}
          style={{
            backgroundColor: config.color,
            opacity: 0.08,
            transform: `scale(${breathScale})`,
          }}
        />

        {/* SVG Rings */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />

          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={outerOffset}
            className="transition-all duration-500 ease-linear"
            style={{ opacity: 0.6 }}
          />
        </svg>

        {/* Inner breathing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex flex-col items-center justify-center transition-transform"
            style={{
              width: size * 0.6,
              height: size * 0.6,
              transform: `scale(${breathScale})`,
              transitionDuration: `${step?.duration || 4}s`,
              transitionTimingFunction: phase === 'inhale' ? 'ease-in' : phase === 'exhale' ? 'ease-out' : 'linear',
              background: `radial-gradient(circle, ${config.color}15, transparent)`,
              border: `1px solid ${config.color}30`,
            }}
          >
            <span className="text-3xl font-extralight text-white tabular-nums">
              {timeLeft}
            </span>
            <span className="text-xs font-medium mt-0.5" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Instruction + step counter */}
      <p className="text-xs text-white/40 mt-3 text-center max-w-[200px]">
        {step?.instruction}
      </p>
      <p className="text-[10px] text-white/20 mt-1">
        Step {stepIndex + 1} of {totalSteps}
      </p>

      {/* Step dots */}
      <div className="flex gap-1 mt-2.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < stepIndex
                ? '#34d399' // completed
                : i === stepIndex
                  ? config.color // current
                  : 'rgba(255,255,255,0.15)', // upcoming
              transform: i === stepIndex ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={() => { setIsActive(false); onComplete() }}
        className="text-[10px] text-white/20 hover:text-white/40 transition-colors mt-3"
      >
        End breathing
      </button>
    </div>
  )
}
