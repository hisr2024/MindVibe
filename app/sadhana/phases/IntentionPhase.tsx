'use client'

/**
 * IntentionPhase — Dharma micro-action commitment.
 * AI suggests an intention; user can accept or write their own.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { DharmaIntention } from '@/types/sadhana.types'

interface IntentionPhaseProps {
  intention: DharmaIntention
  value: string
  onChange: (text: string) => void
  onComplete: () => void
}

export function IntentionPhase({ intention, value, onChange, onComplete }: IntentionPhaseProps) {
  const [useCustom, setUseCustom] = useState(false)

  const handleAcceptSuggestion = () => {
    onChange(intention.suggestion)
    setTimeout(onComplete, 300)
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl font-light mb-2">
          Dharma Intention
        </h2>
        <p className="text-sm text-[#d4a44c]/60">
          One action to carry with you today
        </p>
      </motion.div>

      {/* AI Suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-lg w-full"
      >
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-[#d4a44c]/10">
          <p className="text-xs text-[#d4a44c]/40 uppercase tracking-wider mb-3">
            {intention.category}
          </p>
          <p className="text-lg text-[#FFF8DC]/80 font-light leading-relaxed">
            &ldquo;{intention.suggestion}&rdquo;
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-8 flex flex-col items-center gap-4 max-w-lg w-full"
      >
        {!useCustom ? (
          <>
            <motion.button
              onClick={handleAcceptSuggestion}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-8 py-3 rounded-full bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30 backdrop-blur-md hover:bg-[#d4a44c]/30 transition-colors"
            >
              Accept This Intention
            </motion.button>
            <motion.button
              onClick={() => setUseCustom(true)}
              whileHover={{ scale: 1.05 }}
              className="text-[#d4a44c]/40 text-sm hover:text-[#d4a44c]/60 transition-colors"
            >
              Write my own
            </motion.button>
          </>
        ) : (
          <>
            <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl border border-[#d4a44c]/10 overflow-hidden">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="My intention for today..."
                maxLength={200}
                className="w-full bg-transparent text-[#FFF8DC]/80 placeholder-[#d4a44c]/30 p-4 outline-none font-light"
                autoFocus
              />
            </div>
            <motion.button
              onClick={onComplete}
              disabled={!value.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-full bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30 backdrop-blur-md hover:bg-[#d4a44c]/30 transition-colors disabled:opacity-30"
            >
              Set Intention
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
