/**
 * OnboardingComplete Component
 * Success screen with confetti animation and CTA
 */

'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface OnboardingCompleteProps {
  userName?: string
  selectedPlan?: string
  kiaanQuota?: number | string
  onGoToDashboard?: () => void
  onStartChat?: () => void
  className?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
}

const checkmarkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 15,
      delay: 0.2,
    },
  },
}

export function OnboardingComplete({
  userName,
  selectedPlan = 'Free',
  kiaanQuota = 10,
  onGoToDashboard,
  onStartChat,
  className = '',
}: OnboardingCompleteProps) {
  useEffect(() => {
    // Fire confetti via canvas-confetti (lightweight, no extra component)
    import('canvas-confetti').then((mod) => {
      const confetti = mod.default
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.4 },
        colors: ['#ff7327', '#fbbf24', '#f59e0b', '#10b981', '#3b82f6'],
      })
    }).catch(() => {
      // Confetti unavailable, graceful degradation
    })
  }, [])

  const quickActions = [
    {
      icon: '💬',
      label: 'Chat with KIAAN',
      description: 'Start your first conversation',
      onClick: onStartChat,
    },
    {
      icon: '📔',
      label: 'Write in Journal',
      description: 'Express your thoughts',
      href: '/flows/journal',
    },
    {
      icon: '🧘',
      label: 'Guided Meditation',
      description: 'Find your calm',
      href: '/flows/wisdom',
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`text-center max-w-md mx-auto ${className}`}
    >
      {/* Success checkmark */}
      <motion.div
        variants={checkmarkVariants}
        className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-10 h-10 text-emerald-400"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>

      {/* Welcome message */}
      <motion.h2 variants={itemVariants} className="text-2xl font-bold text-[#f5f0e8] mb-2">
        {userName ? `Welcome, ${userName}!` : 'You\'re All Set!'}
      </motion.h2>

      <motion.p variants={itemVariants} className="text-sm text-[#f5f0e8]/70 mb-6">
        Your profile is ready. Start a conversation with KIAAN, explore your
        journal, or try one of our guided exercises.
      </motion.p>

      {/* Selected plan card */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl bg-[#d4a44c]/10 border border-[#d4a44c]/20 p-4 mb-8"
      >
        <p className="text-xs text-[#f5f0e8]/60 mb-2">Your selected plan:</p>
        <p className="text-lg font-semibold text-[#f5f0e8]">{selectedPlan}</p>
        <p className="text-xs text-[#f5f0e8]/60 mt-1">
          {kiaanQuota === 'unlimited'
            ? 'Unlimited KIAAN questions'
            : `${kiaanQuota} KIAAN questions per month`}
        </p>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={itemVariants} className="space-y-3">
        <p className="text-sm font-medium text-[#f5f0e8]/80 mb-3">
          Start exploring:
        </p>
        {quickActions.map((action) => (
          <motion.a
            key={action.label}
            href={action.href}
            onClick={(e) => {
              if (action.onClick) {
                e.preventDefault()
                action.onClick()
              }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 rounded-xl border border-[#d4a44c]/20 bg-black/30 p-4 hover:border-[#d4a44c]/50 transition cursor-pointer"
          >
            <span className="text-2xl">{action.icon}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-[#f5f0e8]">{action.label}</p>
              <p className="text-xs text-[#f5f0e8]/50">{action.description}</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-[#f5f0e8]/40 ml-auto"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </motion.a>
        ))}
      </motion.div>

      {/* Dashboard CTA */}
      {onGoToDashboard && (
        <motion.button
          variants={itemVariants}
          onClick={onGoToDashboard}
          className="mt-8 text-sm text-[#f5f0e8]/60 hover:text-[#f5f0e8] transition underline underline-offset-4"
        >
          Or go to dashboard →
        </motion.button>
      )}
    </motion.div>
  )
}

export default OnboardingComplete
