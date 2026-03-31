'use client'

/**
 * MobileArrivalPhase — Orbital mood spheres for touch-native mood selection.
 * 6 mood spheres orbit around a central golden OM, each representing a
 * mood state with Sanskrit label and color palette.
 */

import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import type { SadhanaMood } from '@/types/sadhana.types'

const SADHANA_MOODS = [
  { id: 'heavy' as SadhanaMood, sanskrit: 'भारग्रस्त', label: 'Heavy', description: 'Burdened, tired, silver-blue', color: '#93C5FD', glowColor: '#1D4ED8', angle: -150 },
  { id: 'wounded' as SadhanaMood, sanskrit: 'आहत', label: 'Wounded', description: 'Hurting, grieving, crimson', color: '#FCA5A5', glowColor: '#B91C1C', angle: -30 },
  { id: 'seeking' as SadhanaMood, sanskrit: 'जिज्ञासु', label: 'Seeking', description: 'Curious, searching, purple', color: '#C4B5FD', glowColor: '#7C3AED', angle: 150 },
  { id: 'radiant' as SadhanaMood, sanskrit: 'तेजस्वी', label: 'Radiant', description: 'Joyful, bright, golden', color: '#F0C040', glowColor: '#FDE68A', angle: 30 },
  { id: 'grateful' as SadhanaMood, sanskrit: 'कृतज्ञ', label: 'Grateful', description: 'Thankful, blessed, green', color: '#6EE7B7', glowColor: '#059669', angle: 90 },
  { id: 'peaceful' as SadhanaMood, sanskrit: 'शान्त', label: 'Peaceful', description: 'Calm, centered, sky blue', color: '#67E8F9', glowColor: '#06B6D4', angle: -90 },
] as const

interface MobileArrivalPhaseProps {
  onMoodSelect: (mood: SadhanaMood) => void
}

function getTimeGreeting(): { sanskrit: string; english: string } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return { sanskrit: 'प्रभात नमस्कार', english: 'Good Morning, dear seeker' }
  if (hour >= 11 && hour < 17) return { sanskrit: 'दोपहर आशीर्वाद', english: 'Sacred afternoon greetings' }
  if (hour >= 17 && hour < 21) return { sanskrit: 'सांध्य प्रणाम', english: 'Evening blessings upon you' }
  return { sanskrit: 'रात्रि साधना', english: 'The sacred night begins' }
}

export function MobileArrivalPhase({ onMoodSelect }: MobileArrivalPhaseProps) {
  const [selectedMood, setSelectedMood] = useState<SadhanaMood | null>(null)
  const { triggerHaptic } = useHapticFeedback()
  const greeting = useMemo(() => getTimeGreeting(), [])
  const orbitRadius = useSyncExternalStore(
    (cb) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb) },
    () => Math.min(window.innerWidth * 0.30, 130),
    () => 120,
  )

  const handleMoodTap = useCallback((mood: SadhanaMood) => {
    if (selectedMood) return
    triggerHaptic('medium')
    setSelectedMood(mood)
    onMoodSelect(mood)
  }, [selectedMood, triggerHaptic, onMoodSelect])

  const selectedMoodData = SADHANA_MOODS.find(m => m.id === selectedMood)

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Sanskrit invocation */}
      <motion.p
        className="font-[family-name:var(--font-divine)] text-xl text-[#D4A017] text-center mb-1 tracking-wide"
        style={{ fontWeight: 300 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        OM saha nāvavatu
      </motion.p>

      {/* Time greeting */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <p className="font-[family-name:var(--font-divine)] italic text-sm text-[#B8AE98]">
          {greeting.sanskrit}
        </p>
        <p className="font-[family-name:var(--font-divine)] italic text-xs text-[#6B6355] mt-0.5">
          {greeting.english}
        </p>
      </motion.div>

      {/* Orbital container */}
      <div className="relative" style={{ width: orbitRadius * 2 + 80, height: orbitRadius * 2 + 80 }}>
        {/* Central OM */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          animate={{
            textShadow: [
              '0 0 8px rgba(212,160,23,0.4)',
              '0 0 16px rgba(212,160,23,0.7)',
              '0 0 8px rgba(212,160,23,0.4)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-5xl font-[family-name:var(--font-divine)] text-[#D4A017] select-none">
            ॐ
          </span>
        </motion.div>

        {/* Mood spheres orbiting */}
        {SADHANA_MOODS.map((mood, i) => {
          const isSelected = selectedMood === mood.id
          const isDimmed = selectedMood && !isSelected

          return (
            <motion.button
              key={mood.id}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-full border border-white/20 z-20"
              style={{
                width: 68,
                height: 68,
                background: `radial-gradient(circle, ${mood.color}, ${mood.glowColor})`,
                boxShadow: `0 0 16px ${mood.glowColor}80`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: isDimmed ? 0.4 : 1,
                scale: isSelected ? 1.3 : 1,
                x: Math.cos(((mood.angle) * Math.PI) / 180) * orbitRadius,
                y: Math.sin(((mood.angle) * Math.PI) / 180) * orbitRadius,
              }}
              transition={{
                opacity: { duration: 0.3 },
                scale: { type: 'spring', stiffness: 300, damping: 20 },
                x: { duration: 0.6, delay: i * 0.1 },
                y: { duration: 0.6, delay: i * 0.1 },
              }}
              onClick={() => handleMoodTap(mood.id)}
              disabled={!!selectedMood}
            >
              <span className="font-[family-name:var(--font-divine)] italic text-[11px] text-white leading-tight">
                {mood.sanskrit}
              </span>
              <span className="font-[family-name:var(--font-ui)] text-[9px] text-white/70 mt-0.5">
                {mood.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Selection greeting overlay */}
      <AnimatePresence>
        {selectedMoodData && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#050714]/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              className="font-[family-name:var(--font-divine)] text-5xl mb-3"
              style={{ color: selectedMoodData.color, fontWeight: 300 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {selectedMoodData.sanskrit}
            </motion.p>
            <motion.p
              className="font-[family-name:var(--font-ui)] text-base text-[#B8AE98]"
              style={{ fontWeight: 300 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {selectedMoodData.label}
            </motion.p>
            <motion.p
              className="font-[family-name:var(--font-ui)] text-[11px] text-[#6B6355] mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Composing your sacred practice...
            </motion.p>
            {/* OM loader */}
            <motion.span
              className="text-lg text-[#D4A017] mt-2"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ॐ
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
