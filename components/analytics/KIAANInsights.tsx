/**
 * KIAANInsights Component
 * Display KIAAN conversation analytics
 */

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Chart } from '@/components/common/Chart'
import { Skeleton } from '@/components/ui'
import type { KIAANInsightData } from '@/types/analytics.types'

interface KIAANInsightsProps {
  insights: KIAANInsightData | null
  isLoading?: boolean
  className?: string
}

function InsightsSkeleton() {
  return (
    <div className="rounded-2xl border border-orange-500/20 bg-black/40 p-6">
      <Skeleton height={24} width={150} className="mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={80} className="rounded-xl" />
        ))}
      </div>
      <Skeleton height={200} className="rounded-xl" />
    </div>
  )
}

const engagementStyles = {
  high: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    label: 'High Engagement',
    emoji: '🔥',
  },
  medium: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    label: 'Moderate',
    emoji: '👍',
  },
  low: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    label: 'Getting Started',
    emoji: '🌱',
  },
}

export function KIAANInsights({
  insights,
  isLoading = false,
  className = '',
}: KIAANInsightsProps) {
  // Format usage by day for bar chart
  const usageByDayData = useMemo(() => {
    if (!insights?.usageByDay) return []
    return insights.usageByDay.map((d) => ({
      name: d.dayName,
      messages: d.messageCount,
    }))
  }, [insights])

  // Format top topics
  const topTopicsData = useMemo(() => {
    if (!insights?.topTopics) return []
    return insights.topTopics.slice(0, 5)
  }, [insights])

  if (isLoading || !insights) {
    return <InsightsSkeleton />
  }

  const engagement = engagementStyles[insights.engagementLevel]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={`rounded-2xl border border-orange-500/20 bg-black/40 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-orange-50">
          KIAAN Insights
        </h3>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${engagement.bg} border ${engagement.border}`}
        >
          <span>{engagement.emoji}</span>
          <span className={`text-xs font-medium ${engagement.text}`}>
            {engagement.label}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-blue-50">{insights.totalConversations}</p>
          <p className="text-xs text-blue-100/60">Conversations</p>
        </div>
        <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-blue-50">{insights.totalMessages}</p>
          <p className="text-xs text-blue-100/60">Messages</p>
        </div>
        <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-purple-50">{insights.avgMessagesPerConversation.toFixed(1)}</p>
          <p className="text-xs text-purple-100/60">Avg Messages</p>
        </div>
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-50">{insights.streakDays}</p>
          <p className="text-xs text-emerald-100/60">Day Streak</p>
        </div>
      </div>

      {/* Charts and Topics Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Usage by Day */}
        <div>
          <h4 className="text-sm font-medium text-orange-100/80 mb-4">
            Activity by Day
          </h4>
          {usageByDayData.length > 0 ? (
            <Chart
              type="bar"
              data={usageByDayData}
              dataKey="messages"
              xAxisKey="name"
              height={180}
              showGrid={false}
              showTooltip={true}
              colors={['#3b82f6']}
              tooltipFormatter={(value) => `${value} messages`}
            />
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-orange-100/50 text-sm">No activity data</p>
            </div>
          )}
        </div>

        {/* Top Topics */}
        <div>
          <h4 className="text-sm font-medium text-orange-100/80 mb-4">
            Topics Discussed
          </h4>
          {topTopicsData.length > 0 ? (
            <div className="space-y-3">
              {topTopicsData.map((topic, index) => (
                <div key={topic.tag} className="flex items-center gap-3">
                  <span className="text-sm text-orange-100/60 w-4">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-orange-50 capitalize">{topic.tag}</span>
                      <span className="text-xs text-orange-100/50">{topic.count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-orange-500/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-orange-100/50 text-sm">Start chatting to see topics</p>
            </div>
          )}
        </div>
      </div>

      {/* Response Time */}
      <div className="mt-6 pt-6 border-t border-orange-500/10">
        <div className="flex items-center justify-center gap-2 text-sm text-orange-100/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Average response time: {insights.avgResponseTime.toFixed(1)}s</span>
        </div>
      </div>
    </motion.div>
  )
}

export default KIAANInsights
