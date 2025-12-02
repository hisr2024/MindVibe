'use client'

import { motion } from 'framer-motion'

interface SeasonIndicatorProps {
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  description?: string
}

const seasonData = {
  spring: {
    icon: '🌸',
    label: 'Spring',
    colors: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    description: 'Growing – Positive momentum building.',
  },
  summer: {
    icon: '☀️',
    label: 'Summer',
    colors: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    description: 'Full bloom – Your mindfulness practice is thriving!',
  },
  autumn: {
    icon: '🍂',
    label: 'Autumn',
    colors: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
    description: 'Reflection – A time for deeper introspection.',
  },
  winter: {
    icon: '❄️',
    label: 'Winter',
    colors: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    description: 'Rest & renewal – Nurturing your roots.',
  },
}

export function SeasonIndicator({ season, description }: SeasonIndicatorProps) {
  const data = seasonData[season]

  return (
    <motion.div
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${data.colors} border px-4 py-2`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <span className="text-xl">{data.icon}</span>
      <div>
        <span className="text-sm font-semibold text-orange-50 capitalize">{data.label}</span>
        <p className="text-xs text-orange-100/60">{description || data.description}</p>
      </div>
    </motion.div>
  )
}

export default SeasonIndicator
