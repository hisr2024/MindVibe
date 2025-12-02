/**
 * Chart Helpers
 * Utility functions for chart data formatting and visualization
 */

import type {
  ChartTheme,
  DARK_CHART_THEME,
  MoodDataPoint,
  WritingTimeData,
} from '@/types/analytics.types'

/**
 * Format date for chart display
 */
export function formatChartDate(
  dateString: string,
  format: 'short' | 'medium' | 'long' = 'short'
): string {
  const date = new Date(dateString)

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case 'medium':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
      })
    case 'long':
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    default:
      return dateString
  }
}

/**
 * Get mood color based on score (1-10 scale)
 */
export function getMoodColor(score: number): string {
  if (score >= 8) return '#10b981' // Green - great
  if (score >= 6) return '#fbbf24' // Yellow - good
  if (score >= 4) return '#f59e0b' // Orange - okay
  if (score >= 2) return '#f97316' // Deep orange - not great
  return '#ef4444' // Red - poor
}

/**
 * Get mood emoji based on score
 */
export function getMoodEmoji(score: number): string {
  if (score >= 8) return '😊'
  if (score >= 6) return '🙂'
  if (score >= 4) return '😐'
  if (score >= 2) return '😔'
  return '😢'
}

/**
 * Get mood label based on score
 */
export function getMoodLabel(score: number): string {
  if (score >= 8) return 'Great'
  if (score >= 6) return 'Good'
  if (score >= 4) return 'Okay'
  if (score >= 2) return 'Low'
  return 'Struggling'
}

/**
 * Calculate trend direction from data points
 */
export function calculateTrend(
  data: MoodDataPoint[]
): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable'

  const recentAvg =
    data.slice(-3).reduce((sum, d) => sum + d.score, 0) / Math.min(3, data.length)
  const olderAvg =
    data.slice(0, -3).reduce((sum, d) => sum + d.score, 0) /
    Math.max(1, data.length - 3)

  const diff = recentAvg - olderAvg
  if (diff > 0.5) return 'up'
  if (diff < -0.5) return 'down'
  return 'stable'
}

/**
 * Format number for display (with K, M suffixes)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Get percentage change between two values
 */
export function getPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Convert writing time data to heatmap format
 */
export function formatHeatmapData(
  data: WritingTimeData[]
): { x: string; y: string; value: number }[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = Array.from({ length: 24 }, (_, i) =>
    i < 12 ? `${i || 12}am` : `${i === 12 ? 12 : i - 12}pm`
  )

  return data.map((d) => ({
    x: hours[d.hour],
    y: days[d.dayOfWeek],
    value: d.count,
  }))
}

/**
 * Get chart colors for pie/donut charts
 */
export function getPieChartColors(isDark: boolean = true): string[] {
  return isDark
    ? ['#ff7327', '#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
    : ['#ea580c', '#d97706', '#ca8a04', '#059669', '#2563eb', '#7c3aed']
}

/**
 * Get gradient colors for area charts
 */
export function getGradientColors(
  theme: ChartTheme
): { start: string; end: string } {
  return {
    start: theme.primaryColor,
    end: `${theme.primaryColor}00`, // Transparent
  }
}

/**
 * Format time duration (in seconds) to human readable
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

/**
 * Generate date labels for chart X-axis
 */
export function generateDateLabels(
  startDate: Date,
  endDate: Date,
  interval: 'day' | 'week' | 'month'
): string[] {
  const labels: string[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    labels.push(formatChartDate(current.toISOString()))

    switch (interval) {
      case 'day':
        current.setDate(current.getDate() + 1)
        break
      case 'week':
        current.setDate(current.getDate() + 7)
        break
      case 'month':
        current.setMonth(current.getMonth() + 1)
        break
    }
  }

  return labels
}

/**
 * Normalize data to 0-100 scale for consistent visualization
 */
export function normalizeData(
  data: number[],
  min: number = 0,
  max: number = 10
): number[] {
  return data.map((value) => ((value - min) / (max - min)) * 100)
}

/**
 * Get tooltip formatter for Recharts
 */
export function getTooltipFormatter(
  dataType: 'mood' | 'count' | 'percentage' | 'time'
): (value: number) => string {
  switch (dataType) {
    case 'mood':
      return (value) => `${value.toFixed(1)} ${getMoodEmoji(value)}`
    case 'count':
      return (value) => formatNumber(value)
    case 'percentage':
      return (value) => `${value.toFixed(1)}%`
    case 'time':
      return (value) => formatDuration(value)
    default:
      return (value) => String(value)
  }
}

/**
 * Calculate moving average for smoother chart lines
 */
export function calculateMovingAverage(
  data: number[],
  window: number = 3
): number[] {
  return data.map((_, index) => {
    const start = Math.max(0, index - Math.floor(window / 2))
    const end = Math.min(data.length, index + Math.ceil(window / 2))
    const slice = data.slice(start, end)
    return slice.reduce((sum, val) => sum + val, 0) / slice.length
  })
}

/**
 * Get responsive chart dimensions
 */
export function getResponsiveChartDimensions(
  containerWidth: number
): { width: number; height: number; margin: { top: number; right: number; bottom: number; left: number } } {
  const isMobile = containerWidth < 640
  const isTablet = containerWidth < 1024

  return {
    width: containerWidth,
    height: isMobile ? 200 : isTablet ? 250 : 300,
    margin: {
      top: 20,
      right: isMobile ? 10 : 30,
      bottom: isMobile ? 40 : 50,
      left: isMobile ? 30 : 40,
    },
  }
}
