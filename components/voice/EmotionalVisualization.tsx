'use client'

/**
 * Emotional Visualization Component
 *
 * Displays a visual graph of the user's emotional journey over time.
 * Uses the emotional data stored by KIAAN's context memory system.
 *
 * Features:
 * - Line chart showing emotional trends
 * - Emotion color coding
 * - Time period selection (7/30/90 days)
 * - Insights and patterns
 */

import React, { useState, useEffect, useMemo } from 'react'

// Emotion to numeric value mapping (for y-axis positioning)
const EMOTION_VALUES: Record<string, number> = {
  // Positive emotions (higher values)
  'joy': 90,
  'peaceful': 85,
  'grateful': 80,
  'hopeful': 75,
  'content': 70,
  'calm': 65,
  // Neutral
  'neutral': 50,
  'curious': 55,
  'reflective': 50,
  // Challenging emotions (lower values, but not negative - all emotions are valid)
  'anxious': 35,
  'worried': 35,
  'sad': 30,
  'frustrated': 30,
  'angry': 25,
  'lonely': 25,
  'overwhelmed': 20,
  'depressed': 15,
  'hopeless': 10
}

// Emotion to color mapping
const EMOTION_COLORS: Record<string, string> = {
  'joy': '#FFD700',
  'peaceful': '#87CEEB',
  'grateful': '#98FB98',
  'hopeful': '#FFA500',
  'content': '#90EE90',
  'calm': '#ADD8E6',
  'neutral': '#C0C0C0',
  'curious': '#DDA0DD',
  'reflective': '#B0C4DE',
  'anxious': '#FFB6C1',
  'worried': '#FFC0CB',
  'sad': '#778899',
  'frustrated': '#FF6347',
  'angry': '#DC143C',
  'lonely': '#4682B4',
  'overwhelmed': '#8B4513',
  'depressed': '#483D8B',
  'hopeless': '#2F4F4F'
}

interface EmotionalDataPoint {
  date: Date
  emotion: string
  context?: string
}

interface EmotionalVisualizationProps {
  data?: EmotionalDataPoint[]
  height?: number
  showInsights?: boolean
  className?: string
}

// Helper to get emotional data from localStorage
function getEmotionalData(days: number): EmotionalDataPoint[] {
  try {
    // Try to get from context memory
    const contextData = localStorage.getItem('kiaan_context_memory')
    if (contextData) {
      const parsed = JSON.parse(contextData)
      const emotionalJourney = parsed.emotionalJourney || []

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)

      return emotionalJourney
        .filter((e: any) => new Date(e.lastOccurred) > cutoff)
        .map((e: any) => ({
          date: new Date(e.lastOccurred),
          emotion: e.emotion,
          context: ''
        }))
    }

    // Fallback to conversation logs
    const logsData = localStorage.getItem('kiaan_conversation_logs')
    if (logsData) {
      const logs = JSON.parse(logsData)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)

      return logs
        .filter((log: any) => new Date(log.timestamp) > cutoff && log.detectedEmotion)
        .map((log: any) => ({
          date: new Date(log.timestamp),
          emotion: log.detectedEmotion,
          context: log.userMessage?.substring(0, 50)
        }))
    }

    return []
  } catch {
    return []
  }
}

// Generate insights from emotional data
function generateInsights(data: EmotionalDataPoint[]): string[] {
  if (data.length === 0) return ['Not enough data yet. Keep talking with KIAAN to see your emotional journey unfold.']

  const insights: string[] = []

  // Count emotions
  const emotionCounts: Record<string, number> = {}
  for (const point of data) {
    emotionCounts[point.emotion] = (emotionCounts[point.emotion] || 0) + 1
  }

  // Most common emotion
  const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])
  if (sorted.length > 0) {
    const [mostCommon, count] = sorted[0]
    const percentage = Math.round((count / data.length) * 100)
    insights.push(`Your most frequent emotional state has been "${mostCommon}" (${percentage}% of conversations).`)
  }

  // Emotional range
  const values = data.map(d => EMOTION_VALUES[d.emotion] || 50)
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length

  if (avgValue > 65) {
    insights.push('Your emotional journey shows predominantly positive states. Your spiritual practice appears to be bearing fruit.')
  } else if (avgValue < 40) {
    insights.push('You have been navigating some challenging emotions. Remember, this too shall pass. KIAAN is here to support you.')
  } else {
    insights.push('Your emotional landscape shows a balanced mix of states. This is natural - the Gita teaches equanimity in both joy and sorrow.')
  }

  // Recent trend
  if (data.length >= 5) {
    const recentData = data.slice(-5)
    const recentAvg = recentData.map(d => EMOTION_VALUES[d.emotion] || 50).reduce((a, b) => a + b, 0) / 5
    const olderData = data.slice(0, -5)
    if (olderData.length > 0) {
      const olderAvg = olderData.map(d => EMOTION_VALUES[d.emotion] || 50).reduce((a, b) => a + b, 0) / olderData.length

      if (recentAvg > olderAvg + 10) {
        insights.push('There is an upward trend in your recent emotional states. Your efforts are showing.')
      } else if (recentAvg < olderAvg - 10) {
        insights.push('Recent conversations show more challenging emotions. Consider a grounding practice or speaking with KIAAN about what you are facing.')
      }
    }
  }

  // Gita wisdom based on patterns
  if (emotionCounts['anxious'] > 2 || emotionCounts['worried'] > 2) {
    insights.push('The Gita says: "Do not worry about the future, for the present moment is all you truly have." - BG 6.35')
  }
  if (emotionCounts['sad'] > 2 || emotionCounts['lonely'] > 2) {
    insights.push('Krishna reminds us: "I am the friend dwelling in the hearts of all beings." You are never truly alone. - BG 18.61')
  }

  return insights
}

export default function EmotionalVisualization({
  data: propData,
  height = 300,
  showInsights = true,
  className = ''
}: EmotionalVisualizationProps) {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30)
  const [hoveredPoint, setHoveredPoint] = useState<EmotionalDataPoint | null>(null)

  // Get data from props or localStorage
  const data = useMemo(() => {
    if (propData && propData.length > 0) return propData
    return getEmotionalData(timeRange)
  }, [propData, timeRange])

  // Sort data by date
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [data])

  // Generate insights
  const insights = useMemo(() => {
    return showInsights ? generateInsights(sortedData) : []
  }, [sortedData, showInsights])

  // Calculate SVG dimensions
  const width = 100 // percentage
  const padding = { top: 20, right: 20, bottom: 40, left: 60 }
  const chartHeight = height - padding.top - padding.bottom
  const chartWidth = 100 - ((padding.left + padding.right) / 10)

  // Generate path for the line
  const linePath = useMemo(() => {
    if (sortedData.length === 0) return ''

    const points = sortedData.map((point, index) => {
      const x = padding.left + (index / Math.max(sortedData.length - 1, 1)) * (chartWidth * 10 - padding.left)
      const y = padding.top + chartHeight - ((EMOTION_VALUES[point.emotion] || 50) / 100) * chartHeight
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }, [sortedData, chartWidth, chartHeight, padding])

  // Generate area fill path
  const areaPath = useMemo(() => {
    if (sortedData.length === 0) return ''

    const points = sortedData.map((point, index) => {
      const x = padding.left + (index / Math.max(sortedData.length - 1, 1)) * (chartWidth * 10 - padding.left)
      const y = padding.top + chartHeight - ((EMOTION_VALUES[point.emotion] || 50) / 100) * chartHeight
      return `${x},${y}`
    })

    const baseline = padding.top + chartHeight
    return `M ${padding.left},${baseline} L ${points.join(' L ')} L ${padding.left + chartWidth * 10 - padding.left},${baseline} Z`
  }, [sortedData, chartWidth, chartHeight, padding])

  if (sortedData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Your Emotional Journey
        </h3>
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-center">Your emotional journey will appear here as you continue talking with KIAAN.</p>
          <p className="text-sm mt-2 text-center">Each conversation helps paint the picture of your inner landscape.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Your Emotional Journey
        </h3>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as 7 | 30 | 90)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                timeRange === days
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${chartWidth * 10 + padding.left + padding.right} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = padding.top + chartHeight - (value / 100) * chartHeight
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth * 10 + padding.left}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-400"
                >
                  {value === 100 ? 'Joy' : value === 75 ? 'Hopeful' : value === 50 ? 'Neutral' : value === 25 ? 'Challenged' : ''}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#emotionGradient)"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {sortedData.map((point, index) => {
            const x = padding.left + (index / Math.max(sortedData.length - 1, 1)) * (chartWidth * 10 - padding.left)
            const y = padding.top + chartHeight - ((EMOTION_VALUES[point.emotion] || 50) / 100) * chartHeight
            const color = EMOTION_COLORS[point.emotion] || '#C0C0C0'

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition-transform hover:scale-150"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            )
          })}

          {/* X-axis labels */}
          {sortedData.length > 0 && (
            <>
              <text
                x={padding.left}
                y={height - 10}
                textAnchor="start"
                className="text-xs fill-gray-400"
              >
                {sortedData[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
              <text
                x={chartWidth * 10 + padding.left}
                y={height - 10}
                textAnchor="end"
                className="text-xs fill-gray-400"
              >
                {sortedData[sortedData.length - 1].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-10">
            <div className="font-medium capitalize">{hoveredPoint.emotion}</div>
            <div className="text-gray-300 text-xs">
              {hoveredPoint.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {Object.entries(emotionCounts(sortedData))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([emotion, count]) => (
            <div key={emotion} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: EMOTION_COLORS[emotion] || '#C0C0C0' }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {emotion} ({count})
              </span>
            </div>
          ))}
      </div>

      {/* Insights */}
      {showInsights && insights.length > 0 && (
        <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
            Insights from Your Journey
          </h4>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm text-orange-700 dark:text-orange-400 flex gap-2">
                <span className="text-orange-500">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Helper to count emotions
function emotionCounts(data: EmotionalDataPoint[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const point of data) {
    counts[point.emotion] = (counts[point.emotion] || 0) + 1
  }
  return counts
}

// Export types for use in other components
export type { EmotionalDataPoint, EmotionalVisualizationProps }
