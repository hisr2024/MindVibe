'use client'

/**
 * CompletionSeal — Celebration screen with Om ripple, confetti, and XP award.
 * The sacred seal of today's practice.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface CompletionSealProps {
  xpAwarded: number
  streakCount: number
  message: string
  verseId: string
}

export function CompletionSeal({ xpAwarded, streakCount, message, verseId }: CompletionSealProps) {
  const [confettiFired, setConfettiFired] = useState(false)

  useEffect(() => {
    if (confettiFired) return
    setConfettiFired(true)

    /* Dynamic import canvas-confetti to avoid SSR issues */
    import('canvas-confetti').then((confettiModule) => {
      const confetti = confettiModule.default
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4a44c', '#FFD700', '#F4A460', '#FFF8DC'],
        disableForReducedMotion: true,
      })
    }).catch(() => {
      /* canvas-confetti not available — degrade gracefully */
    })
  }, [confettiFired])

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Om Symbol with ripple */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.3 }}
        className="relative mb-8"
      >
        {/* Ripple rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-[#d4a44c]/20"
            initial={{ scale: 1, opacity: 0.3 }}
            animate={{ scale: 2 + i * 0.5, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut',
            }}
            style={{ width: 100, height: 100, left: -10, top: -10 }}
          />
        ))}

        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d4a44c]/30 to-[#FFD700]/20 flex items-center justify-center backdrop-blur-md border border-[#d4a44c]/20">
          <span className="text-4xl text-[#d4a44c]">ॐ</span>
        </div>
      </motion.div>

      {/* Completion message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-light text-[#FFF8DC] mb-3">
          Sadhana Sealed
        </h2>
        <p className="text-[#d4a44c]/70 font-light max-w-md leading-relaxed">
          {message}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="flex gap-8 mb-10"
      >
        <div className="text-center">
          <p className="text-2xl font-light text-[#FFD700]">+{xpAwarded}</p>
          <p className="text-xs text-[#d4a44c]/50 mt-1">XP Earned</p>
        </div>
        <div className="w-px bg-[#d4a44c]/20" />
        <div className="text-center">
          <p className="text-2xl font-light text-[#FFD700]">{streakCount}</p>
          <p className="text-xs text-[#d4a44c]/50 mt-1">Day Streak</p>
        </div>
        <div className="w-px bg-[#d4a44c]/20" />
        <div className="text-center">
          <p className="text-2xl font-light text-[#FFD700]">{verseId}</p>
          <p className="text-xs text-[#d4a44c]/50 mt-1">Today&apos;s Verse</p>
        </div>
      </motion.div>

      {/* Return link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <Link
          href="/dashboard"
          className="px-8 py-3 rounded-full bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30 backdrop-blur-md hover:bg-[#d4a44c]/30 transition-colors inline-block"
        >
          Return to Dashboard
        </Link>
      </motion.div>
    </motion.div>
  )
}
