'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { X } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/mobile/bodyScrollLock'

export interface MobileBottomSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean
  /** Callback when sheet should close */
  onClose: () => void
  /** Sheet content */
  children: ReactNode
  /** Title for the sheet header */
  title?: string
  /** Subtitle for the sheet header */
  subtitle?: string
  /** Whether the sheet can be dismissed by swiping down */
  dismissible?: boolean
  /** Whether to show the drag handle */
  showHandle?: boolean
  /** Whether to show close button */
  showCloseButton?: boolean
  /** Whether to show backdrop */
  showBackdrop?: boolean
  /** Whether clicking backdrop closes the sheet */
  closeOnBackdropClick?: boolean
  /** Custom height (percentage of viewport) */
  height?: 'auto' | 'half' | 'full' | number
  /** Whether the sheet is expandable */
  expandable?: boolean
  /** Additional CSS classes */
  className?: string
  /** Z-index for the sheet (default: 65 per z-index system) */
  zIndex?: number
  /** Callback when sheet is fully expanded */
  onExpand?: () => void
  /** Callback when sheet is collapsed to default */
  onCollapse?: () => void
}

const sheetVariants = {
  hidden: {
    y: '100%',
    transition: {
      type: 'spring',
      damping: 40,
      stiffness: 500,
      mass: 0.8,
    },
  },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      damping: 35,
      stiffness: 400,
      mass: 0.8,
    },
  },
} as const

const backdropVariants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
} as const

export const MobileBottomSheet = forwardRef<HTMLDivElement, MobileBottomSheetProps>(
  function MobileBottomSheet(
    {
      isOpen,
      onClose,
      children,
      title,
      subtitle,
      dismissible = true,
      showHandle = true,
      showCloseButton = true,
      showBackdrop = true,
      closeOnBackdropClick = true,
      height = 'auto',
      expandable = false,
      className = '',
      zIndex = 65,
      onExpand,
      onCollapse,
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()
    const controls = useAnimation()
    const sheetRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const [isExpanded, setIsExpanded] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Get height value
    const getHeightValue = useCallback(() => {
      if (height === 'auto') return 'auto'
      if (height === 'half') return '50vh'
      if (height === 'full') return '95vh'
      if (typeof height === 'number') return `${height}vh`
      return 'auto'
    }, [height])

    // Handle drag end
    const handleDragEnd = useCallback(
      (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false)
        const { velocity, offset } = info

        // If dragged down fast or far enough, close
        if (dismissible && (velocity.y > 500 || offset.y > 150)) {
          triggerHaptic('light')
          onClose()
          return
        }

        // If expandable and dragged up fast or far enough, expand
        if (expandable && !isExpanded && (velocity.y < -500 || offset.y < -100)) {
          triggerHaptic('medium')
          setIsExpanded(true)
          onExpand?.()
          controls.start({ y: 0, height: '95vh' })
          return
        }

        // If expanded and dragged down, collapse
        if (expandable && isExpanded && (velocity.y > 300 || offset.y > 50)) {
          triggerHaptic('light')
          setIsExpanded(false)
          onCollapse?.()
          controls.start({ y: 0, height: getHeightValue() })
          return
        }

        // Snap back
        controls.start({ y: 0 })
      },
      [
        dismissible,
        expandable,
        isExpanded,
        onClose,
        onExpand,
        onCollapse,
        controls,
        triggerHaptic,
        getHeightValue,
      ]
    )

    // Handle drag start
    const handleDragStart = useCallback(() => {
      setIsDragging(true)
      triggerHaptic('selection')
    }, [triggerHaptic])

    // Lock body scroll when open using centralized utility
    useEffect(() => {
      if (isOpen) {
        lockBodyScroll()
        return () => {
          unlockBodyScroll()
        }
      }
    }, [isOpen])

    // Reset state when closed
    useEffect(() => {
      if (!isOpen) {
        setIsExpanded(false)
        setIsDragging(false)
      }
    }, [isOpen])

    // Handle escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen && dismissible) {
          onClose()
        }
      }
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, dismissible, onClose])

    return (
      <Portal>
        <AnimatePresence mode="sync">
          {isOpen && (
            <>
              {/* Backdrop - hardware accelerated */}
              {showBackdrop && (
                <motion.div
                  variants={backdropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  onClick={closeOnBackdropClick ? onClose : undefined}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm will-change-[opacity]"
                  style={{
                    zIndex: zIndex - 1,
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    WebkitBackdropFilter: 'blur(4px)',
                    backdropFilter: 'blur(4px)',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Sheet - hardware accelerated, rendered via Portal */}
              <motion.div
                ref={(node) => {
                  (sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = node
                  if (typeof ref === 'function') ref(node)
                  else if (ref) ref.current = node
                }}
                variants={sheetVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                drag={dismissible || expandable ? 'y' : false}
                dragConstraints={{ top: expandable ? -100 : 0, bottom: 0 }}
                dragElastic={{ top: 0.1, bottom: 0.4 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{
                  zIndex,
                  height: isExpanded ? '95vh' : getHeightValue(),
                  maxHeight: '95vh',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
                className={`
                  overlay-bottom-sheet
                  fixed bottom-0 left-0 right-0
                  rounded-t-[28px] overflow-hidden
                  bg-[#0f1624] border-t border-white/[0.08]
                  shadow-2xl shadow-black/40
                  flex flex-col will-change-transform
                  ${isDragging ? 'cursor-grabbing' : ''}
                  ${className}
                `.trim()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'bottom-sheet-title' : undefined}
              >
                {/* Drag Handle */}
                {showHandle && (
                  <div
                    className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing overlay-draggable"
                    aria-hidden="true"
                  >
                    <div
                      className={`
                        w-10 h-1.5 rounded-full
                        transition-colors duration-200
                        ${isDragging ? 'bg-[#d4a44c]/80' : 'bg-white/30'}
                      `}
                    />
                  </div>
                )}

                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                    <div className="flex-1">
                      {title && (
                        <h2
                          id="bottom-sheet-title"
                          className="text-lg font-semibold text-white"
                        >
                          {title}
                        </h2>
                      )}
                      {subtitle && (
                        <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
                      )}
                    </div>
                    {showCloseButton && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          triggerHaptic('light')
                          onClose()
                        }}
                        className="
                          w-9 h-9 rounded-full
                          flex items-center justify-center
                          bg-white/[0.06] hover:bg-white/[0.1]
                          transition-colors
                        "
                        aria-label="Close"
                      >
                        <X className="w-5 h-5 text-slate-300" />
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div
                  ref={contentRef}
                  className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
                  }}
                >
                  {children}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    )
  }
)

/**
 * Confirmation Bottom Sheet
 */
export interface ConfirmationSheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

export function ConfirmationSheet({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmationSheetProps) {
  const { triggerHaptic } = useHapticFeedback()

  const handleConfirm = () => {
    triggerHaptic(variant === 'danger' ? 'warning' : 'success')
    onConfirm()
    onClose()
  }

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      showHandle
      showCloseButton={false}
      height="auto"
    >
      <div className="text-center pb-2">
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-300 mb-6">{message}</p>

        <div className="flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            className={`
              w-full py-3.5 rounded-xl font-semibold
              transition-all duration-200
              ${
                variant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-[#d4a44c] to-[#d4a44c] text-slate-950'
              }
            `}
          >
            {confirmText}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="
              w-full py-3.5 rounded-xl font-medium
              bg-white/[0.06] hover:bg-white/[0.1]
              text-slate-200 transition-colors
            "
          >
            {cancelText}
          </motion.button>
        </div>
      </div>
    </MobileBottomSheet>
  )
}

/**
 * Action Sheet (iOS-style action menu)
 */
export interface ActionSheetOption {
  label: string
  icon?: ReactNode
  onPress: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  options: ActionSheetOption[]
  cancelText?: string
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  options,
  cancelText = 'Cancel',
}: ActionSheetProps) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      showHandle
      showCloseButton={false}
      height="auto"
    >
      {title && (
        <p className="text-center text-sm text-slate-400 mb-4 pb-3 border-b border-white/[0.06]">
          {title}
        </p>
      )}

      <div className="flex flex-col gap-1">
        {options.map((option, index) => (
          <motion.button
            key={index}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (option.disabled) return
              triggerHaptic(option.variant === 'danger' ? 'warning' : 'selection')
              option.onPress()
              onClose()
            }}
            disabled={option.disabled}
            className={`
              w-full py-3.5 px-4 rounded-xl
              flex items-center justify-center gap-3
              font-medium transition-colors
              ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}
              ${
                option.variant === 'danger'
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-white hover:bg-white/[0.06]'
              }
            `}
          >
            {option.icon}
            {option.label}
          </motion.button>
        ))}

        <div className="h-2" />

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="
            w-full py-3.5 rounded-xl font-semibold
            bg-white/[0.06] hover:bg-white/[0.1]
            text-slate-200 transition-colors
          "
        >
          {cancelText}
        </motion.button>
      </div>
    </MobileBottomSheet>
  )
}

export default MobileBottomSheet
