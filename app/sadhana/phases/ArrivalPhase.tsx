'use client'

/**
 * ArrivalPhase — Mood capture + sacred greeting.
 * User selects their emotional state, KIAAN greets them.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MandalaBloom } from '../visuals/MandalaBloom'
import type { SadhanaMood, MoodOption } from '@/types/sadhana.types'

interface ArrivalPhaseProps {
  greeting: string | null
  isComposing: boolean
  onMoodSelect: (mood: SadhanaMood) => void
}

const MOODS: MoodOption[] = [
  { id: 'radiant', label: 'Radiant', emoji: '✨', color: '#FFD700', description: 'Joyful, bright, full of energy' },
  { id: 'peaceful', label: 'At Peace', emoji: '🕊️', color: '#87CEEB', description: 'Calm, centered, content' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏', color: '#98FB98', description: 'Thankful, blessed, appreciative' },
  { id: 'seeking', label: 'Seeking', emoji: '🔍', color: '#DDA0DD', description: 'Curious, searching, questioning' },
  { id: 'heavy', label: 'Heavy', emoji: '🌧️', color: '#A0A0C0', description: 'Burdened, tired, weighed down' },
  { id: 'wounded', label: 'Wounded', emoji: '💔', color: '#CD5C5C', description: 'Hurting, grieving, in pain' },
]

export function ArrivalPhase({ greeting, isComposing, onMoodSelect }: ArrivalPhaseProps) {
  const [selectedMood, setSelectedMood] = useState<SadhanaMood | null>(null)

  const handleSelect = (mood: SadhanaMood) => {
    setSelectedMood(mood)
    onMoodSelect(mood)
  }

  const timeGreeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning, dear soul'
    if (hour < 17) return 'Good afternoon, dear soul'
    return 'Good evening, dear soul'
  })()

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background mandala */}
      <div className="absolute opacity-30 pointer-events-none">
        <MandalaBloom isActive size={400} />
      </div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-3xl md:text-4xl font-light mb-2">
          {timeGreeting}
        </h1>
        <p className="text-lg text-[#d4a44c]/70">
          How does your heart feel right now?
        </p>
      </motion.div>

      {/* Mood orbs */}
      <motion.div
        className="grid grid-cols-3 gap-4 md:gap-6 max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {MOODS.map((mood, i) => (
          <motion.button
            key={mood.id}
            onClick={() => handleSelect(mood.id)}
            disabled={isComposing}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-2xl
              backdrop-blur-md transition-all duration-300
              ${selectedMood === mood.id
                ? 'bg-white/15 ring-2 ring-[#d4a44c]/50'
                : 'bg-white/5 hover:bg-white/10'
              }
              ${isComposing ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
            `}
          >
            <span className="text-3xl">{mood.emoji}</span>
            <span className="text-sm text-[#FFF8DC]/80">{mood.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Loading state after mood selection */}
      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 text-center relative z-10"
          >
            <motion.div
              className="w-8 h-8 border-2 border-[#d4a44c]/30 border-t-[#d4a44c] rounded-full mx-auto mb-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-[#d4a44c]/60 text-sm">
              Composing your sacred practice...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Greeting after composition */}
      <AnimatePresence>
        {greeting && !isComposing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 max-w-lg text-center relative z-10"
          >
            <p className="text-lg text-[#FFF8DC]/80 font-light italic leading-relaxed">
              &ldquo;{greeting}&rdquo;
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
