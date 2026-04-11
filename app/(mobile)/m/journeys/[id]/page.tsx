'use client'

/**
 * Mobile Journey Detail & Guided Experience Page
 *
 * Full mobile-optimized journey view with:
 * - Journey progress header with day selector
 * - Step content (teaching, verses, reflection, practice)
 * - Step completion with optional reflection
 * - Journey actions (pause, resume, abandon)
 * - Swipe-friendly day navigation
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft,
  MoreVertical,
  Pause,
  Play,
  X,
  BookOpen,
  Sparkles,
  Target,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import type {
  JourneyResponse,
  StepResponse,
  EnemyType,
} from '@/types/journeyEngine.types'
import {
  ENEMY_INFO,
  getJourneyStatusLabel,
} from '@/types/journeyEngine.types'

export default function MobileJourneyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const journeyId = params.id as string
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [journey, setJourney] = useState<JourneyResponse | null>(null)
  const [step, setStep] = useState<StepResponse | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [isCompleting, setIsCompleting] = useState(false)
  const isCompletingRef = useRef(false)
  const [showActions, setShowActions] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [reflection, setReflection] = useState('')
  const [showReflection, setShowReflection] = useState(false)
  // Sakha wisdom — surfaced after a successful completion. Both default to
  // null so the card stays hidden until the backend returns ai_response.
  // If the server is older and omits the field, the legacy "reload + go
  // back" flow runs and these stay null (no regression).
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [masteryDelta, setMasteryDelta] = useState<number | null>(null)

  const primaryEnemy = journey?.primary_enemies[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  const loadJourney = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const journeyData = await journeyEngineService.getJourney(journeyId)
      setJourney(journeyData)
      setSelectedDay(journeyData.current_day)

      if (journeyData.status === 'active') {
        const stepData = await journeyEngineService.getCurrentStep(journeyId)
        setStep(stepData)
      }
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        if (err.isAuthError()) {
          router.push('/onboarding')
          return
        }
        setError(err.isNotFoundError() ? 'Journey not found.' : err.message)
      } else {
        setError('Failed to load journey. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [journeyId, router])

  const loadStep = useCallback(async (day: number) => {
    if (!journey) return
    try {
      const stepData = await journeyEngineService.getStep(journeyId, day)
      setStep(stepData)
    } catch {
      setError('Failed to load step.')
    }
  }, [journeyId, journey])

  useEffect(() => {
    // Wait for auth to finish loading before deciding what to do
    if (authLoading) return

    if (isAuthenticated) {
      loadJourney()
    } else {
      // Journey detail requires auth — redirect to onboarding
      router.push('/onboarding')
    }
  }, [authLoading, isAuthenticated, loadJourney, router])

  const handleSelectDay = (day: number) => {
    triggerHaptic('selection')
    setSelectedDay(day)
    loadStep(day)
  }

  const handleCompleteStep = async () => {
    if (!step || !journey || step.is_completed || !step.available_to_complete || isCompletingRef.current) return

    // Set completing flag immediately to prevent double-tap race condition.
    isCompletingRef.current = true
    setIsCompleting(true)

    if (journey.status !== 'active' || step.day_index !== journey.current_day) {
      isCompletingRef.current = false
      setIsCompleting(false)
      await loadJourney()
      return
    }

    try {
      const result = await journeyEngineService.completeStep(
        journeyId,
        step.day_index,
        { reflection: showReflection && reflection.trim() ? reflection.trim() : undefined }
      )

      triggerHaptic('success')

      // Sakha wisdom — if the backend supplied a templated response, surface
      // the wisdom card and keep the user on the page. Tapping "Return to
      // Journeys" on the card handles navigation. If the field is missing
      // (older server), fall through to the legacy reload-or-navigate flow
      // so we never block on a feature that didn't ship.
      const sakhaText = (result.ai_response ?? '').trim()
      if (sakhaText) {
        setAiResponse(sakhaText)
        setMasteryDelta(result.mastery_delta ?? null)
        // Mark the step as completed locally so the complete button hides
        // and the textarea/button section is replaced by the Sakha card.
        setStep((prev) =>
          prev
            ? { ...prev, is_completed: true, available_to_complete: false }
            : prev,
        )
        return
      }

      if (result.journey_complete) {
        router.push('/m/journeys')
      } else {
        setReflection('')
        setShowReflection(false)
        await loadJourney()
      }
    } catch (err) {
      if (err instanceof JourneyEngineError && err.isAuthError()) {
        router.push('/onboarding')
        return
      }
      if (err instanceof JourneyEngineError && (err.statusCode === 429 || err.statusCode === 400)) {
        await loadJourney()
        return
      }
      setError(err instanceof JourneyEngineError ? err.message : 'Failed to complete step.')
      triggerHaptic('error')
    } finally {
      isCompletingRef.current = false
      setIsCompleting(false)
    }
  }

  const handleAction = async (action: 'pause' | 'resume' | 'abandon') => {
    if (actionLoading) return
    try {
      setActionLoading(action)
      if (action === 'pause') await journeyEngineService.pauseJourney(journeyId)
      else if (action === 'resume') await journeyEngineService.resumeJourney(journeyId)
      else if (action === 'abandon') {
        await journeyEngineService.abandonJourney(journeyId)
        router.push('/m/journeys')
        return
      }
      triggerHaptic('success')
      await loadJourney()
      setShowActions(false)
    } catch (err) {
      setError(err instanceof JourneyEngineError ? err.message : `Failed to ${action} journey.`)
      triggerHaptic('error')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <MobileAppShell title="Journey" showBack showTabBar={false}>
        <div className="px-4 pt-4 pb-10 space-y-4 animate-pulse">
          {/* Header strip */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-white/[0.08]" />
            <div className="h-4 w-16 rounded bg-white/[0.08]" />
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full w-1/4 rounded-full bg-[#d4a44c]/40" />
          </div>
          {/* Title */}
          <div className="space-y-2 pt-2">
            <div className="h-6 w-3/4 rounded bg-white/[0.08]" />
            <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
          </div>
          {/* Teaching card */}
          <div className="h-36 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
          {/* Practice card */}
          <div className="h-24 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
          {/* Reflection card */}
          <div className="h-40 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
          {/* Button */}
          <div className="h-14 rounded-2xl bg-[#d4a44c]/20" />
        </div>
      </MobileAppShell>
    )
  }

  if (error && !journey) {
    return (
      <MobileAppShell title="Journey" showBack showTabBar={false}>
        <div className="px-4 py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-[#d4a44c] mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-body text-[var(--mv-text-secondary)] mb-6">{error}</p>
          <button
            onClick={loadJourney}
            className="px-6 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </MobileAppShell>
    )
  }

  if (!journey) return null

  const progressPercent = journey.total_days > 0
    ? Math.round((journey.days_completed / journey.total_days) * 100)
    : 0

  return (
    <MobileAppShell
      title=""
      showHeader={false}
      showTabBar={false}
    >
      {/* Custom header */}
      <div className="sticky top-0 z-20 bg-[#050714]/95 backdrop-blur-xl border-b border-white/[0.06]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/m/journeys')}
            className="p-2 -ml-2 rounded-full"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex-1 text-center px-4">
            {enemyInfo && (
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: enemyInfo.color }} />
                <span className="text-xs font-medium" style={{ color: enemyInfo.color }}>
                  {enemyInfo.sanskrit}
                </span>
              </div>
            )}
            <h1 className="text-sm font-semibold truncate">{journey.title}</h1>
          </div>

          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 -mr-2 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
            <span>Day {journey.current_day} of {journey.total_days}</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{
                background: enemyInfo
                  ? `linear-gradient(to right, ${enemyInfo.color}, ${enemyInfo.color}99)`
                  : 'linear-gradient(to right, #d4a44c, #e8b54a)',
              }}
            />
          </div>
        </div>

        {/* Day selector */}
        <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5">
            {Array.from({ length: journey.total_days }, (_, i) => i + 1).map((day) => {
              const isCompleted = day <= journey.days_completed
              const isCurrent = day === journey.current_day
              const isAccessible = day <= journey.current_day
              const isSelected = day === selectedDay

              return (
                <button
                  key={day}
                  onClick={() => isAccessible && handleSelectDay(day)}
                  disabled={!isAccessible}
                  className={`flex-shrink-0 w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#d4a44c] text-black'
                      : isCompleted
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : isCurrent
                      ? 'bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30'
                      : isAccessible
                      ? 'bg-white/10 text-white/70'
                      : 'bg-white/[0.04] text-white/20'
                  }`}
                >
                  {isCompleted && !isSelected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mx-auto" />
                  ) : (
                    day
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Actions dropdown */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-3 rounded-2xl border border-white/10 bg-[#0d0d12] p-3 space-y-2"
          >
            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/[0.06]">
              <span className="text-xs text-white/70">{getJourneyStatusLabel(journey.status)}</span>
              <button onClick={() => setShowActions(false)}>
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
            {journey.status === 'active' && (
              <button
                onClick={() => handleAction('pause')}
                disabled={actionLoading !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#d4a44c]/10 text-[#d4a44c] text-sm disabled:opacity-50"
              >
                <Pause className="w-4 h-4" />
                {actionLoading === 'pause' ? 'Pausing...' : 'Pause Journey'}
              </button>
            )}
            {journey.status === 'paused' && (
              <button
                onClick={() => handleAction('resume')}
                disabled={actionLoading !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-500/10 text-green-400 text-sm disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {actionLoading === 'resume' ? 'Resuming...' : 'Resume Journey'}
              </button>
            )}
            {(journey.status === 'active' || journey.status === 'paused') && (
              <button
                onClick={() => handleAction('abandon')}
                disabled={actionLoading !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                {actionLoading === 'abandon' ? 'Abandoning...' : 'Abandon Journey'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <p className="text-xs text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-300 underline mt-1">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step content */}
      <div className="px-page-x py-4 pb-8 space-y-5">
        {step ? (
          <>
            {/* Step title */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4a44c]/10 border border-[#d4a44c]/20 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a44c] animate-pulse" />
                <span className="text-xs font-medium text-[#d4a44c]">Day {step.day_index}</span>
              </div>
              <h2 className="text-xl font-bold">{step.step_title}</h2>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                BLOCK 1: Gita Verse (primary, flattened) ──────────────────
                Renders from the flattened sacred fields the backend's
                _step_to_response() helper always populates (live verse if
                seeded, otherwise the canonical _ENEMY_SACRED fallback).
                The legacy step.verses[] loop further down only renders
                when the flattened block is unavailable, so the verse is
                shown exactly once. ─────────────────────────────────────── */}
            {(step.verse_sanskrit || step.verse_ref) && (
              <section
                className="relative overflow-hidden rounded-2xl"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 0%, rgba(212,160,23,0.12), rgba(17,20,53,0.98))',
                  border: '1px solid rgba(212,160,23,0.22)',
                  borderTop: '3px solid rgba(212,160,23,0.7)',
                }}
              >
                <div className="p-5">
                  {step.verse_ref && (
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg mb-3"
                      style={{
                        background: 'rgba(212,160,23,0.1)',
                        border: '1px solid rgba(212,160,23,0.25)',
                        fontSize: 9,
                        color: '#D4A017',
                        fontFamily: 'Outfit, sans-serif',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {'\u2726'} BG {step.verse_ref.chapter}.{step.verse_ref.verse}
                    </div>
                  )}

                  {step.verse_sanskrit && (
                    <div
                      style={{
                        fontFamily: '"Noto Sans Devanagari", sans-serif',
                        fontSize: 18,
                        fontWeight: 500,
                        color: '#F0C040',
                        lineHeight: 2.0,
                        marginBottom: 10,
                        textShadow: '0 0 20px rgba(212,160,23,0.3)',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {step.verse_sanskrit}
                    </div>
                  )}

                  {step.verse_sanskrit && step.verse_transliteration && (
                    <div
                      style={{
                        height: 1,
                        background:
                          'linear-gradient(90deg, transparent, rgba(212,160,23,0.4), transparent)',
                        margin: '8px 0',
                      }}
                    />
                  )}

                  {step.verse_transliteration && (
                    <div
                      className="font-sacred italic"
                      style={{
                        fontSize: 13,
                        color: '#B8AE98',
                        lineHeight: 1.7,
                        marginBottom: 8,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {step.verse_transliteration}
                    </div>
                  )}

                  {step.verse_translation && step.verse_transliteration && (
                    <div
                      style={{
                        height: 1,
                        background:
                          'linear-gradient(90deg, transparent, rgba(212,160,23,0.25), transparent)',
                        margin: '8px 0',
                      }}
                    />
                  )}

                  {step.verse_translation && (
                    <div
                      className="font-sacred italic"
                      style={{
                        fontSize: 14,
                        color: '#EDE8DC',
                        lineHeight: 1.75,
                      }}
                    >
                      &ldquo;{step.verse_translation}&rdquo;
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Teaching */}
            <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4a44c] to-orange-500" />
              <div className="p-5 pl-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-[#d4a44c]" />
                  <span className="text-xs font-semibold text-[#d4a44c] uppercase tracking-wider">Teaching</span>
                </div>
                {/* Detect the legacy hardcoded fallback line and surface a
                    clear "being prepared" chip instead of silently showing it.
                    The new enemy-aware fallback in journey_engine_service.py
                    eliminates this for fresh journeys, but pre-existing
                    UserJourneyStepState rows persist the old text in
                    kiaan_step_json — this chip catches those. */}
                {step.teaching?.startsWith('Continue your journey with mindfulness') && (
                  <div
                    className="rounded-lg px-3 py-2 mb-3 text-xs"
                    style={{
                      background: 'rgba(217,119,6,0.1)',
                      border: '1px solid rgba(217,119,6,0.25)',
                      color: '#FCD34D',
                      fontFamily: 'Outfit, sans-serif',
                      lineHeight: 1.5,
                    }}
                  >
                    {'\u23F3'} Full teaching content is being prepared for this day.
                  </div>
                )}
                <p className="text-white/90 leading-relaxed">{step.teaching}</p>
              </div>
            </section>

            {/* Verses (legacy) — only render if the flattened block above
                is unavailable, so the verse is never duplicated. */}
            {!step.verse_sanskrit && !step.verse_ref && step.verses?.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4a44c]" />
                  <span className="text-sm font-semibold">Wisdom from the Gita</span>
                </div>
                {step.verses.map((verse, idx) => (
                  <div
                    key={`${verse.chapter}-${verse.verse}-${idx}`}
                    className="rounded-2xl border border-[#d4a44c]/20 bg-gradient-to-br from-[#d4a44c]/5 to-transparent overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#d4a44c]/10 flex items-center gap-2">
                      <span className="text-[#d4a44c] text-sm">ॐ</span>
                      <span className="text-xs text-[#d4a44c]/80">
                        Chapter {verse.chapter}, Verse {verse.verse}
                      </span>
                    </div>
                    {verse.sanskrit && (
                      <div className="px-4 py-3 bg-[#d4a44c]/[0.03]">
                        <p
                          className="text-center leading-loose"
                          style={{
                            fontFamily: '"Noto Sans Devanagari", sans-serif',
                            color: 'rgba(240,192,64,0.9)',
                            fontSize: '18px',
                            lineHeight: 2.0,
                            textShadow: '0 0 8px rgba(212,160,23,0.15)',
                          }}
                        >
                          {verse.sanskrit}
                        </p>
                        {verse.transliteration && (
                          <p className="text-xs text-[#d4a44c]/60 font-sacred italic text-center mt-2">{verse.transliteration}</p>
                        )}
                      </div>
                    )}
                    <div className="px-4 py-3">
                      <p className="text-white/90 leading-relaxed text-sm">{verse.english}</p>
                    </div>
                    {verse.hindi && (
                      <div className="px-4 py-2 border-t border-[#d4a44c]/10">
                        <p className="text-caption text-[var(--mv-text-muted)] leading-relaxed">{verse.hindi}</p>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════
                BLOCK 3: Modern Real-Life Example
                "I recognise myself in this." — the mirror that makes
                ancient wisdom immediately relevant. Rendered only when
                the backend supplies modern_example (deterministically
                picked per enemy + day_index). ─────────────────────── */}
            {step.modern_example && (
              <section
                className="relative overflow-hidden rounded-2xl"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(22,26,66,0.85), rgba(17,20,53,0.98))',
                  border: enemyInfo
                    ? `1px solid rgba(${enemyInfo.colorRGB},0.22)`
                    : '1px solid rgba(212,160,23,0.22)',
                  borderLeft: enemyInfo
                    ? `3px solid rgba(${enemyInfo.colorRGB},0.65)`
                    : '3px solid rgba(212,160,23,0.65)',
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              >
                <div className="p-5">
                  <div
                    className="font-ui uppercase mb-2"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.14em',
                      color: enemyInfo?.color ?? '#D4A017',
                    }}
                  >
                    {'\u2726'} In Today&apos;s World
                  </div>

                  <div className="font-divine italic text-[#EDE8DC] leading-snug mb-2 text-base">
                    {step.modern_example.scenario}
                  </div>

                  <div className="font-sacred italic text-[#B8AE98] leading-relaxed text-sm mb-3">
                    {step.modern_example.how_enemy_manifests}
                  </div>

                  <div
                    className="my-2"
                    style={{
                      height: 1,
                      background: enemyInfo
                        ? `linear-gradient(90deg, transparent, rgba(${enemyInfo.colorRGB},0.32), transparent)`
                        : 'linear-gradient(90deg, transparent, rgba(212,160,23,0.32), transparent)',
                    }}
                  />

                  <div className="font-sacred italic text-[#EDE8DC] leading-relaxed text-sm">
                    {step.modern_example.practical_antidote}
                  </div>
                </div>
              </section>
            )}

            {/* Guided Reflection */}
            {step.guided_reflection?.length > 0 && (
              <section className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-950/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-violet-500" />
                <div className="p-5 pl-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Reflection</span>
                  </div>
                  <ul className="space-y-3">
                    {step.guided_reflection.map((prompt, idx) => (
                      <li key={idx} className="flex gap-3 text-white/90 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-400 font-medium">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{prompt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Practice */}
            {step.practice && Object.keys(step.practice).length > 0 && (
              <section className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-green-950/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-500" />
                <div className="p-5 pl-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Practice</span>
                    </div>
                    {typeof step.practice.duration_minutes === 'number' && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400">
                        {step.practice.duration_minutes} min
                      </span>
                    )}
                  </div>
                  {typeof step.practice.name === 'string' && (
                    <p className="font-semibold text-white mb-3">{step.practice.name}</p>
                  )}
                  {Array.isArray(step.practice.instructions) && (
                    <ol className="space-y-2.5">
                      {(step.practice.instructions as string[]).map((instruction, idx) => (
                        <li key={idx} className="flex gap-3 text-white/90 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-[10px] text-green-400 font-bold">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{String(instruction)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </section>
            )}

            {/* Micro commitment */}
            {step.micro_commitment && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4">
                <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Micro Commitment</p>
                <p className="text-white/90 text-sm italic">&ldquo;{step.micro_commitment}&rdquo;</p>
              </div>
            )}

            {/* Safety note */}
            {step.safety_note && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300/90 leading-relaxed">{step.safety_note}</p>
                </div>
              </div>
            )}

            {/* Completion area */}
            {!step.is_completed && step.available_to_complete && (
              <div className="space-y-3 pt-2">
                {/* Sakha asks reflection prompt */}
                {step.check_in_prompt && typeof step.check_in_prompt.prompt === 'string' && (
                  <div className="mb-2">
                    <p className="text-[9px] uppercase tracking-[0.15em] font-ui mb-1"
                      style={{ color: enemyInfo?.color ?? '#D4A017' }}>
                      Sakha asks:
                    </p>
                    <p className="font-divine text-lg italic text-[#EDE8DC] leading-relaxed">
                      {step.check_in_prompt.prompt}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setShowReflection(!showReflection)}
                  className="w-full rounded-xl border py-3 text-sm transition-all"
                  style={{
                    borderColor: showReflection
                      ? `${enemyInfo?.color ?? '#D4A017'}40`
                      : 'rgba(255,255,255,0.08)',
                    backgroundColor: showReflection
                      ? `${enemyInfo?.color ?? '#D4A017'}08`
                      : 'rgba(255,255,255,0.03)',
                    color: showReflection
                      ? (enemyInfo?.color ?? '#D4A017')
                      : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {showReflection ? 'Hide Reflection' : 'Add Reflection (Optional)'}
                </button>

                <AnimatePresence>
                  {showReflection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="relative">
                        <textarea
                          value={reflection}
                          onChange={(e) => setReflection(e.target.value)}
                          placeholder="What stirs in you after this practice?"
                          className="w-full rounded-xl bg-[rgba(22,26,66,0.5)] p-4 text-[#EDE8DC] font-sacred text-base leading-relaxed placeholder:text-white/25 outline-none resize-none transition-all"
                          style={{
                            border: `1px solid ${reflection.length > 0 ? (enemyInfo?.color ?? '#D4A017') + '40' : 'rgba(212,160,23,0.15)'}`,
                            minHeight: 140,
                            maxHeight: 300,
                          }}
                          rows={4}
                          maxLength={5000}
                        />
                        {/* Word count */}
                        <div className="flex items-center justify-between mt-1 px-1">
                          <span className="text-[10px] text-[#D4A017]/40 font-ui">
                            {'\u2726'} {reflection.trim().split(/\s+/).filter(Boolean).length} words offered
                          </span>
                          <span className="text-[9px] text-white/20 font-ui">
                            {'\uD83D\uDD12'} Encrypted
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCompleteStep}
                  disabled={isCompleting}
                  className="w-full rounded-2xl py-4 text-base font-bold text-[#050714] disabled:opacity-50"
                  style={{
                    // BUG-14 parity with Begin button: explicit touch target
                    // and no tap delay on older Android WebView.
                    minHeight: 48,
                    touchAction: 'manipulation',
                    background: enemyInfo
                      ? `linear-gradient(135deg, ${enemyInfo.color}cc, ${enemyInfo.color})`
                      : 'linear-gradient(135deg, #D4A017cc, #D4A017)',
                    boxShadow: enemyInfo
                      ? `0 4px 20px rgba(${enemyInfo.colorRGB},0.3)`
                      : '0 4px 20px rgba(212,160,23,0.3)',
                  }}
                >
                  {isCompleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Completing...
                    </span>
                  ) : showReflection && reflection.trim()
                    ? "Complete & Receive Sakha's Wisdom"
                    : "Complete Today's Step"
                  }
                </motion.button>
              </div>
            )}

            {/* Time-gated - Come back tomorrow */}
            {!step.is_completed && !step.available_to_complete && (
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-amber-900/10 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🌅</span>
                </div>
                <p className="text-amber-400 font-semibold">
                  Come back tomorrow
                </p>
                {step.next_available_at && (
                  <p className="text-caption text-[var(--mv-text-muted)] mt-1">
                    Available {new Date(step.next_available_at).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })}
                  </p>
                )}
                <p className="text-caption text-[var(--mv-text-muted)] mt-3 max-w-xs mx-auto">
                  Take time to reflect on today&apos;s teaching.
                  Your next step will be waiting for you.
                </p>
              </div>
            )}

            {/* Sakha wisdom card — animates in after a successful completion
                when the backend returned ai_response. Replaces the plain
                "Step Completed" box for the immediate post-completion view. */}
            <AnimatePresence>
              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45 }}
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    background:
                      'radial-gradient(ellipse at 50% 0%, rgba(212,160,23,0.12), rgba(17,20,53,0.98))',
                    border: '1px solid rgba(212,160,23,0.22)',
                    borderTop: '3px solid rgba(212,160,23,0.7)',
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{
                          background: 'radial-gradient(#1B4FBB, #050714)',
                          border: '1.5px solid rgba(212,160,23,0.5)',
                          fontSize: 18,
                        }}
                      >
                        {'\u0950'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-ui uppercase"
                          style={{
                            fontSize: 9,
                            color: '#D4A017',
                            letterSpacing: '0.14em',
                          }}
                        >
                          Sakha Reflects
                        </div>
                        <div
                          className="font-ui"
                          style={{ fontSize: 10, color: '#6B6355' }}
                        >
                          Your KIAAN companion responds
                        </div>
                      </div>
                      {masteryDelta && masteryDelta > 0 && (
                        <div
                          className="font-ui"
                          style={{
                            fontSize: 11,
                            padding: '3px 9px',
                            borderRadius: 9,
                            background: 'rgba(16,185,129,0.15)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            color: '#6EE7B7',
                          }}
                        >
                          +{masteryDelta} mastery
                        </div>
                      )}
                    </div>

                    <p
                      className="font-sacred italic"
                      style={{
                        fontSize: 15,
                        color: '#EDE8DC',
                        lineHeight: 1.85,
                      }}
                    >
                      {aiResponse}
                    </p>

                    <button
                      type="button"
                      onClick={() => router.push('/m/journeys')}
                      className="mt-4 w-full rounded-xl py-3 font-ui"
                      style={{
                        fontSize: 13,
                        background: 'rgba(22,26,66,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#B8AE98',
                        touchAction: 'manipulation',
                        minHeight: 44,
                      }}
                    >
                      Return to Journeys
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Already completed (legacy box) — suppressed while the Sakha
                card is showing so we don't duplicate the "completed" state. */}
            {step.is_completed && !aiResponse && (
              <div className="rounded-2xl border border-green-500/30 bg-green-950/20 p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-semibold">Step Completed</p>
                {step.completed_at && (
                  <p className="text-caption text-[var(--mv-text-muted)] mt-1">
                    {new Date(step.completed_at).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            )}
          </>
        ) : journey.status === 'paused' ? (
          <div className="text-center py-12">
            <Pause className="w-12 h-12 text-[#d4a44c] mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Journey Paused</h2>
            <p className="text-body text-[var(--mv-text-secondary)] mb-6">Resume to continue your transformation.</p>
            <button
              onClick={() => handleAction('resume')}
              disabled={actionLoading !== null}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4a44c] to-orange-500 text-black font-medium disabled:opacity-50"
            >
              {actionLoading === 'resume' ? 'Resuming...' : 'Resume Journey'}
            </button>
          </div>
        ) : journey.status === 'completed' ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🙏</div>
            <h2 className="text-xl font-bold mb-2">Journey Complete</h2>
            <p className="text-body text-[var(--mv-text-secondary)] mb-6">
              You have completed all {journey.total_days} days. Your dedication to inner transformation is inspiring.
            </p>
            <button
              onClick={() => router.push('/m/journeys')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4a44c] to-orange-500 text-black font-medium"
            >
              Explore More Journeys
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a44c] border-t-transparent" />
          </div>
        )}
      </div>
    </MobileAppShell>
  )
}
