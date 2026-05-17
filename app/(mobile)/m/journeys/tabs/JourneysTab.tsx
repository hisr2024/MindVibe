/**
 * JourneysTab — Journey management: active journeys, template catalog,
 * enemy filter pills, template detail modal with pace selector.
 *
 * Fixed: modal error display, navigation race condition, error visibility
 */

'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type {
  DashboardResponse,
  JourneyTemplate,
  EnemyType,
  PersonalizationSettings,
} from '@/types/journeyEngine.types'
import { ENEMY_INFO, ENEMY_ORDER, getDifficultyLabel } from '@/types/journeyEngine.types'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import { ActiveJourneyCardMobile } from '../components/ActiveJourneyCardMobile'
import { ActiveJourneyActions } from '../components/ActiveJourneyActions'
import { JourneyTemplateCard } from '../components/JourneyTemplateCard'
import { JourneyCardSkeleton } from '../skeletons/JourneyCardSkeleton'
import { MaxJourneysSheet } from '../components/MaxJourneysSheet'

interface JourneysTabProps {
  dashboard: DashboardResponse | null
  templates: JourneyTemplate[]
  isLoading: boolean
  onRefresh: () => void
  /** Optional enemy to pre-select filter when user arrives from Battleground tab */
  initialEnemy?: EnemyType | null
  /** Called once the initialEnemy has been applied so parent can clear it */
  onEnemyConsumed?: () => void
  /** When set, auto-open the matching template detail (single-match case) */
  autoOpenForEnemy?: EnemyType | null
  /** Called after auto-open has been processed */
  onAutoOpenConsumed?: () => void
}

type PaceOption = 'daily' | 'every_other_day' | 'weekly'

const PACE_OPTIONS: { value: PaceOption; label: string; desc: string }[] = [
  { value: 'daily', label: 'Daily', desc: 'Every day' },
  { value: 'every_other_day', label: 'Every Other Day', desc: 'Gentle pace' },
  { value: 'weekly', label: 'Weekly', desc: 'Once a week' },
]

function estimateCompletion(duration: number, pace: PaceOption): string {
  const multiplier = pace === 'daily' ? 1 : pace === 'every_other_day' ? 2 : 7
  const days = duration * multiplier
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function JourneysTab({
  dashboard,
  templates,
  isLoading,
  onRefresh,
  initialEnemy = null,
  onEnemyConsumed,
  autoOpenForEnemy = null,
  onAutoOpenConsumed,
}: JourneysTabProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType | null>(initialEnemy)

  // When parent hands us a pre-selected enemy (navigated from Battleground tab),
  // apply it once then notify the parent to clear its state.
  useEffect(() => {
    if (initialEnemy) {
      setSelectedEnemy(initialEnemy)
      onEnemyConsumed?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEnemy])

  // Auto-open template detail after Battleground "Begin Journey" tap.
  // Single-match → open the detail sheet so the button feels responsive.
  // Multi-match → leave the filtered list visible.
  useEffect(() => {
    if (!autoOpenForEnemy || !templates || templates.length === 0) return
    const matches = templates.filter((t) =>
      t.primary_enemy_tags.includes(autoOpenForEnemy),
    )
    if (matches.length === 1) {
      const timer = setTimeout(() => {
        setDetailTemplate(matches[0])
        setSelectedPace('daily')
        setModalError(null)
        onAutoOpenConsumed?.()
      }, 180)
      return () => clearTimeout(timer)
    }
    onAutoOpenConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenForEnemy, templates])
  const [startingId, setStartingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showMaxSheet, setShowMaxSheet] = useState(false)

  // BUG-03: synchronous re-entry guard. Two rapid taps before React commits
  // state both passed the old `if (startingId) return` check and fired two
  // concurrent POSTs. A ref update is synchronous and survives across renders.
  const isStartingRef = useRef<boolean>(false)

  // Template detail modal state
  const [detailTemplate, setDetailTemplate] = useState<JourneyTemplate | null>(null)
  const [selectedPace, setSelectedPace] = useState<PaceOption>('daily')
  // FIX BUG 1+5: Separate modal error state so errors show INSIDE the modal
  const [modalError, setModalError] = useState<string | null>(null)

  // BUG-03: fresh idempotency key per opened template. Retries for the same
  // template use the same key (backend deduplicates within 60s), while a
  // different template gets a new key so a genuine second journey can start.
  const idempotencyKey = useMemo(
    () =>
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `journey-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    [detailTemplate?.id],
  )

  // Trust the backend-authoritative count. Previously we re-filtered the
  // list by status here, which compounded the bug where the dashboard list
  // could be empty (orphaned templates) while the DB count was still 5,
  // permanently trapping the user behind the MaxJourneysSheet blocker.
  const activeJourneys = dashboard?.active_journeys ?? []
  const maxActive = dashboard?.max_active ?? 5
  const activeCount = dashboard?.active_count ?? activeJourneys.length
  const canStart = activeCount < maxActive

  const filteredTemplates = useMemo(() => {
    if (!selectedEnemy) return templates
    return templates.filter((t) =>
      t.primary_enemy_tags.includes(selectedEnemy),
    )
  }, [templates, selectedEnemy])

  // Lookup of "is this template already an active journey?" keyed by both
  // template_slug and template_id, since the dashboard's active_journeys
  // entries currently only carry template_slug. Once populated, the catalog
  // can render a "Continue → Day N" CTA on the matching card AND
  // handleTemplateCardTap can navigate directly into the existing journey
  // instead of opening the start-modal (which would either start a duplicate
  // or hit the 5/5 limit).
  //
  // We depend on `dashboard?.active_journeys` directly (not the
  // `activeJourneys` local) because the local is a `?? []` expression that
  // produces a fresh array reference on every render — that would invalidate
  // this memo every render and defeat the purpose.
  const activeByTemplate = useMemo(() => {
    const list = dashboard?.active_journeys ?? []
    const map = new Map<string, (typeof list)[number]>()
    for (const j of list) {
      if (j.template_slug) map.set(j.template_slug, j)
      // template_id is not on the JourneyResponse shape today, but if a
      // future server adds it we want this lookup to work without code
      // changes. Cast through unknown to keep TS strict-mode happy.
      const tid = (j as unknown as { template_id?: string }).template_id
      if (tid) map.set(tid, j)
    }
    return map
  }, [dashboard?.active_journeys])

  const handleStart = useCallback(
    async (templateId: string) => {
      // BUG-03: synchronous guard — state updates are async, a ref is not.
      if (isStartingRef.current) return
      if (!canStart) {
        setDetailTemplate(null)
        setShowMaxSheet(true)
        return
      }
      isStartingRef.current = true
      setStartingId(templateId)
      setModalError(null)
      triggerHaptic('medium')

      const personalization: PersonalizationSettings = { pace: selectedPace }

      // BUG-05: single AbortController drives both the 15s timeout and the
      // in-flight fetch. `timedOut` is flipped INSIDE the timeout callback,
      // before abort() propagates, so the catch block classifies the error
      // correctly (previously the flag was set after Promise.race resolved,
      // mislabelling real network errors as "Request timed out").
      const controller = new AbortController()
      let timedOut = false
      const timeoutHandle = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, 15_000)

      try {
        const journey = await journeyEngineService.startJourney(
          { template_id: templateId, personalization },
          { signal: controller.signal, idempotencyKey },
        )
        clearTimeout(timeoutHandle)

        // BUG-06 + BUG-17: prefetch, navigate, then close the modal on the
        // next microtask. Using requestAnimationFrame (~16ms) previously raced
        // the 280ms Framer Motion exit animation, unmounting the sheet
        // mid-animation and flickering. Navigating first commits the route,
        // and the haptic only fires once we're on the way.
        const destination = `/m/journeys/${journey.journey_id}`
        router.prefetch(destination)
        // Refresh the dashboard BEFORE navigating so the catalog state the
        // user returns to already includes the new journey. Without this
        // await the "Your Active Battles" section + the template card's
        // "Continue → Day N" affordance can race the back-navigation and
        // appear to lose the journey the user just started. We swallow
        // refresh failures because the navigation itself is the priority.
        try {
          await Promise.resolve(onRefresh())
        } catch {
          /* refresh errors are non-fatal — navigation still proceeds */
        }
        await router.push(destination)
        setTimeout(() => setDetailTemplate(null), 0)
        triggerHaptic('success')
      } catch (err) {
        clearTimeout(timeoutHandle)
        triggerHaptic('error')

        const isAbort =
          err instanceof Error &&
          (err.name === 'AbortError' || err.message === 'REQUEST_TIMEOUT')
        const isAuth =
          err instanceof JourneyEngineError && err.code === 'AUTH_REQUIRED'
        const isMax =
          err instanceof JourneyEngineError && err.isMaxJourneysError()
        const isOffline =
          typeof navigator !== 'undefined' && !navigator.onLine

        if (isMax) {
          // BUG-04: refresh dashboard so canStart recomputes from fresh data
          // before we show the MaxJourneys sheet.
          setDetailTemplate(null)
          try {
            await Promise.resolve(onRefresh())
          } catch {
            /* swallow refresh errors — MaxJourneys sheet is still the right UX */
          }
          setShowMaxSheet(true)
        } else if (isAbort && timedOut) {
          setModalError(
            'Request timed out. Check your connection and try again.',
          )
        } else if (isAbort) {
          setModalError('Request was cancelled. Please try again.')
        } else if (isAuth) {
          setModalError('Session expired. Please log in and try again.')
        } else if (isOffline) {
          setModalError(
            'No internet connection. Please reconnect and try again.',
          )
        } else if (err instanceof JourneyEngineError) {
          if (err.statusCode === 403) {
            setModalError('Permission denied. Try refreshing the page.')
          } else if (err.statusCode === 404) {
            setModalError(
              'This journey template was not found. Please choose another.',
            )
          } else if (err.statusCode === 422) {
            setModalError('Invalid journey configuration. Please try again.')
          } else if (err.statusCode >= 500) {
            setModalError('Server error. Please try again in a moment.')
          } else {
            setModalError(err.message)
          }
        } else {
          setModalError('Failed to start journey. Please try again.')
        }
      } finally {
        clearTimeout(timeoutHandle)
        isStartingRef.current = false
        setStartingId(null)
      }
    },
    [canStart, triggerHaptic, selectedPace, router, onRefresh, idempotencyKey],
  )

  const handleTemplateCardTap = (template: JourneyTemplate) => {
    // If the user already has an active journey for this template, skip the
    // start-modal entirely and jump straight to the day page. Without this,
    // tapping an already-active template would either start a duplicate or
    // (when at 5/5) raise the MaxJourneys sheet — both bad UX.
    const existing =
      activeByTemplate.get(template.slug) ??
      activeByTemplate.get(template.id)
    if (existing) {
      triggerHaptic('light')
      router.push(`/m/journeys/${existing.journey_id}`)
      return
    }

    if (!canStart) {
      setShowMaxSheet(true)
      return
    }
    triggerHaptic('light')
    setDetailTemplate(template)
    setSelectedPace('daily')
    setModalError(null) // Clear any previous modal errors
  }

  const detailEnemy = detailTemplate?.primary_enemy_tags[0] as EnemyType | undefined
  const detailInfo = detailEnemy ? ENEMY_INFO[detailEnemy] : null

  // BUG-11 (root cause): the sheet uses position: fixed, but JourneysScreen
  // wraps every tab in a Framer Motion <motion.div> with transform/opacity
  // animations. A transformed ancestor creates a new containing block, which
  // re-anchors `position: fixed` children to that ancestor instead of the
  // viewport — so the sheet's `bottom: 0` landed ABOVE the tab bar rather
  // than at the physical bottom of the screen. Rendering the sheet via a
  // React portal to document.body escapes the transformed ancestor so
  // `fixed` anchors to the viewport as expected.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (typeof document !== 'undefined') setPortalTarget(document.body)
  }, [])

  return (
    <div className="px-4 pb-6 space-y-5">
      {/* Enemy filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
        <button
          onClick={() => {
            triggerHaptic('light')
            setSelectedEnemy(null)
          }}
          className="flex-shrink-0 h-[36px] px-3 rounded-full text-[11px] font-ui font-medium transition-all"
          style={{
            backgroundColor: !selectedEnemy
              ? '#D4A017'
              : 'rgba(255,255,255,0.05)',
            color: !selectedEnemy ? '#050714' : 'rgba(255,255,255,0.6)',
          }}
        >
          All
        </button>
        {ENEMY_ORDER.map((enemy) => {
          const info = ENEMY_INFO[enemy]
          const isActive = selectedEnemy === enemy
          return (
            <button
              key={enemy}
              onClick={() => {
                triggerHaptic('light')
                setSelectedEnemy(isActive ? null : enemy)
              }}
              className="flex-shrink-0 h-[36px] px-3 rounded-full text-[11px] font-ui font-medium transition-all flex items-center gap-1"
              style={{
                backgroundColor: isActive
                  ? info.color
                  : 'rgba(255,255,255,0.05)',
                color: isActive ? '#050714' : info.color,
                boxShadow: isActive ? `0 2px 8px rgba(${info.colorRGB},0.3)` : 'none',
              }}
            >
              <span
                className="text-[10px]"
                style={{ fontFamily: '"Noto Sans Devanagari", sans-serif', lineHeight: 1.5 }}
              >
                {info.devanagari}
              </span>
            </button>
          )
        })}
        <div className="flex-shrink-0 flex items-center pl-1">
          <span className="text-[9px] text-[#6B6355] font-ui whitespace-nowrap">
            {activeCount}/{maxActive}
          </span>
        </div>
      </div>

      {/* Error banner (tab-level, for non-modal errors) */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-900/15 px-4 py-2 text-center">
          <p className="text-xs text-red-300 font-ui">{error}</p>
        </div>
      )}

      {/* Active Journeys */}
      {isLoading ? (
        <JourneyCardSkeleton count={2} />
      ) : activeJourneys.length > 0 ? (
        <section>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui mb-2">
            Your Active Battles
          </p>
          <div className="space-y-3">
            {activeJourneys.map((journey, i) => (
              <div key={journey.journey_id} className="space-y-1.5">
                <ActiveJourneyCardMobile journey={journey} index={i} />
                <ActiveJourneyActions
                  journey={journey}
                  onChanged={onRefresh}
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center">
          <div className="text-3xl mb-2">{'\u2694\uFE0F'}</div>
          <p className="text-sm text-[#EDE8DC] font-ui">No active journeys</p>
          <p className="text-[11px] text-[#6B6355] font-ui mt-1">
            Begin the inner war below.
          </p>
          {activeCount > 0 && (
            /* TRAP STATE — backend reports >0 active journeys but none are
               visible in the list. Give the user a direct recovery action
               instead of making them hit the 5/5 limit first. */
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-900/10 p-3">
              <p className="text-[11px] text-amber-200 font-ui mb-2">
                Server reports {activeCount} active but none visible.
              </p>
              <button
                type="button"
                onClick={async () => {
                  triggerHaptic('medium')
                  try {
                    await journeyEngineService.fixStuckJourneys()
                    triggerHaptic('success')
                    onRefresh()
                  } catch (err) {
                    triggerHaptic('error')
                    setError(
                      err instanceof JourneyEngineError
                        ? err.message
                        : 'Could not clear stuck journeys.',
                    )
                  }
                }}
                className="w-full rounded-lg py-2.5 text-[12px] font-ui font-semibold text-[#050714]"
                style={{
                  background:
                    'linear-gradient(135deg, #D4A017cc, #D4A017)',
                  touchAction: 'manipulation',
                  minHeight: 44,
                }}
              >
                Clear stuck slots
              </button>
            </div>
          )}
        </div>
      )}

      {/* Max warning (inline) */}
      {!canStart && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2">
          <p className="text-[11px] text-amber-300/80 font-ui text-center">
            5 active journeys. Complete or pause one to start another.
          </p>
        </div>
      )}

      {/* Template catalog */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui mb-2">
          {selectedEnemy
            ? `${ENEMY_INFO[selectedEnemy].name} Journeys`
            : 'Begin a New Journey'}
        </p>
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredTemplates.map((template, i) => {
              const startedInfo =
                activeByTemplate.get(template.slug) ??
                activeByTemplate.get(template.id) ??
                null
              return (
                <JourneyTemplateCard
                  key={template.id}
                  template={template}
                  startedInfo={startedInfo}
                  onStart={() => handleTemplateCardTap(template)}
                  isStarting={startingId === template.id}
                  // Active templates remain tappable even when the user is
                  // at 5/5, because tapping an active card just navigates
                  // to the existing journey (handled in handleTemplateCardTap).
                  disabled={!canStart && !startedInfo}
                  index={i}
                />
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center">
            <p className="text-sm text-[#B8AE98] font-ui">
              {selectedEnemy
                ? `No journeys found for ${ENEMY_INFO[selectedEnemy].name}.`
                : 'Journey templates are being prepared.'}
            </p>
          </div>
        )}
      </section>

      {/* Template Detail Modal — portaled to document.body so `position: fixed`
          anchors to the viewport (not the transformed motion.div ancestor
          in JourneysScreen). z-[60] keeps it above the fixed tab bar (z-20). */}
      {portalTarget && createPortal(
      <AnimatePresence>
        {detailTemplate && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 60 }}
          >
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/75 pointer-events-auto"
              onClick={(e) => {
                // Only close on a direct tap of the backdrop itself.
                // Never close mid-start (user's tap is being processed).
                if (
                  e.target === e.currentTarget &&
                  !isStartingRef.current
                ) {
                  setDetailTemplate(null)
                }
              }}
            />

            {/* Sheet — critically-damped tween, GPU-composited */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 rounded-t-3xl pointer-events-auto overflow-y-auto"
              style={{
                background: detailInfo
                  ? `linear-gradient(170deg, rgba(${detailInfo.colorRGB},0.1), rgba(5,7,20,0.99) 40%)`
                  : 'rgba(5,7,20,0.99)',
                borderTop: detailInfo ? `2px solid ${detailInfo.color}40` : '2px solid rgba(212,160,23,0.3)',
                // BUG-09: dvh respects iOS Safari's dynamic toolbar; vh was
                // stale on landscape and clipped the Begin button off-screen.
                maxHeight:
                  'min(92dvh, calc(100dvh - env(safe-area-inset-top, 44px)))',
                // BUG-12: safe-area padding on all sides, not just bottom.
                paddingBottom:
                  'max(env(safe-area-inset-bottom, 0px), 16px)',
                paddingLeft: 'env(safe-area-inset-left, 0px)',
                paddingRight: 'env(safe-area-inset-right, 0px)',
                // BUG-13: contain scroll momentum to the sheet on Android
                // and prevent touch gestures from chaining to the page.
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
                backfaceVisibility: 'hidden',
                WebkitOverflowScrolling: 'touch',
                willChange: 'transform',
                transform: 'translate3d(0, 0, 0)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-5 pb-6">
                {/* Enemy badge */}
                {detailInfo && (
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-lg"
                      style={{
                        fontFamily: '"Noto Sans Devanagari", sans-serif',
                        color: detailInfo.color,
                        lineHeight: 2.0,
                      }}
                    >
                      {detailInfo.devanagari}
                    </span>
                    <span className="text-xs font-ui" style={{ color: detailInfo.color }}>
                      {detailInfo.name}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h2 className="text-xl font-ui font-bold text-[#EDE8DC] mb-1">
                  {detailTemplate.title}
                </h2>
                <p className="text-sm text-[#B8AE98] font-ui mb-4">
                  {detailTemplate.description || 'Begin your journey of inner transformation'}
                </p>

                {/* Metadata pills */}
                <div className="flex gap-2 mb-5">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#D4A017]/15 text-[#D4A017] font-ui">
                    {detailTemplate.duration_days} Days
                  </span>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/70 font-ui">
                    {getDifficultyLabel(detailTemplate.difficulty)}
                  </span>
                  {detailTemplate.is_free && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-ui">
                      Free
                    </span>
                  )}
                </div>

                {/* Gita verse reference */}
                {detailInfo && (
                  <div className="bg-white/[0.03] rounded-xl p-3 mb-5">
                    <p className="text-[9px] text-[#D4A017]/50 font-ui uppercase tracking-wider mb-1">
                      BG {detailInfo.keyVerse.chapter}.{detailInfo.keyVerse.verse}
                    </p>
                    <p className="text-xs text-[#B8AE98] font-sacred italic">
                      {detailInfo.keyVerseText}
                    </p>
                  </div>
                )}

                {/* Pace selector */}
                <div className="mb-5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui mb-2">
                    Choose Your Pace
                  </p>
                  <div className="flex gap-2">
                    {PACE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          triggerHaptic('light')
                          setSelectedPace(option.value)
                          setModalError(null) // Clear error on pace change
                        }}
                        className="flex-1 rounded-xl py-2.5 text-center transition-all"
                        style={{
                          backgroundColor:
                            selectedPace === option.value
                              ? '#D4A017'
                              : 'rgba(255,255,255,0.05)',
                          color:
                            selectedPace === option.value
                              ? '#050714'
                              : 'rgba(255,255,255,0.6)',
                          boxShadow:
                            selectedPace === option.value
                              ? '0 2px 12px rgba(212,160,23,0.3)'
                              : 'none',
                        }}
                      >
                        <div className="text-[12px] font-ui font-semibold">{option.label}</div>
                        <div className="text-[9px] font-ui opacity-70">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#6B6355] font-ui mt-1.5 text-center">
                    Est. completion: {estimateCompletion(detailTemplate.duration_days, selectedPace)}
                  </p>
                </div>

                {/* FIX BUG 5: Error message INSIDE the modal (visible above the button) */}
                {modalError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-900/15 px-4 py-2.5 mb-3">
                    <p className="text-xs text-red-300 font-ui text-center">{modalError}</p>
                    <button
                      onClick={() => setModalError(null)}
                      className="text-[10px] text-red-400/60 font-ui underline mt-1 block mx-auto"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Start button — BUG-14: explicit type="button" (no form
                    submission), touch-action: manipulation (removes the
                    300ms tap delay on older Android WebView), and a 48px
                    minimum hit target for WCAG 2.5.5. */}
                <button
                  type="button"
                  onClick={() => handleStart(detailTemplate.id)}
                  disabled={startingId === detailTemplate.id}
                  className="w-full rounded-xl text-sm font-ui font-bold text-[#050714] active:scale-[0.97] transition-transform disabled:opacity-60"
                  style={{
                    minHeight: 48,
                    padding: '14px 16px',
                    touchAction: 'manipulation',
                    background: detailInfo
                      ? `linear-gradient(135deg, ${detailInfo.color}cc, ${detailInfo.color})`
                      : 'linear-gradient(135deg, #D4A017cc, #D4A017)',
                    boxShadow: detailInfo
                      ? `0 4px 20px rgba(${detailInfo.colorRGB},0.35)`
                      : '0 4px 20px rgba(212,160,23,0.35)',
                  }}
                >
                  {startingId === detailTemplate.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="inline-block"
                        style={{
                          fontFamily: '"Noto Sans Devanagari", sans-serif',
                          animation: 'spin 1.5s linear infinite',
                          lineHeight: 2.0,
                        }}
                      >
                        {'\u0950'}
                      </span>
                      Starting…
                    </span>
                  ) : (
                    `Begin ${detailTemplate.duration_days}-Day Journey`
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      portalTarget,
      )}

      {/* Max Journeys Sheet — now lists the active journeys with Pause
          buttons so the user can unblock themselves without leaving the
          sheet (previously they had no exit and were permanently trapped). */}
      <MaxJourneysSheet
        isOpen={showMaxSheet}
        onClose={() => {
          setShowMaxSheet(false)
          // BUG-04: after the user dismisses the Max Journeys sheet (likely
          // after completing one elsewhere), refresh dashboard so canStart
          // recomputes and the Begin button becomes tappable again.
          try {
            onRefresh()
          } catch {
            /* refresh errors are non-fatal here */
          }
        }}
        activeJourneys={activeJourneys}
        maxActive={maxActive}
        onAfterPause={async () => {
          try {
            await Promise.resolve(onRefresh())
          } catch {
            /* refresh errors are non-fatal — sheet stays open */
          }
        }}
      />
    </div>
  )
}
