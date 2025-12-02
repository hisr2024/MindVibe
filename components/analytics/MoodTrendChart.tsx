/**
 * MoodTrendChart Component
 * Line/area chart showing mood trends over time
 */

'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Chart } from '@/components/common/Chart'
import { Skeleton } from '@/components/ui'
import type { MoodTrendData, AnalyticsPeriod } from '@/types/analytics.types'
import { formatChartDate, getMoodColor, getMoodEmoji } from '@/utils/chartHelpers'

interface MoodTrendChartProps {
  data: MoodTrendData | null
  period: AnalyticsPeriod
  onPeriodChange?: (period: AnalyticsPeriod) => void
  isLoading?: boolean
  className?: string
}

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'daily', label: '7 Days' },
  { value: 'weekly', label: '4 Weeks' },
  { value: 'monthly', label: '12 Months' },
]

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-orange-500/20 bg-black/40 p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton height={24} width={150} />
        <Skeleton height={32} width={200} />
      </div>
      <Skeleton height={250} className="rounded-xl" />
    </div>
  )
}

export function MoodTrendChart({
  data,
  period,
  onPeriodChange,
  isLoading = false,
  className = '',
}: MoodTrendChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('area')

  // Format data for chart
  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map((point) => ({
      date: formatChartDate(point.date),
      score: Math.round(point.score * 10) / 10,
      label: point.label || getMoodEmoji(point.score),
    }))
  }, [data])

  if (isLoading || !data) {
    return <ChartSkeleton />
  }

  const getTrendInfo = () => {
    const trendEmoji = data.trend === 'improving' ? '📈' : data.trend === 'declining' ? '📉' : '➡️'
    const trendText = data.trend === 'improving' ? 'Improving' : data.trend === 'declining' ? 'Declining' : 'Stable'
    const changeText = data.changePercentage > 0
      ? `+${data.changePercentage.toFixed(1)}%`
      : `${data.changePercentage.toFixed(1)}%`
    return { emoji: trendEmoji, text: trendText, change: changeText }
  }

  const trendInfo = getTrendInfo()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`rounded-2xl border border-orange-500/20 bg-black/40 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-orange-50 flex items-center gap-2">
            Mood Trends
            <span className="text-sm font-normal text-orange-100/60">
              {trendInfo.emoji} {trendInfo.text} ({trendInfo.change})
            </span>
          </h3>
          <p className="text-sm text-orange-100/50 mt-1">
            Avg: {data.averageScore.toFixed(1)} • High: {data.highestScore.toFixed(1)} • Low: {data.lowestScore.toFixed(1)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          {onPeriodChange && (
            <div className="flex rounded-lg border border-orange-500/20 overflow-hidden">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onPeriodChange(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition ${
                    period === opt.value
                      ? 'bg-orange-500/20 text-orange-50'
                      : 'text-orange-100/60 hover:bg-orange-500/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Chart type toggle */}
          <div className="flex rounded-lg border border-orange-500/20 overflow-hidden">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 text-xs transition ${
                chartType === 'area'
                  ? 'bg-orange-500/20 text-orange-50'
                  : 'text-orange-100/60 hover:bg-orange-500/10'
              }`}
              title="Area Chart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M3 3v18h18" />
                <path d="M3 12l5-6 4 4 5-6 4 4" />
              </svg>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 text-xs transition ${
                chartType === 'line'
                  ? 'bg-orange-500/20 text-orange-50'
                  : 'text-orange-100/60 hover:bg-orange-500/10'
              }`}
              title="Line Chart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M3 3v18h18" />
                <path d="M3 12l5-6 4 4 5-6 4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <Chart
          type={chartType}
          data={chartData}
          dataKey="score"
          xAxisKey="date"
          height={250}
          isDark={true}
          showGrid={true}
          showTooltip={true}
          tooltipFormatter={(value) => `${value.toFixed(1)} ${getMoodEmoji(value)}`}
        />
      ) : (
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-orange-100/50 text-sm">No mood data available</p>
        </div>
      )}
    </motion.div>
  )
}

export default MoodTrendChart
