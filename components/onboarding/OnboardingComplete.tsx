/**
 * OnboardingComplete Component
 * Success screen with confetti animation and CTA
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

// Dynamic import for confetti to avoid SSR issues
const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

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
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Set window size for confetti
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
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
      {/* Confetti */}
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#ff7327', '#fbbf24', '#f59e0b', '#10b981', '#3b82f6']}
        />
      )}

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
      <motion.h2 variants={itemVariants} className="text-2xl font-bold text-orange-50 mb-2">
        {userName ? `Welcome, ${userName}!` : 'You\'re All Set!'}
      </motion.h2>

      <motion.p variants={itemVariants} className="text-sm text-orange-100/70 mb-6">
        Your profile is ready. Start a conversation with KIAAN, explore your
        journal, or try one of our guided exercises.
      </motion.p>

      {/* Selected plan card */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 mb-8"
      >
        <p className="text-xs text-orange-100/60 mb-2">Your selected plan:</p>
        <p className="text-lg font-semibold text-orange-50">{selectedPlan}</p>
        <p className="text-xs text-orange-100/60 mt-1">
          {kiaanQuota === 'unlimited'
            ? 'Unlimited KIAAN questions'
            : `${kiaanQuota} KIAAN questions per month`}
        </p>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={itemVariants} className="space-y-3">
        <p className="text-sm font-medium text-orange-100/80 mb-3">
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
            className="flex items-center gap-4 rounded-xl border border-orange-500/20 bg-black/30 p-4 hover:border-orange-400/50 transition cursor-pointer"
          >
            <span className="text-2xl">{action.icon}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-orange-50">{action.label}</p>
              <p className="text-xs text-orange-100/50">{action.description}</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-orange-100/40 ml-auto"
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
          className="mt-8 text-sm text-orange-100/60 hover:text-orange-50 transition underline underline-offset-4"
        >
          Or go to dashboard →
        </motion.button>
      )}
    </motion.div>
  )
}

export default OnboardingComplete
