'use client'

/**
 * SankalpaSealButton — The most ceremonial button in Karma Reset.
 * 80px circle with divine-breath, 3-ripple ceremony on tap,
 * golden sweep, and "तत् त्वम् असि" reveal.
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface SankalpaSealButtonProps {
  onSeal: () => void
  disabled?: boolean
}

export function SankalpaSealButton({ onSeal, disabled }: SankalpaSealButtonProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [sealing, setSealing] = useState(false)
  const [sealed, setSealed] = useState(false)

  const handleSeal = useCallback(() => {
    if (disabled || sealing || sealed) return
    setSealing(true)
    triggerHaptic('heavy')

    // Ceremony duration: ~1800ms total
    setTimeout(() => {
      setSealed(true)
      setTimeout(() => onSeal(), 1200)
    }, 600)
  }, [disabled, sealing, sealed, triggerHaptic, onSeal])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <p
        style={{
          fontSize: 11,
          color: 'var(--sacred-text-muted, #6B6355)',
          fontFamily: 'var(--font-ui, Outfit, sans-serif)',
          textAlign: 'center',
        }}
      >
        Seal this Sankalpa before the Paramatma
      </p>

      {/* Button container with ripples */}
      <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* 3 expanding golden ripple rings */}
        <AnimatePresence>
          {sealing && [0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, delay: ring * 0.15, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '2px solid rgba(212,160,23,0.6)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </AnimatePresence>

        {/* The seal button */}
        <motion.button
          onClick={handleSeal}
          disabled={disabled || sealed}
          animate={!sealing && !sealed ? {
            boxShadow: [
              '0 0 28px rgba(212,160,23,0.3), 0 0 56px rgba(212,160,23,0.1)',
              '0 0 36px rgba(212,160,23,0.4), 0 0 72px rgba(212,160,23,0.15)',
              '0 0 28px rgba(212,160,23,0.3), 0 0 56px rgba(212,160,23,0.1)',
            ],
          } : {}}
          transition={{ duration: 4, repeat: Infinity }}
          whileTap={!sealed ? { scale: 0.95 } : {}}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: sealing
              ? 'radial-gradient(circle, rgba(255,255,255,0.9), #1B4FBB)'
              : 'radial-gradient(circle, #1B4FBB, #050714)',
            border: '2px solid rgba(212,160,23,0.7)',
            cursor: disabled || sealed ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
            transition: 'background 0.3s ease',
          }}
          aria-label="Seal your sankalpa"
        >
          {/* Anjali mudra (folded hands) */}
          <span style={{ fontSize: 32, filter: sealed ? 'brightness(1.3)' : 'none' }}>
            🙏
          </span>
        </motion.button>
      </div>

      {/* Golden sweep overlay */}
      <AnimatePresence>
        {sealing && (
          <motion.div
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0 0 0 0)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0, 0.8, 0.2, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(to top, rgba(212,160,23,0.12), transparent)',
              pointerEvents: 'none',
              zIndex: 50,
            }}
          />
        )}
      </AnimatePresence>

      {/* "तत् त्वम् असि" reveal */}
      <AnimatePresence>
        {sealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ textAlign: 'center' }}
          >
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              style={{
                fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                fontWeight: 300,
                fontSize: 36,
                color: '#F0C040',
                textShadow: '0 0 20px rgba(212,160,23,0.6)',
              }}
            >
              तत् त्वम् असि
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{
                fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--sacred-text-secondary, #B8AE98)',
                marginTop: 8,
              }}
            >
              This intention has been witnessed.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {!sealed && (
        <p
          style={{
            fontSize: 10,
            color: 'var(--sacred-text-muted, #6B6355)',
            fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            textAlign: 'center',
          }}
        >
          I commit to walk in dharma today
        </p>
      )}
    </div>
  )
}
