'use client'

/**
 * MobileVerseMeditationPhase — Sanskrit reveal + parchment card + contemplation timer.
 * The most sacred visual moment in Sadhana.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MobileSanskritReveal } from '../visuals/MobileSanskritReveal'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import type { SadhanaVerse } from '@/types/sadhana.types'

interface MobileVerseMeditationPhaseProps {
  verse: SadhanaVerse
  onComplete: () => void
}

export function MobileVerseMeditationPhase({ verse, onComplete }: MobileVerseMeditationPhaseProps) {
  const [showCard, setShowCard] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [timerProgress, setTimerProgress] = useState(0)
  const { triggerHaptic } = useHapticFeedback()
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const onCompleteRef = useRef(onComplete)
  const triggerHapticRef = useRef(triggerHaptic)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => { triggerHapticRef.current = triggerHaptic }, [triggerHaptic])

  const handleSanskritComplete = useCallback(() => {
    setTimeout(() => setShowCard(true), 400)
  }, [])

  // Start contemplation timer after card shows
  useEffect(() => {
    if (!showCard) return
    const delay = setTimeout(() => {
      setShowTimer(true)
      let progress = 0
      timerRef.current = setInterval(() => {
        progress += 100 / 600 // 60s = 600 ticks at 100ms
        setTimerProgress(Math.min(progress, 100))
        if (progress >= 50 && progress < 50.5) triggerHapticRef.current('light')
        if (progress >= 100) {
          clearInterval(timerRef.current)
          triggerHapticRef.current('medium')
          setTimeout(() => onCompleteRef.current(), 500)
        }
      }, 100)
    }, 1000)
    return () => {
      clearTimeout(delay)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [showCard])

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    onComplete()
  }, [onComplete])

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-5 pt-8 pb-20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 80px)' }}>
      {/* Skip link */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-5 text-[10px] text-[#6B6355] font-[family-name:var(--font-ui)] z-10"
        aria-label="Skip verse meditation"
      >
        Skip →
      </button>

      {/* Section 1: Sanskrit Reveal */}
      <div className="relative mb-6 w-full">
        {verse.sanskrit && (
          <MobileSanskritReveal
            text={verse.sanskrit}
            onComplete={handleSanskritComplete}
          />
        )}

        {/* Chapter/verse reference */}
        <motion.p
          className="text-center font-[family-name:var(--font-ui)] text-[11px] text-[#6B6355] mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: showCard ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          Chapter {verse.chapter} • Verse {verse.verse}
          {verse.chapterName && ` • ${verse.chapterName}`}
        </motion.p>
      </div>

      {/* Section 2: Verse Parchment Card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            className="w-full max-w-[360px] rounded-3xl p-5 relative overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(212,160,23,0.12), rgba(22,26,66,0.95) 70%)',
              border: '1px solid rgba(212,160,23,0.25)',
              borderTop: '3px solid rgba(212,160,23,0.7)',
              boxShadow: '0 24px 80px rgba(5,7,20,0.9), 0 0 60px rgba(212,160,23,0.08)',
            }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            {/* Transliteration */}
            {verse.transliteration && (
              <>
                <p className="font-[family-name:var(--font-scripture)] italic text-sm text-[#B8AE98] leading-[1.7] mb-3">
                  {verse.transliteration}
                </p>
                <div className="h-px bg-gradient-to-r from-transparent via-[#D4A017]/30 to-transparent mb-3" />
              </>
            )}

            {/* English translation */}
            <p className="font-[family-name:var(--font-ui)] text-[15px] text-[#EDE8DC] leading-[1.75] mb-3" style={{ fontWeight: 400 }}>
              {verse.english}
            </p>

            <div className="h-px bg-gradient-to-r from-transparent via-[#D4A017]/30 to-transparent mb-3" />

            {/* KIAAN's Insight */}
            <div>
              <p className="text-[9px] text-[#D4A017] tracking-[0.15em] uppercase mb-2 font-[family-name:var(--font-ui)]">
                ✦ KIAAN&apos;S INSIGHT
              </p>
              <div className="border-l-[3px] border-[#D4A017] pl-4">
                <p className="font-[family-name:var(--font-display)] italic text-base text-[#EDE8DC] leading-[1.7]">
                  {verse.personalInterpretation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 3: Contemplation Timer */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            className="mt-8 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="font-[family-name:var(--font-scripture)] italic text-[13px] text-[#6B6355] mb-4">
              Sit with this truth
            </p>

            {/* Circular timer */}
            <div className="relative w-16 h-16">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(212,160,23,0.15)" strokeWidth="1.5" />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="#D4A017"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - timerProgress / 100)}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '32px 32px', transition: 'stroke-dashoffset 0.1s linear' }}
                  opacity={0.6}
                />
              </svg>
              <motion.span
                className="absolute inset-0 flex items-center justify-center text-2xl font-[family-name:var(--font-divine)] text-[#D4A017]"
                animate={{
                  textShadow: [
                    '0 0 6px rgba(212,160,23,0.3)',
                    '0 0 12px rgba(212,160,23,0.6)',
                    '0 0 6px rgba(212,160,23,0.3)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                ॐ
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
