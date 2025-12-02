'use client'

import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  trend?: 'up' | 'down' | 'stable'
  color?: 'orange' | 'green' | 'blue'
}

export function StatCard({ label, value, icon, trend, color = 'orange' }: StatCardProps) {
  const colorClasses = {
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
    green: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  }
  
  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  }
  
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    stable: 'text-orange-100/60',
  }
  
  return (
    <motion.div
      className={`rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-orange-100/60 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-50">{value}</span>
            {trend && (
              <span className={`text-sm ${trendColors[trend]}`}>
                {trendIcons[trend]}
              </span>
            )}
          </div>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </motion.div>
  )
}

export default StatCard
