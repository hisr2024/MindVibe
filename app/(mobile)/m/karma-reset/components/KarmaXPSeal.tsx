'use client'

/**
 * KarmaXPSeal — XP counter with deceleration curve + streak lotus icons.
 * Reuses the MobileCompletionSeal counter pattern with karma theming.
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface KarmaXPSealProps {
  xpAwarded: number
  streakCount: number
}

export function KarmaXPSeal({ xpAwarded, streakCount }: KarmaXPSealProps) {
  const [displayXP, setDisplayXP] = useState(0)
  const [showStreak, setShowStreak] = useState(false)
  const [showJournalSave, setShowJournalSave] = useState(false)
  const { triggerHaptic } = useHapticFeedback()

  // Animated XP counter — cubic ease-out deceleration.
  // Defensive: guard non-numeric / negative input, clear interval on every
  // path so a stale interval can never call setState after unmount, and
  // throttle to ~30 fps which is plenty for a counter and halves the work.
  useEffect(() => {
    const target = typeof xpAwarded === 'number' && xpAwarded > 0 ? xpAwarded : 0
    if (target === 0) {
      setDisplayXP(0)
      return
    }
    let frame = 0
    const totalFrames = 30
    const interval = setInterval(() => {
      frame++
      const eased = 1 - Math.pow(1 - frame / totalFrames, 3)
      setDisplayXP(Math.round(eased * target))
      if (frame >= totalFrames) {
        clearInterval(interval)
        try {
          triggerHaptic('success')
        } catch {
          // haptic unavailable — silently continue the ceremony
        }
      }
    }, 1200 / totalFrames)
    return () => clearInterval(interval)
  }, [xpAwarded, triggerHaptic])

  // Staggered reveals
  useEffect(() => {
    const t1 = setTimeout(() => setShowStreak(true), 1400)
    const t2 = setTimeout(() => setShowJournalSave(true), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* XP Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
          border: '1px solid rgba(212,160,23,0.2)',
          borderTop: '2px solid rgba(212,160,23,0.5)',
          boxShadow: '0 20px 60px rgba(5,7,20,0.8)',
          borderRadius: 24,
          padding: '24px 32px',
          textAlign: 'center',
          maxWidth: 260,
        }}
      >
        <p
          style={{
            fontSize: 9,
            color: '#D4A017',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            marginBottom: 8,
          }}
        >
          ✦ Dharmic Offering
        </p>
        <p
          style={{
            fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
            fontSize: 52,
            fontWeight: 300,
            color: '#F0C040',
            textShadow: '0 0 16px rgba(212,160,23,0.5)',
            lineHeight: 1,
          }}
        >
          +{displayXP} XP
        </p>
      </motion.div>

      {/* Streak with lotus icons */}
      {showStreak && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <p
            style={{
              fontSize: 14,
              color: 'var(--sacred-text-secondary, #B8AE98)',
              fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            }}
          >
            {streakCount} {streakCount === 1 ? 'Day' : 'Days'} of Dharmic Clarity
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: Math.min(streakCount, 7) }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                style={{ fontSize: 18, color: '#D4A017' }}
              >
                🪷
              </motion.span>
            ))}
            {streakCount > 7 && (
              <span style={{ fontSize: 12, color: '#D4A017' }}>+</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Journal save notification */}
      {showJournalSave && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, times: [0, 0.2, 0.7, 1] }}
          style={{
            fontSize: 11,
            color: '#D4A017',
            fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            textAlign: 'center',
          }}
        >
          ✦ Saved to your Karma Journal
        </motion.p>
      )}
    </div>
  )
}
