'use client'

import { useMemo } from 'react'

interface UsageDataPoint {
  month: string
  chats: number
  journals: number
  moods: number
}

interface UsageChartProps {
  data?: UsageDataPoint[]
  className?: string
}

// Generate mock data for demonstration
const generateMockData = (): UsageDataPoint[] => {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((month) => ({
    month,
    chats: Math.floor(Math.random() * 50) + 10,
    journals: Math.floor(Math.random() * 30) + 5,
    moods: Math.floor(Math.random() * 20) + 10,
  }))
}

export function UsageChart({ data, className = '' }: UsageChartProps) {
  const chartData = useMemo(() => data || generateMockData(), [data])

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...chartData.flatMap((d) => [d.chats, d.journals, d.moods]))
  }, [chartData])

  return (
    <div className={`rounded-2xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-orange-50">Usage Analytics</h2>
          <p className="text-xs text-orange-100/60">Last 6 months activity</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-orange-400" />
            <span className="text-orange-100/70">Chats</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-emerald-400" />
            <span className="text-orange-100/70">Journals</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-purple-400" />
            <span className="text-orange-100/70">Moods</span>
          </div>
        </div>
      </div>

      {/* Simple bar chart */}
      <div className="h-48 flex items-end gap-4">
        {chartData.map((point, index) => (
          <div key={point.month} className="flex-1 flex flex-col items-center gap-1">
            {/* Bars */}
            <div className="w-full flex justify-center gap-1 items-end h-40">
              <div
                className="w-3 bg-orange-400 rounded-t transition-all duration-500"
                style={{ height: `${(point.chats / maxValue) * 100}%` }}
                title={`${point.chats} chats`}
              />
              <div
                className="w-3 bg-emerald-400 rounded-t transition-all duration-500"
                style={{ height: `${(point.journals / maxValue) * 100}%` }}
                title={`${point.journals} journals`}
              />
              <div
                className="w-3 bg-purple-400 rounded-t transition-all duration-500"
                style={{ height: `${(point.moods / maxValue) * 100}%` }}
                title={`${point.moods} moods`}
              />
            </div>
            {/* Month label */}
            <span className="text-xs text-orange-100/50">{point.month}</span>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-orange-500/10">
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-400">
            {chartData.reduce((sum, d) => sum + d.chats, 0)}
          </p>
          <p className="text-xs text-orange-100/60">Total Chats</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {chartData.reduce((sum, d) => sum + d.journals, 0)}
          </p>
          <p className="text-xs text-orange-100/60">Journal Entries</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">
            {chartData.reduce((sum, d) => sum + d.moods, 0)}
          </p>
          <p className="text-xs text-orange-100/60">Mood Check-ins</p>
        </div>
      </div>
    </div>
  )
}

export default UsageChart
