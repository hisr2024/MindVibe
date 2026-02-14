/**
 * useMicroPause - Manages the 1.5-2s calming pause before AI responses.
 *
 * Tracks when a loading phase ends (loading transitions from true to false
 * while a result exists) and holds a `showPause` flag for the breathing-dot
 * duration. Automatically respects reduced-motion and the feature flag.
 */

import { useState, useEffect, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { useMicroPauseStore, type MicroPauseTool } from '@/lib/micro-pause/store'

/** Duration of the breathing dot pause in milliseconds */
const MICRO_PAUSE_MS = 1750

interface UseMicroPauseOptions {
  /** Whether the parent is currently loading */
  loading: boolean
  /** Whether a result is available to show after the pause */
  hasResult: boolean
  /** Tool identifier for per-tool feature flag check */
  tool: MicroPauseTool
}

interface UseMicroPauseReturn {
  /** True while the breathing-dot pause is active */
  showPause: boolean
}

export function useMicroPause({
  loading,
  hasResult,
  tool,
}: UseMicroPauseOptions): UseMicroPauseReturn {
  const [showPause, setShowPause] = useState(false)
  const wasLoading = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const prefersReducedMotion = useReducedMotion()
  const isEnabled = useMicroPauseStore((s) => s.isEnabledForTool)(tool)

  useEffect(() => {
    // Detect loading → done transition
    if (wasLoading.current && !loading && hasResult) {
      if (isEnabled && !prefersReducedMotion) {
        setShowPause(true)
        timerRef.current = setTimeout(() => setShowPause(false), MICRO_PAUSE_MS)
      }
    }
    wasLoading.current = loading
  }, [loading, hasResult, isEnabled, prefersReducedMotion])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { showPause }
}
