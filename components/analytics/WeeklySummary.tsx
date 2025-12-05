/**
 * WeeklySummary Component
 * Weekly highlights and insights
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui'
import type { WeeklySummaryData, Achievement } from '@/types/analytics.types'

interface WeeklySummaryProps {
  summary: WeeklySummaryData | null
  isLoading?: boolean
  className?: string
}

function SummarySkeleton() {
  return (
    <div className="rounded-2xl border border-orange-500/20 bg-black/40 p-6">
      <Skeleton height={24} width={180} className="mb-6" />
      <div className="space-y-4">
        <Skeleton height={80} className="rounded-xl" />
        <Skeleton height={80} className="rounded-xl" />
        <Skeleton height={60} className="rounded-xl" />
      </div>
    </div>
  )
}

const trendIcons = {
  up: '📈',
  down: '📉',
  stable: '➡️',
}

const insightIcons: Record<string, string> = {
  mood: '😊',
  journal: '✍️',
  kiaan: '💬',
  general: '💡',
}

export function WeeklySummary({
  summary,
  isLoading = false,
  className = '',
}: WeeklySummaryProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (isLoading || !summary) {
    return <SummarySkeleton />
  }

  const formatDateRange = () => {
    // Only render formatted dates after client hydration to avoid SSR mismatch
    if (!isClient) return '...'
    const start = new Date(summary.weekStart).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const end = new Date(summary.weekEnd).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return `${start} - ${end}`
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-400'
    if (change < 0) return 'text-red-400'
    return 'text-orange-100/60'
  }

  const getChangePrefix = (change: number) => {
    if (change > 0) return '+'
    return ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={`rounded-2xl border border-orange-500/20 bg-black/40 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-orange-50">
          Weekly Summary
        </h3>
        <span className="text-sm text-orange-100/60">
          {formatDateRange()}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Mood Summary */}
        <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{trendIcons[summary.moodSummary.trend]}</span>
            <h4 className="text-sm font-medium text-purple-100">Mood</h4>
          </div>
          <p className="text-2xl font-bold text-purple-50">
            {summary.moodSummary.avgScore.toFixed(1)}/10
          </p>
          <div className="mt-2 space-y-1 text-xs text-purple-100/60">
            {summary.moodSummary.bestDay && (
              <p>Best: {summary.moodSummary.bestDay}</p>
            )}
            {summary.moodSummary.challengingDay && (
              <p>Challenging: {summary.moodSummary.challengingDay}</p>
            )}
          </div>
        </div>

        {/* Journal Summary */}
        <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✍️</span>
            <h4 className="text-sm font-medium text-orange-100">Journal</h4>
          </div>
          <p className="text-2xl font-bold text-orange-50">
            {summary.journalSummary.entriesCount} entries
          </p>
          <div className="mt-2 text-xs text-orange-100/60">
            <p>{summary.journalSummary.totalWords.toLocaleString()} words</p>
            {summary.journalSummary.topTopics.length > 0 && (
              <p className="mt-1">
                Topics: {summary.journalSummary.topTopics.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* KIAAN Summary */}
        <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💬</span>
            <h4 className="text-sm font-medium text-blue-100">KIAAN</h4>
          </div>
          <p className="text-2xl font-bold text-blue-50">
            {summary.kiaanSummary.conversationCount} chats
          </p>
          <div className="mt-2 text-xs text-blue-100/60">
            <p>{summary.kiaanSummary.messageCount} messages</p>
            {summary.kiaanSummary.topTopics.length > 0 && (
              <p className="mt-1">
                Topics: {summary.kiaanSummary.topTopics.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comparison to Previous Week */}
      <div className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-4 mb-6">
        <h4 className="text-sm font-medium text-orange-100/80 mb-3">
          Compared to Last Week
        </h4>
        <div className="flex flex-wrap gap-6">
          <div>
            <span className="text-xs text-orange-100/50">Mood</span>
            <p className={`text-sm font-semibold ${getChangeColor(summary.comparisonToPreviousWeek.moodChange)}`}>
              {getChangePrefix(summary.comparisonToPreviousWeek.moodChange)}
              {summary.comparisonToPreviousWeek.moodChange}%
            </p>
          </div>
          <div>
            <span className="text-xs text-orange-100/50">Entries</span>
            <p className={`text-sm font-semibold ${getChangeColor(summary.comparisonToPreviousWeek.entriesChange)}`}>
              {getChangePrefix(summary.comparisonToPreviousWeek.entriesChange)}
              {summary.comparisonToPreviousWeek.entriesChange}%
            </p>
          </div>
          <div>
            <span className="text-xs text-orange-100/50">KIAAN</span>
            <p className={`text-sm font-semibold ${getChangeColor(summary.comparisonToPreviousWeek.kiaanChange)}`}>
              {getChangePrefix(summary.comparisonToPreviousWeek.kiaanChange)}
              {summary.comparisonToPreviousWeek.kiaanChange}%
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {summary.insights.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-orange-100/80 mb-3">
            Weekly Insights
          </h4>
          <div className="space-y-3">
            {summary.insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 rounded-lg border border-orange-500/10 bg-black/30 p-3"
              >
                <span className="text-xl">
                  {insight.icon || insightIcons[insight.type] || '💡'}
                </span>
                <div>
                  <p className="text-sm font-medium text-orange-50">
                    {insight.title}
                  </p>
                  <p className="text-xs text-orange-100/60">
                    {insight.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Highlight Quote */}
      {summary.highlightQuote && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-sm text-amber-100/90 italic">
            "{summary.highlightQuote}"
          </p>
        </div>
      )}

      {/* Achievements */}
      {summary.achievements.length > 0 && (
        <div className="mt-6 pt-6 border-t border-orange-500/10">
          <h4 className="text-sm font-medium text-orange-100/80 mb-3">
            🏆 Achievements Earned
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10"
              >
                <span>{achievement.icon}</span>
                <span className="text-xs font-medium text-amber-100">
                  {achievement.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default WeeklySummary
