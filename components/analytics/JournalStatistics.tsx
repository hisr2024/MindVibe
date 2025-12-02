/**
 * JournalStatistics Component
 * Display journal writing statistics
 */

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Chart } from '@/components/common/Chart'
import { StatCard } from '@/components/common/StatCard'
import { Skeleton } from '@/components/ui'
import type { JournalStatistics as JournalStatsType } from '@/types/analytics.types'

interface JournalStatisticsProps {
  stats: JournalStatsType | null
  isLoading?: boolean
  className?: string
}

function StatisticsSkeleton() {
  return (
    <div className="rounded-2xl border border-orange-500/20 bg-black/40 p-6">
      <Skeleton height={24} width={180} className="mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={80} className="rounded-xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton height={200} className="rounded-xl" />
        <Skeleton height={200} className="rounded-xl" />
      </div>
    </div>
  )
}

export function JournalStatistics({
  stats,
  isLoading = false,
  className = '',
}: JournalStatisticsProps) {
  // Format sentiment data for pie chart
  const sentimentData = useMemo(() => {
    if (!stats?.sentimentDistribution) return []
    const { positive, neutral, negative, mixed } = stats.sentimentDistribution
    return [
      { name: 'Positive', value: positive },
      { name: 'Neutral', value: neutral },
      { name: 'Negative', value: negative },
      { name: 'Mixed', value: mixed },
    ]
  }, [stats])

  // Format top tags for bar chart
  const tagsData = useMemo(() => {
    if (!stats?.topTags) return []
    return stats.topTags.slice(0, 5).map((tag) => ({
      name: tag.tag,
      count: tag.count,
    }))
  }, [stats])

  // Format entries by month for bar chart
  const entriesData = useMemo(() => {
    if (!stats?.entriesByMonth) return []
    return stats.entriesByMonth
  }, [stats])

  if (isLoading || !stats) {
    return <StatisticsSkeleton />
  }

  const sentimentColors = ['#10b981', '#6b7280', '#ef4444', '#8b5cf6']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`rounded-2xl border border-orange-500/20 bg-black/40 p-6 ${className}`}
    >
      {/* Header */}
      <h3 className="text-lg font-semibold text-orange-50 mb-6">
        Journal Statistics
      </h3>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-orange-50">{stats.totalEntries}</p>
          <p className="text-xs text-orange-100/60">Total Entries</p>
        </div>
        <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-orange-50">{stats.totalWords.toLocaleString()}</p>
          <p className="text-xs text-orange-100/60">Words Written</p>
        </div>
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-50">{stats.currentStreak}</p>
          <p className="text-xs text-emerald-100/60">Current Streak</p>
        </div>
        <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-3 text-center">
          <p className="text-2xl font-bold text-purple-50">{stats.avgWordsPerEntry}</p>
          <p className="text-xs text-purple-100/60">Avg Words/Entry</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div>
          <h4 className="text-sm font-medium text-orange-100/80 mb-4">
            Sentiment Distribution
          </h4>
          {sentimentData.length > 0 ? (
            <Chart
              type="pie"
              data={sentimentData}
              dataKey="value"
              xAxisKey="name"
              height={200}
              isDark={true}
              colors={sentimentColors}
              showTooltip={true}
              tooltipFormatter={(value) => `${value}%`}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-orange-100/50 text-sm">No sentiment data</p>
            </div>
          )}
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {sentimentData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: sentimentColors[index] }}
                />
                <span className="text-xs text-orange-100/70">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Topics/Tags */}
        <div>
          <h4 className="text-sm font-medium text-orange-100/80 mb-4">
            Common Topics
          </h4>
          {tagsData.length > 0 ? (
            <Chart
              type="bar"
              data={tagsData}
              dataKey="count"
              xAxisKey="name"
              height={200}
              isDark={true}
              showGrid={false}
              showTooltip={true}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-orange-100/50 text-sm">No topics detected yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Entries by Month */}
      {entriesData.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-orange-100/80 mb-4">
            Entries Over Time
          </h4>
          <Chart
            type="bar"
            data={entriesData}
            dataKey="count"
            xAxisKey="month"
            height={150}
            isDark={true}
            showGrid={true}
            showTooltip={true}
            tooltipFormatter={(value) => `${value} entries`}
          />
        </div>
      )}

      {/* Additional Stats */}
      <div className="mt-6 pt-6 border-t border-orange-500/10">
        <div className="flex flex-wrap gap-6 justify-center text-center">
          <div>
            <p className="text-xl font-bold text-orange-50">{stats.longestStreak}</p>
            <p className="text-xs text-orange-100/50">Longest Streak</p>
          </div>
          <div>
            <p className="text-xl font-bold text-orange-50">{stats.avgEntriesPerWeek.toFixed(1)}</p>
            <p className="text-xs text-orange-100/50">Avg Entries/Week</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default JournalStatistics
