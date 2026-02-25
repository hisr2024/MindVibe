/**
 * AnalyticsOverview Component
 * Summary cards showing key metrics
 */

'use client'

import { motion } from 'framer-motion'
import { StatCard } from '@/components/common/StatCard'
import { Skeleton } from '@/components/ui'
import type { OverviewMetrics } from '@/types/analytics.types'

interface AnalyticsOverviewProps {
  metrics: OverviewMetrics | null
  isLoading?: boolean
  className?: string
}

// Icons for stat cards
const icons = {
  entries: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  streak: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  mood: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  kiaan: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 p-4"
        >
          <Skeleton height={16} width="60%" className="mb-2" />
          <Skeleton height={32} width="40%" className="mb-2" />
          <Skeleton height={14} width="80%" />
        </div>
      ))}
    </div>
  )
}

export function AnalyticsOverview({
  metrics,
  isLoading = false,
  className = '',
}: AnalyticsOverviewProps) {
  if (isLoading || !metrics) {
    return <OverviewSkeleton />
  }

  const getTrendValue = () => {
    if (metrics.moodTrend === 'up') return '+8%'
    if (metrics.moodTrend === 'down') return '-5%'
    return '0%'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      <StatCard
        title="Total Entries"
        value={metrics.totalEntries}
        subtitle={`${metrics.totalWords.toLocaleString()} words`}
        icon={icons.entries}
        color="orange"
      />
      <StatCard
        title="Current Streak"
        value={`${metrics.currentStreak} days`}
        subtitle={`Best: ${metrics.longestStreak} days`}
        icon={icons.streak}
        color="emerald"
        trend={metrics.currentStreak > 0 ? 'up' : 'stable'}
      />
      <StatCard
        title="Mood Average"
        value={metrics.avgMoodScore.toFixed(1)}
        subtitle="out of 10"
        icon={icons.mood}
        color="purple"
        trend={metrics.moodTrend}
        trendValue={getTrendValue()}
      />
      <StatCard
        title="KIAAN Chats"
        value={metrics.kiaanConversations}
        subtitle={`${metrics.kiaanMessages} messages`}
        icon={icons.kiaan}
        color="blue"
      />
    </motion.div>
  )
}

export default AnalyticsOverview
