/**
 * Pattern Analysis Component
 *
 * Visualizes behavioral patterns: weekly mood rhythms and tag correlations.
 *
 * Quantum Enhancement #6: Advanced Analytics Dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calendar, Tag } from 'lucide-react'

interface TagCorrelation {
  tag: string
  average_mood: number
  count: number
  impact: 'positive' | 'negative' | 'neutral'
}

interface PatternData {
  patterns: {
    weekly: Record<string, { average: number; count: number }>
    tag_correlations: TagCorrelation[]
  }
  insights: Array<{
    type: string
    title: string
    description: string
  }>
  analyzed_at: string
}

interface PatternAnalysisProps {
  className?: string
}

const DAY_COLORS: Record<string, string> = {
  Monday: '#EF4444',
  Tuesday: '#F59E0B',
  Wednesday: '#10B981',
  Thursday: '#3B82F6',
  Friday: '#8B5CF6',
  Saturday: '#EC4899',
  Sunday: '#F59E0B'
}

const IMPACT_COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280'
}

export function PatternAnalysis({ className = '' }: PatternAnalysisProps) {
  const [patternData, setPatternData] = useState<PatternData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPatterns()
  }, [])

  const fetchPatterns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/advanced/pattern-analysis')

      if (!response.ok) {
        throw new Error('Failed to fetch pattern analysis')
      }

      const data = await response.json()
      setPatternData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patterns')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`rounded-3xl border border-orange-500/15 bg-black/50 p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400" />
        </div>
      </div>
    )
  }

  if (error || !patternData) {
    return (
      <div className={`rounded-3xl border border-red-500/15 bg-black/50 p-6 ${className}`}>
        <p className="text-red-400 text-center">{error || 'No data available'}</p>
      </div>
    )
  }

  // Transform weekly data for chart
  const weeklyChartData = Object.entries(patternData.patterns.weekly).map(([day, data]) => ({
    day,
    average: data.average,
    count: data.count
  }))

  // Sort by day of week
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  weeklyChartData.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))

  // Find best and worst days
  const sortedDays = [...weeklyChartData].sort((a, b) => b.average - a.average)
  const bestDay = sortedDays[0]
  const worstDay = sortedDays[sortedDays.length - 1]

  return (
    <div className={`rounded-3xl border border-orange-500/15 bg-black/50 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-orange-50 mb-1 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-400" />
          Pattern Analysis
        </h3>
        <p className="text-sm text-orange-100/60">Discover your behavioral rhythms</p>
      </div>

      {/* Weekly Patterns Section */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-orange-50 mb-4">Weekly Mood Rhythm</h4>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-3">
            <div className="text-xs text-green-100/60 mb-1">Best Day</div>
            <div className="text-lg font-bold text-green-400">{bestDay?.day}</div>
            <div className="text-xs text-green-100/60">{bestDay?.average.toFixed(1)} avg mood</div>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
            <div className="text-xs text-red-100/60 mb-1">Challenging Day</div>
            <div className="text-lg font-bold text-red-400">{worstDay?.day}</div>
            <div className="text-xs text-red-100/60">{worstDay?.average.toFixed(1)} avg mood</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 115, 39, 0.1)" />
              <XAxis
                dataKey="day"
                stroke="rgba(255, 115, 39, 0.6)"
                tick={{ fill: 'rgba(255, 115, 39, 0.8)', fontSize: 10 }}
                tickFormatter={(value) => value.substring(0, 3)}
              />
              <YAxis
                domain={[0, 10]}
                stroke="rgba(255, 115, 39, 0.6)"
                tick={{ fill: 'rgba(255, 115, 39, 0.8)', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 115, 39, 0.3)',
                  borderRadius: '12px'
                }}
                labelStyle={{ color: '#FFF5E6' }}
                itemStyle={{ color: '#FF7327' }}
              />
              <Bar dataKey="average" radius={[8, 8, 0, 0]}>
                {weeklyChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DAY_COLORS[entry.day] || '#FF7327'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tag Correlations Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-orange-50 mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-orange-400" />
          Emotional Triggers
        </h4>

        <div className="space-y-3">
          {patternData.patterns.tag_correlations.slice(0, 6).map((tag, index) => (
            <motion.div
              key={tag.tag}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: IMPACT_COLORS[tag.impact] }}
                  />
                  <span className="text-sm font-medium text-orange-50 capitalize">{tag.tag}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-orange-100/60">{tag.count} times</span>
                  <span className="text-sm font-bold text-orange-50">{tag.average_mood.toFixed(1)}</span>
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-orange-500/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: IMPACT_COLORS[tag.impact] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(tag.average_mood / 10) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {patternData.insights.length > 0 && (
        <div className="space-y-3">
          {patternData.insights.map((insight, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-blue-400/30 bg-blue-950/20 p-4"
            >
              <h5 className="text-sm font-semibold text-orange-50 mb-1">{insight.title}</h5>
              <p className="text-xs text-blue-100/80 leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 text-xs text-center text-orange-100/40">
        Analyzed {new Date(patternData.analyzed_at).toLocaleString()}
      </div>
    </div>
  )
}
