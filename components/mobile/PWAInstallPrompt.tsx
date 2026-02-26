'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  Download,
  X,
  Share,
  PlusSquare,
  Smartphone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export interface PWAInstallPromptProps {
  /** Delay before showing the prompt (in ms) */
  delay?: number
  /** Don't show again for this many days after dismissal */
  dismissForDays?: number
  /** Custom app name */
  appName?: string
  /** Custom description */
  description?: string
  /** Show as bottom sheet instead of floating banner */
  variant?: 'banner' | 'sheet' | 'mini'
}

export function PWAInstallPrompt({
  delay = 3000,
  dismissForDays = 7,
  appName = 'MindVibe',
  description = 'Install MindVibe for a better experience with offline access and faster loading.',
  variant = 'banner',
}: PWAInstallPromptProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  // Check if already installed or dismissed
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if running as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    setIsPWA(isStandalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(iOS)

    // Check dismiss timestamp
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissedAt) {
      const dismissDate = new Date(parseInt(dismissedAt))
      const daysSince = (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < dismissForDays) {
        return
      }
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setInstallPrompt(e)

      // Show prompt after delay
      setTimeout(() => {
        setIsVisible(true)
        triggerHaptic('light')
      }, delay)
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(true)
      triggerHaptic('success')

      // Hide after showing success
      setTimeout(() => {
        setIsVisible(false)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Show iOS prompt after delay if on iOS and not PWA
    if (iOS && !isStandalone) {
      setTimeout(() => {
        setIsVisible(true)
        triggerHaptic('light')
      }, delay)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [delay, dismissForDays, triggerHaptic])

  // Handle install
  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      triggerHaptic('medium')
      return
    }

    if (!installPrompt) return

    triggerHaptic('medium')
    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
        triggerHaptic('success')
      }
    } catch {
      // Install prompt was dismissed or failed
    }

    setInstallPrompt(null)
  }, [installPrompt, isIOS, triggerHaptic])

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    triggerHaptic('light')
    setIsVisible(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }, [triggerHaptic])

  // Don't show if already PWA or nothing to show
  if (isPWA || (!installPrompt && !isIOS && !isInstalled)) {
    return null
  }

  // Success state
  if (isInstalled) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="
              fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px)+16px)]
              left-4 right-4
              p-4 rounded-2xl
              bg-emerald-500/20 border border-emerald-500/30
              backdrop-blur-xl
              flex items-center gap-3
              z-50
            "
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="text-emerald-50 font-medium">
              {appName} installed successfully!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // iOS Instructions Sheet
  if (showIOSInstructions) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setShowIOSInstructions(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="
              absolute bottom-0 left-0 right-0
              bg-[#0f1624] rounded-t-[28px]
              p-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]
            "
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#d4a44c] to-[#d4a44c] flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-slate-950" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Install {appName}
              </h3>
              <p className="text-slate-400 text-sm">
                Add to your home screen for the best experience
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.04]">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Share className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">1. Tap Share</p>
                  <p className="text-slate-400 text-sm">Find it at the bottom of Safari</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.04]">
                <div className="w-10 h-10 rounded-full bg-[#d4a44c]/20 flex items-center justify-center">
                  <PlusSquare className="w-5 h-5 text-[#d4a44c]" />
                </div>
                <div>
                  <p className="text-white font-medium">2. Add to Home Screen</p>
                  <p className="text-slate-400 text-sm">Scroll down and tap the option</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.04]">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">3. Tap Add</p>
                  <p className="text-slate-400 text-sm">Confirm to install the app</p>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowIOSInstructions(false)}
              className="
                w-full py-4 rounded-xl
                bg-white/[0.08] hover:bg-white/[0.12]
                text-white font-semibold
                transition-colors
              "
            >
              Got it
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Mini variant
  if (variant === 'mini') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstall}
            className="
              fixed top-[calc(env(safe-area-inset-top,0px)+16px)]
              right-4
              px-4 py-2 rounded-full
              bg-gradient-to-r from-[#d4a44c] to-[#d4a44c]
              text-slate-950 font-semibold text-sm
              shadow-lg shadow-[#d4a44c]/30
              flex items-center gap-2
              z-50
            "
          >
            <Download className="w-4 h-4" />
            Install
          </motion.button>
        )}
      </AnimatePresence>
    )
  }

  // Banner variant (default)
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          className="
            fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px)+16px)]
            left-4 right-4
            p-4 rounded-2xl
            bg-[#1a2133]/95 border border-[#d4a44c]/20
            backdrop-blur-xl
            shadow-xl shadow-black/30
            z-50
          "
        >
          {/* Close button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDismiss}
            className="
              absolute top-3 right-3
              w-8 h-8 rounded-full
              bg-white/[0.06] hover:bg-white/[0.1]
              flex items-center justify-center
              transition-colors
            "
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-slate-400" />
          </motion.button>

          <div className="flex items-start gap-4">
            {/* App Icon */}
            <div className="
              w-14 h-14 rounded-xl flex-shrink-0
              bg-gradient-to-br from-[#d4a44c] to-[#d4a44c]
              flex items-center justify-center
              shadow-lg shadow-[#d4a44c]/30
            ">
              <Sparkles className="w-7 h-7 text-slate-950" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-6">
              <h3 className="text-white font-semibold mb-1">
                Install {appName}
              </h3>
              <p className="text-slate-400 text-sm line-clamp-2">
                {description}
              </p>
            </div>
          </div>

          {/* Install Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleInstall}
            className="
              w-full mt-4 py-3 rounded-xl
              bg-gradient-to-r from-[#d4a44c] to-[#d4a44c]
              text-slate-950 font-semibold
              shadow-lg shadow-[#d4a44c]/25
              flex items-center justify-center gap-2
            "
          >
            <Download className="w-5 h-5" />
            Install App
          </motion.button>

          {/* Features */}
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Offline Access
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Fast Loading
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Notifications
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PWAInstallPrompt
