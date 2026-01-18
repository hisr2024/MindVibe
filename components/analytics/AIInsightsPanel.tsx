/**
 * AI Insights Panel Component
 *
 * Displays AI-generated personalized insights with priority levels.
 *
 * Quantum Enhancement #6: Advanced Analytics Dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw } from 'lucide-react'

interface Insight {
  type: string
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  icon: string
}

interface AIInsightsData {
  insights: Insight[]
  generated_at: string
  ai_powered: boolean
}

interface AIInsightsPanelProps {
  className?: string
}

const PRIORITY_STYLES = {
  high: {
    border: 'border-orange-400/30',
    bg: 'bg-gradient-to-br from-orange-950/40 to-amber-950/30',
    badge: 'bg-orange-500/20 text-orange-400'
  },
  medium: {
    border: 'border-blue-400/30',
    bg: 'bg-gradient-to-br from-blue-950/40 to-indigo-950/30',
    badge: 'bg-blue-500/20 text-blue-400'
  },
  low: {
    border: 'border-purple-400/30',
    bg: 'bg-gradient-to-br from-purple-950/40 to-indigo-950/30',
    badge: 'bg-purple-500/20 text-purple-400'
  }
}

export function AIInsightsPanel({ className = '' }: AIInsightsPanelProps) {
  const [insightsData, setInsightsData] = useState<AIInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/advanced/ai-insights')

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights')
      }

      const data = await response.json()
      setInsightsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchInsights()
  }

  if (loading && !refreshing) {
    return (
      <div className={`rounded-3xl border border-orange-500/15 bg-black/50 p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400" />
        </div>
      </div>
    )
  }

  if (error || !insightsData) {
    return (
      <div className={`rounded-3xl border border-red-500/15 bg-black/50 p-6 ${className}`}>
        <p className="text-red-400 text-center">{error || 'No insights available'}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 mx-auto block px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 text-sm hover:bg-orange-500/30 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className={`rounded-3xl border border-orange-500/15 bg-black/50 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-orange-50 mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-400" />
            AI-Powered Insights
          </h3>
          <p className="text-sm text-orange-100/60">
            Personalized guidance based on your patterns
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-orange-500/20 text-sm text-orange-100/80 hover:border-orange-400/50 hover:text-orange-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* AI Badge */}
      {insightsData.ai_powered && (
        <div className="mb-4 flex items-center gap-2 text-xs text-green-400">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span>Powered by GPT-4o-mini</span>
        </div>
      )}

      {/* Insights */}
      <div className="space-y-4">
        {insightsData.insights.map((insight, index) => {
          const styles = PRIORITY_STYLES[insight.priority]

          return (
            <motion.div
              key={insight.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border ${styles.border} ${styles.bg} p-4`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{insight.icon}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-orange-50">{insight.title}</h4>
                    <p className="text-xs text-orange-100/60 capitalize">{insight.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                {/* Priority Badge */}
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                  {insight.priority}
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-orange-100/90 leading-relaxed">
                {insight.content}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-orange-500/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-orange-100/60">
            Generated {new Date(insightsData.generated_at).toLocaleString()}
          </span>
          <span className="text-orange-100/40">
            {insightsData.insights.length} insights
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 rounded-2xl border border-indigo-400/20 bg-indigo-950/10 p-3">
        <p className="text-xs text-indigo-100/70 leading-relaxed">
          💡 <strong>Tip:</strong> These insights are generated from your mood patterns, journal themes, and verse
          engagement. They update weekly to reflect your evolving journey.
        </p>
      </div>
    </div>
  )
}
