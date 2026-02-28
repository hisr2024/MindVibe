'use client'

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react'

// Types for mobile optimization
export interface MobileDeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isIOS: boolean
  isAndroid: boolean
  isSafari: boolean
  isChrome: boolean
  isPWA: boolean
  hasNotch: boolean
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  isLandscape: boolean
  isTouchDevice: boolean
  prefersReducedMotion: boolean
  prefersColorScheme: 'dark' | 'light'
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown'
  isOnline: boolean
  batteryLevel: number | null
  isLowPowerMode: boolean
}

export interface MobileSettings {
  hapticFeedbackEnabled: boolean
  animationsEnabled: boolean
  pullToRefreshEnabled: boolean
  swipeNavigationEnabled: boolean
  autoPlayVideos: boolean
  dataSaverMode: boolean
}

export interface MobileContextValue {
  device: MobileDeviceInfo
  settings: MobileSettings
  updateSettings: (settings: Partial<MobileSettings>) => void
  triggerHaptic: (type: HapticType) => void
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: () => void
  toast: ToastState | null
  bottomSheetOpen: boolean
  setBottomSheetOpen: (open: boolean) => void
  keyboardVisible: boolean
  keyboardHeight: number
  safeAreaInsets: SafeAreaInsets
  orientation: 'portrait' | 'landscape'
}

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error'
type ToastType = 'info' | 'success' | 'warning' | 'error'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

const MobileContext = createContext<MobileContextValue | undefined>(undefined)

// Default device info for SSR
const defaultDeviceInfo: MobileDeviceInfo = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isIOS: false,
  isAndroid: false,
  isSafari: false,
  isChrome: false,
  isPWA: false,
  hasNotch: false,
  screenWidth: 1920,
  screenHeight: 1080,
  pixelRatio: 1,
  isLandscape: true,
  isTouchDevice: false,
  prefersReducedMotion: false,
  prefersColorScheme: 'dark',
  connectionType: 'unknown',
  isOnline: true,
  batteryLevel: null,
  isLowPowerMode: false,
}

const defaultSettings: MobileSettings = {
  hapticFeedbackEnabled: true,
  animationsEnabled: true,
  pullToRefreshEnabled: true,
  swipeNavigationEnabled: true,
  autoPlayVideos: true,
  dataSaverMode: false,
}

// Detect device information
function detectDevice(): MobileDeviceInfo {
  if (typeof window === 'undefined') return defaultDeviceInfo

  const ua = navigator.userAgent.toLowerCase()
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  const isMobile = screenWidth < 768 || /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)
  const isTablet = !isMobile && (screenWidth < 1024 || /ipad|tablet|playbook|silk/i.test(ua))
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /android/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/chrome/i.test(ua)
  const isChrome = /chrome/i.test(ua)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true

  // Detect notch (approximate)
  const hasNotch = isIOS && screenHeight >= 812 && screenWidth <= 428

  // Connection type
  const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection
  const connectionType = connection?.effectiveType as MobileDeviceInfo['connectionType'] || 'unknown'

  // Preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isPWA,
    hasNotch,
    screenWidth,
    screenHeight,
    pixelRatio: window.devicePixelRatio || 1,
    isLandscape: screenWidth > screenHeight,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    prefersReducedMotion,
    prefersColorScheme,
    connectionType,
    isOnline: navigator.onLine,
    batteryLevel: null,
    isLowPowerMode: false,
  }
}

// Haptic patterns
const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  selection: 5,
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [30, 100, 30, 100, 30],
}

interface MobileProviderProps {
  children: ReactNode
}

export function MobileOptimizationProvider({ children }: MobileProviderProps) {
  const [device, setDevice] = useState<MobileDeviceInfo>(detectDevice)
  const [settings, setSettings] = useState<MobileSettings>(() => {
    if (typeof window === 'undefined') return defaultSettings
    const saved = localStorage.getItem('mv-mobile-settings')
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  })
  const [toast, setToast] = useState<ToastState | null>(null)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // Initialize device detection
  useEffect(() => {
    // Update safe area insets
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement)
      setSafeAreaInsets({
        top: parseInt(style.getPropertyValue('--sat') || '0') || 0,
        bottom: parseInt(style.getPropertyValue('--sab') || '0') || 0,
        left: parseInt(style.getPropertyValue('--sal') || '0') || 0,
        right: parseInt(style.getPropertyValue('--sar') || '0') || 0,
      })
    }

    // Set CSS variables for safe area
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top, 0px)')
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom, 0px)')
    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left, 0px)')
    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right, 0px)')

    updateSafeArea()

    // Handle resize
    const handleResize = () => {
      setDevice(detectDevice())
      updateSafeArea()
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }

    // Handle online/offline
    const handleOnline = () => setDevice(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setDevice(prev => ({ ...prev, isOnline: false }))

    // Handle keyboard on mobile
    const handleViewportResize = () => {
      if (typeof visualViewport !== 'undefined' && visualViewport !== null) {
        const viewportHeight = visualViewport.height
        const windowHeight = window.innerHeight
        const keyboardH = windowHeight - viewportHeight

        setKeyboardVisible(keyboardH > 100)
        setKeyboardHeight(keyboardH > 100 ? keyboardH : 0)
      }
    }

    // Battery API
    const updateBattery = async () => {
      try {
        const battery = await (navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> }).getBattery?.()
        if (battery) {
          setDevice(prev => ({
            ...prev,
            batteryLevel: battery.level * 100,
            isLowPowerMode: battery.level < 0.2 && !battery.charging,
          }))
        }
      } catch {
        // Battery API not supported
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (typeof visualViewport !== 'undefined' && visualViewport !== null) {
      visualViewport.addEventListener('resize', handleViewportResize)
    }

    updateBattery()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (typeof visualViewport !== 'undefined' && visualViewport !== null) {
        visualViewport.removeEventListener('resize', handleViewportResize)
      }
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mv-mobile-settings', JSON.stringify(settings))
    }
  }, [settings])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<MobileSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Trigger haptic feedback
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (!settings.hapticFeedbackEnabled) return
    if (typeof navigator === 'undefined' || !navigator.vibrate) return
    if (device.prefersReducedMotion) return

    const pattern = hapticPatterns[type]
    navigator.vibrate(pattern)
  }, [settings.hapticFeedbackEnabled, device.prefersReducedMotion])

  // Show toast notification
  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToast({ message, type, visible: true })
    triggerHaptic(type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'light')

    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null)
      setTimeout(() => setToast(null), 300)
    }, duration)
  }, [triggerHaptic])

  // Hide toast
  const hideToast = useCallback(() => {
    setToast(prev => prev ? { ...prev, visible: false } : null)
    setTimeout(() => setToast(null), 300)
  }, [])

  const value = useMemo<MobileContextValue>(() => ({
    device,
    settings,
    updateSettings,
    triggerHaptic,
    showToast,
    hideToast,
    toast,
    bottomSheetOpen,
    setBottomSheetOpen,
    keyboardVisible,
    keyboardHeight,
    safeAreaInsets,
    orientation,
  }), [
    device,
    settings,
    updateSettings,
    triggerHaptic,
    showToast,
    hideToast,
    toast,
    bottomSheetOpen,
    keyboardVisible,
    keyboardHeight,
    safeAreaInsets,
    orientation,
  ])

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  )
}

export function useMobileOptimization() {
  const context = useContext(MobileContext)
  if (context === undefined) {
    throw new Error('useMobileOptimization must be used within a MobileOptimizationProvider')
  }
  return context
}

// Convenience hooks
export function useIsMobile() {
  const { device } = useMobileOptimization()
  return device.isMobile
}

export function useIsTablet() {
  const { device } = useMobileOptimization()
  return device.isTablet
}

export function useIsDesktop() {
  const { device } = useMobileOptimization()
  return device.isDesktop
}

export function useDeviceInfo() {
  const { device } = useMobileOptimization()
  return device
}

export function useSafeArea() {
  const { safeAreaInsets } = useMobileOptimization()
  return safeAreaInsets
}

export function useKeyboard() {
  const { keyboardVisible, keyboardHeight } = useMobileOptimization()
  return { isVisible: keyboardVisible, height: keyboardHeight }
}

export function useToast() {
  const { showToast, hideToast, toast } = useMobileOptimization()
  return { show: showToast, hide: hideToast, current: toast }
}

export function useHaptic() {
  const { triggerHaptic, settings } = useMobileOptimization()
  return {
    trigger: triggerHaptic,
    enabled: settings.hapticFeedbackEnabled,
  }
}
