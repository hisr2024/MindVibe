'use client'

/**
 * MobileIntentionPhase — Dharma intention display with sacred seal commitment gesture.
 * Shows AI-generated intention with optional editing, then a ceremony to seal the sankalpa.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import type { DharmaIntention } from '@/types/sadhana.types'

interface MobileIntentionPhaseProps {
  intention: DharmaIntention
  intentionText: string
  onIntentionChange: (text: string) => void
  onComplete: () => void
}

export function MobileIntentionPhase({
  intention,
  intentionText,
  onIntentionChange,
  onComplete,
}: MobileIntentionPhaseProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [sealed, setSealed] = useState(false)
  const [showCeremony, setShowCeremony] = useState(false)
  const { triggerHaptic } = useHapticFeedback()

  const displayText = intentionText || intention.suggestion

  const handleSeal = useCallback(() => {
    if (sealed) return
    triggerHaptic('heavy')
    setSealed(true)
    setShowCeremony(true)

    // Save intention text if not already set
    if (!intentionText) {
      onIntentionChange(intention.suggestion)
    }

    // Advance after ceremony
    setTimeout(() => {
      onComplete()
    }, 2500)
  }, [sealed, triggerHaptic, intentionText, intention.suggestion, onIntentionChange, onComplete])

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center px-5 pt-10 pb-20">
      {/* Category badge */}
      <motion.p
        className="text-[9px] text-[#D4A017] tracking-[0.15em] uppercase mb-4 font-[family-name:var(--font-ui)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {intention.category}
      </motion.p>

      {/* Intention card */}
      <motion.div
        className="w-full max-w-[340px] rounded-3xl p-6 relative"
        style={{
          background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(30,25,50,0.98))',
          borderLeft: '4px solid #D4A017',
          border: '1px solid rgba(212,160,23,0.2)',
          borderLeftWidth: 4,
          borderLeftColor: '#D4A017',
          boxShadow: '0 20px 60px rgba(5,7,20,0.8)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* Edit toggle */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-4 right-4 text-[#6B6355] hover:text-[#D4A017] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Category label */}
        <p className="text-[9px] text-[#D4A017] tracking-[0.15em] uppercase mb-3 font-[family-name:var(--font-ui)]">
          {intention.category}
        </p>

        {/* Intention text */}
        {isEditing ? (
          <textarea
            value={displayText}
            onChange={(e) => onIntentionChange(e.target.value)}
            className="w-full bg-transparent text-[#EDE8DC] font-[family-name:var(--font-display)] italic text-[22px] leading-[1.6] resize-none outline-none border-b border-[#D4A017]/30 pb-2"
            rows={3}
            autoFocus
            onBlur={() => setIsEditing(false)}
          />
        ) : (
          <motion.p
            className="font-[family-name:var(--font-display)] italic text-[22px] text-[#EDE8DC] leading-[1.6] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {displayText}
          </motion.p>
        )}

        {/* Time of day */}
        <p className="text-[10px] text-[#6B6355] text-center mt-4 font-[family-name:var(--font-ui)]">
          For today, {timeOfDay}
        </p>
      </motion.div>

      {/* Customize hint */}
      <motion.p
        className="text-[10px] text-[#6B6355] mt-3 font-[family-name:var(--font-ui)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Tap the pencil to customize your intention
      </motion.p>

      {/* Commitment gesture */}
      <div className="mt-auto pt-8 flex flex-col items-center">
        <motion.p
          className="text-[11px] text-[#6B6355] mb-4 font-[family-name:var(--font-ui)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Seal Your Sankalpa
        </motion.p>

        {/* Sacred seal button */}
        <motion.button
          onClick={handleSeal}
          disabled={sealed}
          className="w-20 h-20 rounded-full flex items-center justify-center relative"
          style={{
            background: 'radial-gradient(circle, #2563EB, #050714)',
            border: '2px solid rgba(212,160,23,0.6)',
          }}
          whileTap={!sealed ? { scale: 0.92 } : {}}
          animate={!sealed ? {
            boxShadow: [
              '0 0 10px rgba(212,160,23,0.3)',
              '0 0 20px rgba(212,160,23,0.5)',
              '0 0 10px rgba(212,160,23,0.3)',
            ],
          } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Lotus SVG */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4c-2 4-6 8-6 12s2 6 6 8c4-2 6-4 6-8s-4-8-6-12z" fill="#D4A017" opacity="0.8" />
            <path d="M16 4c0 4-4 10-8 12 2 2 5 4 8 4s6-2 8-4c-4-2-8-8-8-12z" fill="#D4A017" opacity="0.5" />
            <circle cx="16" cy="18" r="2" fill="#FDE68A" />
          </svg>
        </motion.button>

        <motion.p
          className="text-[11px] text-[#6B6355] mt-3 font-[family-name:var(--font-ui)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          I commit to this sankalpa
        </motion.p>
      </div>

      {/* Ceremony overlay */}
      <AnimatePresence>
        {showCeremony && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Golden light sweep */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(212,160,23,0.2), transparent)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />

            {/* Divine ripple */}
            <motion.div
              className="absolute w-40 h-40 rounded-full border-2 border-[#D4A017]/40"
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            {/* Sealed message */}
            <motion.p
              className="relative z-10 font-[family-name:var(--font-divine)] italic text-xl text-[#D4A017] text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Sankalpa sealed. Walk in dharma.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
