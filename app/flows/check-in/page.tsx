'use client'

/**
 * Sacred Soul Check-In — An immersive divine transformation experience.
 *
 * Multi-phase flow that takes the soul through a spiritual journey:
 *   Phase 1 (Gateway): Sacred entrance with mandala and ambient particles
 *   Phase 2 (Heart):   Emotion selection via sacred orbs
 *   Phase 3 (Body):    Chakra-based body awareness
 *   Phase 4 (Reflect): Sacred reflection space for writing
 *   Phase 5 (Blessing): KIAAN divine friend response + transformation seal
 *
 * Each phase transitions with sacred animations. The atmosphere deepens
 * as the user progresses, creating a feeling of entering a divine realm.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBlessing, moodToContext } from '@/lib/blessings'
import { useEmotionTheme } from '@/hooks/useEmotionTheme'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import Link from 'next/link'

type Phase = 'gateway' | 'heart' | 'body' | 'reflect' | 'blessing'

/** Sacred emotion states — each represents a soul-level feeling */
const SOUL_STATES = [
  {
    id: 'radiant',
    label: 'Radiant',
    score: 9,
    icon: '\u2728',
    gradient: 'from-amber-400 to-yellow-300',
    ring: 'ring-amber-400/50',
    bgGlow: 'rgba(251, 191, 36, 0.12)',
    description: 'Light fills my being',
    moodKey: 'Excellent',
  },
  {
    id: 'peaceful',
    label: 'At Peace',
    score: 8,
    icon: '\u{1F54A}\uFE0F',
    gradient: 'from-emerald-400 to-teal-300',
    ring: 'ring-emerald-400/50',
    bgGlow: 'rgba(52, 211, 153, 0.12)',
    description: 'Stillness within',
    moodKey: 'Good',
  },
  {
    id: 'grateful',
    label: 'Grateful',
    score: 7,
    icon: '\u{1F64F}',
    gradient: 'from-orange-400 to-amber-300',
    ring: 'ring-orange-400/50',
    bgGlow: 'rgba(251, 146, 60, 0.12)',
    description: 'My heart overflows',
    moodKey: 'Good',
  },
  {
    id: 'seeking',
    label: 'Seeking',
    score: 5,
    icon: '\u{1F52E}',
    gradient: 'from-violet-400 to-purple-300',
    ring: 'ring-violet-400/50',
    bgGlow: 'rgba(167, 139, 250, 0.12)',
    description: 'Searching for answers',
    moodKey: 'Neutral',
  },
  {
    id: 'heavy',
    label: 'Heavy',
    score: 3,
    icon: '\u{1F327}\uFE0F',
    gradient: 'from-slate-400 to-blue-300',
    ring: 'ring-slate-400/50',
    bgGlow: 'rgba(148, 163, 184, 0.12)',
    description: 'Weight on my soul',
    moodKey: 'Low',
  },
  {
    id: 'wounded',
    label: 'Wounded',
    score: 1,
    icon: '\u{1F494}',
    gradient: 'from-rose-400 to-pink-300',
    ring: 'ring-rose-400/50',
    bgGlow: 'rgba(251, 113, 133, 0.12)',
    description: 'My heart aches',
    moodKey: 'Very Low',
  },
] as const

/** Chakra energy centres for body awareness */
const CHAKRA_POINTS = [
  { id: 'crown', label: 'Crown', y: 8, color: '#a78bfa', hint: 'Overthinking, racing thoughts' },
  { id: 'third-eye', label: 'Third Eye', y: 16, color: '#818cf8', hint: 'Confusion, lack of clarity' },
  { id: 'throat', label: 'Throat', y: 28, color: '#60a5fa', hint: 'Words left unspoken' },
  { id: 'heart', label: 'Heart', y: 40, color: '#34d399', hint: 'Love, grief, longing' },
  { id: 'solar', label: 'Solar Plexus', y: 52, color: '#fbbf24', hint: 'Anxiety, self-doubt' },
  { id: 'sacral', label: 'Sacral', y: 63, color: '#fb923c', hint: 'Shame, blocked creativity' },
  { id: 'root', label: 'Root', y: 75, color: '#f87171', hint: 'Fear, feeling unsafe' },
] as const

/** Floating sacred particles for ambient atmosphere */
const SACRED_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 5.3) % 90}%`,
  delay: i * 0.6,
  duration: 5 + (i % 4) * 2,
  size: i % 4 === 0 ? 3 : 2,
}))

/** Phase-level fade transition shared by all phases */
const phaseTransition = {
  initial: { opacity: 0, y: 30, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.97 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

export default function SacredCheckIn() {
  const [phase, setPhase] = useState<Phase>('gateway')
  const [selectedEmotion, setSelectedEmotion] = useState<typeof SOUL_STATES[number] | null>(null)
  const [selectedChakras, setSelectedChakras] = useState<string[]>([])
  const [reflection, setReflection] = useState('')
  const { updateFromMood } = useEmotionTheme()
  const { triggerHaptic } = useHapticFeedback()
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up any pending phase timers on unmount
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    }
  }, [])

  // Gateway auto-advances after a brief sacred pause
  useEffect(() => {
    if (phase === 'gateway') {
      phaseTimerRef.current = setTimeout(() => setPhase('heart'), 3800)
      return () => {
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
      }
    }
  }, [phase])

  const handleEmotionSelect = useCallback(
    (emotion: typeof SOUL_STATES[number]) => {
      setSelectedEmotion(emotion)
      triggerHaptic('medium')
      updateFromMood({ score: emotion.score })
      // Brief pause to let the selection animate, then advance
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
      phaseTimerRef.current = setTimeout(() => setPhase('body'), 900)
    },
    [triggerHaptic, updateFromMood],
  )

  const handleChakraToggle = useCallback(
    (id: string) => {
      triggerHaptic('light')
      setSelectedChakras((prev) =>
        prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
      )
    },
    [triggerHaptic],
  )

  const handleReflectionNext = useCallback(() => {
    triggerHaptic('medium')
    setPhase('blessing')
  }, [triggerHaptic])

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-violet-950/20 to-slate-950 px-4 pb-28 sm:pb-16">
      {/* ─── Ambient sacred particles (always visible) ─── */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        {SACRED_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-violet-300/40"
            style={{ width: p.size, height: p.size, left: p.left, bottom: 0 }}
            animate={{ y: [0, -600], opacity: [0, 0.7, 0.5, 0] }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* ─── Sacred geometry background ring (always visible) ─── */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center" aria-hidden="true">
        <motion.div
          className="h-[500px] w-[500px] rounded-full border border-violet-500/[0.06]"
          animate={{ rotate: 360, scale: [1, 1.04, 1] }}
          transition={{ rotate: { duration: 60, repeat: Infinity, ease: 'linear' }, scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }}
        />
        <motion.div
          className="absolute h-[360px] w-[360px] rounded-full border border-violet-400/[0.05]"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute h-[220px] w-[220px] rounded-full border border-violet-300/[0.04]"
          animate={{ rotate: 360, scale: [1, 1.06, 1] }}
          transition={{ rotate: { duration: 30, repeat: Infinity, ease: 'linear' }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-lg pt-8 sm:pt-14">
        <AnimatePresence mode="wait">
          {/* ═══════════════ PHASE 1: SACRED GATEWAY ═══════════════ */}
          {phase === 'gateway' && (
            <motion.div
              key="gateway"
              {...phaseTransition}
              className="flex flex-col items-center justify-center pt-16 sm:pt-24 text-center"
            >
              {/* Blooming mandala */}
              <motion.div
                className="relative mb-10"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.svg
                  viewBox="0 0 120 120"
                  className="h-32 w-32 sm:h-40 sm:w-40"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.ellipse
                      key={i}
                      cx="60"
                      cy="60"
                      rx="6"
                      ry="26"
                      fill="none"
                      stroke="rgba(196, 181, 253, 0.25)"
                      strokeWidth="0.8"
                      transform={`rotate(${i * 30} 60 60)`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                    />
                  ))}
                  <motion.text
                    x="60"
                    y="66"
                    textAnchor="middle"
                    className="fill-violet-200/90"
                    fontSize="22"
                    fontFamily="serif"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    {'\u0950'}
                  </motion.text>
                </motion.svg>

                {/* Outer glow halo */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 50px 10px rgba(139, 92, 246, 0.1)',
                      '0 0 80px 20px rgba(139, 92, 246, 0.25)',
                      '0 0 50px 10px rgba(139, 92, 246, 0.1)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>

              <motion.h1
                className="font-sacred text-2xl sm:text-3xl text-violet-100/90 mb-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                Welcome to your inner sanctuary
              </motion.h1>
              <motion.p
                className="text-sm text-violet-300/60 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                Your divine friend awaits...
              </motion.p>

              <motion.button
                onClick={() => setPhase('heart')}
                className="text-xs text-violet-400/50 hover:text-violet-300/70 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.4 }}
              >
                Tap to enter
              </motion.button>
            </motion.div>
          )}

          {/* ═══════════════ PHASE 2: HEART'S VOICE ═══════════════ */}
          {phase === 'heart' && (
            <motion.div key="heart" {...phaseTransition} className="space-y-8 pt-4">
              {/* Phase indicator */}
              <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={1} aria-valuemin={1} aria-valuemax={4} aria-label="Step 1 of 4: Heart">
                <span className="sr-only">Step 1 of 4</span>
                {(['heart', 'body', 'reflect', 'blessing'] as Phase[]).map((p, i) => (
                  <motion.div
                    key={p}
                    className={`h-1.5 rounded-full transition-colors duration-500 ${
                      p === phase ? 'w-8 bg-violet-400' : 'w-1.5 bg-violet-800/50'
                    }`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    aria-hidden="true"
                  />
                ))}
              </div>

              <div className="text-center space-y-2">
                <motion.h2
                  className="font-sacred text-xl sm:text-2xl text-violet-100/90"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Dear soul, how does your heart feel?
                </motion.h2>
                <motion.p
                  className="text-sm text-violet-300/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Touch the feeling closest to your truth
                </motion.p>
              </div>

              {/* Sacred emotion orbs — 2-column grid */}
              <motion.div
                className="grid grid-cols-2 gap-3 sm:gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
                }}
              >
                {SOUL_STATES.map((emotion) => {
                  const isSelected = selectedEmotion?.id === emotion.id
                  return (
                    <motion.button
                      key={emotion.id}
                      variants={{
                        hidden: { opacity: 0, y: 20, scale: 0.9 },
                        visible: { opacity: 1, y: 0, scale: 1 },
                      }}
                      onClick={() => handleEmotionSelect(emotion)}
                      className={`relative flex flex-col items-center gap-2 rounded-[20px] border p-5 sm:p-6 transition-all duration-500 ${
                        isSelected
                          ? `border-white/20 ring-2 ${emotion.ring} bg-white/[0.08] shadow-lg`
                          : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.1]'
                      }`}
                      style={isSelected ? { boxShadow: `0 0 40px ${emotion.bgGlow}` } : undefined}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Emotion icon orb */}
                      <motion.span
                        className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${emotion.gradient} shadow-lg`}
                        animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}
                      >
                        <span className="text-2xl">{emotion.icon}</span>
                      </motion.span>

                      <span className="text-sm font-semibold text-white/85">{emotion.label}</span>
                      <span className="text-[11px] text-white/40 leading-tight">{emotion.description}</span>

                      {/* Selection glow ring */}
                      {isSelected && (
                        <motion.span
                          className="absolute inset-0 rounded-[20px] pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                            boxShadow: [
                              `inset 0 0 20px ${emotion.bgGlow}`,
                              `inset 0 0 40px ${emotion.bgGlow}`,
                              `inset 0 0 20px ${emotion.bgGlow}`,
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </motion.div>
            </motion.div>
          )}

          {/* ═══════════════ PHASE 3: BODY TEMPLE ═══════════════ */}
          {phase === 'body' && (
            <motion.div key="body" {...phaseTransition} className="space-y-6 pt-4">
              {/* Phase indicator */}
              <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={2} aria-valuemin={1} aria-valuemax={4} aria-label="Step 2 of 4: Body">
                <span className="sr-only">Step 2 of 4</span>
                {(['heart', 'body', 'reflect', 'blessing'] as Phase[]).map((p) => (
                  <div
                    key={p}
                    className={`h-1.5 rounded-full transition-colors duration-500 ${
                      p === 'heart' ? 'w-1.5 bg-violet-400/60'
                        : p === phase ? 'w-8 bg-violet-400'
                        : 'w-1.5 bg-violet-800/50'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>

              <div className="text-center space-y-2">
                <motion.h2
                  className="font-sacred text-xl sm:text-2xl text-violet-100/90"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Where does your spirit feel it?
                </motion.h2>
                <motion.p
                  className="text-sm text-violet-300/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Touch the energy centres that call to you
                </motion.p>
              </div>

              {/* Chakra body map */}
              <motion.div
                className="relative mx-auto w-full max-w-xs rounded-[24px] border border-violet-500/10 bg-gradient-to-b from-violet-950/40 via-indigo-950/30 to-slate-950/40 px-4 py-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Subtle body silhouette line */}
                <div className="absolute left-1/2 top-[10%] bottom-[20%] w-px bg-gradient-to-b from-violet-500/10 via-violet-400/20 to-violet-500/10 -translate-x-1/2" />

                <div className="space-y-1">
                  {CHAKRA_POINTS.map((chakra, i) => {
                    const isActive = selectedChakras.includes(chakra.id)
                    return (
                      <motion.button
                        key={chakra.id}
                        onClick={() => handleChakraToggle(chakra.id)}
                        className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-400 ${
                          isActive
                            ? 'bg-white/[0.06] shadow-lg'
                            : 'hover:bg-white/[0.03]'
                        }`}
                        initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {/* Chakra dot */}
                        <motion.span
                          className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: isActive ? chakra.color : `${chakra.color}33` }}
                          animate={isActive ? {
                            boxShadow: [
                              `0 0 8px ${chakra.color}40`,
                              `0 0 20px ${chakra.color}60`,
                              `0 0 8px ${chakra.color}40`,
                            ],
                            scale: [1, 1.1, 1],
                          } : {}}
                          transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: isActive ? '#fff' : chakra.color }}
                          />
                        </motion.span>

                        <span className="flex-1 text-left min-w-0">
                          <span className={`block text-sm font-medium transition-colors ${isActive ? 'text-white/90' : 'text-white/60'}`}>
                            {chakra.label}
                          </span>
                          <span className={`block text-[11px] leading-tight transition-colors ${isActive ? 'text-white/50' : 'text-white/30'}`}>
                            {chakra.hint}
                          </span>
                        </span>

                        {isActive && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex-shrink-0 h-5 w-5 rounded-full bg-white/10 flex items-center justify-center"
                          >
                            <svg className="h-3 w-3 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>

              {/* Continue button */}
              <motion.button
                onClick={() => { triggerHaptic('light'); setPhase('reflect') }}
                className="mx-auto flex items-center gap-2 rounded-full bg-violet-500/15 px-6 py-3 text-sm font-medium text-violet-200 border border-violet-500/20 hover:bg-violet-500/25 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileTap={{ scale: 0.96 }}
              >
                Continue your journey
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.button>
            </motion.div>
          )}

          {/* ═══════════════ PHASE 4: SACRED REFLECTION ═══════════════ */}
          {phase === 'reflect' && (
            <motion.div key="reflect" {...phaseTransition} className="space-y-6 pt-4">
              {/* Phase indicator */}
              <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={3} aria-valuemin={1} aria-valuemax={4} aria-label="Step 3 of 4: Reflect">
                <span className="sr-only">Step 3 of 4</span>
                {(['heart', 'body', 'reflect', 'blessing'] as Phase[]).map((p) => (
                  <div
                    key={p}
                    className={`h-1.5 rounded-full transition-colors duration-500 ${
                      p === 'heart' || p === 'body' ? 'w-1.5 bg-violet-400/60'
                        : p === phase ? 'w-8 bg-violet-400'
                        : 'w-1.5 bg-violet-800/50'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>

              <div className="text-center space-y-2">
                <motion.h2
                  className="font-sacred text-xl sm:text-2xl text-violet-100/90"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Unburden your soul, dear one
                </motion.h2>
                <motion.p
                  className="text-sm text-violet-300/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  These words are sacred and safe. Only you can see them.
                </motion.p>
              </div>

              {/* Selected emotion reminder */}
              {selectedEmotion && (
                <motion.div
                  className="flex items-center justify-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 mx-auto w-fit"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-lg">{selectedEmotion.icon}</span>
                  <span className="text-xs text-white/50">
                    Feeling <span className="text-white/70 font-medium">{selectedEmotion.label}</span>
                  </span>
                  {selectedChakras.length > 0 && (
                    <span className="text-xs text-white/40">
                      &middot; {selectedChakras.length} chakra{selectedChakras.length > 1 ? 's' : ''} touched
                    </span>
                  )}
                </motion.div>
              )}

              {/* Sacred writing space */}
              <motion.div
                className="relative rounded-[20px] border border-violet-500/15 bg-gradient-to-b from-violet-950/30 to-indigo-950/20 p-1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Inner glow border */}
                <motion.div
                  className="absolute inset-0 rounded-[20px] pointer-events-none"
                  animate={{
                    boxShadow: [
                      'inset 0 0 30px rgba(139, 92, 246, 0.05)',
                      'inset 0 0 50px rgba(139, 92, 246, 0.1)',
                      'inset 0 0 30px rgba(139, 92, 246, 0.05)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="What weighs on your heart today? What would you share with a trusted divine friend?..."
                  aria-label="Your sacred reflection"
                  className="relative w-full rounded-[18px] bg-transparent px-5 py-5 text-sm text-violet-100/80 placeholder:text-violet-400/30 outline-none resize-none font-sacred leading-relaxed"
                  rows={6}
                />
              </motion.div>

              {/* Context whispers */}
              <motion.div
                className="flex flex-wrap justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {['What triggered this?', 'What am I holding onto?', 'What do I need right now?'].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setReflection((prev) => prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`)}
                    className="rounded-full border border-violet-500/15 bg-violet-500/5 px-3 py-1.5 text-[11px] text-violet-300/50 hover:text-violet-200/70 hover:border-violet-500/25 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </motion.div>

              {/* Receive blessing button */}
              <motion.button
                onClick={handleReflectionNext}
                className="mx-auto flex items-center gap-3 rounded-full bg-gradient-to-r from-violet-600/30 to-indigo-600/30 px-8 py-3.5 text-sm font-semibold text-white/90 border border-violet-400/20 hover:border-violet-400/40 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
              >
                <span>Receive Your Divine Blessing</span>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {'\u2728'}
                </motion.span>
              </motion.button>

              {/* Skip option */}
              <motion.button
                onClick={handleReflectionNext}
                className="block mx-auto text-[11px] text-violet-500/40 hover:text-violet-400/60 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Skip reflection
              </motion.button>
            </motion.div>
          )}

          {/* ═══════════════ PHASE 5: DIVINE BLESSING ═══════════════ */}
          {phase === 'blessing' && (
            <motion.div key="blessing" {...phaseTransition} className="space-y-8 pt-6 sm:pt-10">
              {/* Phase indicator — all complete */}
              <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={4} aria-valuemin={1} aria-valuemax={4} aria-label="Step 4 of 4: Blessing">
                <span className="sr-only">Step 4 of 4</span>
                {(['heart', 'body', 'reflect', 'blessing'] as Phase[]).map((p) => (
                  <div
                    key={p}
                    className={`h-1.5 rounded-full ${
                      p === phase ? 'w-8 bg-amber-400' : 'w-1.5 bg-violet-400/60'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* KIAAN divine friend response */}
              <motion.div
                className="relative rounded-[24px] border border-amber-500/15 bg-gradient-to-b from-amber-950/30 via-orange-950/20 to-violet-950/20 p-6 sm:p-8 overflow-hidden"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Background sacred glow */}
                <motion.div
                  className="absolute inset-0 rounded-[24px] pointer-events-none"
                  animate={{
                    boxShadow: [
                      'inset 0 0 60px rgba(251, 191, 36, 0.04), 0 0 40px rgba(139, 92, 246, 0.08)',
                      'inset 0 0 80px rgba(251, 191, 36, 0.08), 0 0 60px rgba(139, 92, 246, 0.12)',
                      'inset 0 0 60px rgba(251, 191, 36, 0.04), 0 0 40px rgba(139, 92, 246, 0.08)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                {/* KIAAN avatar */}
                <div className="relative flex items-start gap-4">
                  <motion.div
                    className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg"
                    animate={{
                      boxShadow: [
                        '0 0 15px rgba(251, 191, 36, 0.3)',
                        '0 0 30px rgba(251, 191, 36, 0.5)',
                        '0 0 15px rgba(251, 191, 36, 0.3)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-lg font-bold text-slate-900">K</span>
                  </motion.div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-amber-200">KIAAN</span>
                      <span className="text-[10px] text-amber-400/50 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        Your Divine Friend
                      </span>
                    </div>

                    {/* Blessing text */}
                    <motion.p
                      className="font-sacred text-base sm:text-lg text-amber-100/85 leading-relaxed italic"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                    >
                      {selectedEmotion
                        ? getBlessing(moodToContext(selectedEmotion.moodKey))
                        : getBlessing('mood-default')}
                    </motion.p>

                    {/* Personalized acknowledgement */}
                    <motion.p
                      className="text-sm text-amber-200/50 leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4, duration: 0.6 }}
                    >
                      {selectedEmotion != null && selectedEmotion.score >= 7
                        ? 'Your light is beautiful. Carry it forward and let it touch others today.'
                        : selectedEmotion != null && selectedEmotion.score <= 3
                          ? 'I see your pain, dear soul. You are held. This darkness is not your destination — it is the passage to deeper wisdom.'
                          : 'You are exactly where you need to be. Trust the unfolding.'}
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              {/* Transformation seal */}
              <motion.div
                className="text-center space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.6 }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/15 px-4 py-2"
                  animate={{ boxShadow: ['0 0 20px rgba(139, 92, 246, 0.05)', '0 0 30px rgba(139, 92, 246, 0.12)', '0 0 20px rgba(139, 92, 246, 0.05)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {'\u{1F54A}\uFE0F'}
                  </motion.span>
                  <span className="text-xs font-medium text-violet-300/70">
                    Your soul check-in has been sealed in light
                  </span>
                </motion.div>
              </motion.div>

              {/* Action paths forward */}
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, duration: 0.6 }}
              >
                <p className="text-center text-xs text-violet-400/40 mb-4">
                  Continue your sacred journey
                </p>

                <Link
                  href="/companion"
                  className="flex items-center gap-4 rounded-[20px] border border-violet-500/15 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-4 hover:border-violet-500/25 transition-all group"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
                    <span className="text-white text-sm font-bold">K</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-violet-100 group-hover:text-white transition-colors">
                      Talk to KIAAN
                    </span>
                    <p className="text-[11px] text-violet-300/50 mt-0.5">
                      Share more with your divine friend
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-violet-400/40 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/flows/journal"
                  className="flex items-center gap-4 rounded-[20px] border border-violet-500/10 bg-white/[0.02] p-4 hover:border-violet-500/15 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                    <span className="text-lg">{'\u{1F4DD}'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">
                      Write in Sacred Reflections
                    </span>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      Deepen your reflection in your journal
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-white/20 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 rounded-full bg-white/[0.03] py-3 text-xs text-violet-400/50 hover:text-violet-300/70 hover:bg-white/[0.05] transition-all mt-4"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                  </svg>
                  Return to Sacred Sanctuary
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
