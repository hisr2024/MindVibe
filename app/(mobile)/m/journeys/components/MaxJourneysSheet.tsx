/**
 * MaxJourneysSheet — Bottom sheet shown when user has 5/5 active journeys.
 *
 * Shows the user's active journeys inline with Continue / Pause buttons so
 * they can unblock themselves without leaving the sheet. Previously the
 * sheet only displayed an "Understood" button, which left the user trapped
 * if the dashboard list was empty (e.g. orphaned templates) — there was no
 * way to discover which journeys were holding the slot or to release one.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { JourneyResponse, EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO } from '@/types/journeyEngine.types'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface MaxJourneysSheetProps {
  isOpen: boolean
  onClose: () => void
  activeJourneys: JourneyResponse[]
  maxActive: number
  /** Called after a successful pause so the parent can refresh the dashboard. */
  onAfterPause: () => Promise<void> | void
}

export function MaxJourneysSheet({
  isOpen,
  onClose,
  activeJourneys,
  maxActive,
  onAfterPause,
}: MaxJourneysSheetProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const [pausingId, setPausingId] = useState<string | null>(null)
  const [pauseError, setPauseError] = useState<string | null>(null)

  const handlePause = async (journeyId: string) => {
    if (pausingId) return
    setPausingId(journeyId)
    setPauseError(null)
    triggerHaptic('medium')
    try {
      await journeyEngineService.pauseJourney(journeyId)
      await onAfterPause()
      triggerHaptic('success')
      onClose()
    } catch (err) {
      triggerHaptic('error')
      const message =
        err instanceof JourneyEngineError
          ? err.message
          : 'Could not pause this journey. Please try again.'
      setPauseError(message)
    } finally {
      setPausingId(null)
    }
  }

  const handleContinue = (journeyId: string) => {
    triggerHaptic('light')
    router.push(`/m/journeys/${journeyId}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full rounded-t-3xl bg-[#0B0E2A] border-t border-amber-500/20 flex flex-col"
            style={{
              maxHeight: '88dvh',
              paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-6 pt-3 pb-4 text-center flex-shrink-0">
              <div className="text-3xl mb-2">{'\u2694\uFE0F'}</div>
              <h3 className="text-lg font-ui font-bold text-[#EDE8DC] mb-2">
                {maxActive} Active Journeys
              </h3>
              <p className="text-sm text-[#B8AE98] font-ui leading-relaxed">
                Pause one journey below to make room for a new path.
              </p>
              <p className="text-[10px] text-[#6B6355] font-ui italic mt-2">
                &quot;Focus on fewer battles to win the war within.&quot;
              </p>
            </div>

            {/* Active journeys list — the exit hatch */}
            <div
              className="flex-1 overflow-y-auto px-4 pb-4"
              style={{ overscrollBehavior: 'contain' }}
            >
              <p className="text-[9px] uppercase tracking-[0.14em] text-[#D4A017] font-ui mb-2">
                Your active journeys — pause one to continue
              </p>

              {pauseError && (
                <div className="rounded-xl border border-red-500/30 bg-red-900/20 px-3 py-2 mb-3">
                  <p className="text-[11px] text-red-300 font-ui text-center">
                    {pauseError}
                  </p>
                </div>
              )}

              {activeJourneys.length === 0 ? (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] py-5 text-center">
                  <p className="text-xs text-[#6B6355] font-ui italic">
                    Refreshing your journeys&hellip;
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {activeJourneys.map((journey) => {
                    const enemy = journey.primary_enemies[0] as
                      | EnemyType
                      | undefined
                    const info = enemy ? ENEMY_INFO[enemy] : null
                    const color = info?.color ?? '#D4A017'
                    const rgb = info?.colorRGB ?? '212,160,23'
                    const isPausing = pausingId === journey.journey_id
                    const progress = Math.round(journey.progress_percentage)

                    return (
                      <li
                        key={journey.journey_id}
                        className="rounded-xl flex items-center gap-3 p-3"
                        style={{
                          background: `linear-gradient(145deg, rgba(${rgb},0.12), rgba(5,7,20,0.95))`,
                          border: `1px solid rgba(${rgb},0.2)`,
                          borderLeft: `3px solid ${color}`,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {info && (
                              <span
                                className="text-[11px]"
                                style={{
                                  fontFamily:
                                    '"Noto Sans Devanagari", sans-serif',
                                  color,
                                }}
                              >
                                {info.devanagari}
                              </span>
                            )}
                            <span className="text-[9px] text-[#6B6355] font-ui">
                              · Day {journey.current_day}/{journey.total_days}
                              {' · '}
                              {progress}%
                            </span>
                          </div>
                          <p className="text-[13px] text-[#EDE8DC] font-ui font-semibold truncate">
                            {journey.title}
                          </p>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${progress}%`,
                                background: color,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleContinue(journey.journey_id)}
                            disabled={isPausing}
                            className="px-3 h-8 rounded-full text-[10px] font-ui font-semibold disabled:opacity-50"
                            style={{
                              minWidth: 72,
                              background: `rgba(${rgb},0.18)`,
                              border: `1px solid ${color}80`,
                              color,
                              touchAction: 'manipulation',
                            }}
                          >
                            Continue
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePause(journey.journey_id)}
                            disabled={isPausing}
                            className="px-3 h-8 rounded-full text-[10px] font-ui text-[#B8AE98] bg-white/5 border border-white/10 disabled:opacity-50"
                            style={{
                              minWidth: 72,
                              touchAction: 'manipulation',
                            }}
                          >
                            {isPausing ? 'Pausing\u2026' : 'Pause'}
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="px-6 pt-2 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl py-3 text-sm font-ui font-semibold text-[#EDE8DC] bg-white/10 active:scale-[0.97] transition-transform"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
