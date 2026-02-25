/**
 * WelcomeScreen Component
 * Welcome screen with feature highlights and animated introduction
 */

'use client'

import { motion } from 'framer-motion'

interface WelcomeScreenProps {
  className?: string
}

const features = [
  {
    icon: '🧘',
    label: 'Calm Guidance',
    description: 'Ancient wisdom',
  },
  {
    icon: '📔',
    label: 'Private Journal',
    description: 'Express freely',
  },
  {
    icon: '🔒',
    label: 'Fully Encrypted',
    description: 'Your data, protected',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

export function WelcomeScreen({ className = '' }: WelcomeScreenProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`text-center max-w-md mx-auto ${className}`}
    >
      {/* Logo */}
      <motion.div
        variants={itemVariants}
        className="mx-auto mb-6 h-24 w-24 rounded-3xl bg-gradient-to-br from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] flex items-center justify-center text-4xl font-bold text-slate-900 shadow-lg shadow-[#d4a44c]/30"
      >
        MV
      </motion.div>

      {/* Welcome text */}
      <motion.p variants={itemVariants} className="text-sm text-[#f5f0e8]/70 mb-8">
        KIAAN is here to offer gentle guidance inspired by ancient wisdom for your mental
        wellness journey. Your conversations and journal entries stay private,
        encrypted on your device.
      </motion.p>

      {/* Features grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-3 gap-4"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.label}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            className="rounded-xl bg-[#d4a44c]/10 border border-[#d4a44c]/20 p-4"
          >
            <div className="text-2xl mb-2">{feature.icon}</div>
            <p className="text-xs font-medium text-[#f5f0e8]/80 mb-1">
              {feature.label}
            </p>
            <p className="text-[10px] text-[#f5f0e8]/50">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tagline */}
      <motion.p
        variants={itemVariants}
        className="mt-8 text-xs text-[#f5f0e8]/50 italic"
      >
        &quot;The mind is everything. What you think, you become.&quot;
      </motion.p>
    </motion.div>
  )
}

export default WelcomeScreen
