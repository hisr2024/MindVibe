/**
 * MobileStatsBar — 4 horizontal-scroll stat cards from dashboard data.
 */

'use client'

import { motion } from 'framer-motion'
import type { DashboardResponse } from '@/types/journeyEngine.types'
import { StatsBarSkeleton } from '../skeletons/StatsBarSkeleton'

interface MobileStatsBarProps {
  dashboard: DashboardResponse | null
  isLoading: boolean
}

interface StatDef {
  label: string
  value: number
  suffix?: string
  icon: string
  gradient: string
}

export function MobileStatsBar({ dashboard, isLoading }: MobileStatsBarProps) {
  if (isLoading || !dashboard) return <StatsBarSkeleton />

  const stats: StatDef[] = [
    {
      label: 'Active',
      value: dashboard.active_journeys.length,
      suffix: '/5',
      icon: '\u2694\uFE0F',
      gradient: 'from-violet-500/20 to-indigo-500/10',
    },
    {
      label: 'Completed',
      value: dashboard.completed_journeys,
      icon: '\u2705',
      gradient: 'from-emerald-500/20 to-green-500/10',
    },
    {
      label: 'Streak',
      value: dashboard.current_streak,
      icon: '\uD83D\uDD25',
      gradient: 'from-[#D4A017]/20 to-[#c8943a]/10',
    },
    {
      label: 'Days',
      value: dashboard.total_days_practiced,
      icon: '\uD83D\uDCFF',
      gradient: 'from-pink-500/20 to-rose-500/10',
    },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className={`flex-shrink-0 w-[80px] rounded-2xl border border-white/[0.07] bg-gradient-to-br ${stat.gradient} backdrop-blur-sm`}
        >
          <div className="flex flex-col items-center justify-center h-[90px] gap-1 px-2">
            <span className="text-sm">{stat.icon}</span>
            <span className="font-divine text-2xl font-light text-[#F0C040]">
              {stat.value}
              {stat.suffix && (
                <span className="text-sm text-white/40">{stat.suffix}</span>
              )}
            </span>
            <span className="text-[9px] text-white/50 font-ui tracking-wide">
              {stat.label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
