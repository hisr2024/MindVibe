'use client'

/**
 * IntroOverlay — Divine Welcome Overlay (Performance-Optimized)
 *
 * A full-screen overlay that greets first-time visitors with Krishna's message
 * from the Bhagavad Gita. Uses localStorage to show only once per visitor.
 *
 * Performance approach:
 * - CSS-first animations via @keyframes (runs on GPU compositor thread)
 * - Zero Framer Motion instances — pure CSS stagger with animation-delay
 * - No filter:blur() — pre-softened radial gradients eliminate GPU blur cost
 * - GPU layer promotion via will-change + translateZ(0) + contain
 * - Exit animation uses onTransitionEnd (no setTimeout race condition)
 * - Respects prefers-reduced-motion for accessibility
 *
 * Color scheme: Gold (#d4a44c) on Black (#050507) — rich and divine.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Portal } from '@/components/ui/Portal'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/mobile/bodyScrollLock'

const STORAGE_KEY = 'mindvibe_intro_seen'

export function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const hasCleanedUp = useRef(false)

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

  const cleanup = useCallback(() => {
    if (hasCleanedUp.current) return
    hasCleanedUp.current = true
    setIsVisible(false)
    setIsExiting(false)
    unlockBodyScroll()
  }, [])

  const handleClose = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    hasCleanedUp.current = false
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // localStorage unavailable
    }
  }, [isExiting])

  // Clean up after exit transition completes — no setTimeout race condition
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName === 'opacity' && isExiting) {
      cleanup()
    }
  }, [isExiting, cleanup])

  // Close on Escape key
  useEffect(() => {
    if (!isVisible) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isVisible, handleClose])

  // Safety net: if transitionend doesn't fire (e.g., reduced motion skips transitions)
  useEffect(() => {
    if (!isExiting) return
    const fallbackTimer = setTimeout(() => {
      cleanup()
    }, 500)
    return () => clearTimeout(fallbackTimer)
  }, [isExiting, cleanup])

  if (!isVisible) return null

  return (
    <Portal>
      <div
        className={`intro-overlay${isExiting ? ' intro-overlay--exiting' : ''}`}
        onTransitionEnd={handleTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to MindVibe"
      >
        {/* Background — deep black with pre-softened golden cosmic hazes */}
        {/* No filter:blur() — wider radial-gradient spread handles softness natively */}
        <div className="intro-overlay__bg" aria-hidden="true">
          <div className="intro-overlay__glow intro-overlay__glow--top" />
          <div className="intro-overlay__glow intro-overlay__glow--bottom" />
          <div className="intro-overlay__glow intro-overlay__glow--center" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="intro-overlay__close intro-overlay__stagger"
          style={{ '--stagger-index': 7 } as React.CSSProperties}
          aria-label="Close welcome overlay"
        >
          <div className="intro-overlay__close-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </button>

        {/* Content — all children use CSS stagger via --stagger-index */}
        <div className="intro-overlay__content">
          {/* OM Symbol */}
          <div
            className="intro-overlay__stagger intro-overlay__om"
            style={{ '--stagger-index': 0 } as React.CSSProperties}
          >
            <span className="text-5xl sm:text-6xl md:text-7xl select-none" style={{ color: '#d4a44c' }}>
              ॐ
            </span>
          </div>

          {/* Top ornamental line */}
          <div
            className="intro-overlay__stagger intro-overlay__ornament"
            style={{ '--stagger-index': 1 } as React.CSSProperties}
          >
            <span className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-[#d4a44c]/40" />
            <span className="block h-1.5 w-1.5 rounded-full bg-[#d4a44c]/50" />
            <span className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-[#d4a44c]/40" />
          </div>

          {/* KIAAN greeting */}
          <p
            className="intro-overlay__stagger text-[#d4a44c]/60 text-xs sm:text-sm tracking-[0.2em] uppercase mb-4 sm:mb-5"
            style={{ '--stagger-index': 2 } as React.CSSProperties}
          >
            KIAAN — Your Divine Friend
          </p>

          {/* Main message */}
          <h1
            className="intro-overlay__stagger intro-overlay__heading"
            style={{ '--stagger-index': 3 } as React.CSSProperties}
          >
            Welcome, Dear Friend
          </h1>

          {/* Krishna's message */}
          <div
            className="intro-overlay__stagger space-y-4 sm:space-y-5 mb-8 sm:mb-10"
            style={{ '--stagger-index': 4 } as React.CSSProperties}
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
          </div>

          {/* Abhyaas Verse — BG 6.35 */}
          <div
            className="intro-overlay__stagger mb-8 sm:mb-10 space-y-3"
            style={{ '--stagger-index': 5 } as React.CSSProperties}
          >
            <p className="text-[#d4a44c]/45 text-[10px] sm:text-xs uppercase tracking-[0.2em]">
              Bhagavad Gita 6.35
            </p>
            <p
              className="font-sacred text-base sm:text-lg leading-relaxed tracking-wide text-[#f0c96d]/80"
              lang="sa"
            >
              {'\u0905\u092D\u094D\u092F\u093E\u0938\u0947\u0928 \u0924\u0941 \u0915\u094C\u0928\u094D\u0924\u0947\u092F'}
            </p>
            <p
              className="font-sacred text-base sm:text-lg leading-relaxed tracking-wide text-[#f0c96d]/80"
              lang="sa"
            >
              {'\u0935\u0948\u0930\u093E\u0917\u094D\u092F\u0947\u0923 \u091A \u0917\u0943\u0939\u094D\u092F\u0924\u0947'}
            </p>
            <p className="font-sacred text-xs sm:text-sm italic text-[#d4a44c]/50 leading-relaxed max-w-md mx-auto">
              &ldquo;The mind is indeed restless and difficult to restrain, O son of Kunti. But through practice and detachment, it can be mastered.&rdquo;
            </p>
            <p className="text-xs text-[#d4a44c]/35">
              — Shri Krishna to Arjuna
            </p>
          </div>

          {/* Bottom ornament */}
          <div
            className="intro-overlay__stagger intro-overlay__ornament"
            style={{ '--stagger-index': 6 } as React.CSSProperties}
          >
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#d4a44c]/25" />
            <span className="block h-1 w-1 rounded-full bg-[#d4a44c]/35" />
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#d4a44c]/25" />
          </div>

          {/* Enter button */}
          <button
            onClick={handleClose}
            className="intro-overlay__stagger intro-overlay__cta"
            style={{ '--stagger-index': 7 } as React.CSSProperties}
          >
            Enter the Sacred Space
          </button>
        </div>
      </div>
    </Portal>
  )
}

export default IntroOverlay
