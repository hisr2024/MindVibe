'use client'

import { useState, useCallback, useRef, useEffect, type MutableRefObject } from 'react'
import { useHapticFeedback } from './useHapticFeedback'

export interface UsePullToRefreshOptions {
  /** Callback to execute on refresh */
  onRefresh: () => Promise<void> | void
  /** Minimum pull distance to trigger refresh (default: 80) */
  threshold?: number
  /** Maximum pull distance (default: 150) */
  maxPull?: number
  /** Whether pull to refresh is enabled */
  enabled?: boolean
  /** Callback when pull distance changes */
  onPullChange?: (distance: number, progress: number) => void
}

export interface UsePullToRefreshReturn {
  /** Current pull distance */
  pullDistance: number
  /** Progress percentage (0-1) */
  progress: number
  /** Whether currently refreshing */
  isRefreshing: boolean
  /** Whether currently pulling */
  isPulling: boolean
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement>
  /** Callback ref to set the container element */
  setContainerRef: (node: HTMLDivElement | null) => void
  /** Props to spread on the container element */
  containerProps: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

/**
 * usePullToRefresh - Hook for implementing pull-to-refresh functionality
 *
 * Features:
 * - Touch-based pull detection
 * - Haptic feedback integration
 * - Progress tracking
 * - Configurable thresholds
 * - Smooth rubber-band effect
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 150,
  enabled = true,
  onPullChange,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null) as MutableRefObject<HTMLDivElement | null>
  const startYRef = useRef<number | null>(null)

  // Callback ref setter to allow external consumers to set the container node
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
  }, [])
  const currentYRef = useRef<number>(0)
  const triggeredRef = useRef(false)

  const { triggerHaptic } = useHapticFeedback()

  // Calculate progress (0 to 1)
  const progress = Math.min(pullDistance / threshold, 1)

  // Notify parent of pull change
  useEffect(() => {
    onPullChange?.(pullDistance, progress)
  }, [pullDistance, progress, onPullChange])

  // Apply rubber-band effect to pull distance
  const applyRubberBand = useCallback((distance: number): number => {
    if (distance <= threshold) {
      return distance
    }
    // Rubber band effect for pulling past threshold
    const overPull = distance - threshold
    const rubberBanded = threshold + overPull * 0.4
    return Math.min(rubberBanded, maxPull)
  }, [threshold, maxPull])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return

    const container = containerRef.current
    if (!container) return

    // Only start pull if scrolled to top
    if (container.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY
      currentYRef.current = e.touches[0].clientY
      triggeredRef.current = false
    }
  }, [enabled, isRefreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing || startYRef.current === null) return

    const container = containerRef.current
    if (!container) return

    // Only continue if still at top
    if (container.scrollTop > 0) {
      startYRef.current = null
      setPullDistance(0)
      setIsPulling(false)
      return
    }

    currentYRef.current = e.touches[0].clientY
    const rawDistance = currentYRef.current - startYRef.current

    // Only track downward pulls
    if (rawDistance > 0) {
      setIsPulling(true)
      const adjustedDistance = applyRubberBand(rawDistance)
      setPullDistance(adjustedDistance)

      // Haptic feedback when crossing threshold
      if (adjustedDistance >= threshold && !triggeredRef.current) {
        triggeredRef.current = true
        triggerHaptic('medium')
      } else if (adjustedDistance < threshold && triggeredRef.current) {
        triggeredRef.current = false
      }
    } else {
      setPullDistance(0)
    }
  }, [enabled, isRefreshing, threshold, applyRubberBand, triggerHaptic])

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || startYRef.current === null) return

    startYRef.current = null
    setIsPulling(false)

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold * 0.8) // Keep a small indicator while refreshing
      triggerHaptic('success')

      try {
        await onRefresh()
      } catch (error) {
        console.error('Pull to refresh error:', error)
        triggerHaptic('error')
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [enabled, pullDistance, threshold, isRefreshing, onRefresh, triggerHaptic])

  return {
    pullDistance,
    progress,
    isRefreshing,
    isPulling,
    containerRef,
    setContainerRef,
    containerProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

export default usePullToRefresh
