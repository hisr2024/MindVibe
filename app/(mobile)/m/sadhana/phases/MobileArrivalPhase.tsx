'use client'

/**
 * MobileArrivalPhase — Orbital mood spheres for touch-native mood selection.
 * 6 mood spheres orbit around a central golden OM, each representing a
 * mood state with Sanskrit label and color palette.
 * Greeting is absolute-positioned so the orbital container centers in the
 * full viewport, not the remaining space after the greeting.
 */

import { useState, useRef, useMemo, useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import type { SadhanaMood } from '@/types/sadhana.types'

const SADHANA_MOODS = [
  { id: 'heavy' as SadhanaMood, sanskrit: 'भारग्रस्त', label: 'Heavy', description: 'Burdened, tired, silver-blue', color: '#93C5FD', glowColor: '#1D4ED8', glowStyle: '0 0 22px #1D4ED8B0', angle: -150 },
  { id: 'wounded' as SadhanaMood, sanskrit: 'आहत', label: 'Wounded', description: 'Hurting, grieving, crimson', color: '#FCA5A5', glowColor: '#B91C1C', glowStyle: '0 0 14px #B91C1C80', angle: -30 },
  { id: 'seeking' as SadhanaMood, sanskrit: 'जिज्ञासु', label: 'Seeking', description: 'Curious, searching, purple', color: '#C4B5FD', glowColor: '#7C3AED', glowStyle: '0 0 20px #7C3AEDA0', angle: 150 },
  { id: 'radiant' as SadhanaMood, sanskrit: 'तेजस्वी', label: 'Radiant', description: 'Joyful, bright, golden', color: '#F0C040', glowColor: '#FDE68A', glowStyle: '0 0 14px #FDE68A70', angle: 30 },
  { id: 'grateful' as SadhanaMood, sanskrit: 'कृतज्ञ', label: 'Grateful', description: 'Thankful, blessed, green', color: '#6EE7B7', glowColor: '#059669', glowStyle: '0 0 18px #05966990', angle: 90 },
  { id: 'peaceful' as SadhanaMood, sanskrit: 'शान्त', label: 'Peaceful', description: 'Calm, centered, sky blue', color: '#67E8F9', glowColor: '#06B6D4', glowStyle: '0 0 16px #06B6D480', angle: -90 },
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
  const tappedRef = useRef(false)
  const { triggerHaptic } = useHapticFeedback()
  const greeting = useMemo(() => getTimeGreeting(), [])
  const orbitRadius = useSyncExternalStore(
    (cb) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb) },
    () => Math.min(window.innerWidth * 0.30, 130),
    () => 120,
  )

  const handleMoodTap = useCallback((mood: SadhanaMood) => {
    if (tappedRef.current) return
    tappedRef.current = true
    triggerHaptic('medium')
    setSelectedMood(mood)
    onMoodSelect(mood)
  }, [triggerHaptic, onMoodSelect])

  const selectedMoodData = SADHANA_MOODS.find(m => m.id === selectedMood)

  return (
    <div className="relative min-h-[100dvh] px-4">
      {/* Greeting — absolute so it doesn't push the orbit down */}
      <motion.div
        className="absolute top-0 left-0 right-0 pt-10 text-center z-20 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <p
          className="font-[family-name:var(--font-divine)] text-xl text-[#D4A017] mb-1 tracking-wide"
          style={{ fontWeight: 300 }}
        >
          OM saha nāvavatu
        </p>
        <motion.div
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
      </motion.div>

      {/* Orbital container — centers in full viewport height */}
      <div className="min-h-[100dvh] flex items-center justify-center">
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
                  boxShadow: mood.glowStyle,
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
                aria-label={`Select mood: ${mood.label}`}
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
