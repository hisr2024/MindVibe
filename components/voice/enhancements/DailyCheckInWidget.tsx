'use client'

/**
 * Daily Check-In Widget Component
 *
 * UI for voice-guided wellness check-ins:
 * - Morning/evening check-in prompts
 * - Mood & energy tracking
 * - Quick voice responses
 * - Trend visualization
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Moon,
  Mic,
  TrendingUp,
  Heart,
  Zap,
  CloudSun,
  Smile,
  Meh,
  Frown,
  ThumbsUp
} from 'lucide-react'

// ============ Types ============

export type CheckInTime = 'morning' | 'evening' | 'midday'

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export type EnergyLevel = 'depleted' | 'low' | 'moderate' | 'good' | 'excellent'

export interface CheckInData {
  mood: MoodLevel
  energy: EnergyLevel
  gratitude?: string
  intention?: string
  timestamp: Date
}

export interface DailyCheckInWidgetProps {
  onStartCheckIn?: (type: CheckInTime) => void
  onMoodSelect?: (mood: MoodLevel) => void
  onEnergySelect?: (energy: EnergyLevel) => void
  onComplete?: (data: CheckInData) => void
  recentCheckIns?: CheckInData[]
  compact?: boolean
  className?: string
}

// ============ Configuration ============

const CHECK_IN_TYPES: Record<CheckInTime, {
  name: string
  nameHindi: string
  greeting: string
  icon: typeof Sun
  color: string
  gradient: string
}> = {
  morning: {
    name: 'Morning Check-In',
    nameHindi: 'सुबह की जांच',
    greeting: 'Good morning! How are you feeling today?',
    icon: Sun,
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-orange-500/20'
  },
  midday: {
    name: 'Midday Pause',
    nameHindi: 'दोपहर का विराम',
    greeting: 'Taking a moment to check in. How is your day going?',
    icon: CloudSun,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  evening: {
    name: 'Evening Reflection',
    nameHindi: 'शाम का चिंतन',
    greeting: 'Time for evening reflection. How was your day?',
    icon: Moon,
    color: 'text-indigo-400',
    gradient: 'from-indigo-500/20 to-purple-500/20'
  }
}

const MOOD_OPTIONS: { level: MoodLevel; label: string; icon: typeof Smile; color: string }[] = [
  { level: 1, label: 'Struggling', icon: Frown, color: 'text-red-400' },
  { level: 2, label: 'Low', icon: Frown, color: 'text-orange-400' },
  { level: 3, label: 'Okay', icon: Meh, color: 'text-yellow-400' },
  { level: 4, label: 'Good', icon: Smile, color: 'text-green-400' },
  { level: 5, label: 'Great', icon: Smile, color: 'text-emerald-400' }
]

const ENERGY_OPTIONS: { level: EnergyLevel; label: string; bars: number }[] = [
  { level: 'depleted', label: 'Depleted', bars: 1 },
  { level: 'low', label: 'Low', bars: 2 },
  { level: 'moderate', label: 'Moderate', bars: 3 },
  { level: 'good', label: 'Good', bars: 4 },
  { level: 'excellent', label: 'Excellent', bars: 5 }
]

// ============ Helper Functions ============

function getCheckInTimeType(): CheckInTime {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'midday'
  return 'evening'
}

// ============ Mood Trend Mini Chart ============

function MoodTrendChart({ checkIns }: { checkIns: CheckInData[] }) {
  const last7 = checkIns.slice(-7)

  if (last7.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-xs text-white/30">
        No recent check-ins
      </div>
    )
  }

  return (
    <div className="flex items-end justify-between h-16 gap-1">
      {last7.map((checkIn, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500/50 to-emerald-400/50"
            style={{ height: `${(checkIn.mood / 5) * 100}%` }}
          />
          <span className="text-[8px] text-white/30">
            {new Date(checkIn.timestamp).toLocaleDateString('en', { weekday: 'narrow' })}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============ Component ============

export function DailyCheckInWidget({
  onStartCheckIn,
  onMoodSelect,
  onEnergySelect,
  onComplete,
  recentCheckIns = [],
  compact = false,
  className = ''
}: DailyCheckInWidgetProps) {
  const [checkInActive, setCheckInActive] = useState(false)
  const [currentStep, setCurrentStep] = useState<'mood' | 'energy' | 'gratitude' | 'complete'>('mood')
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel | null>(null)
  const [gratitude, setGratitude] = useState('')
  const [isListening, setIsListening] = useState(false)

  const currentTimeType = getCheckInTimeType()
  const checkInConfig = CHECK_IN_TYPES[currentTimeType]
  const TimeIcon = checkInConfig.icon

  const handleStartCheckIn = useCallback(() => {
    setCheckInActive(true)
    setCurrentStep('mood')
    setSelectedMood(null)
    setSelectedEnergy(null)
    setGratitude('')
    onStartCheckIn?.(currentTimeType)
  }, [currentTimeType, onStartCheckIn])

  const handleMoodSelect = useCallback((mood: MoodLevel) => {
    setSelectedMood(mood)
    onMoodSelect?.(mood)
    setCurrentStep('energy')
  }, [onMoodSelect])

  const handleEnergySelect = useCallback((energy: EnergyLevel) => {
    setSelectedEnergy(energy)
    onEnergySelect?.(energy)
    setCurrentStep('gratitude')
  }, [onEnergySelect])

  const handleComplete = useCallback(() => {
    if (selectedMood && selectedEnergy) {
      const data: CheckInData = {
        mood: selectedMood,
        energy: selectedEnergy,
        gratitude: gratitude || undefined,
        timestamp: new Date()
      }
      onComplete?.(data)
      setCurrentStep('complete')

      // Reset after delay
      setTimeout(() => {
        setCheckInActive(false)
        setCurrentStep('mood')
      }, 3000)
    }
  }, [selectedMood, selectedEnergy, gratitude, onComplete])

  // Compact view
  if (compact) {
    return (
      <div className={`rounded-xl border border-amber-500/20 bg-black/30 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${checkInConfig.gradient}`}>
              <TimeIcon className={`w-4 h-4 ${checkInConfig.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Daily Check-In</p>
              <p className="text-[10px] text-white/50">{checkInConfig.name}</p>
            </div>
          </div>
          <button
            onClick={handleStartCheckIn}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors"
          >
            Start
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
      className={`rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 to-black/40 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${checkInConfig.gradient}`}>
              <TimeIcon className={`w-5 h-5 ${checkInConfig.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Daily Check-In</h3>
              <p className="text-xs text-white/50">{checkInConfig.nameHindi}</p>
            </div>
          </div>

          {!checkInActive && (
            <button
              onClick={handleStartCheckIn}
              className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-colors"
            >
              Begin
            </button>
          )}
        </div>
      </div>

      {/* Check-In Flow */}
      <AnimatePresence mode="wait">
        {checkInActive ? (
          <motion.div
            key="check-in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-6">
              {['mood', 'energy', 'gratitude', 'complete'].map((step, idx) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`w-2 h-2 rounded-full ${
                    currentStep === step ? 'bg-amber-400' :
                    ['mood', 'energy', 'gratitude', 'complete'].indexOf(currentStep) > idx
                      ? 'bg-emerald-400' : 'bg-white/20'
                  }`} />
                  {idx < 3 && <div className="flex-1 h-px bg-white/10" />}
                </div>
              ))}
            </div>

            {/* Mood Selection */}
            {currentStep === 'mood' && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <p className="text-sm text-white/70 mb-4 text-center">
                  How are you feeling right now?
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {MOOD_OPTIONS.map(({ level, label, icon: Icon, color }) => (
                    <button
                      key={level}
                      onClick={() => handleMoodSelect(level)}
                      className={`p-3 rounded-xl border transition-all ${
                        selectedMood === level
                          ? 'border-amber-500/50 bg-amber-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${color}`} />
                      <p className="text-[10px] text-white/60">{label}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Energy Selection */}
            {currentStep === 'energy' && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <p className="text-sm text-white/70 mb-4 text-center">
                  What is your energy level?
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {ENERGY_OPTIONS.map(({ level, label, bars }) => (
                    <button
                      key={level}
                      onClick={() => handleEnergySelect(level)}
                      className={`p-3 rounded-xl border transition-all ${
                        selectedEnergy === level
                          ? 'border-amber-500/50 bg-amber-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-end justify-center gap-0.5 h-6 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 rounded-t transition-colors ${
                              i < bars ? 'bg-yellow-400' : 'bg-white/20'
                            }`}
                            style={{ height: `${(i + 1) * 20}%` }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-white/60">{label}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Gratitude */}
            {currentStep === 'gratitude' && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <p className="text-sm text-white/70 mb-4 text-center">
                  What are you grateful for today?
                </p>
                <div className="relative">
                  <textarea
                    value={gratitude}
                    onChange={(e) => setGratitude(e.target.value)}
                    placeholder="Share something you're grateful for..."
                    className="w-full h-24 p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    onClick={() => setIsListening(!isListening)}
                    className={`absolute bottom-3 right-3 p-2 rounded-lg transition-colors ${
                      isListening ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleComplete}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-colors"
                  >
                    {gratitude ? 'Complete' : 'Skip & Complete'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Complete */}
            {currentStep === 'complete' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                >
                  <ThumbsUp className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h4 className="text-lg font-semibold text-white mb-1">Check-In Complete!</h4>
                <p className="text-sm text-white/50">Thank you for taking time to reflect</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {/* Greeting */}
            <p className="text-sm text-white/70 mb-4">{checkInConfig.greeting}</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-xs text-white/50">Avg Mood</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {recentCheckIns.length > 0
                    ? (recentCheckIns.reduce((a, c) => a + c.mood, 0) / recentCheckIns.length).toFixed(1)
                    : '-'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-white/50">Check-Ins</span>
                </div>
                <p className="text-lg font-semibold text-white">{recentCheckIns.length}</p>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-white/50">7-Day Mood Trend</span>
              </div>
              <MoodTrendChart checkIns={recentCheckIns} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default DailyCheckInWidget
