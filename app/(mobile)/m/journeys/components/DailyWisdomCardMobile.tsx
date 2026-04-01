/**
 * DailyWisdomCardMobile — Gita verse of the day with Sanskrit reveal,
 * KIAAN reflection, and contemplation question.
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MobileSanskritReveal } from '@/app/(mobile)/m/sadhana/visuals/MobileSanskritReveal'
import { VoiceResponseButton } from '@/components/voice/VoiceResponseButton'

interface DailyVerse {
  chapter: number
  verse: number
  sanskrit: string
  translation: string
  kiaanReflection: string
  contemplation: string
}

interface DailyWisdomCardMobileProps {
  verse: DailyVerse
}

export function DailyWisdomCardMobile({ verse }: DailyWisdomCardMobileProps) {
  const [revealComplete, setRevealComplete] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-[#D4A017]/25 p-6 overflow-hidden"
      style={{
        borderTopWidth: 3,
        borderTopColor: 'rgba(212,160,23,0.7)',
        background:
          'radial-gradient(ellipse at center top, rgba(212,160,23,0.08), rgba(17,20,53,0.98) 70%)',
      }}
    >
      {/* Reference badge */}
      <p className="text-center text-[9px] uppercase tracking-[0.15em] text-[#D4A017]/60 font-ui mb-4">
        BG {verse.chapter}.{verse.verse}
      </p>

      {/* Sanskrit verse with reveal animation */}
      <MobileSanskritReveal
        text={verse.sanskrit}
        stagger={70}
        onComplete={() => setRevealComplete(true)}
        className="mb-4"
      />

      {/* Gold divider */}
      <div className="mx-auto w-12 h-px bg-gradient-to-r from-transparent via-[#D4A017]/40 to-transparent mb-4" />

      {/* English translation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: revealComplete ? 1 : 0.3 }}
        transition={{ duration: 0.8 }}
        className="text-center font-ui text-base text-[#EDE8DC] leading-relaxed mb-5"
      >
        {verse.translation}
      </motion.p>

      {/* Gold divider */}
      <div className="mx-auto w-12 h-px bg-gradient-to-r from-transparent via-[#D4A017]/40 to-transparent mb-5" />

      {/* KIAAN reflection */}
      <div className="pl-4 border-l-[3px] border-[#D4A017]/40 mb-5">
        <p className="text-[9px] uppercase tracking-[0.15em] text-[#D4A017]/50 font-ui mb-2">
          {'\u2726'} Sakha&apos;s Reflection
        </p>
        <p className="font-display text-base italic text-[#EDE8DC] leading-relaxed">
          {verse.kiaanReflection}
        </p>
      </div>

      {/* Contemplation question */}
      <div className="bg-white/[0.03] rounded-xl p-4 mb-4">
        <p className="text-[9px] text-[#6B6355] font-ui mb-1.5">
          Sit with this question:
        </p>
        <p className="font-sacred text-base italic text-[#EDE8DC] leading-relaxed">
          {verse.contemplation}
        </p>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-center gap-4">
        <VoiceResponseButton
          text={`${verse.translation}. ${verse.kiaanReflection}`}
          size="sm"
          variant="minimal"
        />
      </div>
    </motion.div>
  )
}
