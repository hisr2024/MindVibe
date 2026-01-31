'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Transition, Variants } from 'framer-motion'
import Link from 'next/link'
import { FadeIn } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyService,
  JourneyServiceError,
} from '@/services/journeyService'
import type {
  Journey,
  JourneyStep,
  StepContent,
} from '@/types/journey.types'

interface TodayStepClientProps {
  journeyId: string
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
}

const celebrationTransition: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 15,
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: itemTransition,
  },
}

const celebrationVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: celebrationTransition,
  },
}

export default function TodayStepClient({ journeyId }: TodayStepClientProps) {
  const { triggerHaptic } = useHapticFeedback()

  // State
  const [journey, setJourney] = useState<Journey | null>(null)
  const [step, setStep] = useState<JourneyStep | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reflection, setReflection] = useState('')
  const [checkInValue, setCheckInValue] = useState<number>(5)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('teaching')

  // Load journey and step data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [journeyData, stepData] = await Promise.all([
        journeyService.getJourney(journeyId),
        journeyService.getTodayStep(journeyId),
      ])

      setJourney(journeyData)
      setStep(stepData)

      if (stepData.is_completed) {
        setCompleted(true)
      }
    } catch (err) {
      const message = err instanceof JourneyServiceError
        ? err.message
        : 'Failed to load today\'s step. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [journeyId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle step completion
  const handleComplete = async () => {
    if (completing || !journey || !step) return

    try {
      setCompleting(true)
      triggerHaptic('medium')

      const updatedJourney = await journeyService.completeStep(
        journeyId,
        step.day_index,
        reflection || undefined,
        checkInValue ? { intensity: checkInValue } : undefined
      )

      setJourney(updatedJourney)
      setCompleted(true)
      triggerHaptic('success')
    } catch (err) {
      const message = err instanceof JourneyServiceError
        ? err.message
        : 'Failed to complete step. Please try again.'
      setError(message)
      triggerHaptic('error')
    } finally {
      setCompleting(false)
    }
  }

  // Toggle section expansion
  const toggleSection = (section: string) => {
    triggerHaptic('light')
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Get content safely
  const content: StepContent | null = step?.content || null

  // Journey completed check
  const isJourneyComplete = journey?.status === 'completed'

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-24 pt-4 lg:px-6">
      <FadeIn>
        {/* Back navigation */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            href="/journeys"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            <span>←</span>
            <span>Back to Journeys</span>
          </Link>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-900/20 p-6 text-center"
          >
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null)
                loadData()
              }}
              className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Journey Complete Celebration */}
        <AnimatePresence>
          {isJourneyComplete && !loading && (
            <motion.div
              variants={celebrationVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mb-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/40 to-orange-900/40 p-8 text-center"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-amber-400 mb-2">
                Journey Complete!
              </h2>
              <p className="text-white/70 mb-6">
                Congratulations on completing {journey?.template?.title}!
                You&apos;ve taken a meaningful step toward inner peace.
              </p>
              <Link
                href="/journeys"
                className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-medium text-black"
              >
                Start Another Journey
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        {!loading && !error && journey && step && content && !isJourneyComplete && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-1.5 text-sm text-amber-400 mb-3">
                <span>{journeyService.getInnerEnemyIcon(content.today_focus)}</span>
                <span>Day {step.day_index} of {journey.total_days}</span>
              </div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {content.step_title}
              </h1>
              <p className="mt-2 text-white/60">
                {journey.template?.title}
              </p>
            </motion.div>

            {/* Progress bar */}
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between text-sm text-white/60">
                <span>Progress</span>
                <span>{Math.round(journey.progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${journey.progress}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
            </motion.div>

            {/* Already completed today */}
            {completed && (
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-green-500/30 bg-green-900/20 p-6 text-center"
              >
                <div className="text-4xl mb-2">✓</div>
                <h3 className="text-lg font-medium text-green-400">
                  Day {step.day_index} Complete!
                </h3>
                <p className="mt-2 text-white/60">
                  Great work! Come back tomorrow for your next step.
                </p>
                <Link
                  href="/journeys"
                  className="mt-4 inline-block rounded-lg bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/20"
                >
                  View All Journeys
                </Link>
              </motion.div>
            )}

            {/* Step content sections */}
            {!completed && (
              <>
                {/* Teaching Section */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection('teaching')}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📖</span>
                      <span className="font-medium text-white">Today&apos;s Teaching</span>
                    </div>
                    <span className="text-white/40">
                      {expandedSection === 'teaching' ? '−' : '+'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'teaching' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        <p className="text-white/70 leading-relaxed">
                          {content.teaching}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Reflection Section */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection('reflection')}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🪷</span>
                      <span className="font-medium text-white">Guided Reflection</span>
                    </div>
                    <span className="text-white/40">
                      {expandedSection === 'reflection' ? '−' : '+'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'reflection' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 space-y-4"
                      >
                        {content.guided_reflection.map((prompt, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-amber-400">{i + 1}.</span>
                            <p className="text-white/70">{prompt}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Practice Section */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection('practice')}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🧘</span>
                      <span className="font-medium text-white">
                        {content.practice.name} ({content.practice.duration_minutes} min)
                      </span>
                    </div>
                    <span className="text-white/40">
                      {expandedSection === 'practice' ? '−' : '+'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {expandedSection === 'practice' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 space-y-3"
                      >
                        {content.practice.instructions.map((instruction, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                              {i + 1}
                            </span>
                            <p className="text-white/70">{instruction}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Micro Commitment */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-amber-500/20 bg-amber-900/10 p-4 text-center"
                >
                  <p className="text-sm text-amber-400/70 mb-2">Today&apos;s Micro Commitment</p>
                  <p className="text-white font-medium italic">
                    &quot;{content.micro_commitment}&quot;
                  </p>
                </motion.div>

                {/* Check-in & Completion */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5"
                >
                  {/* Check-in slider */}
                  <div className="space-y-3">
                    <label className="text-sm text-white/70">
                      {content.check_in_prompt.label}
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={checkInValue}
                        onChange={(e) => setCheckInValue(parseInt(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-white/40">
                        <span>1</span>
                        <span className="text-amber-400 font-medium">{checkInValue}</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>

                  {/* Reflection textarea */}
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">
                      Your Reflection (optional)
                    </label>
                    <textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="Write your thoughts, insights, or feelings..."
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Complete button */}
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 font-medium text-black transition-all hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                        Completing...
                      </span>
                    ) : (
                      'Complete Day ' + step.day_index
                    )}
                  </button>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </FadeIn>
    </main>
  )
}
