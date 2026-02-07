'use client'

import { FadeIn } from '@/components/ui'
import { ToolsDashboardSection } from '@/components/dashboard'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useCallback } from 'react'

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

/**
 * DashboardClient component - Main dashboard view
 *
 * Premium mobile-optimized dashboard with:
 * - Staggered entrance animations
 * - Haptic feedback on interactions
 * - Touch-friendly card layouts
 * - Smooth spring animations
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
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 lg:px-6">
      <FadeIn>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Quick Access to Introduction - Divine Presence */}
          <motion.div className="mb-6" variants={itemVariants}>
            <Link
              href="/introduction"
              onClick={handleFeatureTap}
              className="block overflow-hidden rounded-[20px] border border-amber-500/20 bg-gradient-to-br from-amber-900/40 via-amber-900/30 to-orange-900/40 p-5 shadow-lg shadow-amber-900/10 transition-all duration-200 active:scale-[0.98] md:p-6"
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
                  <span className="text-3xl md:text-4xl">🙏</span>
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

          {/* Quick Actions Grid */}
          <motion.div
            className="grid grid-cols-2 gap-3 mb-8 md:grid-cols-4 md:gap-4"
            variants={itemVariants}
          >
            {/* KIAAN */}
            <motion.div variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
              <Link
                href="/kiaan"
                onClick={handleCardTap}
                className="flex flex-col items-center justify-center rounded-[18px] border border-orange-500/20 bg-gradient-to-br from-orange-900/30 to-amber-900/30 p-4 transition-all duration-200 active:opacity-90 md:p-5"
              >
                <motion.div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 shadow-lg shadow-orange-500/30 md:h-14 md:w-14"
                  animate={{
                    boxShadow: [
                      '0 0 15px rgba(251, 146, 60, 0.25)',
                      '0 0 25px rgba(251, 146, 60, 0.4)',
                      '0 0 15px rgba(251, 146, 60, 0.25)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-lg font-bold text-slate-900 md:text-xl">K</span>
                </motion.div>
                <span className="text-sm font-medium text-white/80">KIAAN</span>
                <span className="mt-0.5 text-[10px] text-orange-300/60">AI Companion</span>
              </Link>
            </motion.div>

            {/* Journal */}
            <motion.div variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
              <Link
                href="/flows/journal"
                onClick={handleCardTap}
                className="flex flex-col items-center justify-center rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 transition-all duration-200 active:opacity-90 md:p-5"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] shadow-inner md:h-14 md:w-14">
                  <span className="text-2xl md:text-3xl">📝</span>
                </div>
                <span className="text-sm font-medium text-white/80">Journal</span>
                <span className="mt-0.5 text-[10px] text-white/40">Reflections</span>
              </Link>
            </motion.div>

            {/* Wisdom Journeys */}
            <motion.div variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
              <Link
                href="/journeys"
                onClick={handleCardTap}
                className="flex flex-col items-center justify-center rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 transition-all duration-200 active:opacity-90 md:p-5"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] shadow-inner md:h-14 md:w-14">
                  <span className="text-2xl md:text-3xl">🕉️</span>
                </div>
                <span className="text-sm font-medium text-white/80">Wisdom Journeys</span>
                <span className="mt-0.5 text-[10px] text-white/40">Transform Within</span>
              </Link>
            </motion.div>

            {/* Mood Check-in */}
            <motion.div variants={quickActionVariants} initial="rest" whileHover="hover" whileTap="tap">
              <Link
                href="/flows/check-in"
                onClick={handleCardTap}
                className="flex flex-col items-center justify-center rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 transition-all duration-200 active:opacity-90 md:p-5"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] shadow-inner md:h-14 md:w-14">
                  <span className="text-2xl md:text-3xl">💙</span>
                </div>
                <span className="text-sm font-medium text-white/80">Mood Check-in</span>
                <span className="mt-0.5 text-[10px] text-white/40">How are you?</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* KIAAN Companion - Best Friend CTA */}
          <motion.div variants={itemVariants} className="mb-6">
            <CompanionCTA message="Your best friend who truly listens. Talk through anything — voice or text." />
          </motion.div>

          {/* Tools Section */}
          <motion.div variants={itemVariants}>
            <div className="mb-5 flex items-center gap-3">
              <motion.span
                className="text-2xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                🛠️
              </motion.span>
              <h2 className="text-lg font-semibold text-white/90 md:text-xl">
                All Tools & Features
              </h2>
            </div>
            <ToolsDashboardSection />
          </motion.div>
        </motion.div>
      </FadeIn>
    </main>
  )
}
