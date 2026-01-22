'use client'

import { useEffect, useCallback, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react'

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'offline' | 'online'
export type ToastPosition = 'top' | 'bottom'

export interface ToastConfig {
  id?: string
  message: string
  type?: ToastType
  duration?: number
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  position?: ToastPosition
}

export interface Toast extends ToastConfig {
  id: string
  createdAt: number
}

// Toast context for global usage
let toastListeners: Set<(toast: Toast) => void> = new Set()
let dismissListeners: Set<(id: string) => void> = new Set()

export function showToast(config: ToastConfig) {
  const toast: Toast = {
    ...config,
    id: config.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    type: config.type || 'info',
    duration: config.duration ?? 3000,
    dismissible: config.dismissible ?? true,
    position: config.position ?? 'bottom',
  }

  toastListeners.forEach((listener) => listener(toast))
  return toast.id
}

export function dismissToast(id: string) {
  dismissListeners.forEach((listener) => listener(id))
}

// Individual Toast Component
interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { triggerHaptic } = useHapticFeedback()

  const typeConfig = {
    info: {
      icon: <Info className="w-5 h-5" />,
      bgClass: 'bg-blue-500/10 border-blue-500/30',
      iconClass: 'text-blue-400',
      textClass: 'text-blue-50',
    },
    success: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
      iconClass: 'text-emerald-400',
      textClass: 'text-emerald-50',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bgClass: 'bg-amber-500/10 border-amber-500/30',
      iconClass: 'text-amber-400',
      textClass: 'text-amber-50',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      bgClass: 'bg-red-500/10 border-red-500/30',
      iconClass: 'text-red-400',
      textClass: 'text-red-50',
    },
    offline: {
      icon: <WifiOff className="w-5 h-5" />,
      bgClass: 'bg-slate-500/10 border-slate-500/30',
      iconClass: 'text-slate-400',
      textClass: 'text-slate-200',
    },
    online: {
      icon: <Wifi className="w-5 h-5" />,
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
      iconClass: 'text-emerald-400',
      textClass: 'text-emerald-50',
    },
  }

  const config = typeConfig[toast.type || 'info']

  useEffect(() => {
    // Trigger haptic on mount
    if (toast.type === 'error') {
      triggerHaptic('error')
    } else if (toast.type === 'warning') {
      triggerHaptic('warning')
    } else if (toast.type === 'success') {
      triggerHaptic('success')
    } else {
      triggerHaptic('light')
    }

    // Auto dismiss
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, onDismiss, triggerHaptic])

  const isTop = toast.position === 'top'

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: isTop ? -20 : 20,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: isTop ? -10 : 10,
        scale: 0.95,
        transition: { duration: 0.15 },
      }}
      className={`
        w-full max-w-sm mx-auto
        px-4 py-3 rounded-2xl
        backdrop-blur-xl
        border ${config.bgClass}
        shadow-lg shadow-black/20
        flex items-center gap-3
      `}
    >
      {/* Icon */}
      <span className={config.iconClass}>
        {toast.icon || config.icon}
      </span>

      {/* Message */}
      <p className={`flex-1 text-sm font-medium ${config.textClass}`}>
        {toast.message}
      </p>

      {/* Action Button */}
      {toast.action && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('selection')
            toast.action?.onClick()
            onDismiss(toast.id)
          }}
          className="px-3 py-1 text-sm font-semibold text-orange-400 hover:text-orange-300"
        >
          {toast.action.label}
        </motion.button>
      )}

      {/* Dismiss Button */}
      {toast.dismissible && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic('light')
            onDismiss(toast.id)
          }}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-slate-400" />
        </motion.button>
      )}

      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-4 right-4 h-0.5 bg-white/20 rounded-full overflow-hidden"
        >
          <motion.div
            className={`h-full ${config.iconClass.replace('text-', 'bg-')}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}

// Toast Container Component
export interface MobileToastContainerProps {
  /** Maximum number of toasts to show */
  maxToasts?: number
  /** Gap between toasts */
  gap?: number
}

export function MobileToastContainer({
  maxToasts = 3,
  gap = 12,
}: MobileToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Subscribe to toast events
  useEffect(() => {
    const addToast = (toast: Toast) => {
      setToasts((prev) => {
        // Remove oldest if at max
        const newToasts = prev.length >= maxToasts
          ? [...prev.slice(1), toast]
          : [...prev, toast]
        return newToasts
      })
    }

    const removeToast = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    toastListeners.add(addToast)
    dismissListeners.add(removeToast)

    return () => {
      toastListeners.delete(addToast)
      dismissListeners.delete(removeToast)
    }
  }, [maxToasts])

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Separate toasts by position
  const topToasts = toasts.filter((t) => t.position === 'top')
  const bottomToasts = toasts.filter((t) => t.position !== 'top')

  return (
    <>
      {/* Top Toasts */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <AnimatePresence mode="sync">
          {topToasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto"
              style={{ marginBottom: gap }}
            >
              <ToastItem toast={toast} onDismiss={handleDismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Toasts */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none"
        style={{
          paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px) + 16px)',
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <AnimatePresence mode="sync">
          {bottomToasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto"
              style={{ marginTop: gap }}
            >
              <ToastItem toast={toast} onDismiss={handleDismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

// Convenience functions
export const toast = {
  info: (message: string, options?: Partial<ToastConfig>) =>
    showToast({ message, type: 'info', ...options }),
  success: (message: string, options?: Partial<ToastConfig>) =>
    showToast({ message, type: 'success', ...options }),
  warning: (message: string, options?: Partial<ToastConfig>) =>
    showToast({ message, type: 'warning', ...options }),
  error: (message: string, options?: Partial<ToastConfig>) =>
    showToast({ message, type: 'error', ...options }),
  offline: (message: string = 'You are offline', options?: Partial<ToastConfig>) =>
    showToast({ message, type: 'offline', duration: 0, ...options }),
  online: (message: string = 'Back online', options?: Partial<ToastConfig>) =>
    showToast({ message, type: 'online', ...options }),
  dismiss: dismissToast,
}

export default MobileToastContainer
