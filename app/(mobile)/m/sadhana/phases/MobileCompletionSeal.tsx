'use client'

/**
 * MobileCompletionSeal — The Disney Moment. Maximum animation quality.
 * MandalaBloom + golden confetti + XP counter + streak + benediction.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MobileMandalaBloom } from '../visuals/MobileMandalaBloom'
import { MobileGoldenParticles } from '../visuals/MobileGoldenParticles'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import type { CompleteResponse } from '@/types/sadhana.types'

const BENEDICTIONS = [
  { sanskrit: 'सर्वे भवन्तु सुखिनः', english: 'May all beings be happy' },
  { sanskrit: 'लोका समस्ता सुखिनो भवन्तु', english: 'May all worlds be at peace' },
  { sanskrit: 'ॐ शान्तिः शान्तिः शान्तिः', english: 'Peace. Peace. Peace.' },
  { sanskrit: 'तत् त्वम् असि', english: 'That thou art' },
  { sanskrit: 'अहं ब्रह्मास्मि', english: 'I am the infinite' },
]

interface MobileCompletionSealProps {
  result: CompleteResponse | null
}

export function MobileCompletionSeal({ result }: MobileCompletionSealProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const [displayXP, setDisplayXP] = useState(0)
  const [showXP, setShowXP] = useState(false)
  const [showStreak, setShowStreak] = useState(false)
  const [showBenediction, setShowBenediction] = useState(false)

  const xpAwarded = result?.xpAwarded ?? 25
  const streakCount = result?.streakCount ?? 1

  const benediction = useMemo(() => {
    const idx = Math.floor(((Date.now() / 1000) % BENEDICTIONS.length))
    return BENEDICTIONS[idx]
  }, [])

  // Staggered reveal sequence
  useEffect(() => {
    const t1 = setTimeout(() => setShowXP(true), 600)
    const t2 = setTimeout(() => setShowStreak(true), 1800)
    const t3 = setTimeout(() => setShowBenediction(true), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Animated XP counter
  useEffect(() => {
    if (!showXP) return
    let frame = 0
    const totalFrames = 60
    const interval = setInterval(() => {
      frame++
      const eased = 1 - Math.pow(1 - frame / totalFrames, 3)
      setDisplayXP(Math.round(eased * xpAwarded))
      if (frame >= totalFrames) clearInterval(interval)
    }, 1200 / totalFrames)
    return () => clearInterval(interval)
  }, [showXP, xpAwarded])

  const handleExit = useCallback(() => {
    triggerHaptic('medium')
    router.push('/m')
  }, [triggerHaptic, router])

  return (
    <div className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Mandala bloom background */}
      <MobileMandalaBloom />

      {/* Golden confetti burst */}
      <MobileGoldenParticles burst density={1} />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center px-6">
        {/* XP Award */}
        {showXP && (
          <motion.div
            className="rounded-3xl px-8 py-6 text-center mb-6"
            style={{
              background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
              border: '1px solid rgba(212,160,23,0.2)',
              borderTop: '2px solid rgba(212,160,23,0.5)',
              boxShadow: '0 20px 60px rgba(5,7,20,0.8)',
            }}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <p className="text-[9px] text-[#D4A017] tracking-[0.15em] uppercase mb-2 font-[family-name:var(--font-ui)]">
              ✦ Sacred Offering
            </p>
            <p className="font-[family-name:var(--font-divine)] text-5xl text-[#D4A017]" style={{ fontWeight: 300 }}>
              +{displayXP} XP
            </p>
          </motion.div>
        )}

        {/* Streak */}
        {showStreak && (
          <motion.div
            className="flex flex-col items-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-[#B8AE98] mb-2 font-[family-name:var(--font-ui)]">
              {streakCount} {streakCount === 1 ? 'Day' : 'Days'} of Dharma
            </p>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(streakCount, 7) }).map((_, i) => (
                <motion.span
                  key={i}
                  className="text-[#D4A017] text-lg"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                >
                  🪷
                </motion.span>
              ))}
              {streakCount > 7 && (
                <span className="text-xs text-[#D4A017] ml-1">+</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Benediction */}
        {showBenediction && (
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-[family-name:var(--font-divine)] text-[22px] text-[#D4A017] mb-1" style={{ fontWeight: 300 }}>
              {benediction.sanskrit}
            </p>
            <p className="font-[family-name:var(--font-scripture)] italic text-sm text-[#B8AE98]">
              {benediction.english}
            </p>
          </motion.div>
        )}

        {/* Exit buttons */}
        {showBenediction && (
          <motion.div
            className="flex flex-col items-center gap-3 w-full max-w-[300px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleExit}
              className="w-full h-14 rounded-[28px] text-[15px] font-[family-name:var(--font-ui)] text-white active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, #1B4FBB, #0E7490)',
                border: '1px solid rgba(212,160,23,0.4)',
                fontWeight: 500,
              }}
            >
              Walk in Dharma
            </button>
            <button
              onClick={() => router.push('/m/journal')}
              className="text-sm text-[#D4A017]/70 font-[family-name:var(--font-ui)] hover:text-[#D4A017] transition-colors"
            >
              View Journal Entry
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
