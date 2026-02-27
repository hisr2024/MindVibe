'use client'

import { FadeIn } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useCallback, useState, useEffect } from 'react'
import { PathwayMap } from '@/components/navigation/PathwayMap'
import { SubscriptionBanner } from '@/components/subscription'

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 25,
    },
  },
}

// Quick action card variants
const quickActionVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.96,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 25,
    },
  },
}

// Quick access links for the dashboard
const QUICK_ACCESS = [
  {
    id: 'profile',
    icon: '\u{2699}\uFE0F',
    title: 'Profile & Settings',
    href: '/profile',
  },
  {
    id: 'subscription',
    icon: '\u{1F4B3}',
    title: 'Subscription',
    href: '/subscription/success',
  },
  {
    id: 'about',
    icon: '\u{2139}\uFE0F',
    title: 'About MindVibe',
    href: '/about',
  },
  {
    id: 'sacred-reflections',
    icon: '\u{1F64F}',
    title: 'Sacred Reflections',
    href: '/sacred-reflections#spiritual',
  },
] as const

// Featured Sacred Tools — the three divine instruments on the dashboard
const SACRED_TOOLS = [
  {
    id: 'viyoga',
    title: 'Viyoga',
    sanskrit: '\u0935\u093F\u092F\u094B\u0917',
    subtitle: 'The Detachment Tool',
    verse: 'BG 2.47',
    href: '/tools/viyog',
    gradient: 'from-cyan-900/40 via-blue-950/30 to-indigo-950/40',
    glowColor: 'rgba(6, 182, 212, 0.2)',
    accentColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/20',
    iconBg: 'from-cyan-400/20 to-blue-500/20',
  },
  {
    id: 'ardha',
    title: 'Ardha',
    sanskrit: '\u0905\u0930\u094D\u0927',
    subtitle: 'The Reframing Tool',
    verse: 'BG 2.16',
    href: '/tools/ardha',
    gradient: 'from-violet-900/40 via-purple-950/30 to-indigo-950/40',
    glowColor: 'rgba(139, 92, 246, 0.2)',
    accentColor: 'text-violet-300',
    borderColor: 'border-violet-500/20',
    iconBg: 'from-violet-400/20 to-purple-500/20',
  },
  {
    id: 'relationship-compass',
    title: 'Compass',
    sanskrit: '\u0938\u0902\u092C\u0928\u094D\u0927',
    subtitle: 'The Relationship Guide',
    verse: 'BG 6.32',
    href: '/tools/relationship-compass',
    gradient: 'from-rose-900/40 via-pink-950/30 to-amber-950/40',
    glowColor: 'rgba(244, 63, 94, 0.15)',
    accentColor: 'text-rose-300',
    borderColor: 'border-rose-500/20',
    iconBg: 'from-rose-400/20 to-amber-500/20',
  },
] as const

// Other tools — compact grid below the featured tools
const OTHER_TOOLS = [
  {
    id: 'emotional-reset',
    icon: '\u{1F4AB}',
    title: 'Emotional Reset',
    subtitle: 'Guided healing',
    href: '/emotional-reset',
  },
  {
    id: 'karma-reset',
    icon: '\u{1F49A}',
    title: 'Karma Reset',
    subtitle: 'Heal with grace',
    href: '/tools/karma-reset',
  },
  {
    id: 'sacred-reflections',
    icon: '\u{1F4DD}',
    title: 'Sacred Reflections',
    subtitle: 'Private journal',
    href: '/flows/journal',
  },
  {
    id: 'karmic-tree',
    icon: '\u{1F331}',
    title: 'Karmic Tree',
    subtitle: 'Your growth',
    href: '/karmic-tree',
  },
  {
    id: 'kiaan-vibe',
    icon: '\u{1F3B5}',
    title: 'Vibe Player',
    subtitle: 'Sacred sounds',
    href: '/kiaan-vibe',
  },
  {
    id: 'wisdom-rooms',
    icon: '\u{1F30D}',
    title: 'Wisdom Rooms',
    subtitle: 'Community chats',
    href: '/wisdom-rooms',
  },
] as const

// Sacred questions that cycle gently in the Chakra Heartbeat hero — dedicated to feelings
const SACRED_QUESTIONS = [
  'How does your heart feel right now?',
  'What emotions are alive in you today?',
  'Where do you feel tension or peace?',
  'What is your soul carrying right now?',
] as const

// Floating prayer-star particles configuration
const PRAYER_STARS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 7.5) % 85}%`,
  delay: i * 0.7,
  duration: 4 + (i % 3) * 1.5,
  size: i % 3 === 0 ? 3 : 2,
}))

// Divine Presence particles for the My Profile banner
const DIVINE_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${10 + (i * 11) % 80}%`,
  delay: i * 0.5,
  duration: 3 + (i % 2) * 1.5,
  size: i % 2 === 0 ? 2.5 : 2,
}))

/**
 * Returns a time-of-day greeting for the sacred sanctuary dashboard.
 *
 * Morning (5-12): gentle awakening
 * Afternoon (12-17): warm presence
 * Evening (17-21): settling in
 * Night (21-5): quiet companionship
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning, beautiful soul.'
  if (hour >= 12 && hour < 17) return 'Good afternoon, beautiful soul.'
  if (hour >= 17 && hour < 21) return 'Good evening, beautiful soul.'
  return 'The world is quiet. I\u2019m here with you.'
}

/**
 * DashboardClient component - Sacred Sanctuary Dashboard
 *
 * A calm, focused dashboard that feels like a divine friend greeting you.
 * All main features are prominently visible — KIAAN Chat, Journeys,
 * Viyoga, Relationship Compass, Karma Reset, and Emotional Reset
 * are front and center as feature highlights.
 *
 * Design philosophy:
 * - Sacred sanctuary with all highlights visible
 * - Soul Check-In as primary CTA, KIAAN as secondary
 * - Feature highlights grid for main spiritual tools
 * - Generous spacing, rounded-[24px] cards, shadow-mobile-glow
 * - font-sacred serif for greetings and blessings
 * - Haptic feedback preserved on all interactions
 */
export default function DashboardClient() {
  const { triggerHaptic } = useHapticFeedback()

  // Cycle through sacred questions every 5 seconds
  const [questionIndex, setQuestionIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setQuestionIndex((prev) => (prev + 1) % SACRED_QUESTIONS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleCardTap = useCallback(() => {
    triggerHaptic('light')
  }, [triggerHaptic])

  const handleFeatureTap = useCallback(() => {
    triggerHaptic('medium')
  }, [triggerHaptic])

  return (
    <div className="space-y-6 sm:space-y-8">
      <FadeIn>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8"
        >
          {/* ─── Sacred Greeting ─── */}
          <motion.div
            variants={itemVariants}
            className="pt-4 sm:pt-6 text-center"
          >
            <motion.p
              className="font-sacred text-lg sm:text-xl text-white/70 tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {getGreeting()}
            </motion.p>
          </motion.div>

          {/* ─── Subscription Upsell Banner (free users) ─── */}
          <motion.div variants={itemVariants}>
            <SubscriptionBanner
              feature="encrypted_journal"
              message="Unlock journals, voice synthesis, and 150 KIAAN questions — Plus starts at $4.99/mo"
              ctaText="View Plans"
            />
          </motion.div>

          {/* ─── Living Chakra Heartbeat (PRIMARY) ─── */}
          <motion.div variants={itemVariants}>
            <Link
              href="/flows/check-in"
              onClick={handleFeatureTap}
              className="block group"
            >
              <motion.div
                className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-violet-950/60 via-indigo-950/50 to-purple-950/60 p-8 sm:p-10 shadow-mobile-glow text-center"
                variants={quickActionVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                {/* Floating prayer-star particles */}
                {PRAYER_STARS.map((star) => (
                  <motion.div
                    key={star.id}
                    className="absolute rounded-full bg-violet-300/60"
                    style={{
                      width: star.size,
                      height: star.size,
                      left: star.left,
                      bottom: 0,
                    }}
                    animate={{
                      y: [0, -280],
                      opacity: [0, 0.8, 0.6, 0],
                      scale: [0.5, 1, 0.8, 0.3],
                    }}
                    transition={{
                      duration: star.duration,
                      repeat: Infinity,
                      delay: star.delay,
                      ease: 'easeOut',
                    }}
                  />
                ))}

                {/* Chakra Mandala — layered rotating rings */}
                <div className="relative mx-auto mb-6 h-28 w-28 sm:h-36 sm:w-36">
                  {/* Outer glow halo */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      boxShadow: [
                        '0 0 40px 8px rgba(139, 92, 246, 0.15), 0 0 80px 16px rgba(99, 102, 241, 0.08)',
                        '0 0 60px 12px rgba(139, 92, 246, 0.3), 0 0 100px 24px rgba(99, 102, 241, 0.15)',
                        '0 0 40px 8px rgba(139, 92, 246, 0.15), 0 0 80px 16px rgba(99, 102, 241, 0.08)',
                      ],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* Outer ring — slow clockwise rotation with 8 petals */}
                  <motion.svg
                    viewBox="0 0 120 120"
                    className="absolute inset-0 h-full w-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <ellipse
                        key={i}
                        cx="60"
                        cy="60"
                        rx="8"
                        ry="28"
                        fill="none"
                        stroke="rgba(167, 139, 250, 0.25)"
                        strokeWidth="1"
                        transform={`rotate(${i * 45} 60 60)`}
                      />
                    ))}
                  </motion.svg>

                  {/* Middle ring — counter-rotating 6 petals */}
                  <motion.svg
                    viewBox="0 0 120 120"
                    className="absolute inset-0 h-full w-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ellipse
                        key={i}
                        cx="60"
                        cy="60"
                        rx="6"
                        ry="20"
                        fill="none"
                        stroke="rgba(196, 181, 253, 0.2)"
                        strokeWidth="1"
                        transform={`rotate(${i * 60} 60 60)`}
                      />
                    ))}
                  </motion.svg>

                  {/* Inner lotus — pulsing, blooms on hover */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.svg
                      viewBox="0 0 80 80"
                      className="h-16 w-16 sm:h-20 sm:w-20 transition-transform duration-700 group-hover:scale-125"
                    >
                      {/* Lotus petals — bloom on hover via CSS */}
                      {Array.from({ length: 8 }).map((_, i) => (
                        <ellipse
                          key={i}
                          cx="40"
                          cy="40"
                          rx="5"
                          ry="16"
                          className="fill-violet-400/20 stroke-violet-300/40 transition-all duration-700 group-hover:fill-violet-400/30 group-hover:stroke-violet-200/60"
                          strokeWidth="0.8"
                          transform={`rotate(${i * 45} 40 40)`}
                          style={{
                            transformOrigin: '40px 40px',
                          }}
                        />
                      ))}
                      {/* Center Om symbol — larger, properly centered */}
                      <text
                        x="40"
                        y="46"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-violet-200/90 transition-colors duration-700 group-hover:fill-white/95"
                        fontSize="22"
                        fontFamily="serif"
                      >
                        {'\u0950'}
                      </text>
                    </motion.svg>
                  </motion.div>
                </div>

                {/* Cycling sacred questions with crossfade */}
                <div className="relative h-8 sm:h-9 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={questionIndex}
                      className="absolute inset-x-0 font-sacred text-xl sm:text-2xl text-white/90"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    >
                      {SACRED_QUESTIONS[questionIndex]}
                    </motion.h2>
                  </AnimatePresence>
                </div>

                <p className="mt-3 text-sm text-violet-200/60">
                  Tap to share how you feel
                </p>
              </motion.div>
            </Link>
          </motion.div>

          {/* ─── Speak to KIAAN (SECONDARY) ─── */}
          <motion.div variants={itemVariants}>
            <Link
              href="/kiaan/chat"
              onClick={handleCardTap}
              className="block"
            >
              <motion.div
                className="overflow-hidden rounded-[24px] bg-gradient-to-br from-orange-900/25 to-amber-900/20 p-4 sm:p-5 shadow-mobile-glow"
                variants={quickActionVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a44c] to-[#e8b54a] shadow-lg shadow-[#d4a44c]/20"
                    animate={{
                      boxShadow: [
                        '0 0 15px rgba(212, 164, 76, 0.2)',
                        '0 0 25px rgba(212, 164, 76, 0.35)',
                        '0 0 15px rgba(212, 164, 76, 0.2)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-lg font-bold text-slate-900">K</span>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white/80">
                      Your Divine Friend is here
                    </h3>
                    <p className="mt-0.5 text-xs text-[#e8b54a]/60">
                      Talk to KIAAN — voice or text
                    </p>
                  </div>
                  <motion.div
                    className="flex-shrink-0 text-[#e8b54a]/30"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* ─── Sacred Spiritual Toolkit ─── */}
          <motion.div variants={itemVariants}>
            <div className="mb-4 flex items-center gap-3">
              <motion.span
                className="text-lg"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {'\u{1F549}\uFE0F'}
              </motion.span>
              <div>
                <h2 className="text-base font-semibold text-white/80">
                  Your Sacred Instruments
                </h2>
                <p className="text-[10px] text-white/40 font-sacred italic">
                  Guided by the eternal wisdom of the Gita
                </p>
              </div>
            </div>

            {/* Featured Sacred Tools — Viyoga, Ardha, Relationship Compass */}
            <div className="space-y-3">
              {SACRED_TOOLS.map((tool) => (
                <motion.div
                  key={tool.id}
                  variants={quickActionVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    href={tool.href}
                    onClick={handleFeatureTap}
                    className="group block"
                  >
                    <div
                      className={`relative overflow-hidden rounded-[20px] bg-gradient-to-br ${tool.gradient} ${tool.borderColor} border p-4 sm:p-5 transition-all duration-300`}
                      style={{
                        boxShadow: `0 8px 32px ${tool.glowColor}`,
                      }}
                    >
                      {/* Subtle sacred glow overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          boxShadow: `inset 0 0 40px ${tool.glowColor}`,
                        }}
                      />

                      <div className="relative flex items-center gap-4">
                        {/* Sacred Sanskrit Symbol */}
                        <div className={`flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.iconBg}`}>
                          <span className="text-lg sm:text-xl font-sacred text-white/90 select-none">
                            {tool.sanskrit}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-base sm:text-lg font-semibold ${tool.accentColor}`}>
                              {tool.title}
                            </h3>
                            <span className="text-[9px] text-white/30 font-mono tracking-wider">
                              {tool.verse}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 mt-0.5 font-sacred italic">
                            {tool.subtitle}
                          </p>
                        </div>

                        {/* Arrow */}
                        <motion.div
                          className="flex-shrink-0 text-white/20 group-hover:text-white/50 transition-colors"
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.div>
                      </div>

                      {/* Bottom glow line */}
                      <div className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent ${tool.accentColor.replace('text-', 'via-')}/20 to-transparent`} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Other Tools — Compact Grid */}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {OTHER_TOOLS.map((tool) => (
                <motion.div key={tool.id} variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
                  <Link
                    href={tool.href}
                    onClick={handleCardTap}
                    className="flex flex-col items-center justify-center rounded-[16px] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-2.5 sm:p-3 shadow-mobile-glow transition-all duration-300 active:opacity-90"
                  >
                    <div className="mb-1.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/[0.05]">
                      <span className="text-lg sm:text-xl">{tool.icon}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-white/70 text-center leading-tight">{tool.title}</span>
                    <span className="mt-0.5 text-[8px] sm:text-[9px] text-white/40 text-center leading-tight">{tool.subtitle}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ─── Quick Access ─── */}
          <motion.div variants={itemVariants}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-lg">{'\u{26A1}'}</span>
              <h2 className="text-base font-semibold text-white/80">
                Quick Access
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {QUICK_ACCESS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={handleCardTap}
                  className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-3 py-3 shadow-mobile-glow transition-all duration-300 active:scale-[0.96] hover:from-white/[0.07]"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-medium text-white/70 truncate">{item.title}</span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ─── Pathway Map ─── */}
          <motion.div variants={itemVariants}>
            <PathwayMap />
          </motion.div>

          {/* ─── Divine Presence Banner ─── */}
          <motion.div variants={itemVariants}>
            <Link
              href="/introduction"
              onClick={handleFeatureTap}
              className="group block"
            >
              <motion.div
                className="relative overflow-hidden rounded-[24px] p-5 sm:p-6 md:p-7 shadow-[0_8px_40px_rgba(212,168,67,0.15)] transition-all duration-300 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.12) 0%, rgba(184, 134, 11, 0.08) 50%, rgba(212, 168, 67, 0.06) 100%)',
                  border: '1px solid rgba(212, 168, 67, 0.2)',
                }}
                variants={quickActionVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                {/* Divine Presence Glow Overlay */}
                <motion.div
                  className="absolute inset-0 pointer-events-none rounded-[24px]"
                  animate={{
                    boxShadow: [
                      'inset 0 0 30px rgba(212, 168, 67, 0.05)',
                      'inset 0 0 50px rgba(212, 168, 67, 0.12)',
                      'inset 0 0 30px rgba(212, 168, 67, 0.05)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Floating Divine Particles */}
                {DIVINE_PARTICLES.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-[#d4a843]/70"
                    style={{
                      width: particle.size,
                      height: particle.size,
                      left: particle.left,
                      bottom: 0,
                    }}
                    animate={{
                      y: [0, -120],
                      opacity: [0, 0.9, 0.7, 0],
                      scale: [0.4, 1, 0.6, 0.2],
                    }}
                    transition={{
                      duration: particle.duration,
                      repeat: Infinity,
                      delay: particle.delay,
                      ease: 'easeOut',
                    }}
                  />
                ))}

                {/* Top radiance line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a843]/50 to-transparent" />

                <div className="relative flex items-center gap-4 sm:gap-5">
                  {/* Golden Avatar Circle with Pulsing Glow */}
                  <motion.div
                    className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full sm:h-18 sm:w-18 md:h-20 md:w-20"
                    style={{
                      background: 'linear-gradient(135deg, #d4a843 0%, #e8c56d 50%, #b8860b 100%)',
                    }}
                    animate={{
                      scale: [1, 1.06, 1],
                      boxShadow: [
                        '0 0 25px rgba(212, 168, 67, 0.35), 0 0 50px rgba(212, 168, 67, 0.15)',
                        '0 0 35px rgba(212, 168, 67, 0.5), 0 0 70px rgba(212, 168, 67, 0.25)',
                        '0 0 25px rgba(212, 168, 67, 0.35), 0 0 50px rgba(212, 168, 67, 0.15)',
                      ],
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {/* Inner glow ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: [
                          'inset 0 0 12px rgba(255, 255, 255, 0.3)',
                          'inset 0 0 18px rgba(255, 255, 255, 0.45)',
                          'inset 0 0 12px rgba(255, 255, 255, 0.3)',
                        ],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                    <span className="text-3xl sm:text-4xl md:text-[42px] text-[#0a0a0f] drop-shadow-sm select-none" style={{ lineHeight: 1 }}>
                      ॐ
                    </span>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2.5 text-lg font-semibold text-[#f5e6c8] sm:text-xl md:text-[22px]">
                      Divine Presence
                      <span className="inline-flex rounded-full border border-[#d4a843]/30 bg-[#d4a843]/15 px-2.5 py-0.5 text-[10px] font-medium text-[#d4a843] tracking-wide uppercase">
                        Sacred
                      </span>
                    </h2>
                    <p className="mt-1.5 text-sm text-[#d4a843]/70 line-clamp-2 sm:text-[15px]">
                      Enter the divine presence — experience Krishna&apos;s loving guidance and sacred wisdom
                    </p>
                  </div>

                  {/* Animated Arrow */}
                  <motion.div
                    className="flex-shrink-0 text-[#d4a843]/60 transition-colors duration-300 group-hover:text-[#d4a843]"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>

                {/* Bottom radiance line */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4a843]/30 to-transparent" />
              </motion.div>
            </Link>
          </motion.div>

        </motion.div>
      </FadeIn>
    </div>
  )
}
