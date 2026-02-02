'use client'

/**
 * Mobile Mood Tracker Component
 *
 * An immersive mood tracking experience with haptic feedback.
 *
 * Features:
 * - Animated mood selection
 * - Haptic feedback
 * - Mood history visualization
 * - Quick notes
 * - Offline support
 *
 * @example
 * <MobileMoodTracker onMoodSelect={handleMoodSelect} />
 */

import {
  forwardRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smile,
  Sun,
  Meh,
  CloudRain,
  Frown,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ChevronRight,
  MessageCircle,
  X,
  Check,
} from 'lucide-react'

import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { queueOfflineOperation } from '@/lib/offline/syncService'

// Mood definitions with colors and gradients
const MOODS = [
  {
    id: 'great',
    label: 'Great',
    emoji: '😊',
    icon: Smile,
    color: '#10B981',
    gradient: 'from-emerald-500 to-green-400',
    bgGradient: 'from-emerald-500/20 to-green-500/10',
    description: 'Feeling wonderful and energized',
  },
  {
    id: 'good',
    label: 'Good',
    emoji: '🙂',
    icon: Sun,
    color: '#F59E0B',
    gradient: 'from-amber-500 to-yellow-400',
    bgGradient: 'from-amber-500/20 to-yellow-500/10',
    description: 'Feeling positive and content',
  },
  {
    id: 'okay',
    label: 'Okay',
    emoji: '😐',
    icon: Meh,
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-400',
    bgGradient: 'from-blue-500/20 to-cyan-500/10',
    description: 'Feeling neutral, neither good nor bad',
  },
  {
    id: 'low',
    label: 'Low',
    emoji: '😔',
    icon: CloudRain,
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-indigo-400',
    bgGradient: 'from-purple-500/20 to-indigo-500/10',
    description: 'Feeling down or melancholic',
  },
  {
    id: 'struggling',
    label: 'Struggling',
    emoji: '😢',
    icon: Frown,
    color: '#EF4444',
    gradient: 'from-red-500 to-pink-400',
    bgGradient: 'from-red-500/20 to-pink-500/10',
    description: 'Having a difficult time',
  },
]

// Quick reflection prompts based on mood
const MOOD_PROMPTS: Record<string, string[]> = {
  great: [
    "What's making you feel so good?",
    "What are you grateful for today?",
    "How can you share this positivity?",
  ],
  good: [
    "What small wins did you have today?",
    "What are you looking forward to?",
    "Who made you smile today?",
  ],
  okay: [
    "Is there something on your mind?",
    "What would make today better?",
    "How can you add a little joy to your day?",
  ],
  low: [
    "What's weighing on you?",
    "What do you need right now?",
    "Who could you reach out to?",
  ],
  struggling: [
    "Remember, this feeling is temporary.",
    "What's one small step you can take?",
    "Would talking to someone help?",
  ],
}

export interface MoodEntry {
  id: string
  mood: string
  note?: string
  timestamp: string
}

export interface MoodHistory {
  date: string
  mood: string
  entries: MoodEntry[]
}

export interface MobileMoodTrackerProps {
  /** Current selected mood (if any) */
  currentMood?: string
  /** Mood selection handler */
  onMoodSelect: (mood: string, note?: string) => Promise<void>
  /** Recent mood history for visualization */
  history?: MoodHistory[]
  /** Navigate to full mood history */
  onViewHistory?: () => void
  /** Custom className */
  className?: string
}

export const MobileMoodTracker = forwardRef<HTMLDivElement, MobileMoodTrackerProps>(
  function MobileMoodTracker(
    {
      currentMood,
      onMoodSelect,
      history = [],
      onViewHistory,
      className = '',
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()

    const [selectedMood, setSelectedMood] = useState<string | null>(currentMood || null)
    const [showNoteInput, setShowNoteInput] = useState(false)
    const [note, setNote] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    // Get mood data
    const getMoodData = useCallback((moodId: string) => {
      return MOODS.find((m) => m.id === moodId) || MOODS[2]
    }, [])

    // Handle mood selection
    const handleMoodTap = useCallback((moodId: string) => {
      triggerHaptic('medium')
      setSelectedMood(moodId)
      setShowNoteInput(true)
    }, [triggerHaptic])

    // Save mood entry
    const handleSave = useCallback(async () => {
      if (!selectedMood) return

      setIsSaving(true)
      triggerHaptic('success')

      try {
        // Queue for offline sync
        const entryId = `mood_${Date.now()}`
        queueOfflineOperation('mood', 'create', entryId, {
          mood: selectedMood,
          note: note.trim() || undefined,
          timestamp: new Date().toISOString(),
        })

        await onMoodSelect(selectedMood, note.trim() || undefined)

        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          setShowNoteInput(false)
          setNote('')
        }, 1500)
      } catch (error) {
        console.error('Failed to save mood:', error)
        triggerHaptic('error')
      } finally {
        setIsSaving(false)
      }
    }, [selectedMood, note, onMoodSelect, triggerHaptic])

    // Cancel mood input
    const handleCancel = useCallback(() => {
      triggerHaptic('light')
      setShowNoteInput(false)
      setSelectedMood(currentMood || null)
      setNote('')
    }, [currentMood, triggerHaptic])

    // Calculate mood trend
    const moodTrend = useMemo(() => {
      if (history.length < 2) return 'neutral'

      const moodValues: Record<string, number> = {
        great: 5,
        good: 4,
        okay: 3,
        low: 2,
        struggling: 1,
      }

      const recent = history.slice(0, 7)
      const avgRecent = recent.reduce((sum, h) => sum + (moodValues[h.mood] || 3), 0) / recent.length

      const older = history.slice(7, 14)
      if (older.length === 0) return 'neutral'

      const avgOlder = older.reduce((sum, h) => sum + (moodValues[h.mood] || 3), 0) / older.length

      if (avgRecent > avgOlder + 0.5) return 'up'
      if (avgRecent < avgOlder - 0.5) return 'down'
      return 'neutral'
    }, [history])

    // Get random prompt for selected mood
    const getPrompt = useCallback((moodId: string) => {
      const prompts = MOOD_PROMPTS[moodId] || MOOD_PROMPTS.okay
      return prompts[Math.floor(Math.random() * prompts.length)]
    }, [])

    return (
      <div
        ref={ref}
        className={`bg-[#0b0b0f] ${className}`}
      >
        {/* Main mood selector */}
        <div className="px-4 py-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">
              How are you feeling?
            </h2>
            <p className="text-sm text-slate-400">
              Tap to check in with yourself
            </p>
          </div>

          {/* Mood options */}
          <div className="flex justify-between gap-2">
            {MOODS.map((mood, index) => {
              const isSelected = selectedMood === mood.id
              const MoodIcon = mood.icon

              return (
                <motion.button
                  key={mood.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleMoodTap(mood.id)}
                  className={`
                    flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl
                    transition-all duration-300
                    ${isSelected
                      ? `bg-gradient-to-br ${mood.bgGradient} border-2 shadow-lg`
                      : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]'
                    }
                  `}
                  style={{
                    borderColor: isSelected ? mood.color : undefined,
                    boxShadow: isSelected ? `0 8px 32px ${mood.color}40` : undefined,
                  }}
                >
                  <motion.span
                    animate={{
                      scale: isSelected ? 1.3 : 1,
                      y: isSelected ? -4 : 0,
                    }}
                    className="text-3xl"
                  >
                    {mood.emoji}
                  </motion.span>
                  <span
                    className={`
                      text-[10px] font-medium
                      ${isSelected ? 'text-white' : 'text-slate-400'}
                    `}
                  >
                    {mood.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Note input sheet */}
        <AnimatePresence>
          {showNoteInput && selectedMood && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCancel}
                className="fixed inset-0 bg-black/60 z-40"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="
                  fixed bottom-0 left-0 right-0 z-50
                  bg-[#1a1a1f] rounded-t-3xl
                  p-4 pb-safe
                "
              >
                {/* Handle */}
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />

                {/* Success state */}
                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
                      >
                        <Check className="w-8 h-8 text-green-400" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-white">
                        Check-in saved!
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Thank you for sharing how you feel
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Selected mood display */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`
                            w-14 h-14 rounded-2xl flex items-center justify-center
                            bg-gradient-to-br ${getMoodData(selectedMood).bgGradient}
                          `}
                        >
                          <span className="text-3xl">{getMoodData(selectedMood).emoji}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {getMoodData(selectedMood).label}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {getMoodData(selectedMood).description}
                          </p>
                        </div>
                      </div>

                      {/* Prompt */}
                      <p className="text-sm text-slate-300 mb-3 italic">
                        &quot;{getPrompt(selectedMood)}&quot;
                      </p>

                      {/* Note input */}
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note (optional)..."
                        className="
                          w-full h-24 px-4 py-3 rounded-xl
                          bg-white/[0.06] border border-white/[0.08]
                          text-white text-sm
                          placeholder:text-slate-500
                          resize-none
                          outline-none focus:border-orange-500/40
                        "
                        style={{ fontSize: '16px' }}
                      />

                      {/* Action buttons */}
                      <div className="flex gap-3 mt-4">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCancel}
                          className="
                            flex-1 py-3 rounded-xl
                            bg-white/[0.06] border border-white/[0.08]
                            text-slate-300 font-medium
                          "
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSave}
                          disabled={isSaving}
                          className={`
                            flex-1 py-3 rounded-xl
                            bg-gradient-to-r ${getMoodData(selectedMood).gradient}
                            text-white font-medium
                            shadow-lg disabled:opacity-50
                          `}
                          style={{
                            boxShadow: `0 8px 24px ${getMoodData(selectedMood).color}40`,
                          }}
                        >
                          {isSaving ? 'Saving...' : 'Save Check-in'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mood history preview */}
        {history.length > 0 && (
          <div className="px-4 pb-4">
            <div className="
              p-4 rounded-2xl
              bg-gradient-to-br from-white/[0.04] to-white/[0.02]
              border border-white/[0.06]
            ">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-300">This Week</span>
                </div>

                {/* Trend indicator */}
                <div className="flex items-center gap-1">
                  {moodTrend === 'up' && (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Improving</span>
                    </>
                  )}
                  {moodTrend === 'down' && (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-red-400">Declining</span>
                    </>
                  )}
                  {moodTrend === 'neutral' && (
                    <>
                      <Minus className="w-4 h-4 text-slate-500" />
                      <span className="text-xs text-slate-500">Stable</span>
                    </>
                  )}
                </div>
              </div>

              {/* Mini mood history */}
              <div className="flex justify-between gap-1 mb-3">
                {Array.from({ length: 7 }).map((_, index) => {
                  const dayHistory = history[6 - index]
                  const mood = dayHistory ? getMoodData(dayHistory.mood) : null

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className={`
                          w-full aspect-square rounded-lg flex items-center justify-center
                          ${mood
                            ? `bg-gradient-to-br ${mood.bgGradient}`
                            : 'bg-white/[0.04]'
                          }
                        `}
                      >
                        {mood ? (
                          <span className="text-lg">{mood.emoji}</span>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-white/[0.1]" />
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(Date.now() - (6 - index) * 86400000).getDay()]}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* View history button */}
              {onViewHistory && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onViewHistory}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2 rounded-xl
                    bg-white/[0.04] hover:bg-white/[0.08]
                    text-sm text-slate-400
                  "
                >
                  <span>View Full History</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

export default MobileMoodTracker
