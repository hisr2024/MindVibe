'use client'

/**
 * MobileArrivalPhase — Orbital mood spheres for touch-native mood selection.
 * 6 mood spheres orbit around a central golden OM, each representing a
 * mood state with Sanskrit label and color palette.
 *
 * Layout: 3-zone flex column (header → question → orbital arena).
 * OM and spheres are positioned absolutely within a ResizeObserver-measured
 * arena so the OM is always at the exact geometric center.
 */

import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import type { SadhanaMood } from '@/types/sadhana.types'

const SPHERE_SIZE = 68
const OM_SIZE = 80

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

  // Measure the orbital arena for exact OM/sphere centering
  const arenaRef = useRef<HTMLDivElement>(null)
  const [arenaSize, setArenaSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = arenaRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setArenaSize({ width, height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Orbit radius derived from measured arena
  const orbitRadius = Math.min(arenaSize.width, arenaSize.height) * 0.38

  const handleMoodTap = useCallback((mood: SadhanaMood) => {
    if (tappedRef.current) return
    tappedRef.current = true
    triggerHaptic('medium')
    setSelectedMood(mood)
    onMoodSelect(mood)
  }, [triggerHaptic, onMoodSelect])

  const selectedMoodData = SADHANA_MOODS.find(m => m.id === selectedMood)

  // OM position — exact geometric center of the arena
  const omLeft = arenaSize.width / 2 - OM_SIZE / 2
  const omTop = arenaSize.height / 2 - OM_SIZE / 2

  // Sphere position calculator
  const getSpherePosition = (angleDeg: number) => {
    const cx = arenaSize.width / 2
    const cy = arenaSize.height / 2
    const rad = (angleDeg * Math.PI) / 180
    return {
      left: cx + orbitRadius * Math.cos(rad) - SPHERE_SIZE / 2,
      top: cy + orbitRadius * Math.sin(rad) - SPHERE_SIZE / 2,
    }
  }

  const arenaReady = arenaSize.width > 0

  return (
    <div
      className="relative w-full flex flex-col items-center overflow-hidden"
      style={{
        minHeight: '100dvh',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
      }}
    >
      {/* ── ZONE A: HEADER ──────────────────────────────────────────── */}
      <motion.div
        className="shrink-0 text-center px-6 mb-4"
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

      {/* ── ZONE B: "HOW DO YOU FEEL?" ──────────────────────────────── */}
      <motion.div
        className="shrink-0 text-center px-6 mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p
          className="font-[family-name:var(--font-divine)] italic text-[22px] text-[#EDE8DC] mb-1.5"
          style={{ fontWeight: 400, letterSpacing: '0.02em', lineHeight: 1.3 }}
        >
          How do you feel today?
        </p>
        <p
          className="font-[family-name:var(--font-ui)] text-[11px] text-[#6B6355]"
          style={{ letterSpacing: '0.06em' }}
        >
          Touch the sphere that speaks to you
        </p>
      </motion.div>

      {/* ── ZONE C: ORBITAL ARENA ────────────────────────────────────── */}
      <div
        ref={arenaRef}
        className="flex-1 w-full relative"
      >
        {arenaReady && (
          <>
            {/* Central OM — exact center via measured arena dimensions */}
            <motion.div
              className="absolute z-10 flex items-center justify-center rounded-full"
              style={{
                left: omLeft,
                top: omTop,
                width: OM_SIZE,
                height: OM_SIZE,
                background: 'radial-gradient(circle at 40% 35%, rgba(240,192,64,0.2), rgba(5,7,20,0.85))',
                border: '1.5px solid rgba(212,160,23,0.45)',
              }}
              animate={{
                boxShadow: [
                  '0 0 14px rgba(212,160,23,0.3), 0 0 28px rgba(212,160,23,0.1)',
                  '0 0 28px rgba(212,160,23,0.55), 0 0 56px rgba(212,160,23,0.2)',
                  '0 0 14px rgba(212,160,23,0.3), 0 0 28px rgba(212,160,23,0.1)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.span
                className="font-[family-name:var(--font-divine)] text-[#D4A017] select-none"
                style={{ fontSize: 36, fontWeight: 300, lineHeight: 1 }}
                animate={{
                  textShadow: [
                    '0 0 8px rgba(212,160,23,0.4)',
                    '0 0 16px rgba(212,160,23,0.7)',
                    '0 0 8px rgba(212,160,23,0.4)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                ॐ
              </motion.span>
            </motion.div>

            {/* Mood spheres — positioned absolutely within the arena */}
            {SADHANA_MOODS.map((mood, i) => {
              const isSelected = selectedMood === mood.id
              const isDimmed = selectedMood && !isSelected
              const pos = getSpherePosition(mood.angle)

              return (
                <motion.button
                  key={mood.id}
                  className="absolute flex flex-col items-center justify-center rounded-full border border-white/20 z-20"
                  style={{
                    width: SPHERE_SIZE,
                    height: SPHERE_SIZE,
                    left: pos.left,
                    top: pos.top,
                    background: `radial-gradient(circle at 35% 35%, ${mood.color}, ${mood.glowColor}80)`,
                    boxShadow: mood.glowStyle,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: isDimmed ? 0.4 : 1,
                    scale: isSelected ? 1.3 : 1,
                  }}
                  transition={{
                    opacity: { duration: 0.3 },
                    scale: { type: 'spring', stiffness: 300, damping: 20 },
                    default: { duration: 0.6, delay: i * 0.1 },
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
          </>
        )}
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
