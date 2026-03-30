'use client'

/**
 * SealPhase — Sacred completion ceremony.
 * Mandala animation → completion messages → XP + streak → exit options.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MobileWordReveal } from '@/components/mobile/MobileWordReveal'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { KarmaSealMandala } from '../visuals/KarmaSealMandala'
import { KarmaXPSeal } from '../components/KarmaXPSeal'
import { useKarmaReset } from '../hooks/useKarmaReset'
import type { KarmaResetSession } from '../types'

interface SealPhaseProps {
  session: KarmaResetSession
}

export function SealPhase({ session }: SealPhaseProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const { finishSession } = useKarmaReset()

  const [showMessage, setShowMessage] = useState(false)
  const [showSankalpa, setShowSankalpa] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(25)
  const [streakCount, setStreakCount] = useState(1)
  const completedRef = useRef(false)

  // Complete session via API
  useEffect(() => {
    if (completedRef.current) return
    completedRef.current = true

    const complete = async () => {
      const result = await finishSession(
        session.sessionId,
        session.sankalpa?.sealed ?? false,
        []
      )
      if (result) {
        setXpAwarded(result.xpAwarded)
        setStreakCount(result.streakCount)
      }
    }
    complete()
  }, [session, finishSession])

  // Staggered reveal sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setShowMessage(true), 900),
      setTimeout(() => setShowSankalpa(true), 1400),
      setTimeout(() => setShowXP(true), 1800),
      setTimeout(() => setShowExit(true), 3200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const handleReturn = useCallback(() => {
    triggerHaptic('medium')
    router.push('/m')
  }, [triggerHaptic, router])

  const handleJournal = useCallback(() => {
    triggerHaptic('light')
    router.push('/m/journal')
  }, [triggerHaptic, router])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Mandala */}
      <KarmaSealMandala size={180} />

      {/* Completion messages */}
      {showMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', marginTop: 24, marginBottom: 16 }}
        >
          <MobileWordReveal
            text="Your karma has been met with dharma."
            speed={65}
            as="p"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              fontFamily: 'var(--font-scripture, Crimson Text, serif)',
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--sacred-text-secondary, #B8AE98)',
              marginTop: 8,
            }}
          >
            You have acted with consciousness.
          </motion.p>
        </motion.div>
      )}

      {/* Sankalpa recall */}
      {showSankalpa && session.sankalpa && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            marginBottom: 20,
            padding: '0 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                height: 1,
                width: 40,
                background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.5))',
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                fontStyle: 'italic',
                fontSize: 15,
                color: '#F0C040',
                lineHeight: 1.5,
                maxWidth: 280,
              }}
            >
              {session.sankalpa.intentionText}
            </p>
            <div
              style={{
                height: 1,
                width: 40,
                background: 'linear-gradient(90deg, rgba(212,160,23,0.5), transparent)',
              }}
            />
          </div>
        </motion.div>
      )}

      {/* XP + Streak */}
      {showXP && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 20 }}
        >
          <KarmaXPSeal xpAwarded={xpAwarded} streakCount={streakCount} />
        </motion.div>
      )}

      {/* Exit options */}
      {showExit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            gap: 12,
            width: '100%',
            maxWidth: 340,
          }}
        >
          <button
            onClick={handleReturn}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 24,
              background: 'transparent',
              border: '1px solid rgba(212,160,23,0.35)',
              color: '#D4A017',
              fontFamily: 'var(--font-ui, Outfit, sans-serif)',
              fontSize: 13,
              fontWeight: 400,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Return to Sakha
          </button>
          <button
            onClick={handleJournal}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 24,
              background: 'transparent',
              border: '1px solid rgba(212,160,23,0.35)',
              color: '#D4A017',
              fontFamily: 'var(--font-ui, Outfit, sans-serif)',
              fontSize: 13,
              fontWeight: 400,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Karma Journal
          </button>
        </motion.div>
      )}
    </div>
  )
}
