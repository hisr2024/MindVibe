'use client'

/**
 * Journey Completion Celebration Page
 *
 * Celebrates the user's completion of a guided journey with:
 * - Animated celebration
 * - Journey summary statistics
 * - Next journey recommendations
 * - Share options
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FadeIn } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import type {
  JourneyResponse,
  JourneyTemplate,
  EnemyType,
} from '@/types/journeyEngine.types'
import { ENEMY_INFO } from '@/types/journeyEngine.types'

// Confetti particles
function Confetti() {
  const colors = ['#F59E0B', '#EF4444', '#22C55E', '#8B5CF6', '#EC4899', '#06B6D4']

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: window?.innerHeight + 20 || 800,
            opacity: [1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

export default function JourneyCompletePage() {
  const params = useParams()
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const journeyId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [journey, setJourney] = useState<JourneyResponse | null>(null)
  const [recommendations, setRecommendations] = useState<JourneyTemplate[]>([])
  const [showConfetti, setShowConfetti] = useState(true)

  // Get enemy info
  const primaryEnemy = journey?.primary_enemies[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Load journey details
        const journeyData = await journeyEngineService.getJourney(journeyId)
        setJourney(journeyData)

        // Load recommendations
        const templatesData = await journeyEngineService.listTemplates({ limit: 3 })
        setRecommendations(templatesData.templates.filter(t => t.id !== journeyData.template_slug))

        // Trigger celebration haptic
        triggerHaptic('success')
      } catch (err) {
        console.error('[JourneyCompletePage] Error:', err)
        if (err instanceof JourneyEngineError && err.isAuthError()) {
          router.push('/onboarding')
        }
      } finally {
        setLoading(false)
      }
    }

    if (journeyId) {
      loadData()
    }

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [journeyId, router, triggerHaptic])

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 lg:px-6">
        <FadeIn>
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        </FadeIn>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 lg:px-6 relative">
      {showConfetti && <Confetti />}

      <FadeIn>
        {/* Celebration Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Journey Complete!
          </h1>
          <p className="text-white/60">
            You have completed your journey of transformation
          </p>
        </motion.div>

        {/* Journey Summary */}
        {journey && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6"
            style={{ borderColor: enemyInfo ? `${enemyInfo.color}30` : undefined }}
          >
            {/* Enemy indicator */}
            {enemyInfo && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: enemyInfo.color }}
                />
                <span className="text-sm font-medium" style={{ color: enemyInfo.color }}>
                  {enemyInfo.sanskrit} ({enemyInfo.name}) - Mastered
                </span>
              </div>
            )}

            <h2 className="text-xl font-bold text-white text-center mb-6">
              {journey.title}
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-amber-400">
                  {journey.total_days}
                </div>
                <div className="text-xs text-white/50">Days Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">
                  100%
                </div>
                <div className="text-xs text-white/50">Progress</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">
                  {journey.streak_days}
                </div>
                <div className="text-xs text-white/50">Day Streak</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wisdom Quote */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-6 mb-6 text-center"
        >
          <p className="text-lg text-amber-200 italic mb-2">
            &ldquo;You have the right to work, but never to the fruit of work.&rdquo;
          </p>
          <p className="text-sm text-amber-400/70">
            — Bhagavad Gita 2.47
          </p>
          <p className="mt-4 text-white/70 text-sm">
            Your dedication to inner transformation is itself the victory.
            The journey continues...
          </p>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          {/* Primary CTA */}
          <Link
            href="/journeys"
            className="block w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-center text-lg font-semibold text-black hover:from-amber-400 hover:to-orange-400"
          >
            Continue Your Practice
          </Link>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-3 text-center">
                Recommended Next Journeys
              </h3>
              <div className="space-y-2">
                {recommendations.slice(0, 2).map((template) => {
                  const templateEnemy = template.primary_enemy_tags[0] as EnemyType | undefined
                  const templateEnemyInfo = templateEnemy ? ENEMY_INFO[templateEnemy] : null

                  return (
                    <Link
                      key={template.id}
                      href="/journeys"
                      className="block rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {templateEnemyInfo && (
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: templateEnemyInfo.color }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {template.title}
                          </div>
                          <div className="text-xs text-white/50">
                            {template.duration_days} days
                          </div>
                        </div>
                        <span className="text-white/40">→</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Secondary links */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/dashboard"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-center text-sm text-white/70 hover:bg-white/10"
            >
              View Dashboard
            </Link>
            <Link
              href="/sacred-reflections"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-center text-sm text-white/70 hover:bg-white/10"
            >
              Sacred Reflections
            </Link>
          </div>
        </motion.div>
      </FadeIn>
    </main>
  )
}
