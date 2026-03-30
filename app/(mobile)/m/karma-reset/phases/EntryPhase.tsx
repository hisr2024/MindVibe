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

  const sanskritChars = 'कर्म'.split('')

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

      {/* Sanskrit "कर्म" — letter by letter */}
      <AnimatePresence>
        {(step === 'sanskrit' || step === 'subtitle' || step === 'shrink') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 2,
            }}
          >
            {sanskritChars.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: i * 0.08, duration: 0.25 }}
                style={{
                  fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                  fontWeight: 300,
                  fontSize: 52,
                  color: '#F0C040',
                  letterSpacing: '0.08em',
                  textShadow: '0 0 20px rgba(212,160,23,0.6)',
                }}
              >
                {char}
              </motion.span>
            ))}
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
