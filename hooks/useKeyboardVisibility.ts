'use client'

import { useState, useEffect, useCallback } from 'react'

export interface KeyboardState {
  /** Whether the keyboard is currently visible */
  isVisible: boolean
  /** Height of the keyboard in pixels */
  height: number
  /** Whether the keyboard is animating (opening/closing) */
  isAnimating: boolean
  /** The currently focused input element */
  focusedElement: HTMLElement | null
}

export interface UseKeyboardVisibilityOptions {
  /** Callback when keyboard shows */
  onShow?: (height: number) => void
  /** Callback when keyboard hides */
  onHide?: () => void
  /** Callback during keyboard animation */
  onHeightChange?: (height: number) => void
  /** Minimum height change to consider as keyboard */
  minKeyboardHeight?: number
}

export function useKeyboardVisibility(options: UseKeyboardVisibilityOptions = {}): KeyboardState {
  const {
    onShow,
    onHide,
    onHeightChange,
    minKeyboardHeight = 100,
  } = options

  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    isAnimating: false,
    focusedElement: null,
  })

  // Track the initial viewport height
  const initialHeightRef = { current: typeof window !== 'undefined' ? window.innerHeight : 0 }
  const animationTimeoutRef = { current: null as NodeJS.Timeout | null }

  const handleViewportResize = useCallback(() => {
    if (typeof window === 'undefined') return

    // Use visualViewport API if available (more accurate)
    const viewportHeight = typeof visualViewport !== 'undefined'
      ? visualViewport.height
      : window.innerHeight

    const heightDiff = initialHeightRef.current - viewportHeight
    const keyboardVisible = heightDiff > minKeyboardHeight
    const keyboardHeight = keyboardVisible ? heightDiff : 0

    setState(prev => {
      // Detect if keyboard state changed
      const wasVisible = prev.isVisible
      const isNowVisible = keyboardVisible

      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }

      // Set animating state
      if (wasVisible !== isNowVisible) {
        animationTimeoutRef.current = setTimeout(() => {
          setState(p => ({ ...p, isAnimating: false }))
        }, 300)
      }

      // Trigger callbacks
      if (!wasVisible && isNowVisible) {
        onShow?.(keyboardHeight)
      } else if (wasVisible && !isNowVisible) {
        onHide?.()
      }

      if (keyboardHeight !== prev.height) {
        onHeightChange?.(keyboardHeight)
      }

      return {
        ...prev,
        isVisible: keyboardVisible,
        height: keyboardHeight,
        isAnimating: wasVisible !== isNowVisible,
      }
    })
  }, [minKeyboardHeight, onShow, onHide, onHeightChange])

  // Handle focus events
  const handleFocus = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' ||
                   target.tagName === 'TEXTAREA' ||
                   target.isContentEditable

    if (isInput) {
      setState(prev => ({ ...prev, focusedElement: target }))
    }
  }, [])

  const handleBlur = useCallback(() => {
    // Delay to allow for focus to move to another element
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement
      const isInput = activeElement?.tagName === 'INPUT' ||
                     activeElement?.tagName === 'TEXTAREA' ||
                     activeElement?.isContentEditable

      if (!isInput) {
        setState(prev => ({ ...prev, focusedElement: null }))
      }
    }, 100)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Store initial height
    initialHeightRef.current = window.innerHeight

    // Use visualViewport API if available
    if (typeof visualViewport !== 'undefined') {
      visualViewport.addEventListener('resize', handleViewportResize)
    } else {
      window.addEventListener('resize', handleViewportResize)
    }

    // Focus/blur events
    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)

    return () => {
      if (typeof visualViewport !== 'undefined') {
        visualViewport.removeEventListener('resize', handleViewportResize)
      } else {
        window.removeEventListener('resize', handleViewportResize)
      }
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [handleViewportResize, handleFocus, handleBlur])

  return state
}

/**
 * Hook to scroll an element into view when keyboard shows
 */
export function useScrollIntoViewOnKeyboard(elementRef: React.RefObject<HTMLElement | null>) {
  const { isVisible, focusedElement } = useKeyboardVisibility()

  useEffect(() => {
    if (isVisible && focusedElement && elementRef.current) {
      // Wait for keyboard animation
      setTimeout(() => {
        focusedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)
    }
  }, [isVisible, focusedElement, elementRef])
}

/**
 * Hook to adjust container padding when keyboard is visible
 */
export function useKeyboardPadding(baseBottomPadding: number = 0) {
  const { isVisible, height } = useKeyboardVisibility()

  return {
    paddingBottom: isVisible ? height + baseBottomPadding : baseBottomPadding,
    transition: 'padding-bottom 0.2s ease-out',
  }
}

/**
 * Hook to dismiss keyboard on scroll
 */
export function useDismissKeyboardOnScroll(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.blur()
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef])
}

export default useKeyboardVisibility
