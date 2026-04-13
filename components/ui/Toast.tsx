/**
 * Unified Toast System — Re-exports the advanced MobileToast as the
 * standard toast API for the entire application.
 *
 * Features: 6 types (info, success, warning, error, offline, online),
 * configurable position, action buttons, progress bar, dismiss, haptic.
 *
 * Usage:
 *   import { toast, showToast, MobileToastContainer } from '@/components/ui/Toast'
 *
 *   toast.success('Journey step completed!')
 *   toast.error('Failed to save', { action: { label: 'Retry', onClick: retry } })
 */

export {
  showToast,
  dismissToast,
  toast,
  MobileToastContainer as ToastContainer,
  type ToastType,
  type ToastPosition,
  type ToastConfig,
  type Toast as ToastInstance,
} from '@/components/mobile/MobileToast'
export { default as ToastContainerDefault } from '@/components/mobile/MobileToast'
