/**
 * Mobile Optimization Utilities
 * Helper functions for mobile-first development
 */

// ============================================
// DEVICE DETECTION
// ============================================

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768 ||
    /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())
}

export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false
  const width = window.innerWidth
  const ua = navigator.userAgent.toLowerCase()
  return (width >= 768 && width < 1024) || /ipad|tablet|playbook|silk/i.test(ua)
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function isPWA(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
}

export function hasNotch(): boolean {
  if (typeof window === 'undefined') return false
  // Check for notch via CSS env variables
  const div = document.createElement('div')
  div.style.paddingTop = 'env(safe-area-inset-top, 0px)'
  document.body.appendChild(div)
  const hasNotch = parseInt(getComputedStyle(div).paddingTop) > 0
  document.body.removeChild(div)
  return hasNotch
}

// ============================================
// SAFE AREA INSETS
// ============================================

export interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

export function getSafeAreaInsets(): SafeAreaInsets {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }

  const div = document.createElement('div')
  div.style.cssText = `
    position: fixed;
    top: env(safe-area-inset-top, 0px);
    bottom: env(safe-area-inset-bottom, 0px);
    left: env(safe-area-inset-left, 0px);
    right: env(safe-area-inset-right, 0px);
    pointer-events: none;
    visibility: hidden;
  `
  document.body.appendChild(div)
  const style = getComputedStyle(div)
  const insets = {
    top: parseInt(style.top) || 0,
    bottom: parseInt(style.bottom) || 0,
    left: parseInt(style.left) || 0,
    right: parseInt(style.right) || 0,
  }
  document.body.removeChild(div)
  return insets
}

// ============================================
// VIEWPORT UTILITIES
// ============================================

export function getViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 }
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

export function getVisualViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 }
  }
  if (typeof visualViewport !== 'undefined' && visualViewport !== null) {
    return {
      width: visualViewport.width,
      height: visualViewport.height,
    }
  }
  return getViewportSize()
}

export function isLandscape(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth > window.innerHeight
}

// ============================================
// SCROLL UTILITIES
// ============================================

export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {}

  const originalStyle = document.body.style.overflow
  const originalPosition = document.body.style.position
  const scrollY = window.scrollY

  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.width = '100%'

  return () => {
    document.body.style.overflow = originalStyle
    document.body.style.position = originalPosition
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, scrollY)
  }
}

export function scrollToTop(smooth = true): void {
  if (typeof window === 'undefined') return
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto',
  })
}

export function scrollToElement(
  element: HTMLElement | null,
  options: ScrollIntoViewOptions = {}
): void {
  if (!element) return
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    ...options,
  })
}

// ============================================
// TOUCH UTILITIES
// ============================================

export function preventPullToRefresh(): () => void {
  if (typeof document === 'undefined') return () => {}

  let startY = 0
  const handleTouchStart = (e: TouchEvent) => {
    startY = e.touches[0].clientY
  }

  const handleTouchMove = (e: TouchEvent) => {
    const y = e.touches[0].clientY
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop

    // If scrolling up while at the top, prevent default
    if (scrollTop <= 0 && y > startY) {
      e.preventDefault()
    }
  }

  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchmove', handleTouchMove, { passive: false })

  return () => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
  }
}

export function disableDoubleTapZoom(): () => void {
  if (typeof document === 'undefined') return () => {}

  let lastTap = 0
  const handleTouchEnd = (e: TouchEvent) => {
    const now = Date.now()
    if (now - lastTap < 300) {
      e.preventDefault()
    }
    lastTap = now
  }

  document.addEventListener('touchend', handleTouchEnd, { passive: false })
  return () => document.removeEventListener('touchend', handleTouchEnd)
}

// ============================================
// NETWORK UTILITIES
// ============================================

export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown'

export function getConnectionType(): ConnectionType {
  if (typeof navigator === 'undefined') return 'unknown'
  const connection = (navigator as { connection?: { effectiveType?: string } }).connection
  if (!connection?.effectiveType) return 'unknown'
  return connection.effectiveType as ConnectionType
}

export function isSlowConnection(): boolean {
  const type = getConnectionType()
  return type === 'slow-2g' || type === '2g'
}

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

// ============================================
// PERFORMANCE UTILITIES
// ============================================

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function prefersColorScheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function supportsBackdropFilter(): boolean {
  if (typeof CSS === 'undefined') return false
  return CSS.supports('backdrop-filter', 'blur(1px)')
}

// ============================================
// ANIMATION UTILITIES
// ============================================

export const MOBILE_SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
}

export const MOBILE_EASE = [0.22, 1, 0.36, 1] as const

export const MOBILE_DURATION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
}

// ============================================
// CSS HELPERS
// ============================================

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function rem(px: number): string {
  return `${px / 16}rem`
}

export function vw(percentage: number): string {
  return `${percentage}vw`
}

export function vh(percentage: number): string {
  return `${percentage}vh`
}

export function safeAreaTop(): string {
  return 'env(safe-area-inset-top, 0px)'
}

export function safeAreaBottom(): string {
  return 'env(safe-area-inset-bottom, 0px)'
}

export function safeAreaLeft(): string {
  return 'env(safe-area-inset-left, 0px)'
}

export function safeAreaRight(): string {
  return 'env(safe-area-inset-right, 0px)'
}

// ============================================
// BREAKPOINTS
// ============================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export function isBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= BREAKPOINTS[breakpoint]
}

// ============================================
// MOBILE NAV HEIGHT
// ============================================

export const MOBILE_NAV_HEIGHT = 88
export const MOBILE_HEADER_HEIGHT = 56

export function getContentPadding(): { top: number; bottom: number } {
  const insets = getSafeAreaInsets()
  return {
    top: MOBILE_HEADER_HEIGHT + insets.top,
    bottom: MOBILE_NAV_HEIGHT + insets.bottom,
  }
}
