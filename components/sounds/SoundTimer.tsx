'use client'

/**
 * Sound Timer Component
 *
 * Beautiful timer for ambient sound sessions:
 * - Preset durations (15, 30, 45, 60, 90 min)
 * - Custom timer with circular visualization
 * - Sleep timer with fade out
 * - Alarm/notification options
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Timer,
  Moon,
  Bell,
  BellOff,
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Infinity as InfinityIcon
} from 'lucide-react'

export interface SoundTimerProps {
  onTimerEnd?: () => void
  onTimeUpdate?: (remainingSeconds: number) => void
  onFadeStart?: (fadeSeconds: number) => void
  className?: string
}

const PRESET_DURATIONS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '90m', minutes: 90 },
  { label: '2h', minutes: 120 },
]

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Circular progress component
function CircularProgress({
  progress,
  size = 200,
  strokeWidth = 8,
  color = '#ff9159'
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress * circumference)

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 0.5s ease',
          filter: `drop-shadow(0 0 10px ${color})`
        }}
      />
    </svg>
  )
}

export function SoundTimer({
  onTimerEnd,
  onTimeUpdate,
  onFadeStart,
  className = ''
}: SoundTimerProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isInfinite, setIsInfinite] = useState(true)
  const [fadeEnabled, setFadeEnabled] = useState(true)
  const [fadeSeconds, setFadeSeconds] = useState(30)
  const [showAlarm, setShowAlarm] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Timer countdown
  useEffect(() => {
    if (!isActive || isPaused || isInfinite) return

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          onTimerEnd?.()
          return 0
        }

        // Trigger fade if enabled
        if (fadeEnabled && prev === fadeSeconds + 1) {
          onFadeStart?.(fadeSeconds)
        }

        onTimeUpdate?.(prev - 1)
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isPaused, isInfinite, fadeEnabled, fadeSeconds, onTimerEnd, onTimeUpdate, onFadeStart])

  const handlePresetSelect = useCallback((minutes: number) => {
    const seconds = minutes * 60
    setTotalSeconds(seconds)
    setRemainingSeconds(seconds)
    setIsInfinite(false)
    setIsActive(true)
    setIsPaused(false)
  }, [])

  const handleInfiniteMode = useCallback(() => {
    setIsInfinite(true)
    setIsActive(true)
    setIsPaused(false)
    setTotalSeconds(0)
    setRemainingSeconds(0)
  }, [])

  const handleToggle = useCallback(() => {
    if (isActive) {
      setIsPaused(!isPaused)
    } else if (!isInfinite && totalSeconds > 0) {
      setIsActive(true)
      setIsPaused(false)
    }
  }, [isActive, isPaused, isInfinite, totalSeconds])

  const handleReset = useCallback(() => {
    setIsActive(false)
    setIsPaused(false)
    setRemainingSeconds(totalSeconds)
  }, [totalSeconds])

  const handleCustomTime = useCallback((delta: number) => {
    setTotalSeconds((prev) => Math.max(60, Math.min(7200, prev + delta)))
    setRemainingSeconds((prev) => Math.max(60, Math.min(7200, prev + delta)))
    if (isInfinite) {
      setIsInfinite(false)
    }
  }, [isInfinite])

  const progress = isInfinite ? 1 : totalSeconds > 0 ? remainingSeconds / totalSeconds : 0

  return (
    <motion.div
      className={`rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 overflow-hidden ${className}`}
      animate={{ height: expanded ? 'auto' : 'auto' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white text-sm">Timer</h3>
            <p className="text-xs text-white/50">
              {isInfinite
                ? 'Playing infinitely'
                : isActive
                  ? `${formatTime(remainingSeconds)} remaining`
                  : 'Set a timer'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && !isInfinite && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20"
              animate={{ opacity: isPaused ? 0.5 : 1 }}
            >
              <Timer className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-medium text-orange-300">
                {formatTime(remainingSeconds)}
              </span>
            </motion.div>
          )}
          {isInfinite && isActive && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20">
              <InfinityIcon className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Infinite</span>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-white/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Circular timer display */}
              <div className="flex justify-center py-4">
                <div className="relative">
                  <CircularProgress
                    progress={progress}
                    size={160}
                    strokeWidth={6}
                    color={isInfinite ? '#10b981' : '#ff9159'}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isInfinite ? (
                      <>
                        <InfinityIcon className="w-8 h-8 text-emerald-400 mb-1" />
                        <span className="text-xs text-white/50">Infinite</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-white">
                          {formatTime(remainingSeconds || totalSeconds)}
                        </span>
                        <span className="text-xs text-white/50">
                          {isActive ? (isPaused ? 'Paused' : 'Remaining') : 'Duration'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="space-y-2">
                <p className="text-xs text-white/40 font-medium">Quick Presets</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_DURATIONS.map(({ label, minutes }) => (
                    <button
                      key={label}
                      onClick={() => handlePresetSelect(minutes)}
                      className={`
                        py-2 px-3 rounded-xl text-xs font-medium transition-all
                        ${totalSeconds === minutes * 60 && !isInfinite
                          ? 'bg-orange-500/30 text-orange-300 border border-orange-500/30'
                          : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={handleInfiniteMode}
                    className={`
                      py-2 px-3 rounded-xl text-xs font-medium transition-all col-span-2
                      ${isInfinite
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                      }
                    `}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <InfinityIcon className="w-3 h-3" />
                      Infinite
                    </span>
                  </button>
                </div>
              </div>

              {/* Custom time adjustment */}
              {!isInfinite && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => handleCustomTime(-300)}
                    className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
                    disabled={totalSeconds <= 60}
                  >
                    -5m
                  </button>
                  <button
                    onClick={() => handleCustomTime(-60)}
                    className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
                    disabled={totalSeconds <= 60}
                  >
                    -1m
                  </button>
                  <button
                    onClick={() => handleCustomTime(60)}
                    className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
                    disabled={totalSeconds >= 7200}
                  >
                    +1m
                  </button>
                  <button
                    onClick={() => handleCustomTime(300)}
                    className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
                    disabled={totalSeconds >= 7200}
                  >
                    +5m
                  </button>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {!isInfinite && totalSeconds > 0 && (
                  <>
                    <button
                      onClick={handleReset}
                      className="p-3 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
                      title="Reset"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleToggle}
                      className={`
                        p-4 rounded-full transition-all
                        ${isActive && !isPaused
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                          : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                        }
                      `}
                    >
                      {isActive && !isPaused ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                {/* Fade out option */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">Fade out at end</span>
                  </div>
                  <button
                    onClick={() => setFadeEnabled(!fadeEnabled)}
                    className={`
                      relative w-11 h-6 rounded-full transition-colors
                      ${fadeEnabled ? 'bg-orange-500' : 'bg-white/10'}
                    `}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white"
                      animate={{ left: fadeEnabled ? 24 : 4 }}
                      transition={{ duration: 0.2 }}
                    />
                  </button>
                </div>

                {/* Alarm option */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showAlarm ? (
                      <Bell className="w-4 h-4 text-white/40" />
                    ) : (
                      <BellOff className="w-4 h-4 text-white/40" />
                    )}
                    <span className="text-sm text-white/70">Gentle alarm at end</span>
                  </div>
                  <button
                    onClick={() => setShowAlarm(!showAlarm)}
                    className={`
                      relative w-11 h-6 rounded-full transition-colors
                      ${showAlarm ? 'bg-orange-500' : 'bg-white/10'}
                    `}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white"
                      animate={{ left: showAlarm ? 24 : 4 }}
                      transition={{ duration: 0.2 }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default SoundTimer
