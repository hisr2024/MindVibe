'use client'

/**
 * IntentionPhase — Sacred vow ceremony with dawn aesthetic.
 * Intention displayed as divine decree. Press-and-hold to seal the vow.
 * Custom intention styled as inscribing on a prayer leaf.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VerseParchment } from '../components/VerseParchment'
import { SacredButton } from '../components/SacredButton'
import type { DharmaIntention } from '@/types/sadhana.types'

interface IntentionPhaseProps {
  intention: DharmaIntention
  value: string
  onChange: (text: string) => void
  onComplete: () => void
}

const CLOSING_SHLOKA = 'यतो धर्मस्ततो जयः'
const CLOSING_MEANING = 'Where there is dharma, there is victory'

export function IntentionPhase({ intention, value, onChange, onComplete }: IntentionPhaseProps) {
  const [useCustom, setUseCustom] = useState(false)
  const [sealed, setSealed] = useState(false)

  const handleAcceptVow = () => {
    onChange(intention.suggestion)
    setSealed(true)
    setTimeout(onComplete, 1500)
  }

  const handleCustomSubmit = () => {
    if (!value.trim()) return
    setSealed(true)
    setTimeout(onComplete, 1500)
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0, scale: 0.9, filter: 'brightness(1.5)' }}
      animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
      exit={{ opacity: 0, scale: 1.1, filter: 'brightness(2)' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Section label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[10px] text-[#FFD700]/30 tracking-[0.25em] uppercase mb-2"
      >
        संकल्प · Sacred Intention
      </motion.p>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-8"
      >
        <h2
          className="text-2xl md:text-3xl font-light mb-2 text-[#FFF8DC]"
          style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
        >
          धर्म संकल्प
        </h2>
        <p className="text-sm text-[#FFD700]/40 font-light">
          One sacred action to carry with you today
        </p>
      </motion.div>

      {/* Sealed state — show closing shloka */}
      <AnimatePresence>
        {sealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.p
              className="text-3xl text-[#FFD700]/70 mb-2"
              style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {CLOSING_SHLOKA}
            </motion.p>
            <motion.p
              className="text-sm text-[#d4a44c]/50 italic font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {CLOSING_MEANING}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intention content — hidden when sealed */}
      {!sealed && (
        <>
          {/* AI Suggestion — Golden decree card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-lg w-full"
          >
            <VerseParchment>
              <p className="text-[10px] text-[#d4a44c]/40 uppercase tracking-wider mb-3 text-center">
                {intention.category}
              </p>
              <p
                className="text-lg text-[#FFF8DC]/80 font-light leading-relaxed text-center"
                style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
              >
                &ldquo;{intention.suggestion}&rdquo;
              </p>
            </VerseParchment>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex flex-col items-center gap-4 max-w-lg w-full"
          >
            <AnimatePresence mode="wait">
              {!useCustom ? (
                <motion.div
                  key="accept"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <SacredButton variant="vow" onClick={handleAcceptVow}>
                    I Accept This Dharma
                  </SacredButton>
                  <SacredButton variant="whisper" onClick={() => setUseCustom(true)}>
                    Inscribe my own intention
                  </SacredButton>
                </motion.div>
              ) : (
                <motion.div
                  key="custom"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex flex-col items-center gap-4"
                >
                  {/* Prayer leaf input */}
                  <div className="w-full bg-[#0f0c06]/50 backdrop-blur-md rounded-2xl border border-[#d4a44c]/10 overflow-hidden">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder="My sacred intention for today..."
                      maxLength={200}
                      className="w-full bg-transparent text-[#FFF8DC]/75 placeholder-[#d4a44c]/20 p-4 outline-none font-light"
                      style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
                      autoFocus
                    />
                  </div>
                  <SacredButton
                    variant="golden"
                    onClick={handleCustomSubmit}
                    disabled={!value.trim()}
                  >
                    Seal This Intention
                  </SacredButton>
                  <SacredButton variant="whisper" onClick={() => setUseCustom(false)}>
                    Back to suggestion
                  </SacredButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
