/**
 * ActiveJourneyActions — Inline Pause / Resume / Close controls rendered
 * beneath each active-journey card on the JourneysTab.
 *
 * Without these buttons the only way to free a slot was to hit the 5/5
 * limit and open the MaxJourneysSheet. Users with no visible active
 * journeys (or who simply wanted to stop one) had no path forward. Each
 * destructive action requires a two-tap confirmation to avoid accidents.
 */

'use client'

import { useState } from 'react'
import type { JourneyResponse } from '@/types/journeyEngine.types'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface ActiveJourneyActionsProps {
  journey: JourneyResponse
  /** Called after a successful pause / resume / abandon so the parent
   *  can refetch the dashboard. */
  onChanged: () => void
}

type BusyAction = 'pause' | 'resume' | 'abandon' | null

export function ActiveJourneyActions({
  journey,
  onChanged,
}: ActiveJourneyActionsProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [busy, setBusy] = useState<BusyAction>(null)
  const [confirmingAbandon, setConfirmingAbandon] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaused = journey.status === 'paused'

  const runAction = async (
    action: Exclude<BusyAction, null>,
    op: () => Promise<unknown>,
    fallbackError: string,
  ) => {
    if (busy) return
    setBusy(action)
    setError(null)
    triggerHaptic('medium')
    try {
      await op()
      triggerHaptic('success')
      setConfirmingAbandon(false)
      onChanged()
    } catch (err) {
      triggerHaptic('error')
      const message =
        err instanceof JourneyEngineError ? err.message : fallbackError
      setError(message)
    } finally {
      setBusy(null)
    }
  }

  const handlePause = () =>
    runAction(
      'pause',
      () => journeyEngineService.pauseJourney(journey.journey_id),
      'Could not pause this journey. Please try again.',
    )

  const handleResume = () =>
    runAction(
      'resume',
      () => journeyEngineService.resumeJourney(journey.journey_id),
      'Could not resume this journey. Please try again.',
    )

  const handleAbandon = () =>
    runAction(
      'abandon',
      () => journeyEngineService.abandonJourney(journey.journey_id),
      'Could not close this journey. Please try again.',
    )

  return (
    <div className="px-1">
      <div className="flex items-center gap-1.5">
        {isPaused ? (
          <button
            type="button"
            onClick={handleResume}
            disabled={busy !== null}
            className="flex-1 h-8 rounded-full text-[10px] font-ui font-semibold text-emerald-300 bg-emerald-900/20 border border-emerald-500/30 disabled:opacity-50"
            style={{ touchAction: 'manipulation' }}
          >
            {busy === 'resume' ? 'Resuming\u2026' : 'Resume'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            disabled={busy !== null}
            className="flex-1 h-8 rounded-full text-[10px] font-ui text-[#B8AE98] bg-white/5 border border-white/10 disabled:opacity-50"
            style={{ touchAction: 'manipulation' }}
          >
            {busy === 'pause' ? 'Pausing\u2026' : 'Pause'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light')
            setError(null)
            setConfirmingAbandon((v) => !v)
          }}
          disabled={busy !== null}
          className="flex-1 h-8 rounded-full text-[10px] font-ui text-red-300 bg-red-900/15 border border-red-500/25 disabled:opacity-50"
          style={{ touchAction: 'manipulation' }}
        >
          {busy === 'abandon' ? 'Closing\u2026' : 'Close'}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-[10px] text-red-300 font-ui text-center">
          {error}
        </p>
      )}

      {confirmingAbandon && (
        <div className="mt-2 rounded-lg bg-red-900/20 border border-red-500/30 p-2.5">
          <p className="text-[10px] text-red-200 font-ui text-center mb-2">
            Permanently close this journey? It will be removed from your
            active battles. Your progress history is preserved.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingAbandon(false)}
              disabled={busy !== null}
              className="flex-1 h-8 rounded-lg text-[10px] font-ui text-[#B8AE98] bg-white/5 border border-white/10 disabled:opacity-50"
              style={{ touchAction: 'manipulation' }}
            >
              Keep
            </button>
            <button
              type="button"
              onClick={handleAbandon}
              disabled={busy !== null}
              className="flex-1 h-8 rounded-lg text-[10px] font-ui font-semibold text-red-200 bg-red-700/40 border border-red-500/40 disabled:opacity-60"
              style={{ touchAction: 'manipulation' }}
            >
              {busy === 'abandon' ? 'Closing\u2026' : 'Close permanently'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
