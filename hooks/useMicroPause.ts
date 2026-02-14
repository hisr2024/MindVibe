/**
 * useMicroPause - Manages the 1.5-2s calming pause before AI responses.
 *
 * Tracks when a loading phase ends (loading transitions from true to false
 * while a result exists) and holds a `showPause` flag for the breathing-dot
 * duration. Automatically respects reduced-motion and the feature flag.
 *
 * Uses the React-documented "storing information from previous renders"
 * pattern to detect prop transitions without refs or effects:
 * https://react.dev/reference/react/useState#storing-information-from-previous-renders
 */

import { useState, useEffect } from 'react'
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
  const [prevLoading, setPrevLoading] = useState(loading)

  const prefersReducedMotion = useReducedMotion()
  const isEnabled = useMicroPauseStore((s) => s.isEnabledForTool)(tool)

  // Detect loading→done transition via render-time state derivation.
  // React allows calling setState during render when comparing with
  // previously stored state. It re-renders synchronously before commit.
  if (loading !== prevLoading) {
    setPrevLoading(loading)
    if (prevLoading && !loading && hasResult && isEnabled && !prefersReducedMotion) {
      setShowPause(true)
    }
  }

  // Timer to end the pause after MICRO_PAUSE_MS
  useEffect(() => {
    if (!showPause) return

    const timer = setTimeout(() => setShowPause(false), MICRO_PAUSE_MS)
    return () => clearTimeout(timer)
  }, [showPause])

  return { showPause }
}
