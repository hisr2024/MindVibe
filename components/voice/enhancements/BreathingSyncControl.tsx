'use client'

/**
 * Breathing Sync Control Component
 *
 * UI for voice-breathing synchronization:
 * - Breathing pattern selection
 * - Visual breathing guide
 * - Audio cue toggle
 * - Session timer
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Wind,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  Leaf,
  Moon,
  Zap,
  Heart
} from 'lucide-react'

// ============ Types ============

export type BreathingPattern =
  | 'relaxing_4_7_8'
  | 'box_breathing'
  | 'energizing'
  | 'calming'
  | 'sleep_inducing'
  | 'pranayama_basic'
  | 'coherence'

export type BreathPhase = 'inhale' | 'hold_in' | 'exhale' | 'hold_out'

export interface BreathingSyncControlProps {
  isActive?: boolean
  onToggle?: (active: boolean) => void
  onPatternChange?: (pattern: BreathingPattern) => void
  compact?: boolean
  className?: string
}

// ============ Configuration ============

const PATTERNS: Record<BreathingPattern, {
  name: string
  nameHindi: string
  description: string
  icon: typeof Wind
  color: string
  phases: { phase: BreathPhase; duration: number }[]
}> = {
  relaxing_4_7_8: {
    name: '4-7-8 Relaxing',
    nameHindi: '४-७-८ विश्राम',
    description: 'Deep relaxation for anxiety relief',
    icon: Leaf,
    color: 'text-emerald-400',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold_in', duration: 7 },
      { phase: 'exhale', duration: 8 }
    ]
  },
  box_breathing: {
    name: 'Box Breathing',
    nameHindi: 'बॉक्स श्वास',
    description: 'Equal timing for focus & calm',
    icon: Wind,
    color: 'text-blue-400',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold_in', duration: 4 },
      { phase: 'exhale', duration: 4 },
      { phase: 'hold_out', duration: 4 }
    ]
  },
  energizing: {
    name: 'Energizing',
    nameHindi: 'ऊर्जावान',
    description: 'Quick breaths for alertness',
    icon: Zap,
    color: 'text-yellow-400',
    phases: [
      { phase: 'inhale', duration: 2 },
      { phase: 'exhale', duration: 2 }
    ]
  },
  calming: {
    name: 'Calming',
    nameHindi: 'शांत करने वाला',
    description: 'Extended exhale for peace',
    icon: Heart,
    color: 'text-pink-400',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'exhale', duration: 6 }
    ]
  },
  sleep_inducing: {
    name: 'Sleep Inducing',
    nameHindi: 'नींद लाने वाला',
    description: 'Very slow for deep rest',
    icon: Moon,
    color: 'text-indigo-400',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold_in', duration: 7 },
      { phase: 'exhale', duration: 8 },
      { phase: 'hold_out', duration: 4 }
    ]
  },
  pranayama_basic: {
    name: 'Pranayama',
    nameHindi: 'प्राणायाम',
    description: 'Traditional yogic breathing',
    icon: Leaf,
    color: 'text-orange-400',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold_in', duration: 4 },
      { phase: 'exhale', duration: 4 },
      { phase: 'hold_out', duration: 2 }
    ]
  },
  coherence: {
    name: 'Heart Coherence',
    nameHindi: 'हृदय सामंजस्य',
    description: '5-second rhythm for HRV',
    icon: Heart,
    color: 'text-red-400',
    phases: [
      { phase: 'inhale', duration: 5 },
      { phase: 'exhale', duration: 5 }
    ]
  }
}

const PHASE_LABELS: Record<BreathPhase, { label: string; labelHindi: string }> = {
  inhale: { label: 'Breathe In', labelHindi: 'सांस लें' },
  hold_in: { label: 'Hold', labelHindi: 'रोकें' },
  exhale: { label: 'Breathe Out', labelHindi: 'सांस छोड़ें' },
  hold_out: { label: 'Rest', labelHindi: 'विश्राम' }
}

// ============ Breathing Visualizer ============

function BreathingVisualizer({
  pattern,
  isPlaying,
  currentPhase,
  progress
}: {
  pattern: BreathingPattern
  isPlaying: boolean
  currentPhase: BreathPhase
  progress: number
}) {
  const config = PATTERNS[pattern]
  const phaseInfo = PHASE_LABELS[currentPhase]

  // Calculate circle size based on phase
  const getCircleScale = () => {
    if (!isPlaying) return 1
    if (currentPhase === 'inhale') return 1 + (progress * 0.5)
    if (currentPhase === 'exhale') return 1.5 - (progress * 0.5)
    return currentPhase === 'hold_in' ? 1.5 : 1
  }

  return (
    <div className="relative w-full aspect-square max-w-[180px] mx-auto">
      {/* Outer guide circle */}
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10" />

      {/* Breathing circle */}
      <motion.div
        className={`absolute inset-4 rounded-full ${
          config.color.replace('text-', 'bg-')
        }/20 border-2 ${config.color.replace('text-', 'border-')}`}
        animate={{
          scale: getCircleScale(),
          opacity: isPlaying ? [0.6, 0.9, 0.6] : 0.5
        }}
        transition={{
          scale: { duration: 0.5, ease: 'easeInOut' },
          opacity: { duration: 2, repeat: Infinity }
        }}
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isPlaying ? (
          <>
            <motion.span
              key={currentPhase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-lg font-semibold ${config.color}`}
            >
              {phaseInfo.label}
            </motion.span>
            <span className="text-xs text-white/40">{phaseInfo.labelHindi}</span>
          </>
        ) : (
          <>
            <Wind className={`w-8 h-8 ${config.color} mb-1`} />
            <span className="text-xs text-white/50">Ready</span>
          </>
        )}
      </div>

      {/* Progress ring */}
      {isPlaying && (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={config.color}
            strokeDasharray={`${progress * 289} 289`}
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  )
}

// ============ Component ============

export function BreathingSyncControl({
  isActive = false,
  onToggle,
  onPatternChange,
  compact = false,
  className = ''
}: BreathingSyncControlProps) {
  const [playing, setPlaying] = useState(isActive)
  const [pattern, setPattern] = useState<BreathingPattern>('box_breathing')
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [audioCues, setAudioCues] = useState(true)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentPattern = PATTERNS[pattern]
  const currentPhase = currentPattern.phases[currentPhaseIndex]

  useEffect(() => {
    setPlaying(isActive)
  }, [isActive])

  // Breathing cycle logic
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    const phaseDuration = currentPhase.duration * 1000
    const tickInterval = 50 // Update every 50ms for smooth animation
    let elapsed = 0

    intervalRef.current = setInterval(() => {
      elapsed += tickInterval
      const progress = elapsed / phaseDuration

      if (progress >= 1) {
        // Move to next phase
        const nextIndex = (currentPhaseIndex + 1) % currentPattern.phases.length
        setCurrentPhaseIndex(nextIndex)
        setPhaseProgress(0)
        elapsed = 0

        // Count cycles
        if (nextIndex === 0) {
          setCycles(c => c + 1)
        }
      } else {
        setPhaseProgress(progress)
      }
    }, tickInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [playing, currentPhaseIndex, currentPattern, currentPhase])

  const handleToggle = useCallback(() => {
    const newState = !playing
    if (!newState) {
      setCurrentPhaseIndex(0)
      setPhaseProgress(0)
      setCycles(0)
    }
    setPlaying(newState)
    onToggle?.(newState)
  }, [playing, onToggle])

  const handlePatternChange = useCallback((newPattern: BreathingPattern) => {
    setPattern(newPattern)
    setCurrentPhaseIndex(0)
    setPhaseProgress(0)
    setCycles(0)
    onPatternChange?.(newPattern)
  }, [onPatternChange])

  const PatternIcon = currentPattern.icon

  // Calculate total cycle duration
  const cycleDuration = currentPattern.phases.reduce((acc, p) => acc + p.duration, 0)

  // Compact view
  if (compact) {
    return (
      <div className={`rounded-xl border border-emerald-500/20 bg-black/30 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Wind className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Breathing Sync</p>
              <p className="text-[10px] text-white/50">{currentPattern.name}</p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-all ${
              playing
                ? 'bg-emerald-500/30 text-emerald-300'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  // Full view
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-black/40 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Wind className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Breathing Guide</h3>
              <p className="text-xs text-white/50">Voice-Synced Breathwork</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Cues Toggle */}
            <button
              onClick={() => setAudioCues(!audioCues)}
              className={`p-2 rounded-lg transition-colors ${
                audioCues ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/50'
              }`}
            >
              {audioCues ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Play/Pause */}
            <button
              onClick={handleToggle}
              className={`p-2.5 rounded-xl transition-all ${
                playing
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Breathing Visualizer */}
      <div className="p-6">
        <BreathingVisualizer
          pattern={pattern}
          isPlaying={playing}
          currentPhase={currentPhase.phase}
          progress={phaseProgress}
        />

        {/* Cycle Counter */}
        {playing && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-white/50">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{cycleDuration}s/cycle</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="text-xs text-white/50">
              Cycles: <span className="text-emerald-400 font-medium">{cycles}</span>
            </div>
          </div>
        )}
      </div>

      {/* Pattern Selection */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs font-medium text-white/50 mb-3">Breathing Pattern</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(PATTERNS) as BreathingPattern[]).slice(0, 4).map((p) => {
            const config = PATTERNS[p]
            const Icon = config.icon
            const isSelected = pattern === p

            return (
              <button
                key={p}
                onClick={() => handlePatternChange(p)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? `border-${config.color.replace('text-', '')}/50 bg-white/10`
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 mx-auto mb-1 ${isSelected ? config.color : 'text-white/40'}`} />
                <p className={`text-xs ${isSelected ? 'text-white' : 'text-white/60'}`}>
                  {config.name}
                </p>
              </button>
            )
          })}
        </div>

        {/* More patterns (collapsible) */}
        <details className="mt-3">
          <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
            More patterns...
          </summary>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(Object.keys(PATTERNS) as BreathingPattern[]).slice(4).map((p) => {
              const config = PATTERNS[p]
              const Icon = config.icon
              const isSelected = pattern === p

              return (
                <button
                  key={p}
                  onClick={() => handlePatternChange(p)}
                  className={`p-2 rounded-lg border transition-all ${
                    isSelected
                      ? `border-${config.color.replace('text-', '')}/50 bg-white/10`
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${isSelected ? config.color : 'text-white/40'}`} />
                  <p className={`text-[10px] ${isSelected ? 'text-white' : 'text-white/60'}`}>
                    {config.name}
                  </p>
                </button>
              )
            })}
          </div>
        </details>
      </div>

      {/* Current Pattern Info */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <PatternIcon className={`w-4 h-4 ${currentPattern.color}`} />
            <span className="text-sm font-medium text-white">{currentPattern.name}</span>
          </div>
          <p className="text-xs text-white/50">{currentPattern.description}</p>
          <div className="flex gap-2 mt-2">
            {currentPattern.phases.map((phase, idx) => (
              <span
                key={idx}
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  playing && idx === currentPhaseIndex
                    ? 'bg-emerald-500/30 text-emerald-300'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {phase.duration}s {PHASE_LABELS[phase.phase].label.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BreathingSyncControl
