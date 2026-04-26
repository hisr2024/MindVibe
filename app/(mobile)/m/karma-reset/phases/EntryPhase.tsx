'use client'

/**
 * EntryPhase — Sacred entry ceremony (1600ms).
 * Flame appears → "कर्म" letter-by-letter → "Karma Reset" subtitle
 * → flame shrinks → onComplete callback.
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { DharmaFlameIcon } from '../visuals/DharmaFlameIcon'

interface EntryPhaseProps {
  onComplete: () => void
}

export function EntryPhase({ onComplete }: EntryPhaseProps) {
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState<'flame' | 'sanskrit' | 'subtitle' | 'shrink' | 'done'>('flame')

  useEffect(() => {
    if (reduceMotion) {
      onComplete()
      return
    }

    const timers = [
      setTimeout(() => setStep('sanskrit'), 200),
      setTimeout(() => setStep('subtitle'), 900),
      setTimeout(() => setStep('shrink'), 1200),
      setTimeout(() => {
        setStep('done')
        onComplete()
      }, 1600),
    ]

    return () => timers.forEach(clearTimeout)
  }, [reduceMotion, onComplete])

  // Render the whole word as a single shaped unit so Devanagari conjuncts
  // (e.g. र्म reph + ma) are not broken by the OS text shaper. Splitting
  // into separate spans previously caused the half-form of र to drop and
  // the word to look like "कम" on some Android WebViews.
  const karmaWord = 'कर्म'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050714',
        zIndex: 10,
      }}
    >
      {/* Central flame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={
          step === 'shrink' || step === 'done'
            ? { opacity: 0.6, scale: 0.3, y: -200 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.4, ease: [0, 0.8, 0.2, 1] }}
      >
        <DharmaFlameIcon size={48} intensity="bright" animate />
      </motion.div>

      {/* Sanskrit "कर्म" — single shaped word with blur-in reveal */}
      <AnimatePresence>
        {(step === 'sanskrit' || step === 'subtitle' || step === 'shrink') && (
          <motion.div
            initial={{ opacity: 0, filter: 'blur(6px)', scale: 0.96 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: [0, 0.8, 0.2, 1] }}
            style={{
              marginTop: 16,
              padding: '0 12px',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            <span
              lang="hi"
              style={{
                fontFamily:
                  '"Noto Sans Devanagari", "Noto Serif Devanagari", "Tiro Devanagari Sanskrit", "Sanskrit Text", "Mangal", var(--font-divine, Cormorant Garamond), serif',
                fontWeight: 500,
                fontSize: 56,
                color: '#F0C040',
                letterSpacing: 'normal',
                textShadow: '0 0 20px rgba(212,160,23,0.6)',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {karmaWord}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* English subtitle */}
      <AnimatePresence>
        {(step === 'subtitle' || step === 'shrink') && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: 'var(--font-ui, Outfit, sans-serif)',
              fontWeight: 300,
              fontSize: 18,
              color: 'var(--sacred-text-secondary, #B8AE98)',
              marginTop: 8,
            }}
          >
            Karma Reset
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
