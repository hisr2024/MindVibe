'use client'

/**
 * Mobile Journey Tracker Component
 *
 * A swipe-enabled journey tracker for mobile devices.
 *
 * Features:
 * - Swipe between days
 * - Progress visualization
 * - Haptic feedback on completion
 * - Offline support
 * - Animated transitions
 *
 * @example
 * <MobileJourneyTracker
 *   journey={currentJourney}
 *   onStepComplete={handleComplete}
 * />
 */

import {
  forwardRef,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
  Target,
  Sparkles,
  BookOpen,
} from 'lucide-react'

import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { queueOfflineOperation } from '@/lib/offline/syncService'

export interface JourneyStep {
  dayIndex: number
  title: string
  description: string
  content?: string
  verseReference?: string
  practice?: string
  reflection?: string
  isCompleted: boolean
  completedAt?: string
  isLocked: boolean
}

export interface Journey {
  id: string
  title: string
  description: string
  category: string
  totalDays: number
  currentDay: number
  progress: number
  steps: JourneyStep[]
  startedAt: string
  completedAt?: string
}

export interface MobileJourneyTrackerProps {
  /** Journey data */
  journey: Journey
  /** Step completion handler */
  onStepComplete: (dayIndex: number) => Promise<void>
  /** Navigate to verse details */
  onVersePress?: (reference: string) => void
  /** Custom className */
  className?: string
}

export const MobileJourneyTracker = forwardRef<HTMLDivElement, MobileJourneyTrackerProps>(
  function MobileJourneyTracker(
    {
      journey,
      onStepComplete,
      onVersePress,
      className = '',
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()
    const controls = useAnimation()

    const [currentDayIndex, setCurrentDayIndex] = useState(journey.currentDay)
    const [isCompleting, setIsCompleting] = useState(false)
    const [_showContent, _setShowContent] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)

    // Get current step data
    const currentStep = useMemo(() => {
      return journey.steps.find((s) => s.dayIndex === currentDayIndex) || journey.steps[0]
    }, [journey.steps, currentDayIndex])

    // Navigate to previous day
    const goToPreviousDay = useCallback(() => {
      if (currentDayIndex > 1) {
        triggerHaptic('selection')
        controls.start({ x: 100, opacity: 0 }).then(() => {
          setCurrentDayIndex(currentDayIndex - 1)
          controls.set({ x: -100 })
          controls.start({ x: 0, opacity: 1 })
        })
      }
    }, [currentDayIndex, triggerHaptic, controls])

    // Navigate to next day
    const goToNextDay = useCallback(() => {
      if (currentDayIndex < journey.totalDays) {
        const nextStep = journey.steps.find((s) => s.dayIndex === currentDayIndex + 1)
        if (nextStep && !nextStep.isLocked) {
          triggerHaptic('selection')
          controls.start({ x: -100, opacity: 0 }).then(() => {
            setCurrentDayIndex(currentDayIndex + 1)
            controls.set({ x: 100 })
            controls.start({ x: 0, opacity: 1 })
          })
        } else {
          triggerHaptic('warning')
        }
      }
    }, [currentDayIndex, journey.totalDays, journey.steps, triggerHaptic, controls])

    // Handle swipe gesture
    const handlePanEnd = useCallback((event: PointerEvent, info: PanInfo) => {
      const swipeThreshold = 50
      const velocity = info.velocity.x

      if (info.offset.x > swipeThreshold || velocity > 500) {
        goToPreviousDay()
      } else if (info.offset.x < -swipeThreshold || velocity < -500) {
        goToNextDay()
      } else {
        controls.start({ x: 0, opacity: 1 })
      }
    }, [goToPreviousDay, goToNextDay, controls])

    // Complete current step
    const handleComplete = useCallback(async () => {
      if (currentStep.isCompleted || currentStep.isLocked || isCompleting) {
        return
      }

      setIsCompleting(true)
      triggerHaptic('success')

      try {
        // Queue for offline sync
        queueOfflineOperation('journey_progress', 'create', journey.id, {
          journey_id: journey.id,
          day_index: currentDayIndex,
          completed_at: new Date().toISOString(),
        })

        await onStepComplete(currentDayIndex)

        // Animate celebration
        if (currentDayIndex === journey.totalDays) {
          // Journey completed!
          triggerHaptic('heavy')
        }
      } catch (error) {
        console.error('Failed to complete step:', error)
        triggerHaptic('error')
      } finally {
        setIsCompleting(false)
      }
    }, [currentStep, isCompleting, triggerHaptic, journey.id, journey.totalDays, currentDayIndex, onStepComplete])

    // Progress dots
    const progressDots = useMemo(() => {
      return journey.steps.slice(0, 7).map((step, _index) => {
        const isActive = step.dayIndex === currentDayIndex
        const isCompleted = step.isCompleted
        const isLocked = step.isLocked

        return (
          <motion.button
            key={step.dayIndex}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (!isLocked) {
                triggerHaptic('selection')
                setCurrentDayIndex(step.dayIndex)
              }
            }}
            disabled={isLocked}
            className={`
              w-3 h-3 rounded-full transition-all
              ${isActive
                ? 'bg-orange-500 scale-125'
                : isCompleted
                  ? 'bg-green-500'
                  : isLocked
                    ? 'bg-slate-700'
                    : 'bg-slate-600'
              }
            `}
          />
        )
      })
    }, [journey.steps, currentDayIndex, triggerHaptic])

    return (
      <div
        ref={ref}
        className={`flex flex-col h-full bg-[#0b0b0f] ${className}`}
      >
        {/* Header with progress */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-orange-400 font-medium">{journey.category}</p>
              <h1 className="text-lg font-semibold text-white">{journey.title}</h1>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-400">{journey.progress}%</p>
              <p className="text-[10px] text-slate-500">Complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${journey.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
            />
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {progressDots}
            {journey.totalDays > 7 && (
              <span className="text-xs text-slate-500">+{journey.totalDays - 7}</span>
            )}
          </div>
        </div>

        {/* Day content with swipe */}
        <motion.div
          ref={containerRef}
          className="flex-1 overflow-hidden"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPanEnd={handlePanEnd as any}
        >
          <motion.div
            animate={controls}
            className="h-full"
          >
            <div className="px-4 py-4 h-full flex flex-col">
              {/* Day header */}
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={goToPreviousDay}
                  disabled={currentDayIndex <= 1}
                  className="
                    w-10 h-10 rounded-full
                    bg-white/[0.06] border border-white/[0.08]
                    flex items-center justify-center
                    disabled:opacity-30
                  "
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </motion.button>

                <div className="text-center">
                  <p className="text-xs text-slate-500">Day</p>
                  <p className="text-2xl font-bold text-white">{currentDayIndex}</p>
                  <p className="text-[10px] text-slate-500">of {journey.totalDays}</p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={goToNextDay}
                  disabled={currentDayIndex >= journey.totalDays || journey.steps.find((s) => s.dayIndex === currentDayIndex + 1)?.isLocked}
                  className="
                    w-10 h-10 rounded-full
                    bg-white/[0.06] border border-white/[0.08]
                    flex items-center justify-center
                    disabled:opacity-30
                  "
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Step content card */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentDayIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {/* Status badge */}
                    {currentStep.isCompleted && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Completed</span>
                      </div>
                    )}

                    {currentStep.isLocked && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-500/10 border border-slate-500/30 rounded-xl">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">Complete previous days to unlock</span>
                      </div>
                    )}

                    {/* Step title and description */}
                    <div className="
                      p-4 rounded-2xl
                      bg-gradient-to-br from-white/[0.06] to-white/[0.02]
                      border border-white/[0.08]
                    ">
                      <h2 className="text-lg font-semibold text-white mb-2">
                        {currentStep.title}
                      </h2>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {currentStep.description}
                      </p>
                    </div>

                    {/* Verse reference */}
                    {currentStep.verseReference && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onVersePress?.(currentStep.verseReference!)}
                        className="
                          w-full p-4 rounded-2xl text-left
                          bg-gradient-to-br from-orange-500/10 to-amber-500/5
                          border border-orange-500/20
                        "
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-xs text-orange-400">Today&apos;s Wisdom</p>
                            <p className="text-sm text-white font-medium">
                              {currentStep.verseReference}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                        </div>
                      </motion.button>
                    )}

                    {/* Practice */}
                    {currentStep.practice && (
                      <div className="
                        p-4 rounded-2xl
                        bg-gradient-to-br from-purple-500/10 to-pink-500/5
                        border border-purple-500/20
                      ">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-purple-400" />
                          <p className="text-xs text-purple-400 font-medium">Today&apos;s Practice</p>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {currentStep.practice}
                        </p>
                      </div>
                    )}

                    {/* Reflection */}
                    {currentStep.reflection && (
                      <div className="
                        p-4 rounded-2xl
                        bg-gradient-to-br from-cyan-500/10 to-blue-500/5
                        border border-cyan-500/20
                      ">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <p className="text-xs text-cyan-400 font-medium">Reflection Question</p>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed italic">
                          &quot;{currentStep.reflection}&quot;
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Complete button */}
              {!currentStep.isCompleted && !currentStep.isLocked && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="
                    mt-4 w-full py-4 rounded-2xl
                    bg-gradient-to-r from-orange-500 to-amber-400
                    text-white font-semibold text-base
                    shadow-lg shadow-orange-500/30
                    disabled:opacity-50
                    flex items-center justify-center gap-2
                  "
                >
                  {isCompleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Complete Day {currentDayIndex}</span>
                    </>
                  )}
                </motion.button>
              )}

              {/* Swipe hint */}
              <p className="text-center text-xs text-slate-500 mt-3">
                Swipe left or right to navigate days
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }
)

export default MobileJourneyTracker
