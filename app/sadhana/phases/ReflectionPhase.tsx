'use client'

/**
 * ReflectionPhase — Sacred journaling space with water-ripple aesthetic.
 * Floating wisdom whispers, sacred paper styling, quill icon, no character count.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SacredButton } from '../components/SacredButton'
import type { ReflectionPrompt } from '@/types/sadhana.types'

interface ReflectionPhaseProps {
  prompt: ReflectionPrompt
  value: string
  onChange: (text: string) => void
  onComplete: () => void
}

const WISDOM_WHISPERS = [
  'Let truth flow freely...',
  'There is no wrong answer...',
  'Your soul already knows...',
  'Write from the heart...',
  'Be gentle with yourself...',
]

export function ReflectionPhase({ prompt, value, onChange, onComplete }: ReflectionPhaseProps) {
  const [focused, setFocused] = useState(false)
  const [whisperIndex, setWhisperIndex] = useState(0)
  const [showBreathReminder, setShowBreathReminder] = useState(false)
  const lastTyped = useRef(Date.now())
  const whisperTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  /* Rotate wisdom whispers */
  useEffect(() => {
    whisperTimer.current = setInterval(() => {
      setWhisperIndex(i => (i + 1) % WISDOM_WHISPERS.length)
    }, 6000)
    return () => { if (whisperTimer.current) clearInterval(whisperTimer.current) }
  }, [])

  /* Breath reminder after inactivity */
  useEffect(() => {
    const check = setInterval(() => {
      if (Date.now() - lastTyped.current > 30000 && focused) {
        setShowBreathReminder(true)
        setTimeout(() => setShowBreathReminder(false), 4000)
      }
    }, 10000)
    return () => clearInterval(check)
  }, [focused])

  const handleChange = (text: string) => {
    lastTyped.current = Date.now()
    setShowBreathReminder(false)
    onChange(text)
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Section label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[10px] text-[#87CEEB]/30 tracking-[0.25em] uppercase mb-2"
      >
        चिंतन · Sacred Reflection
      </motion.p>

      {/* Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-8 max-w-lg"
      >
        <h2
          className="text-2xl font-light mb-3 text-[#FFF8DC]"
          style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
        >
          {prompt.prompt}
        </h2>
        <p className="text-sm text-[#87CEEB]/40 italic font-light">
          {prompt.guidingQuestion}
        </p>
      </motion.div>

      {/* Sacred textarea with whispers */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-lg relative"
      >
        {/* Floating wisdom whisper */}
        <AnimatePresence mode="wait">
          {!focused && !value && (
            <motion.p
              key={whisperIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -top-8 left-0 right-0 text-center text-[#d4a44c]/25 text-xs italic font-light"
            >
              {WISDOM_WHISPERS[whisperIndex]}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Quill icon */}
        <motion.div
          className="absolute -left-8 top-4 text-[#d4a44c]/15 pointer-events-none hidden md:block"
          animate={{ rotate: focused ? -5 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 2L4 18l-2 4 4-2L20 6c1-1 2-3 0-4z" />
            <path d="M15 7l2 2" />
          </svg>
        </motion.div>

        {/* Textarea container */}
        <div
          className={`
            relative rounded-2xl transition-all duration-500
            ${focused
              ? 'bg-[#0f0c06]/60 ring-1 ring-[#d4a44c]/20 shadow-[0_0_30px_rgba(212,164,76,0.05)]'
              : 'bg-white/[0.03]'
            }
          `}
        >
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Let your thoughts flow like the Ganges..."
            rows={7}
            maxLength={2000}
            className="w-full bg-transparent text-[#FFF8DC]/75 placeholder-[#d4a44c]/20 p-5 resize-none outline-none font-light leading-relaxed"
            style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
          />
        </div>

        {/* Breath reminder */}
        <AnimatePresence>
          {showBreathReminder && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-8 left-0 right-0 text-center text-[#87CEEB]/30 text-xs font-light"
            >
              Take a breath... there is no rush 🌬
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-10"
      >
        <SacredButton variant="golden" onClick={onComplete}>
          {value.trim() ? 'Continue' : 'Skip Reflection'}
        </SacredButton>
      </motion.div>
    </motion.div>
  )
}
