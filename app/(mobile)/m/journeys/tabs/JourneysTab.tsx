/**
 * JourneysTab — Journey management: active journeys, template catalog,
 * enemy filter pills, template detail modal with pace selector.
 *
 * Fixed: modal error display, navigation race condition, error visibility
 */

'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
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

  // Template detail modal state
  const [detailTemplate, setDetailTemplate] = useState<JourneyTemplate | null>(null)
  const [selectedPace, setSelectedPace] = useState<PaceOption>('daily')
  // FIX BUG 1+5: Separate modal error state so errors show INSIDE the modal
  const [modalError, setModalError] = useState<string | null>(null)

  const activeCount = dashboard?.active_journeys.filter((j) => j.status === 'active').length ?? 0
  const canStart = activeCount < 5

  const filteredTemplates = useMemo(() => {
    if (!selectedEnemy) return templates
    return templates.filter((t) =>
      t.primary_enemy_tags.includes(selectedEnemy),
    )
  }, [templates, selectedEnemy])

  const handleStart = useCallback(
    async (templateId: string) => {
      if (startingId) return
      if (!canStart) {
        setDetailTemplate(null)
        setShowMaxSheet(true)
        return
      }
      setStartingId(templateId)
      setModalError(null)
      triggerHaptic('medium')

      const personalization: PersonalizationSettings = { pace: selectedPace }

      // 15s timeout guard so a hung request can never spin forever.
      let timedOut = false
      const timeoutHandle = setTimeout(() => {
        timedOut = true
      }, 15_000)

      try {
        const journey = await Promise.race([
          journeyEngineService.startJourney({
            template_id: templateId,
            personalization,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('REQUEST_TIMEOUT')),
              15_000,
            ),
          ),
        ])
        clearTimeout(timeoutHandle)
        triggerHaptic('success')

        // Close modal FIRST so the heavy sheet stops painting over the
        // navigating page, then prefetch + navigate on the next frame so
        // the exit animation actually starts before the route change.
        const destination = `/m/journeys/${journey.journey_id}`
        router.prefetch(destination)
        setDetailTemplate(null)
        requestAnimationFrame(() => {
          router.push(destination)
        })
        onRefresh()
      } catch (err) {
        clearTimeout(timeoutHandle)
        triggerHaptic('error')
        if (err instanceof JourneyEngineError && err.isMaxJourneysError()) {
          setDetailTemplate(null)
          setShowMaxSheet(true)
        } else if (
          timedOut ||
          (err instanceof Error && err.message === 'REQUEST_TIMEOUT')
        ) {
          setModalError(
            'Request timed out. Check your connection and try again.',
          )
        } else if (
          typeof navigator !== 'undefined' &&
          !navigator.onLine
        ) {
          setModalError('No internet connection. Please reconnect and try again.')
        } else {
          setModalError(
            err instanceof JourneyEngineError
              ? err.message
              : 'Failed to start journey. Please try again.',
          )
        }
      } finally {
        setStartingId(null)
      }
    },
    [startingId, canStart, triggerHaptic, selectedPace, router, onRefresh],
  )

  const handleTemplateCardTap = (template: JourneyTemplate) => {
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
                style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}
              >
                {info.devanagari}
              </span>
            </button>
          )
        })}
        <div className="flex-shrink-0 flex items-center pl-1">
          <span className="text-[9px] text-[#6B6355] font-ui whitespace-nowrap">
            {activeCount}/5
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
      ) : dashboard && dashboard.active_journeys.length > 0 ? (
        <section>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui mb-2">
            Active Journeys
          </p>
          <div className="space-y-3">
            {dashboard.active_journeys.map((journey, i) => (
              <ActiveJourneyCardMobile
                key={journey.journey_id}
                journey={journey}
                index={i}
              />
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
            {filteredTemplates.map((template, i) => (
              <JourneyTemplateCard
                key={template.id}
                template={template}
                onStart={() => handleTemplateCardTap(template)}
                isStarting={startingId === template.id}
                disabled={!canStart}
                index={i}
              />
            ))}
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

      {/* Template Detail Modal */}
      <AnimatePresence>
        {detailTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setDetailTemplate(null)}
          >
            {/* Backdrop — solid, no backdrop-blur (kills mobile fps) */}
            <div className="absolute inset-0 bg-black/70" />

            {/* Sheet — critically-damped tween, GPU-composited */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl"
              style={{
                background: detailInfo
                  ? `linear-gradient(170deg, rgba(${detailInfo.colorRGB},0.1), rgba(5,7,20,0.99) 40%)`
                  : 'rgba(5,7,20,0.99)',
                borderTop: detailInfo ? `2px solid ${detailInfo.color}40` : '2px solid rgba(212,160,23,0.3)',
                paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                willChange: 'transform',
                transform: 'translate3d(0, 0, 0)',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Full-sheet "starting" overlay — confirms tap immediately */}
              {startingId === detailTemplate.id && (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                  style={{ background: 'rgba(5,7,20,0.94)' }}
                >
                  <div
                    className="text-4xl"
                    style={{
                      color: '#F0C040',
                      fontFamily: '"Noto Sans Devanagari", sans-serif',
                      animation: 'spin 2s linear infinite',
                    }}
                  >
                    {'\u0950'}
                  </div>
                  <p className="text-xs text-[#B8AE98] font-ui">
                    Beginning your journey...
                  </p>
                </div>
              )}
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

                {/* Start button */}
                <button
                  onClick={() => handleStart(detailTemplate.id)}
                  disabled={!!startingId}
                  className="w-full rounded-xl py-3.5 text-sm font-ui font-bold text-[#050714] active:scale-[0.97] transition-transform disabled:opacity-50"
                  style={{
                    background: detailInfo
                      ? `linear-gradient(135deg, ${detailInfo.color}cc, ${detailInfo.color})`
                      : 'linear-gradient(135deg, #D4A017cc, #D4A017)',
                    boxShadow: detailInfo
                      ? `0 4px 20px rgba(${detailInfo.colorRGB},0.35)`
                      : '0 4px 20px rgba(212,160,23,0.35)',
                  }}
                >
                  {startingId === detailTemplate.id
                    ? 'Starting...'
                    : `Begin ${detailTemplate.duration_days}-Day Journey`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Max Journeys Sheet */}
      <MaxJourneysSheet
        isOpen={showMaxSheet}
        onClose={() => setShowMaxSheet(false)}
      />
    </div>
  )
}
