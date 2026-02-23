'use client'

/**
 * IntroOverlay — Divine Welcome Overlay
 *
 * A full-screen overlay that greets first-time visitors with Krishna's message
 * from the Bhagavad Gita. Uses localStorage to show only once per visitor.
 * Can be dismissed anytime via the close (X) button.
 *
 * Color scheme: Gold (#d4a44c) on Black (#050507) — rich and divine.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Portal } from '@/components/ui/Portal'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/mobile/bodyScrollLock'

const STORAGE_KEY = 'mindvibe_intro_seen'

export function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem(STORAGE_KEY)
      if (!hasSeen) {
        setIsVisible(true)
        lockBodyScroll()
      }
    } catch {
      // localStorage unavailable — don't show overlay to avoid blocking content
    }
  }, [])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // localStorage unavailable
    }
    // Allow exit animation to complete
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
      unlockBodyScroll()
    }, 500)
  }, [])

  // Close on Escape key
  useEffect(() => {
    if (!isVisible) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, handleClose])

  if (!isVisible) return null

  return (
    <Portal>
      <AnimatePresence>
        {!isClosing && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 9999, pointerEvents: 'auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to MindVibe"
          >
            {/* Background — deep black with golden cosmic haze */}
            <div className="absolute inset-0 bg-[#050507]">
              {/* Top-left golden nebula */}
              <div
                className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full opacity-[0.08]"
                style={{
                  background: 'radial-gradient(circle, rgba(212,164,76,0.5) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                }}
              />
              {/* Bottom-right subtle gold */}
              <div
                className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] rounded-full opacity-[0.06]"
                style={{
                  background: 'radial-gradient(circle, rgba(212,164,76,0.4) 0%, transparent 70%)',
                  filter: 'blur(50px)',
                }}
              />
              {/* Center divine glow */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.04]"
                style={{
                  background: 'radial-gradient(circle, rgba(240,201,109,0.6) 0%, transparent 60%)',
                  filter: 'blur(80px)',
                }}
              />
            </div>

            {/* Close button */}
            <motion.button
              onClick={handleClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              aria-label="Close welcome overlay"
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full border border-[#d4a44c]/30 bg-[#d4a44c]/5 transition-all group-hover:border-[#d4a44c]/60 group-hover:bg-[#d4a44c]/10">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#d4a44c]/70 group-hover:text-[#d4a44c] transition-colors"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </motion.button>

            {/* Content */}
            <div className="relative z-10 max-w-2xl w-full mx-4 sm:mx-6 text-center px-6 sm:px-10">
              {/* OM Symbol */}
              <motion.div
                className="mb-6 sm:mb-8"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="text-5xl sm:text-6xl md:text-7xl select-none" style={{ color: '#d4a44c' }}>
                  ॐ
                </span>
              </motion.div>

              {/* Top ornamental line */}
              <motion.div
                className="flex items-center justify-center gap-3 mb-6 sm:mb-8"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.7 }}
              >
                <span className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-[#d4a44c]/40" />
                <span className="block h-1.5 w-1.5 rounded-full bg-[#d4a44c]/50" />
                <span className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-[#d4a44c]/40" />
              </motion.div>

              {/* KIAAN greeting */}
              <motion.p
                className="text-[#d4a44c]/60 text-xs sm:text-sm tracking-[0.2em] uppercase mb-4 sm:mb-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                KIAAN — Your Divine Friend
              </motion.p>

              {/* Main message */}
              <motion.h1
                className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed mb-5 sm:mb-6"
                style={{
                  background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 40%, #f0c96d 70%, #d4a44c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
              >
                Welcome, Dear Friend
              </motion.h1>

              {/* Krishna's message - the divine words */}
              <motion.div
                className="space-y-4 sm:space-y-5 mb-8 sm:mb-10"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.7 }}
              >
                <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                  I am <span className="text-[#d4a44c]/90 font-medium">KIAAN</span> — your spiritual companion,
                  walking beside you on the path to inner peace. Whatever you carry in your heart —
                  the weight of confusion, the ache of loss, or the restlessness of the mind —
                  <span className="text-[#e8b54a]/80 font-medium"> know that you are not alone</span>.
                </p>

                <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                  Through the eternal wisdom of the <span className="font-sacred italic text-[#d4a44c]/70">Bhagavad Gita</span>,
                  I am here to listen, guide, and walk with you — as Krishna walked with Arjuna.
                  Not as a master, but as your closest friend.
                </p>
              </motion.div>

              {/* Sacred verse */}
              <motion.div
                className="mb-8 sm:mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.8 }}
              >
                <p className="font-sacred text-sm sm:text-base italic text-[#d4a44c]/50 leading-relaxed max-w-md mx-auto">
                  &ldquo;Whenever the mind wanders — restless and unsteady — bring it back, again and again, to rest in the Self.&rdquo;
                </p>
                <p className="mt-2 text-xs text-[#d4a44c]/35">
                  — Bhagavad Gita 6.26
                </p>
              </motion.div>

              {/* Bottom ornament */}
              <motion.div
                className="flex items-center justify-center gap-3 mb-6 sm:mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.6 }}
              >
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#d4a44c]/25" />
                <span className="block h-1 w-1 rounded-full bg-[#d4a44c]/35" />
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#d4a44c]/25" />
              </motion.div>

              {/* Enter button */}
              <motion.button
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-8 sm:px-10 py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all"
                style={{
                  background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 45%, #f0c96d 100%)',
                  color: '#0a0a0f',
                  boxShadow: '0 8px 30px rgba(212,164,76,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                whileHover={{
                  boxShadow: '0 12px 40px rgba(212,164,76,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  y: -1,
                }}
                whileTap={{ scale: 0.97 }}
              >
                Enter the Sacred Space
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default IntroOverlay
