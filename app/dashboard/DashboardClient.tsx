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

// Featured Sacred Tools — the three divine instruments (Gold-Black theme)
const SACRED_TOOLS = [
  {
    id: 'viyoga',
    title: 'Viyoga',
    sanskrit: '\u0935\u093F\u092F\u094B\u0917',
    subtitle: 'The Detachment Tool',
    verse: 'BG 2.47',
    href: '/tools/viyog',
    symbol: '\u{1F549}\uFE0F',
  },
  {
    id: 'ardha',
    title: 'Ardha',
    sanskrit: '\u0905\u0930\u094D\u0927',
    subtitle: 'The Reframing Tool',
    verse: 'BG 2.16',
    href: '/tools/ardha',
    symbol: '\u{1F4FF}',
  },
  {
    id: 'relationship-compass',
    title: 'Relationship Compass',
    sanskrit: '\u0938\u0902\u092C\u0928\u094D\u0927',
    subtitle: 'Dharma-Guided Clarity',
    verse: 'BG 6.29',
    href: '/tools/relationship-compass',
    symbol: '\u{1F54A}\uFE0F',
  },
] as const

// Other tools — compact sacred grid
const OTHER_TOOLS = [
  { id: 'emotional-reset', symbol: '\u{1F4AB}', title: 'Emotional Reset', subtitle: 'Guided healing', href: '/emotional-reset' },
  { id: 'karma-reset', symbol: '\u{1F49A}', title: 'Karma Reset', subtitle: 'Heal with grace', href: '/tools/karma-reset' },
  { id: 'sacred-reflections', symbol: '\u{1F4DD}', title: 'Sacred Reflections', subtitle: 'Private journal', href: '/flows/journal' },
  { id: 'karmic-tree', symbol: '\u{1F331}', title: 'Karmic Tree', subtitle: 'Your growth', href: '/karmic-tree' },
  { id: 'kiaan-vibe', symbol: '\u{1F3B5}', title: 'Vibe Player', subtitle: 'Sacred sounds', href: '/kiaan-vibe' },
  { id: 'wisdom-rooms', symbol: '\u{1F30D}', title: 'Wisdom Rooms', subtitle: 'Community chats', href: '/wisdom-rooms' },
] as const

// Sacred questions that cycle gently in the Chakra Heartbeat hero
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

// Divine Presence particles for the banner
const DIVINE_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${10 + (i * 11) % 80}%`,
  delay: i * 0.5,
  duration: 3 + (i % 2) * 1.5,
  size: i % 2 === 0 ? 2.5 : 2,
}))

// Golden god particles for the sacred toolkit
const TOOLKIT_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  left: `${6 + (i * 9) % 88}%`,
  delay: i * 0.6,
  duration: 4.5 + (i % 3) * 1.2,
  size: i % 3 === 0 ? 2.5 : 1.5,
}))

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning, beautiful soul.'
  if (hour >= 12 && hour < 17) return 'Good afternoon, beautiful soul.'
  if (hour >= 17 && hour < 21) return 'Good evening, beautiful soul.'
  return 'The world is quiet. I\u2019m here with you.'
}

export default function DashboardClient() {
  const { triggerHaptic } = useHapticFeedback()

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
                      {/* Center Om symbol */}
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

          {/* ─── Sacred Spiritual Toolkit (Gold-Black Divine Theme) ─── */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-[28px] border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0a06]/90 via-[#080706]/95 to-[#0a0806]/90 p-5 sm:p-6"
              style={{ boxShadow: '0 12px 48px rgba(212, 164, 76, 0.08), inset 0 1px 0 rgba(212, 164, 76, 0.08)' }}
            >
              {/* Top golden radiance line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/40 to-transparent" />

              {/* Floating golden god particles */}
              {TOOLKIT_PARTICLES.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    left: p.left,
                    bottom: 0,
                    background: 'radial-gradient(circle, rgba(212,164,76,0.8) 0%, rgba(212,164,76,0) 70%)',
                  }}
                  animate={{
                    y: [0, -180],
                    opacity: [0, 0.7, 0.5, 0],
                    scale: [0.4, 1, 0.7, 0.2],
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Section header */}
              <div className="relative mb-5 flex items-center gap-3">
                <motion.div
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a44c]/15 to-[#e8b54a]/10 border border-[#d4a44c]/15"
                  animate={{
                    boxShadow: [
                      '0 0 12px rgba(212, 164, 76, 0.15)',
                      '0 0 20px rgba(212, 164, 76, 0.3)',
                      '0 0 12px rgba(212, 164, 76, 0.15)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="text-base select-none">{'\u{1F549}\uFE0F'}</span>
                </motion.div>
                <div>
                  <h2 className="text-base font-semibold text-[#f5e6c8]">
                    Your Sacred Instruments
                  </h2>
                  <p className="text-[10px] text-[#d4a44c]/40 font-sacred italic">
                    Guided by the eternal wisdom of the Bhagavad Gita
                  </p>
                </div>
              </div>

              {/* Featured Sacred Tools — Viyoga, Ardha, Relationship Compass */}
              <div className="relative space-y-2.5">
                {SACRED_TOOLS.map((tool, idx) => (
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
                        className="relative overflow-hidden rounded-[18px] border border-[#d4a44c]/12 bg-gradient-to-r from-[#d4a44c]/[0.06] via-transparent to-[#d4a44c]/[0.03] p-4 sm:p-4.5 transition-all duration-300 hover:border-[#d4a44c]/25 hover:from-[#d4a44c]/[0.1]"
                        style={{
                          boxShadow: '0 4px 20px rgba(212, 164, 76, 0.04)',
                        }}
                      >
                        {/* Hover glow overlay */}
                        <div
                          className="absolute inset-0 pointer-events-none rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            boxShadow: 'inset 0 0 30px rgba(212, 164, 76, 0.08)',
                          }}
                        />

                        <div className="relative flex items-center gap-3.5">
                          {/* Sacred Sanskrit Symbol in golden circle */}
                          <motion.div
                            className="flex h-12 w-12 sm:h-13 sm:w-13 flex-shrink-0 items-center justify-center rounded-2xl border border-[#d4a44c]/15"
                            style={{
                              background: 'linear-gradient(135deg, rgba(212, 164, 76, 0.12) 0%, rgba(232, 181, 74, 0.06) 100%)',
                            }}
                            animate={idx === 0 ? {
                              boxShadow: [
                                '0 0 10px rgba(212, 164, 76, 0.1)',
                                '0 0 18px rgba(212, 164, 76, 0.2)',
                                '0 0 10px rgba(212, 164, 76, 0.1)',
                              ],
                            } : undefined}
                            transition={idx === 0 ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
                          >
                            <span className="text-sm sm:text-base font-sacred text-[#e8b54a]/80 select-none">
                              {tool.sanskrit}
                            </span>
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{tool.symbol}</span>
                              <h3 className="text-sm sm:text-[15px] font-semibold text-[#f5e6c8] group-hover:text-white transition-colors">
                                {tool.title}
                              </h3>
                              <span className="text-[8px] text-[#d4a44c]/30 font-mono tracking-widest uppercase">
                                {tool.verse}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#d4a44c]/45 mt-0.5 font-sacred italic">
                              {tool.subtitle}
                            </p>
                          </div>

                          {/* Arrow */}
                          <motion.div
                            className="flex-shrink-0 text-[#d4a44c]/20 group-hover:text-[#d4a44c]/50 transition-colors"
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </motion.div>
                        </div>

                        {/* Bottom golden thread */}
                        <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/10 to-transparent" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Other Tools — Compact Grid */}
              <div className="relative mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {OTHER_TOOLS.map((tool) => (
                  <motion.div key={tool.id} variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
                    <Link
                      href={tool.href}
                      onClick={handleCardTap}
                      className="flex flex-col items-center justify-center rounded-[14px] border border-[#d4a44c]/[0.06] bg-gradient-to-br from-[#d4a44c]/[0.03] to-transparent p-2.5 sm:p-3 transition-all duration-300 hover:border-[#d4a44c]/15 active:opacity-90"
                    >
                      <div className="mb-1.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#d4a44c]/[0.06]">
                        <span className="text-lg sm:text-xl">{tool.symbol}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-[#f5e6c8]/70 text-center leading-tight">{tool.title}</span>
                      <span className="mt-0.5 text-[8px] sm:text-[9px] text-[#d4a44c]/30 text-center leading-tight">{tool.subtitle}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Bottom golden radiance line */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/20 to-transparent" />
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
                      {'\u0950'}
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
