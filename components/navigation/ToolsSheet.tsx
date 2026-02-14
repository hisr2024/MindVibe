'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { TOOLS_BY_CATEGORY, type ToolConfig } from '@/lib/constants/tools'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useLanguage } from '@/hooks/useLanguage'
import { Portal } from '@/components/ui/Portal'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/mobile/bodyScrollLock'

export interface ToolsSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean
  /** Callback when the sheet should close */
  onClose: () => void
  /** Optional className for styling */
  className?: string
}

// Animation variants for the sheet - optimized for GPU acceleration
const sheetVariants = {
  hidden: {
    y: '100%',
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 40,
      mass: 0.8,
    }
  },
  visible: {
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 35,
      mass: 0.8,
    }
  },
}

// Animation variants for backdrop - faster fade to prevent flicker
const backdropVariants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.15 }
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
}

// Stagger animation for tool items - reduced delay for snappier feel
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.05,
    }
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
    }
  },
}

/**
 * ToolsSheet component for mobile tools bottom sheet.
 *
 * Features:
 * - Premium bottom sheet slide-up animation
 * - Drag to dismiss gesture support
 * - Staggered tool item animations
 * - Haptic feedback on interactions
 * - Touch-friendly tap targets
 * - Backdrop click to close
 * - Escape key to close
 * - Renders via Portal to escape stacking contexts
 */
export function ToolsSheet({ isOpen, onClose, className = '' }: ToolsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { triggerHaptic } = useHapticFeedback()
  const { t } = useLanguage()

  // Close on escape key and manage body scroll lock
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      lockBodyScroll()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (isOpen) {
        unlockBodyScroll()
      }
    }
  }, [isOpen, onClose])

  // Handle drag end for swipe-to-dismiss
  const handleDragEnd = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false)
    // Close if dragged down more than 100px or with significant velocity
    if (info.offset.y > 100 || info.velocity.y > 500) {
      triggerHaptic('light')
      onClose()
    }
  }, [onClose, triggerHaptic])

  // Handle tool selection
  const handleToolClick = useCallback(() => {
    triggerHaptic('selection')
    onClose()
  }, [onClose, triggerHaptic])

  return (
    <Portal>
      <AnimatePresence mode="sync">
        {isOpen && (
          <>
            {/* Backdrop - z-[65] to be above mobile nav, consistent with bottom sheets */}
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm will-change-[opacity]"
              style={{
                zIndex: 64,
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                WebkitBackdropFilter: 'blur(4px)',
                backdropFilter: 'blur(4px)',
              }}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Sheet - z-[65] to be above backdrop - Full height mobile optimized */}
            <motion.div
              ref={sheetRef}
              className={`overlay-bottom-sheet fixed inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-[28px] border-t border-orange-500/25 bg-gradient-to-b from-[#111118] to-[#0b0b0f] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] will-change-transform ${className}`}
              style={{
                zIndex: 65,
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                maxHeight: 'calc(100vh - 60px)', // Leave space for status bar
                height: 'calc(100dvh - 60px)', // Use dynamic viewport height for mobile
              }}
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Tools menu"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              {/* Decorative top glow */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

              {/* Handle bar - draggable indicator */}
              <div
                className="flex justify-center py-4 cursor-grab active:cursor-grabbing overlay-draggable"
                style={{ touchAction: 'none' }}
              >
                <motion.div
                  className="h-1.5 w-12 rounded-full bg-white/30"
                  animate={{
                    backgroundColor: isDragging ? 'rgba(255, 145, 89, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                    scaleX: isDragging ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.15 }}
                />
              </div>

              {/* Header - Sticky */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 pb-3 bg-gradient-to-b from-[#111118] to-transparent sticky top-0">
                <div>
                  <h2 className="text-xl font-bold text-orange-50">All Tools</h2>
                  <p className="text-xs text-white/50 mt-0.5">Tap to explore your wellness toolkit</p>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/15 hover:text-white active:scale-95"
                  aria-label="Close tools menu"
                  whileTap={{ scale: 0.92 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Scrollable content - hardware accelerated, fills available space */}
              <motion.div
                className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 smooth-touch-scroll"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 24px)',
                }}
              >
                {TOOLS_BY_CATEGORY.map((category, categoryIndex) => (
                  <motion.div
                    key={category.id}
                    className={categoryIndex > 0 ? 'mt-6' : ''}
                    variants={itemVariants}
                  >
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-300/70">
                      <span className="h-px flex-1 bg-gradient-to-r from-orange-500/30 to-transparent" />
                      {category.name}
                      <span className="h-px flex-1 bg-gradient-to-l from-orange-500/30 to-transparent" />
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {category.tools.map((tool: ToolConfig, toolIndex: number) => (
                        <motion.div
                          key={tool.id}
                          variants={itemVariants}
                          custom={toolIndex}
                        >
                          <Link
                            href={tool.href}
                            onClick={handleToolClick}
                            className="group relative flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 transition-all duration-200 hover:border-orange-400/40 hover:from-white/[0.1] hover:to-white/[0.04] active:scale-[0.96] min-h-[100px]"
                          >
                            {/* Badge - positioned absolute */}
                            {tool.badge && (
                              <span className="absolute -top-1 -right-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-lg">
                                {tool.badge}
                              </span>
                            )}
                            <motion.span
                              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/25 to-amber-500/20 text-2xl shadow-lg"
                              whileTap={{ scale: 0.9 }}
                            >
                              {tool.icon}
                            </motion.span>
                            <div className="text-center min-w-0 w-full">
                              <p className="text-sm font-semibold text-orange-50 group-hover:text-white truncate">
                                {tool.title}
                              </p>
                              <p className="text-[10px] text-white/40 mt-0.5 truncate">
                                {tool.description}
                              </p>
                              {tool.purposeDescKey && (
                                <p className="text-[9px] text-orange-200/40 mt-0.5 truncate">
                                  {t(`dashboard.tool_desc.${tool.purposeDescKey}`, '')}
                                </p>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {/* Bottom spacer for safe area */}
                <div className="h-4" />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default ToolsSheet
