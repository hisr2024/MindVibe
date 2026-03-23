'use client'

/**
 * ReflectionPhase — Sacred journaling prompt with text input.
 * Saves reflection to the Sadhana store (later persisted via completion API).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ReflectionPrompt } from '@/types/sadhana.types'

interface ReflectionPhaseProps {
  prompt: ReflectionPrompt
  value: string
  onChange: (text: string) => void
  onComplete: () => void
}

export function ReflectionPhase({ prompt, value, onChange, onComplete }: ReflectionPhaseProps) {
  const [focused, setFocused] = useState(false)

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8 max-w-lg"
      >
        <h2 className="text-2xl font-light mb-3">
          Sacred Reflection
        </h2>
        <p className="text-[#d4a44c]/70 leading-relaxed">
          {prompt.prompt}
        </p>
        <p className="text-sm text-[#d4a44c]/40 mt-2 italic">
          {prompt.guidingQuestion}
        </p>
      </motion.div>

      {/* Text area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-lg"
      >
        <div
          className={`
            relative rounded-2xl backdrop-blur-md transition-all duration-300
            ${focused
              ? 'bg-white/10 ring-1 ring-[#d4a44c]/30'
              : 'bg-white/5'
            }
          `}
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Let your thoughts flow freely..."
            rows={6}
            maxLength={2000}
            className="w-full bg-transparent text-[#FFF8DC]/80 placeholder-[#d4a44c]/30 p-5 resize-none outline-none font-light leading-relaxed"
          />

          {/* Character count */}
          <div className="absolute bottom-3 right-4 text-xs text-[#d4a44c]/30">
            {value.length}/2000
          </div>
        </div>
      </motion.div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <motion.button
          onClick={onComplete}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-full bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30 backdrop-blur-md hover:bg-[#d4a44c]/30 transition-colors"
        >
          {value.trim() ? 'Continue' : 'Skip Reflection'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
