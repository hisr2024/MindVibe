/**
 * useDailyRefresh — Detects day changes and triggers periodic content refresh.
 *
 * Stores the last refresh date in localStorage. On mount and at 60-second
 * intervals, checks whether the calendar day has changed. When a new day is
 * detected the onDayChange callback fires. An optional pollingInterval
 * triggers onRefresh for progress sync (default: every 5 minutes).
 */

import { useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'journey_last_refresh_date'
const DAY_CHECK_INTERVAL_MS = 60_000 // 60 seconds

interface UseDailyRefreshOptions {
  /** Fires when the calendar day rolls over (midnight crossing). */
  onDayChange: () => void
  /** Fires on each polling tick for progress sync. */
  onRefresh?: () => void
  /** Polling interval in ms for onRefresh (default 5 min). Set 0 to disable. */
  pollingInterval?: number
}

function todayString(): string {
  return new Date().toDateString()
}

export function useDailyRefresh({
  onDayChange,
  onRefresh,
  pollingInterval = 5 * 60 * 1000,
}: UseDailyRefreshOptions): void {
  const onDayChangeRef = useRef(onDayChange)
  const onRefreshRef = useRef(onRefresh)

  // Keep refs up to date without causing effect re-runs
  useEffect(() => {
    onDayChangeRef.current = onDayChange
  }, [onDayChange])

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  // Day-change detection
  const checkDayChange = useCallback(() => {
    const today = todayString()
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== today) {
        localStorage.setItem(STORAGE_KEY, today)
        onDayChangeRef.current()
      }
    } catch {
      // localStorage unavailable (SSR, private browsing) — skip
    }
  }, [])

  useEffect(() => {
    // Check immediately on mount
    checkDayChange()

    // 60s interval for day rollover detection
    const dayTimer = setInterval(checkDayChange, DAY_CHECK_INTERVAL_MS)

    // Optional polling interval for progress refresh
    let pollTimer: ReturnType<typeof setInterval> | null = null
    if (pollingInterval > 0 && onRefreshRef.current) {
      pollTimer = setInterval(() => {
        onRefreshRef.current?.()
      }, pollingInterval)
    }

    return () => {
      clearInterval(dayTimer)
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [checkDayChange, pollingInterval])
}
