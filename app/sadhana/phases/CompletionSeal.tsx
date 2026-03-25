'use client'

/**
 * CompletionSeal — Divine blessing screen with Sanskrit benediction.
 * Stats displayed as sacred offerings. Full golden radiance atmosphere.
 * Closes with a sacred shloka and "Walk in Dharma" button.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MandalaBloom } from '../visuals/MandalaBloom'
import { SacredButton } from '../components/SacredButton'

interface CompletionSealProps {
  xpAwarded: number
  streakCount: number
  message: string
  verseId: string
}

const BENEDICTIONS = [
  { sanskrit: 'सर्वे भवन्तु सुखिनः', meaning: 'May all beings be happy' },
  { sanskrit: 'ॐ शान्तिः शान्तिः शान्तिः', meaning: 'Om Peace Peace Peace' },
  { sanskrit: 'लोकाः समस्ताः सुखिनो भवन्तु', meaning: 'May all the worlds be happy' },
  { sanskrit: 'तमसो मा ज्योतिर्गमय', meaning: 'Lead me from darkness to light' },
  { sanskrit: 'असतो मा सद्गमय', meaning: 'Lead me from untruth to truth' },
]

export function CompletionSeal({ xpAwarded, streakCount, message, verseId }: CompletionSealProps) {
  const [confettiFired, setConfettiFired] = useState(false)
  const [benediction] = useState(() =>
    BENEDICTIONS[Math.floor(Math.random() * BENEDICTIONS.length)]
  )

  useEffect(() => {
    if (confettiFired) return
    setConfettiFired(true)

    import('canvas-confetti').then((confettiModule) => {
      const confetti = confettiModule.default
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#d4a44c', '#FFD700', '#F4A460', '#FFF8DC'],
        disableForReducedMotion: true,
      })
    }).catch(() => { /* graceful degradation */ })
  }, [confettiFired])

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, type: 'spring', stiffness: 80 }}
    >
      {/* Golden light flood */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Mandala bloom */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 80, delay: 0.3 }}
      >
        <MandalaBloom isActive size={180} />

        {/* Om at center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.span
            className="text-4xl text-[#FFD700]/80"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ॐ
          </motion.span>
        </div>
      </motion.div>

      {/* Sanskrit blessing heading */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center mb-6"
      >
        <h2
          className="text-3xl md:text-4xl font-light mb-1 text-[#FFD700]/90"
          style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
        >
          तत्सत्
        </h2>
        <p className="text-lg text-[#FFF8DC]/60 font-light mb-2">
          साधना सम्पन्न — Sadhana Complete
        </p>
        <p
          className="text-[#d4a44c]/50 font-light max-w-md leading-relaxed text-sm"
          style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
        >
          {message}
        </p>
      </motion.div>

      {/* Sacred offerings — replacing gamified stats */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="flex gap-6 md:gap-8 mb-8"
      >
        <SacredOffering
          icon="🪔"
          value={`+${xpAwarded}`}
          label="पुण्य"
          sublabel="Punya"
        />
        <div className="w-px bg-[#d4a44c]/15" />
        <SacredOffering
          icon="🔥"
          value={`${streakCount}`}
          label="तपस"
          sublabel="Tapas Days"
        />
        <div className="w-px bg-[#d4a44c]/15" />
        <SacredOffering
          icon="📜"
          value={verseId}
          label="श्लोक"
          sublabel="Today&apos;s Shloka"
        />
      </motion.div>

      {/* Closing benediction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center mb-8"
      >
        <p
          className="text-lg text-[#FFD700]/50 mb-1"
          style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
        >
          {benediction.sanskrit}
        </p>
        <p className="text-xs text-[#d4a44c]/30 italic font-light">
          {benediction.meaning}
        </p>
      </motion.div>

      {/* Walk in Dharma — return button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <Link href="/dashboard">
          <SacredButton variant="golden">
            Walk in Dharma 🙏
          </SacredButton>
        </Link>
      </motion.div>
    </motion.div>
  )
}

function SacredOffering({
  icon,
  value,
  label,
  sublabel,
}: {
  icon: string
  value: string
  label: string
  sublabel: string
}) {
  return (
    <div className="text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-xl font-light text-[#FFD700]/80 mt-1">{value}</p>
      <p
        className="text-[10px] text-[#d4a44c]/50 mt-0.5"
        style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
      >
        {label}
      </p>
      <p className="text-[9px] text-[#d4a44c]/30">{sublabel}</p>
    </div>
  )
}
