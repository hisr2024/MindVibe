'use client'

/**
 * Sleep Mode Control Component
 *
 * UI for gradual sleep induction:
 * - Sleep content selection
 * - Timer settings
 * - Gentle wake-up alarm
 * - Volume fade controls
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Moon,
  Play,
  Pause,
  Clock,
  Volume2,
  Bell,
  Sun,
  Sparkles,
  Leaf,
  Heart,
  CloudMoon
} from 'lucide-react'

// ============ Types ============

export type SleepContentType = 'story' | 'body_scan' | 'gratitude' | 'breath_count' | 'visualization'

export interface SleepModeControlProps {
  isActive?: boolean
  onToggle?: (active: boolean) => void
  onContentChange?: (content: SleepContentType) => void
  onTimerSet?: (minutes: number) => void
  onWakeUpSet?: (time: string | null) => void
  compact?: boolean
  className?: string
}

// ============ Configuration ============

const SLEEP_CONTENT: Record<SleepContentType, {
  name: string
  nameHindi: string
  description: string
  duration: string
  icon: typeof Moon
  color: string
}> = {
  story: {
    name: 'Sleep Story',
    nameHindi: 'नींद की कहानी',
    description: 'Peaceful narrative to drift off',
    duration: '15-20 min',
    icon: CloudMoon,
    color: 'text-indigo-400'
  },
  body_scan: {
    name: 'Body Scan',
    nameHindi: 'शरीर स्कैन',
    description: 'Progressive relaxation journey',
    duration: '10-15 min',
    icon: Sparkles,
    color: 'text-purple-400'
  },
  gratitude: {
    name: 'Gratitude',
    nameHindi: 'कृतज्ञता',
    description: 'Reflect on positive moments',
    duration: '8-10 min',
    icon: Heart,
    color: 'text-pink-400'
  },
  breath_count: {
    name: 'Breath Counting',
    nameHindi: 'श्वास गणना',
    description: 'Simple counting meditation',
    duration: '10-15 min',
    icon: Leaf,
    color: 'text-emerald-400'
  },
  visualization: {
    name: 'Peaceful Visualization',
    nameHindi: 'शांत कल्पना',
    description: 'Calming imagery journey',
    duration: '12-18 min',
    icon: Sparkles,
    color: 'text-blue-400'
  }
}

const TIMER_OPTIONS = [15, 30, 45, 60, 90]

// ============ Sleep Stars ============

function SleepStars() {
  /* eslint-disable react-hooks/purity */
  const stars = useMemo(
    () => Array.from({ length: 5 }, () => ({
      top: `${20 + Math.random() * 60}%`,
      left: `${20 + Math.random() * 60}%`,
      duration: 2 + Math.random() * 2,
    })),
    []
  )
  /* eslint-enable react-hooks/purity */

  return (
    <>
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-indigo-300"
          style={{ top: star.top, left: star.left }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: i * 0.5
          }}
        />
      ))}
    </>
  )
}

// ============ Sleep Progress Indicator ============

function SleepProgressIndicator({
  isPlaying,
  timerMinutes,
  elapsedMinutes
}: {
  isPlaying: boolean
  timerMinutes: number
  elapsedMinutes: number
}) {
  const progress = timerMinutes > 0 ? Math.min(elapsedMinutes / timerMinutes, 1) : 0

  return (
    <div className="relative w-32 h-32 mx-auto">
      {/* Background circle */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-white/10"
        />
        {isPlaying && (
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-indigo-400"
            strokeDasharray={`${progress * 264} 264`}
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isPlaying ? (
          <>
            <Moon className="w-6 h-6 text-indigo-400 mb-1" />
            <span className="text-lg font-semibold text-white">
              {Math.floor(timerMinutes - elapsedMinutes)}
            </span>
            <span className="text-[10px] text-white/50">min left</span>
          </>
        ) : (
          <>
            <Moon className="w-8 h-8 text-indigo-400/50" />
            <span className="text-xs text-white/40 mt-1">Ready</span>
          </>
        )}
      </div>

      {/* Animated stars */}
      {isPlaying && <SleepStars />}
    </div>
  )
}

// ============ Component ============

export function SleepModeControl({
  isActive = false,
  onToggle,
  onContentChange,
  onTimerSet,
  onWakeUpSet,
  compact = false,
  className = ''
}: SleepModeControlProps) {
  const [playing, setPlaying] = useState(isActive)
  const [selectedContent, setSelectedContent] = useState<SleepContentType>('story')
  const [timerMinutes, setTimerMinutes] = useState(30)
  const [elapsedMinutes, setElapsedMinutes] = useState(0)
  const [wakeUpTime, setWakeUpTime] = useState<string | null>(null)
  const [showWakeUp, setShowWakeUp] = useState(false)
  const [volumeFade, setVolumeFade] = useState(true)

  useEffect(() => {
    setPlaying(isActive)
  }, [isActive])

  // Timer countdown
  useEffect(() => {
    if (!playing) {
      setElapsedMinutes(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedMinutes(prev => {
        if (prev >= timerMinutes) {
          setPlaying(false)
          onToggle?.(false)
          return 0
        }
        return prev + 1/60 // Update every second (1/60 of a minute)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [playing, timerMinutes, onToggle])

  const handleToggle = useCallback(() => {
    const newState = !playing
    if (!newState) {
      setElapsedMinutes(0)
    }
    setPlaying(newState)
    onToggle?.(newState)
  }, [playing, onToggle])

  const handleContentChange = useCallback((content: SleepContentType) => {
    setSelectedContent(content)
    onContentChange?.(content)
  }, [onContentChange])

  const handleTimerChange = useCallback((minutes: number) => {
    setTimerMinutes(minutes)
    onTimerSet?.(minutes)
  }, [onTimerSet])

  const handleWakeUpChange = useCallback((time: string | null) => {
    setWakeUpTime(time)
    onWakeUpSet?.(time)
  }, [onWakeUpSet])

  const currentContent = SLEEP_CONTENT[selectedContent]
  const ContentIcon = currentContent.icon

  // Compact view
  if (compact) {
    return (
      <div className={`rounded-xl border border-indigo-500/20 bg-black/30 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Sleep Mode</p>
              <p className="text-[10px] text-white/50">{timerMinutes} min • {currentContent.name}</p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-all ${
              playing
                ? 'bg-indigo-500/30 text-indigo-300'
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
      className={`rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-black/40 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Moon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Sleep Mode</h3>
              <p className="text-xs text-white/50">Gradual Rest Induction</p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            className={`p-2.5 rounded-xl transition-all ${
              playing
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sleep Progress */}
      <div className="p-6 bg-gradient-to-b from-transparent to-indigo-500/5">
        <SleepProgressIndicator
          isPlaying={playing}
          timerMinutes={timerMinutes}
          elapsedMinutes={elapsedMinutes}
        />
      </div>

      {/* Content Selection */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs font-medium text-white/50 mb-3">Sleep Content</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(SLEEP_CONTENT) as SleepContentType[]).map((content) => {
            const config = SLEEP_CONTENT[content]
            const Icon = config.icon
            const isSelected = selectedContent === content

            return (
              <button
                key={content}
                onClick={() => handleContentChange(content)}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? `border-${config.color.replace('text-', '')}/50 bg-white/10`
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${isSelected ? config.color : 'text-white/40'}`} />
                <p className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-white/60'}`}>
                  {config.name}
                </p>
                <p className="text-[10px] text-white/30">{config.duration}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Timer Selection */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-white/50" />
          <span className="text-xs font-medium text-white/50">Sleep Timer</span>
        </div>
        <div className="flex gap-2">
          {TIMER_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              onClick={() => handleTimerChange(minutes)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                timerMinutes === minutes
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {minutes}m
            </button>
          ))}
        </div>
      </div>

      {/* Wake-up Alarm */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-white/50">Gentle Wake-Up</span>
          </div>
          <button
            onClick={() => setShowWakeUp(!showWakeUp)}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              wakeUpTime
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-white/5 text-white/40'
            }`}
          >
            {wakeUpTime || 'Set alarm'}
          </button>
        </div>

        <AnimatePresence>
          {showWakeUp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <Bell className="w-4 h-4 text-amber-400" />
                <input
                  type="time"
                  value={wakeUpTime || ''}
                  onChange={(e) => handleWakeUpChange(e.target.value || null)}
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                />
                {wakeUpTime && (
                  <button
                    onClick={() => handleWakeUpChange(null)}
                    className="text-xs text-white/40 hover:text-white/70"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[10px] text-white/30 mt-2 ml-1">
                Volume will gradually increase to wake you gently
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Volume Fade Toggle */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-white/50" />
            <span className="text-xs text-white/70">Auto-fade volume</span>
          </div>
          <button
            onClick={() => setVolumeFade(!volumeFade)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              volumeFade ? 'bg-indigo-500' : 'bg-white/20'
            }`}
          >
            <motion.div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
              animate={{ left: volumeFade ? 20 : 4 }}
            />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default SleepModeControl
