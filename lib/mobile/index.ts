/**
 * Mobile Library Index
 * Export all mobile optimization utilities and context
 */

// Mobile Context and Hooks
export {
  MobileOptimizationProvider,
  useMobileOptimization,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useDeviceInfo,
  useSafeArea,
  useKeyboard,
  useToast,
  useHaptic,
  type MobileDeviceInfo,
  type MobileSettings,
  type MobileContextValue,
} from './MobileContext'

// Mobile Utilities
export {
  // Device detection
  isMobileDevice,
  isTabletDevice,
  isIOSDevice,
  isAndroidDevice,
  isTouchDevice,
  isPWA,
  hasNotch,
  // Safe area
  getSafeAreaInsets,
  type SafeAreaInsets,
  // Viewport
  getViewportSize,
  getVisualViewportSize,
  isLandscape,
  // Scroll
  lockBodyScroll,
  scrollToTop,
  scrollToElement,
  // Touch
  preventPullToRefresh,
  disableDoubleTapZoom,
  // Network
  getConnectionType,
  isSlowConnection,
  isOnline,
  type ConnectionType,
  // Performance
  prefersReducedMotion,
  prefersColorScheme,
  supportsBackdropFilter,
  // Animation config
  MOBILE_SPRING_CONFIG,
  MOBILE_EASE,
  MOBILE_DURATION,
  // CSS helpers
  clamp,
  rem,
  vw,
  vh,
  safeAreaTop,
  safeAreaBottom,
  safeAreaLeft,
  safeAreaRight,
  // Breakpoints
  BREAKPOINTS,
  isBreakpoint,
  // Layout constants
  MOBILE_NAV_HEIGHT,
  MOBILE_HEADER_HEIGHT,
  getContentPadding,
} from './utils'
