'use client'

/**
 * SuggestedPrompts — Horizontal scrollable prompt suggestions for empty chat.
 *
 * Shown when Sakha chat has no messages yet. Offers 8 sacred/spiritual prompts
 * that the user can tap to send immediately. Staggered fade-in animation.
 */

import { motion, type Variants } from 'framer-motion'
import { hapticPulse } from '@/utils/voice/hapticFeedback'

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void
}

const PROMPTS = [
  'I feel anxious today',
  'Tell me about karma',
  'How to find inner peace?',
  'What does the Gita say about fear?',
  'I need strength right now',
  'Explain dharma to me',
  'How to let go of anger?',
  'Guide me through grief',
] as const

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const chipVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const handleSelect = (prompt: string) => {
    hapticPulse()
    onSelect(prompt)
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        <p className="font-serif text-lg text-[#e8b54a]">
          Namaste, dear friend
        </p>
        <p className="mt-1 text-sm text-[#a89e8e]">
          What weighs on your heart today?
        </p>
      </motion.div>

      {/* Prompt chips — horizontal scroll */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {PROMPTS.map((prompt, index) => (
          <motion.button
            key={index}
            type="button"
            variants={chipVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(prompt)}
            className="flex-shrink-0 rounded-full border border-[#d4a44c]/40 bg-[#d4a44c]/5 px-4 py-2 text-sm text-[#f5f0e8] transition-colors hover:border-[#d4a44c]/70 hover:bg-[#d4a44c]/15 focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/30"
          >
            {prompt}
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
