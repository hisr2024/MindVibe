'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { TOOLS_BY_CATEGORY, type ToolConfig } from '@/lib/constants/tools'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

export interface ToolsSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean
  /** Callback when the sheet should close */
  onClose: () => void
  /** Optional className for styling */
  className?: string
}

// Animation variants for the sheet
const sheetVariants = {
  hidden: {
    y: '100%',
    opacity: 0.5,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    }
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    }
  },
}

// Animation variants for backdrop
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25 }
  },
}

// Stagger animation for tool items
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    }
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 25,
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
 */
export function ToolsSheet({ isOpen, onClose, className = '' }: ToolsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { triggerHaptic } = useHapticFeedback()

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-[28px] border-t border-orange-500/25 bg-gradient-to-b from-[#111118] to-[#0b0b0f] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] ${className}`}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Tools menu"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
          >
            {/* Decorative top glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            {/* Handle bar - draggable indicator */}
            <div
              className="flex justify-center py-4 cursor-grab active:cursor-grabbing"
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

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-5 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-orange-50">All Tools</h2>
                <p className="text-xs text-white/40 mt-0.5">Explore your wellness toolkit</p>
              </div>
              <motion.button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close tools menu"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Scrollable content */}
            <motion.div
              className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-5 smooth-touch-scroll"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {TOOLS_BY_CATEGORY.map((category, categoryIndex) => (
                <motion.div
                  key={category.id}
                  className={categoryIndex > 0 ? 'mt-7' : ''}
                  variants={itemVariants}
                >
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-orange-200/50">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {category.tools.map((tool: ToolConfig, toolIndex: number) => (
                      <motion.div
                        key={tool.id}
                        variants={itemVariants}
                        custom={toolIndex}
                      >
                        <Link
                          href={tool.href}
                          onClick={handleToolClick}
                          className="group flex items-center gap-3 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3.5 transition-all duration-200 hover:border-orange-400/30 hover:from-white/[0.08] hover:to-white/[0.02] active:scale-[0.97]"
                        >
                          <motion.span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/15 text-lg shadow-inner"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {tool.icon}
                          </motion.span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-orange-50 group-hover:text-white">
                              {tool.title}
                            </p>
                            {tool.badge && (
                              <span className="mt-1 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          {/* Arrow indicator */}
                          <svg
                            className="h-4 w-4 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-orange-400/60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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
  )
}

export default ToolsSheet
