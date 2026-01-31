'use client'

import { motion, type Variants } from 'framer-motion'

const celebrationVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  },
}

export default function TodayStepClient() {
  return (
    <motion.div
      variants={celebrationVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/60 to-gray-900/70 p-6 text-center text-orange-100"
    >
      <h2 className="text-xl font-semibold text-orange-50">Journey Complete</h2>
      <p className="mt-2 text-sm text-orange-100/70">
        Celebrate your progress and return anytime to continue your daily practice.
      </p>
    </motion.div>
  )
}
