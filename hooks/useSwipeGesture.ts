'use client'

import { useCallback, useRef, useEffect, useState } from 'react'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface SwipeConfig {
  /** Minimum distance in pixels to trigger swipe */
  threshold?: number
  /** Minimum velocity in pixels/ms to trigger swipe */
  velocityThreshold?: number
  /** Enable horizontal swipes */
  horizontal?: boolean
  /** Enable vertical swipes */
  vertical?: boolean
  /** Prevent default touch behavior */
  preventDefault?: boolean
  /** Callback when swipe starts */
  onSwipeStart?: (direction: SwipeDirection, distance: number) => void
  /** Callback during swipe */
  onSwipeMove?: (direction: SwipeDirection, distance: number, velocity: number) => void
  /** Callback when swipe ends */
  onSwipeEnd?: (direction: SwipeDirection, distance: number, velocity: number) => void
  /** Callback when swipe is cancelled */
  onSwipeCancel?: () => void
}

export interface SwipeState {
  isSwiping: boolean
  direction: SwipeDirection | null
  distance: number
  velocity: number
  progress: number
}

export interface UseSwipeGestureReturn {
  ref: React.RefObject<HTMLElement | null>
  state: SwipeState
  bind: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: (e: React.MouseEvent) => void
    onMouseLeave: (e: React.MouseEvent) => void
  }
}

const defaultConfig: Required<SwipeConfig> = {
  threshold: 50,
  velocityThreshold: 0.3,
  horizontal: true,
  vertical: false,
  preventDefault: false,
  onSwipeStart: () => {},
  onSwipeMove: () => {},
  onSwipeEnd: () => {},
  onSwipeCancel: () => {},
}

export function useSwipeGesture(config: SwipeConfig = {}): UseSwipeGestureReturn {
  const mergedConfig = { ...defaultConfig, ...config }
  const ref = useRef<HTMLElement | null>(null)

  const [state, setState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    distance: 0,
    velocity: 0,
    progress: 0,
  })

  // Track touch state
  const touchState = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    isActive: false,
    isMouse: false,
  })

  const getDirection = useCallback((deltaX: number, deltaY: number): SwipeDirection | null => {
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (mergedConfig.horizontal && absX > absY) {
      return deltaX > 0 ? 'right' : 'left'
    }
    if (mergedConfig.vertical && absY > absX) {
      return deltaY > 0 ? 'down' : 'up'
    }
    return null
  }, [mergedConfig.horizontal, mergedConfig.vertical])

  const handleStart = useCallback((clientX: number, clientY: number, isMouse: boolean = false) => {
    touchState.current = {
      startX: clientX,
      startY: clientY,
      startTime: Date.now(),
      currentX: clientX,
      currentY: clientY,
      isActive: true,
      isMouse,
    }
  }, [])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!touchState.current.isActive) return

    const { startX, startY, startTime } = touchState.current
    touchState.current.currentX = clientX
    touchState.current.currentY = clientY

    const deltaX = clientX - startX
    const deltaY = clientY - startY
    const direction = getDirection(deltaX, deltaY)

    if (!direction) return

    const distance = direction === 'left' || direction === 'right'
      ? Math.abs(deltaX)
      : Math.abs(deltaY)

    const elapsed = Date.now() - startTime
    const velocity = distance / elapsed

    const progress = Math.min(distance / mergedConfig.threshold, 1)

    setState({
      isSwiping: true,
      direction,
      distance,
      velocity,
      progress,
    })

    mergedConfig.onSwipeMove(direction, distance, velocity)
  }, [getDirection, mergedConfig])

  const handleEnd = useCallback(() => {
    if (!touchState.current.isActive) return

    const { startX, startY, startTime, currentX, currentY } = touchState.current
    const deltaX = currentX - startX
    const deltaY = currentY - startY
    const direction = getDirection(deltaX, deltaY)

    if (direction) {
      const distance = direction === 'left' || direction === 'right'
        ? Math.abs(deltaX)
        : Math.abs(deltaY)

      const elapsed = Date.now() - startTime
      const velocity = distance / elapsed

      // Check if swipe meets threshold
      if (distance >= mergedConfig.threshold || velocity >= mergedConfig.velocityThreshold) {
        mergedConfig.onSwipeEnd(direction, distance, velocity)
      } else {
        mergedConfig.onSwipeCancel()
      }
    } else {
      mergedConfig.onSwipeCancel()
    }

    touchState.current.isActive = false
    setState({
      isSwiping: false,
      direction: null,
      distance: 0,
      velocity: 0,
      progress: 0,
    })
  }, [getDirection, mergedConfig])

  // Touch event handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
    if (mergedConfig.preventDefault) {
      e.preventDefault()
    }
  }, [handleStart, mergedConfig.preventDefault])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
    if (mergedConfig.preventDefault && state.isSwiping) {
      e.preventDefault()
    }
  }, [handleMove, mergedConfig.preventDefault, state.isSwiping])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    handleEnd()
    if (mergedConfig.preventDefault) {
      e.preventDefault()
    }
  }, [handleEnd, mergedConfig.preventDefault])

  // Mouse event handlers (for desktop testing)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY, true)
  }, [handleStart])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!touchState.current.isMouse) return
    handleMove(e.clientX, e.clientY)
  }, [handleMove])

  const onMouseUp = useCallback(() => {
    if (!touchState.current.isMouse) return
    handleEnd()
  }, [handleEnd])

  const onMouseLeave = useCallback(() => {
    if (!touchState.current.isMouse) return
    handleEnd()
  }, [handleEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      touchState.current.isActive = false
    }
  }, [])

  return {
    ref,
    state,
    bind: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
  }
}

/**
 * Hook for horizontal swipe navigation
 */
export function useSwipeNavigation(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  config: Omit<SwipeConfig, 'onSwipeEnd' | 'horizontal' | 'vertical'> = {}
) {
  return useSwipeGesture({
    ...config,
    horizontal: true,
    vertical: false,
    onSwipeEnd: (direction) => {
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft()
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight()
      }
    },
  })
}

/**
 * Hook for vertical swipe (pull to refresh, dismiss)
 */
export function useSwipeVertical(
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  config: Omit<SwipeConfig, 'onSwipeEnd' | 'horizontal' | 'vertical'> = {}
) {
  return useSwipeGesture({
    ...config,
    horizontal: false,
    vertical: true,
    onSwipeEnd: (direction) => {
      if (direction === 'up' && onSwipeUp) {
        onSwipeUp()
      } else if (direction === 'down' && onSwipeDown) {
        onSwipeDown()
      }
    },
  })
}

export default useSwipeGesture
