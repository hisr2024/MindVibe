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
import { DharmaFlameIcon } from '../visuals/DharmaFlameIcon'
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
  const isMountedRef = useRef(true)

  // Track mount state so async API resolutions never call setState on a
  // teardown component — that was the primary cause of the post-completion
  // crash on Android WebView, which surfaces unhandled errors as native crashes.
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Complete session via API. Use only the stable sessionId in deps so this
  // never re-fires when the session object reference changes.
  const sessionId = session?.sessionId
  const sankalpaSealed = session?.sankalpa?.sealed ?? false

  useEffect(() => {
    if (completedRef.current) return
    completedRef.current = true

    const complete = async () => {
      try {
        if (!sessionId) return
        const result = await finishSession(sessionId, sankalpaSealed, [])
        if (!isMountedRef.current || !result) return
        if (typeof result.xpAwarded === 'number') {
          setXpAwarded(result.xpAwarded)
        }
        if (typeof result.streakCount === 'number') {
          setStreakCount(result.streakCount)
        }
      } catch (err) {
        // Ceremony must not crash even if the API throws synchronously.
        // The fallback values (25 XP, streak 1) already in state are used.
        // eslint-disable-next-line no-console
        console.warn('[SealPhase] finishSession failed:', err)
      }
    }
    complete()
  }, [sessionId, sankalpaSealed, finishSession])

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

  const safePush = useCallback(
    (path: string) => {
      try {
        router.push(path)
      } catch {
        // Fallback for environments where the App Router isn't ready
        // (e.g., Android WebView during a fast page swap).
        if (typeof window !== 'undefined') {
          window.location.href = path
        }
      }
    },
    [router],
  )

  const handleReturn = useCallback(() => {
    triggerHaptic('medium')
    safePush('/m')
  }, [triggerHaptic, safePush])

  const handleJournal = useCallback(() => {
    triggerHaptic('light')
    safePush('/m/journal')
  }, [triggerHaptic, safePush])

  // Live garland — 5 diyas flickering on the completion screen.
  const garlandFlames = [0, 1, 2, 3, 4]

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

      {/* Live diya garland — 5 lamps gently flicker on completion */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 18,
          marginTop: 18,
          minHeight: 56,
        }}
      >
        {garlandFlames.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.12, duration: 0.4 }}
          >
            <DharmaFlameIcon
              size={i === 2 ? 26 : 20}
              intensity={i === 2 ? 'bright' : 'normal'}
              color="#F0C040"
              animate
              phase={i}
            />
          </motion.div>
        ))}
      </motion.div>

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
