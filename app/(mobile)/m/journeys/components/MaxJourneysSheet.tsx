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
  /** Called after a successful pause/abandon/recovery so the parent can refresh the dashboard. */
  onAfterPause: () => Promise<void> | void
}

type BusyAction = 'pause' | 'abandon' | null

export function MaxJourneysSheet({
  isOpen,
  onClose,
  activeJourneys,
  maxActive,
  onAfterPause,
}: MaxJourneysSheetProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const [confirmAbandonId, setConfirmAbandonId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isFixing, setIsFixing] = useState(false)
  const [fixMessage, setFixMessage] = useState<string | null>(null)

  const isBusy = busyId !== null || isFixing

  const handlePause = async (journeyId: string) => {
    if (isBusy) return
    setBusyId(journeyId)
    setBusyAction('pause')
    setActionError(null)
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
      setActionError(message)
    } finally {
      setBusyId(null)
      setBusyAction(null)
    }
  }

  const handleAbandon = async (journeyId: string) => {
    if (isBusy) return
    setBusyId(journeyId)
    setBusyAction('abandon')
    setActionError(null)
    triggerHaptic('medium')
    try {
      await journeyEngineService.abandonJourney(journeyId)
      await onAfterPause()
      triggerHaptic('success')
      setConfirmAbandonId(null)
      onClose()
    } catch (err) {
      triggerHaptic('error')
      const message =
        err instanceof JourneyEngineError
          ? err.message
          : 'Could not close this journey. Please try again.'
      setActionError(message)
    } finally {
      setBusyId(null)
      setBusyAction(null)
    }
  }

  const handleFixStuck = async () => {
    if (isBusy) return
    setIsFixing(true)
    setActionError(null)
    setFixMessage(null)
    triggerHaptic('medium')
    try {
      const res = await journeyEngineService.fixStuckJourneys()
      const cleared =
        (res.force_cleared ?? 0) + (res.orphaned_cleaned ?? 0)
      setFixMessage(
        cleared > 0
          ? `Cleared ${cleared} stuck journey${cleared === 1 ? '' : 's'}. You can start a new one.`
          : 'Slots are clean. You can start a new journey.',
      )
      await onAfterPause()
      triggerHaptic('success')
      // Auto-dismiss after the user can read the confirmation
      setTimeout(() => onClose(), 900)
    } catch (err) {
      triggerHaptic('error')
      const message =
        err instanceof JourneyEngineError
          ? err.message
          : 'Could not clear stuck journeys. Please try again.'
      setActionError(message)
    } finally {
      setIsFixing(false)
    }
  }

  const handleContinue = (journeyId: string) => {
    if (isBusy) return
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

              {actionError && (
                <div className="rounded-xl border border-red-500/30 bg-red-900/20 px-3 py-2 mb-3">
                  <p className="text-[11px] text-red-300 font-ui text-center">
                    {actionError}
                  </p>
                </div>
              )}

              {fixMessage && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/20 px-3 py-2 mb-3">
                  <p className="text-[11px] text-emerald-300 font-ui text-center">
                    {fixMessage}
                  </p>
                </div>
              )}

              {activeJourneys.length === 0 ? (
                /* TRAP STATE — backend says the user is at max but returned
                   an empty list. Without a recovery action they would be
                   permanently locked out of starting new journeys. */
                <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-4 text-center">
                  <div className="text-2xl mb-2">{'\u26A0\uFE0F'}</div>
                  <p className="text-sm text-[#EDE8DC] font-ui font-semibold mb-1">
                    Journey slots are stuck
                  </p>
                  <p className="text-[11px] text-[#B8AE98] font-ui leading-relaxed mb-3">
                    The server reports {maxActive} active journeys but none are
                    visible. Tap below to clear the stuck slots and continue.
                  </p>
                  <button
                    type="button"
                    onClick={handleFixStuck}
                    disabled={isFixing}
                    className="w-full rounded-xl py-3 text-sm font-ui font-bold text-[#050714] active:scale-[0.97] transition-transform disabled:opacity-60"
                    style={{
                      background:
                        'linear-gradient(135deg, #D4A017cc, #D4A017)',
                      boxShadow: '0 4px 20px rgba(212,160,23,0.35)',
                      touchAction: 'manipulation',
                      minHeight: 48,
                    }}
                  >
                    {isFixing ? 'Clearing stuck slots\u2026' : 'Clear stuck journeys'}
                  </button>
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
                    const isThisBusy = busyId === journey.journey_id
                    const isPausing = isThisBusy && busyAction === 'pause'
                    const isAbandoning = isThisBusy && busyAction === 'abandon'
                    const needsConfirm = confirmAbandonId === journey.journey_id
                    const progress = Math.round(journey.progress_percentage)

                    return (
                      <li
                        key={journey.journey_id}
                        className="rounded-xl p-3"
                        style={{
                          background: `linear-gradient(145deg, rgba(${rgb},0.12), rgba(5,7,20,0.95))`,
                          border: `1px solid rgba(${rgb},0.2)`,
                          borderLeft: `3px solid ${color}`,
                        }}
                      >
                       <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {info && (
                              <span
                                className="text-[11px]"
                                style={{
                                  fontFamily:
                                    '"Noto Sans Devanagari", sans-serif',
                                  color,
                                  lineHeight: 1.5,
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
                            disabled={isBusy}
                            className="px-3 h-8 rounded-full text-[10px] font-ui font-semibold disabled:opacity-50"
                            style={{
                              minWidth: 84,
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
                            disabled={isBusy}
                            className="px-3 h-8 rounded-full text-[10px] font-ui text-[#B8AE98] bg-white/5 border border-white/10 disabled:opacity-50"
                            style={{
                              minWidth: 84,
                              touchAction: 'manipulation',
                            }}
                          >
                            {isPausing ? 'Pausing\u2026' : 'Pause'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light')
                              setActionError(null)
                              setConfirmAbandonId(
                                needsConfirm ? null : journey.journey_id,
                              )
                            }}
                            disabled={isBusy}
                            className="px-3 h-8 rounded-full text-[10px] font-ui text-red-300 bg-red-900/15 border border-red-500/25 disabled:opacity-50"
                            style={{
                              minWidth: 84,
                              touchAction: 'manipulation',
                            }}
                          >
                            {isAbandoning ? 'Closing\u2026' : 'Close'}
                          </button>
                        </div>
                       </div>

                        {needsConfirm && (
                          <div className="mt-3 rounded-lg bg-red-900/20 border border-red-500/30 p-2.5">
                            <p className="text-[11px] text-red-200 font-ui text-center mb-2">
                              Permanently close this journey? Your progress
                              will be preserved but it won&apos;t appear in
                              your active battles.
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmAbandonId(null)}
                                disabled={isBusy}
                                className="flex-1 h-9 rounded-lg text-[11px] font-ui text-[#B8AE98] bg-white/5 border border-white/10 disabled:opacity-50"
                                style={{ touchAction: 'manipulation' }}
                              >
                                Keep
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAbandon(journey.journey_id)
                                }
                                disabled={isBusy}
                                className="flex-1 h-9 rounded-lg text-[11px] font-ui font-semibold text-red-200 bg-red-700/40 border border-red-500/40 disabled:opacity-60"
                                style={{ touchAction: 'manipulation' }}
                              >
                                {isAbandoning ? 'Closing\u2026' : 'Close permanently'}
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* Always-available recovery link for edge cases where the
                  list is populated but the real offender is a phantom row. */}
              {activeJourneys.length > 0 && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleFixStuck}
                    disabled={isBusy}
                    className="text-[10px] text-[#6B6355] font-ui underline disabled:opacity-50"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {isFixing
                      ? 'Clearing stuck slots\u2026'
                      : 'Something wrong? Clear stuck slots'}
                  </button>
                </div>
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
