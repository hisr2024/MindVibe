'use client'

/**
 * Program Tracker Component
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Visual progress tracker for therapeutic programs:
 * - Calendar view with completed/upcoming sessions
 * - Current streak with gamification
 * - Progress percentage
 * - Mood trend chart
 * - Next session recommendation
 * - Achievement badges
 *
 * Based on Bhagavad Gita Chapter 6.35:
 * "अभ्यासेन तु कौन्तेय" - Through practice, O Arjuna
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  CheckCircle,
  Circle,
  Clock,
  Flame,
  TrendingUp,
  Calendar,
  Star,
  Award,
  ChevronRight,
  ChevronLeft,
  Info,
  Target
} from 'lucide-react'
import {
  therapeuticProgramsEngine,
  type TherapeuticProgram,
  type ProgramEnrollment,
  type ProgramSession,
  type ProgramInsights,
  THERAPEUTIC_PROGRAMS
} from '@/utils/audio/TherapeuticProgramsEngine'
import { useMusic } from '@/contexts/MusicContext'
import { useAudio } from '@/contexts/AudioContext'

interface ProgramTrackerProps {
  enrollmentId?: string
  className?: string
  onSessionStart?: (session: ProgramSession) => void
  onSessionComplete?: (session: ProgramSession, moodBefore: number, moodAfter: number) => void
}

export function ProgramTracker({
  enrollmentId,
  className = '',
  onSessionStart,
  onSessionComplete
}: ProgramTrackerProps) {
  const music = useMusic()
  const { playSound } = useAudio()

  // State
  const [activeEnrollmentId, setActiveEnrollmentId] = useState<string | null>(enrollmentId || null)
  const [showProgramPicker, setShowProgramPicker] = useState(!enrollmentId)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [moodBefore, setMoodBefore] = useState<number>(5)
  const [moodAfter, setMoodAfter] = useState<number>(5)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)

  // Get enrollment and program data
  const enrollment = useMemo(() => {
    return activeEnrollmentId ? therapeuticProgramsEngine.getEnrollment(activeEnrollmentId) : null
  }, [activeEnrollmentId])

  const program = useMemo(() => {
    return enrollment ? therapeuticProgramsEngine.getProgramById(enrollment.programId) : null
  }, [enrollment])

  const nextSession = useMemo(() => {
    return activeEnrollmentId ? therapeuticProgramsEngine.getNextSession(activeEnrollmentId) : null
  }, [activeEnrollmentId])

  const insights = useMemo(() => {
    return activeEnrollmentId ? therapeuticProgramsEngine.generateInsights(activeEnrollmentId) : null
  }, [activeEnrollmentId])

  // ============ Handlers ============

  const handleEnrollInProgram = useCallback((programId: string) => {
    playSound?.('success')
    const newEnrollment = therapeuticProgramsEngine.enrollInProgram(programId, 'current-user')
    setActiveEnrollmentId(newEnrollment.id)
    setShowProgramPicker(false)
  }, [playSound])

  const handleStartSession = useCallback(async (session: ProgramSession) => {
    playSound?.('meditation_start')
    setActiveSessionId(session.id)
    setSessionStartTime(new Date())

    // Start the appropriate music
    await therapeuticProgramsEngine.startSession(activeEnrollmentId!, session.id)

    onSessionStart?.(session)
  }, [activeEnrollmentId, playSound, onSessionStart])

  const handlePauseSession = useCallback(() => {
    playSound?.('click')
    music.stopAll()
    setActiveSessionId(null)
  }, [music, playSound])

  const handleCompleteSession = useCallback(() => {
    if (!activeSessionId || !activeEnrollmentId) return

    playSound?.('gong')
    setShowCompletionDialog(true)
  }, [activeSessionId, activeEnrollmentId, playSound])

  const handleSubmitCompletion = useCallback(async () => {
    if (!activeSessionId || !activeEnrollmentId || !sessionStartTime) return

    const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60)

    await therapeuticProgramsEngine.completeSession(
      activeEnrollmentId,
      activeSessionId,
      {
        moodBefore,
        moodAfter,
        energyBefore: 5,
        energyAfter: 7,
        duration,
        reflectionNotes: '',
        rating: 5
      }
    )

    const session = program?.sessions.find(s => s.id === activeSessionId)
    if (session) {
      onSessionComplete?.(session, moodBefore, moodAfter)
    }

    playSound?.('achievement')
    setShowCompletionDialog(false)
    setActiveSessionId(null)
    setSessionStartTime(null)
    setMoodBefore(5)
    setMoodAfter(5)
  }, [activeSessionId, activeEnrollmentId, sessionStartTime, moodBefore, moodAfter, program, playSound, onSessionComplete])

  // ============ Render Program Picker ============

  if (showProgramPicker) {
    return (
      <div className={`rounded-2xl bg-gradient-to-br from-[#0d0d12] to-[#08080b] border border-white/10 overflow-hidden ${className}`}>
        <div className="p-4 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Choose a Therapeutic Program</h3>
          <p className="text-sm text-white/50 mt-1">Structured journeys for transformation</p>
        </div>

        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {THERAPEUTIC_PROGRAMS.map((prog) => (
            <motion.button
              key={prog.id}
              onClick={() => handleEnrollInProgram(prog.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full p-4 rounded-xl text-left transition-all
                bg-gradient-to-r ${prog.coverGradient} bg-opacity-20
                hover:shadow-lg border border-white/10
              `}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{prog.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{prog.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs text-white/80">
                      {prog.durationDays} days
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">{prog.nameHindi}</p>
                  <p className="text-sm text-white/70 mt-2 line-clamp-2">{prog.description}</p>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-1.5 h-4 rounded-full ${
                            level <= prog.difficultyLevel ? 'bg-white/70' : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-white/50">
                      {prog.difficultyLevel === 1 ? 'Beginner' :
                       prog.difficultyLevel === 2 ? 'Easy' :
                       prog.difficultyLevel === 3 ? 'Moderate' :
                       prog.difficultyLevel === 4 ? 'Advanced' : 'Expert'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  // ============ Render Active Program ============

  if (!enrollment || !program) {
    return (
      <div className={`rounded-2xl bg-gradient-to-br from-[#0d0d12] to-[#08080b] border border-white/10 p-6 text-center ${className}`}>
        <p className="text-white/50">No active program</p>
        <button
          onClick={() => setShowProgramPicker(true)}
          className="mt-4 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors"
        >
          Start a Program
        </button>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br from-[#0d0d12] to-[#08080b] border border-white/10 overflow-hidden ${className}`}>
      {/* Header with Program Info */}
      <div className={`p-4 bg-gradient-to-r ${program.coverGradient} bg-opacity-30 border-b border-white/10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{program.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-white">{program.name}</h3>
              <p className="text-xs text-white/60">{program.nameHindi}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak Badge */}
            {enrollment.currentStreak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-orange-400">{enrollment.currentStreak}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>Day {enrollment.currentDay} of {program.durationDays}</span>
            <span>{Math.round(enrollment.progressPercentage)}% complete</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${program.coverGradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${enrollment.progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Session in Progress */}
      <AnimatePresence>
        {activeSessionId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 overflow-hidden"
          >
            <div className="p-4 bg-purple-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-green-400"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Session in Progress</p>
                    <p className="text-xs text-white/50">
                      {program.sessions.find(s => s.id === activeSessionId)?.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePauseSession}
                    className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCompleteSession}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-500 transition-colors"
                  >
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Sessions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white/70">Today&apos;s Sessions</h4>
          <span className="text-xs text-white/40">Day {enrollment.currentDay}</span>
        </div>

        <div className="space-y-2">
          {program.sessions
            .filter(s => s.dayNumber === enrollment.currentDay)
            .map((session) => {
              const isCompleted = enrollment.completedSessions.includes(session.id)
              const isActive = activeSessionId === session.id

              return (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.01 }}
                  className={`
                    p-3 rounded-xl border transition-all
                    ${isCompleted
                      ? 'bg-green-900/20 border-green-500/30'
                      : isActive
                      ? 'bg-purple-900/30 border-purple-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isCompleted
                        ? 'bg-green-500/20'
                        : isActive
                        ? 'bg-purple-500/20'
                        : 'bg-white/10'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          <Clock className="w-5 h-5 text-purple-400" />
                        </motion.div>
                      ) : (
                        <Circle className="w-5 h-5 text-white/40" />
                      )}
                    </div>

                    {/* Session Info */}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                        {session.title}
                      </p>
                      <p className="text-xs text-white/50">{session.titleHindi}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-white/40">{session.duration} min</span>
                        <span className="text-xs text-white/30">•</span>
                        <span className="text-xs text-white/40 capitalize">{session.sessionType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isCompleted && !isActive && (
                      <button
                        onClick={() => handleStartSession(session)}
                        className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Gita Verse */}
                  {session.gitaVerse && (
                    <div className="mt-3 p-2 rounded-lg bg-amber-900/20 border border-amber-500/20">
                      <p className="text-xs text-amber-400/80 italic">
                        &ldquo;{session.gitaVerse.translation}&rdquo;
                      </p>
                      <p className="text-xs text-amber-400/50 mt-1">
                        — BG {session.gitaVerse.chapter}.{session.gitaVerse.verse}
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
        </div>
      </div>

      {/* Insights Section */}
      {insights && (
        <div className="p-4 border-t border-white/5">
          <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Your Progress
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-white/50">Avg Mood Improvement</p>
              <p className="text-lg font-bold text-green-400">
                {insights.averageMoodImprovement > 0 ? '+' : ''}
                {insights.averageMoodImprovement.toFixed(1)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-white/50">Adherence Rate</p>
              <p className="text-lg font-bold text-purple-400">
                {Math.round(insights.adherenceRate)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Session Preview */}
      {nextSession && !activeSessionId && enrollment.currentDay < program.durationDays && (
        <div className="p-4 border-t border-white/5">
          <h4 className="text-sm font-medium text-white/70 mb-2">Coming Up Next</h4>
          <p className="text-sm text-white/50">
            Day {nextSession.dayNumber}: {nextSession.title}
          </p>
        </div>
      )}

      {/* Completion Dialog */}
      <AnimatePresence>
        {showCompletionDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowCompletionDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-2xl bg-[#0d0d12] border border-white/10"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-xl font-semibold text-white">Session Complete!</h3>
                <p className="text-sm text-white/50 mt-1">How are you feeling?</p>
              </div>

              {/* Mood Before */}
              <div className="mb-4">
                <label className="text-sm text-white/70 mb-2 block">Before session</label>
                <div className="flex justify-between gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMoodBefore(n)}
                      className={`
                        w-8 h-8 rounded-lg text-sm font-medium transition-all
                        ${moodBefore === n
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                        }
                      `}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood After */}
              <div className="mb-6">
                <label className="text-sm text-white/70 mb-2 block">After session</label>
                <div className="flex justify-between gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMoodAfter(n)}
                      className={`
                        w-8 h-8 rounded-lg text-sm font-medium transition-all
                        ${moodAfter === n
                          ? 'bg-green-600 text-white'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                        }
                      `}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitCompletion}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Save & Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProgramTracker
