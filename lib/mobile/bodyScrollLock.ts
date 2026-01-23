/**
 * Body Scroll Lock Utility
 *
 * A production-grade utility for locking body scroll when modals/overlays open.
 * Handles all the edge cases across iOS, Android, and desktop browsers.
 *
 * Features:
 * - Prevents background scroll when modals are open
 * - Preserves scroll position
 * - Prevents layout shift from scrollbar removal
 * - Handles nested locks (multiple overlays)
 * - iOS Safari specific fixes (no rubber-banding issues)
 * - Android WebView compatibility
 * - SSR safe
 */

interface ScrollLockState {
  scrollY: number
  scrollbarWidth: number
  isLocked: boolean
  lockCount: number
}

// Singleton state
const state: ScrollLockState = {
  scrollY: 0,
  scrollbarWidth: 0,
  isLocked: false,
  lockCount: 0,
}

/**
 * Get the scrollbar width
 */
function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0

  // Cache the value
  if (state.scrollbarWidth > 0) return state.scrollbarWidth

  const outer = document.createElement('div')
  outer.style.visibility = 'hidden'
  outer.style.overflow = 'scroll'
  document.body.appendChild(outer)

  const inner = document.createElement('div')
  outer.appendChild(inner)

  state.scrollbarWidth = outer.offsetWidth - inner.offsetWidth
  outer.remove()

  return state.scrollbarWidth
}

/**
 * Detect if we're on iOS
 */
function isIOS(): boolean {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Detect if we're on Android
 */
function isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

/**
 * Lock body scroll - prevents background scrolling when overlays are open.
 *
 * This handles:
 * - Desktop: Adds overflow: hidden + padding for scrollbar
 * - iOS: Uses position: fixed to prevent Safari rubber-banding
 * - Android: Standard overflow: hidden approach
 *
 * Call unlock() when the overlay closes.
 */
export function lockBodyScroll(): void {
  if (typeof window === 'undefined') return

  state.lockCount++

  // Already locked - just increment counter
  if (state.isLocked) return

  state.isLocked = true
  state.scrollY = window.scrollY

  const scrollbarWidth = getScrollbarWidth()
  const body = document.body
  const html = document.documentElement

  // Store original styles for restoration
  body.dataset.scrollLockPrevOverflow = body.style.overflow
  body.dataset.scrollLockPrevPaddingRight = body.style.paddingRight
  body.dataset.scrollLockPrevPosition = body.style.position
  body.dataset.scrollLockPrevTop = body.style.top
  body.dataset.scrollLockPrevLeft = body.style.left
  body.dataset.scrollLockPrevRight = body.style.right
  body.dataset.scrollLockPrevWidth = body.style.width
  html.dataset.scrollLockPrevOverflow = html.style.overflow

  if (isIOS()) {
    // iOS requires position: fixed to prevent Safari's rubber-banding
    // This is the most reliable approach for iOS
    body.style.position = 'fixed'
    body.style.top = `-${state.scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
  } else {
    // Desktop and Android - standard overflow: hidden
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'

    // Prevent layout shift from scrollbar removal
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }
  }

  // Add class for CSS-based targeting
  body.classList.add('scroll-locked')
}

/**
 * Unlock body scroll - restores normal scrolling.
 *
 * Only actually unlocks when all locks are released (handles nested overlays).
 */
export function unlockBodyScroll(): void {
  if (typeof window === 'undefined') return

  state.lockCount--

  // Don't unlock if there are still active locks
  if (state.lockCount > 0) return

  // Reset to 0 in case of negative (shouldn't happen but safety first)
  state.lockCount = 0

  if (!state.isLocked) return

  state.isLocked = false

  const body = document.body
  const html = document.documentElement

  // Restore original styles
  body.style.overflow = body.dataset.scrollLockPrevOverflow || ''
  body.style.paddingRight = body.dataset.scrollLockPrevPaddingRight || ''
  body.style.position = body.dataset.scrollLockPrevPosition || ''
  body.style.top = body.dataset.scrollLockPrevTop || ''
  body.style.left = body.dataset.scrollLockPrevLeft || ''
  body.style.right = body.dataset.scrollLockPrevRight || ''
  body.style.width = body.dataset.scrollLockPrevWidth || ''
  html.style.overflow = html.dataset.scrollLockPrevOverflow || ''

  // Clean up data attributes
  delete body.dataset.scrollLockPrevOverflow
  delete body.dataset.scrollLockPrevPaddingRight
  delete body.dataset.scrollLockPrevPosition
  delete body.dataset.scrollLockPrevTop
  delete body.dataset.scrollLockPrevLeft
  delete body.dataset.scrollLockPrevRight
  delete body.dataset.scrollLockPrevWidth
  delete html.dataset.scrollLockPrevOverflow

  // Remove class
  body.classList.remove('scroll-locked')

  // Restore scroll position (only needed for iOS position: fixed approach)
  if (isIOS() && state.scrollY > 0) {
    window.scrollTo(0, state.scrollY)
  }
}

/**
 * Force unlock - immediately releases all locks.
 * Use sparingly, only for emergency cleanup.
 */
export function forceUnlockBodyScroll(): void {
  if (typeof window === 'undefined') return

  state.lockCount = 1 // Set to 1 so unlock decrements to 0
  unlockBodyScroll()
}

/**
 * Check if body scroll is currently locked
 */
export function isBodyScrollLocked(): boolean {
  return state.isLocked
}

/**
 * Get current lock count (for debugging)
 */
export function getScrollLockCount(): number {
  return state.lockCount
}

/**
 * React hook for managing body scroll lock
 */
export function useBodyScrollLock(locked: boolean): void {
  if (typeof window === 'undefined') return

  // This is a simple implementation - for React, import and use in useEffect
  if (locked) {
    lockBodyScroll()
  } else {
    unlockBodyScroll()
  }
}

export default {
  lock: lockBodyScroll,
  unlock: unlockBodyScroll,
  forceUnlock: forceUnlockBodyScroll,
  isLocked: isBodyScrollLocked,
  getLockCount: getScrollLockCount,
}
