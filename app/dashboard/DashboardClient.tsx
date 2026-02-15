'use client'

import { FadeIn } from '@/components/ui'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useCallback } from 'react'
import { PathwayMap } from '@/components/navigation/PathwayMap'

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

// Spiritual Toolkit tools — card grid on the dashboard
const SPIRITUAL_TOOLKIT = [
  {
    id: 'viyoga',
    icon: '\u{1F3AF}',
    title: 'Viyoga',
    subtitle: 'Release attachments',
    href: '/viyog',
  },
  {
    id: 'ardha',
    icon: '\u{1F504}',
    title: 'Ardha',
    subtitle: 'Reframe thoughts',
    href: '/ardha',
  },
  {
    id: 'kiaan-chat',
    icon: '\u{1F4AC}',
    title: 'KIAAN Chat',
    subtitle: 'Your companion',
    href: '/kiaan/chat',
  },
  {
    id: 'relationship-compass',
    icon: '\u{1F9ED}',
    title: 'Compass',
    subtitle: 'Relationships',
    href: '/relationship-compass',
  },
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

  const handleCardTap = useCallback(() => {
    triggerHaptic('light')
  }, [triggerHaptic])

  const handleFeatureTap = useCallback(() => {
    triggerHaptic('medium')
  }, [triggerHaptic])

  return (
    <main className="mx-auto max-w-7xl space-y-6 sm:space-y-8 px-3 sm:px-4 pb-28 sm:pb-16 lg:px-6">
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

          {/* ─── Soul Check-In (PRIMARY) ─── */}
          <motion.div variants={itemVariants}>
            <Link
              href="/flows/check-in"
              onClick={handleFeatureTap}
              className="block"
            >
              <motion.div
                className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-violet-900/50 via-indigo-900/40 to-purple-900/50 p-6 sm:p-8 shadow-mobile-glow animate-glow-pulse text-center"
                variants={quickActionVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                {/* Breathing glow ring */}
                <motion.div
                  className="mx-auto mb-5 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-400/20 to-indigo-500/20"
                  animate={{
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      '0 0 30px rgba(139, 92, 246, 0.15)',
                      '0 0 50px rgba(139, 92, 246, 0.3)',
                      '0 0 30px rgba(139, 92, 246, 0.15)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="text-4xl sm:text-5xl">{'\u{1F49C}'}</span>
                </motion.div>

                <h2 className="font-sacred text-xl sm:text-2xl text-white/90 mb-2">
                  How does your heart feel right now?
                </h2>
                <p className="text-sm text-white/50">
                  Pause. Breathe. Check in with yourself.
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
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 shadow-lg shadow-orange-500/20"
                    animate={{
                      boxShadow: [
                        '0 0 15px rgba(251, 146, 60, 0.2)',
                        '0 0 25px rgba(251, 146, 60, 0.35)',
                        '0 0 15px rgba(251, 146, 60, 0.2)',
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
                    <p className="mt-0.5 text-xs text-orange-300/50">
                      Talk to KIAAN — voice or text
                    </p>
                  </div>
                  <motion.div
                    className="flex-shrink-0 text-orange-300/30"
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

          {/* ─── Quick Actions ─── */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {/* Journal */}
              <motion.div variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
                <Link
                  href="/flows/journal"
                  onClick={handleCardTap}
                  className="flex flex-col items-center justify-center rounded-[24px] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 shadow-mobile-glow transition-all duration-300 active:opacity-90 md:p-5"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] shadow-inner md:h-14 md:w-14">
                    <span className="text-2xl md:text-3xl">{'\u{1F4DD}'}</span>
                  </div>
                  <span className="text-sm font-medium text-white/80">Journal</span>
                  <span className="mt-0.5 text-[10px] text-white/40">Reflections</span>
                </Link>
              </motion.div>

              {/* Mood Check-in */}
              <motion.div variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
                <Link
                  href="/flows/check-in"
                  onClick={handleCardTap}
                  className="flex flex-col items-center justify-center rounded-[24px] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 shadow-mobile-glow transition-all duration-300 active:opacity-90 md:p-5"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] shadow-inner md:h-14 md:w-14">
                    <span className="text-2xl md:text-3xl">{'\u{1F499}'}</span>
                  </div>
                  <span className="text-sm font-medium text-white/80">Mood</span>
                  <span className="mt-0.5 text-[10px] text-white/40">How are you?</span>
                </Link>
              </motion.div>

              {/* Karmic Tree */}
              <motion.div variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
                <Link
                  href="/karmic-tree"
                  onClick={handleCardTap}
                  className="flex flex-col items-center justify-center rounded-[24px] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 shadow-mobile-glow transition-all duration-300 active:opacity-90 md:p-5"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] shadow-inner md:h-14 md:w-14">
                    <span className="text-2xl md:text-3xl">{'\u{1F331}'}</span>
                  </div>
                  <span className="text-sm font-medium text-white/80">Karmic Tree</span>
                  <span className="mt-0.5 text-[10px] text-white/40">Your Growth</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* ─── Spiritual Toolkit ─── */}
          <motion.div variants={itemVariants}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-lg">{'\u{1F549}\uFE0F'}</span>
              <h2 className="text-base font-semibold text-white/80">
                Your Spiritual Toolkit
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {SPIRITUAL_TOOLKIT.map((tool) => (
                <motion.div key={tool.id} variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
                  <Link
                    href={tool.href}
                    onClick={handleCardTap}
                    className="flex flex-col items-center justify-center rounded-[24px] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3 sm:p-4 shadow-mobile-glow transition-all duration-300 active:opacity-90 md:p-5"
                  >
                    <div className="mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/[0.06] shadow-inner md:h-14 md:w-14">
                      <span className="text-xl sm:text-2xl md:text-3xl">{tool.icon}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-white/80 text-center leading-tight">{tool.title}</span>
                    <span className="mt-0.5 text-[9px] sm:text-[10px] text-white/40 text-center leading-tight">{tool.subtitle}</span>
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

          {/* ─── Divine Presence ─── */}
          <motion.div variants={itemVariants}>
            <Link
              href="/introduction"
              onClick={handleFeatureTap}
              className="block overflow-hidden rounded-[24px] bg-gradient-to-br from-amber-900/40 via-amber-900/30 to-orange-900/40 p-4 sm:p-5 shadow-mobile-glow transition-all duration-300 active:scale-[0.98] md:p-6"
            >
              <motion.div
                className="flex items-center gap-4"
                variants={quickActionVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <motion.div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 shadow-lg shadow-amber-500/20 md:h-16 md:w-16"
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 20px rgba(251, 191, 36, 0.2)',
                      '0 0 30px rgba(251, 191, 36, 0.35)',
                      '0 0 20px rgba(251, 191, 36, 0.2)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="text-3xl md:text-4xl">{'\u{1F64F}'}</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-amber-100 md:text-xl">
                    Divine Presence
                    <span className="inline-flex rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
                      Krishna
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-amber-200/60 line-clamp-2">
                    Morning Darshan, Heart-to-Heart Journal, Divine Protection Shield & sacred features
                  </p>
                </div>
                <motion.div
                  className="flex-shrink-0 text-amber-300/40"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <svg className="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              </motion.div>
            </Link>
          </motion.div>

          {/* ─── KIAAN Companion CTA ─── */}
          <motion.div variants={itemVariants}>
            <CompanionCTA message="Your best friend who truly listens. Talk through anything — voice or text." />
          </motion.div>
        </motion.div>
      </FadeIn>
    </main>
  )
}
