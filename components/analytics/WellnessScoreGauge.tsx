/**
 * Wellness Score Gauge Component
 *
 * Displays comprehensive wellness score (0-100) with radial gauge visualization
 * and component breakdown.
 *
 * Quantum Enhancement #6: Advanced Analytics Dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, TrendingUp, Target, Heart } from 'lucide-react'

interface WellnessScoreData {
  total_score: number
  level: string
  level_description: string
  components: {
    mood_stability: { score: number; weight: string; description: string }
    engagement: { score: number; weight: string; description: string }
    consistency: { score: number; weight: string; description: string }
    growth: { score: number; weight: string; description: string }
  }
  recommendations: string[]
  calculated_at: string
}

interface WellnessScoreGaugeProps {
  userId?: string
  className?: string
}

const LEVEL_COLORS = {
  excellent: { primary: '#10B981', secondary: '#D1FAE5', text: 'Thriving!' },
  good: { primary: '#3B82F6', secondary: '#DBEAFE', text: 'Doing Well' },
  fair: { primary: '#F59E0B', secondary: '#FEF3C7', text: 'On Track' },
  needs_attention: { primary: '#EF4444', secondary: '#FEE2E2', text: 'Needs Focus' },
  needs_improvement: { primary: '#DC2626', secondary: '#FEE2E2', text: 'Needs Work' }
}

const COMPONENT_ICONS = {
  mood_stability: Heart,
  engagement: Activity,
  consistency: Target,
  growth: TrendingUp
}

export function WellnessScoreGauge({ userId, className = '' }: WellnessScoreGaugeProps) {
  const [wellnessData, setWellnessData] = useState<WellnessScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWellnessScore()
  }, [userId])

  const fetchWellnessScore = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/advanced/wellness-score', { credentials: 'include' })

      if (!response.ok) {
        throw new Error('Failed to fetch wellness score')
      }

      const data = await response.json()
      setWellnessData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wellness score')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4a44c]" />
        </div>
      </div>
    )
  }

  if (error || !wellnessData) {
    return (
      <div className={`rounded-3xl border border-red-500/15 bg-black/50 p-6 ${className}`}>
        <p className="text-red-400 text-center">{error || 'No data available'}</p>
      </div>
    )
  }

  const levelConfig = LEVEL_COLORS[wellnessData.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.fair
  const scorePercentage = wellnessData.total_score

  return (
    <div className={`rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#f5f0e8] mb-1">Wellness Score</h3>
        <p className="text-sm text-[#f5f0e8]/60">Comprehensive health assessment</p>
      </div>

      {/* Radial Gauge */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative w-48 h-48">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke="rgba(212, 164, 76, 0.1)"
              strokeWidth="16"
            />
            {/* Progress circle */}
            <motion.circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke={levelConfig.primary}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${2 * Math.PI * 80 * (1 - scorePercentage / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - scorePercentage / 100) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-center"
            >
              <div className="text-4xl font-bold" style={{ color: levelConfig.primary }}>
                {wellnessData.total_score}
              </div>
              <div className="text-xs text-[#f5f0e8]/60">out of 100</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Level Badge */}
      <div className="flex justify-center mb-6">
        <div
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: levelConfig.secondary,
            color: levelConfig.primary
          }}
        >
          {levelConfig.text}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-center text-[#f5f0e8]/80 mb-6">
        {wellnessData.level_description}
      </p>

      {/* Component Breakdown */}
      <div className="space-y-3 mb-6">
        {Object.entries(wellnessData.components).map(([key, component]) => {
          const Icon = COMPONENT_ICONS[key as keyof typeof COMPONENT_ICONS]
          const componentScore = component.score

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#d4a44c]" />
                  <span className="text-sm text-[#f5f0e8] capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#f5f0e8]/60">{component.weight}</span>
                  <span className="text-sm font-semibold text-[#f5f0e8]">
                    {componentScore.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-[#d4a44c]/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: componentScore >= 70 ? '#10B981' : componentScore >= 50 ? '#F59E0B' : '#EF4444'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${componentScore}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recommendations */}
      {wellnessData.recommendations.length > 0 && (
        <div className="rounded-2xl border border-indigo-400/30 bg-indigo-950/20 p-4">
          <h4 className="text-sm font-semibold text-[#f5f0e8] mb-2 flex items-center gap-2">
            <span>💡</span>
            <span>Recommendations</span>
          </h4>
          <ul className="space-y-2">
            {wellnessData.recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-[#f5f0e8]/80 flex items-start gap-2">
                <span className="text-[#d4a44c] mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 text-xs text-center text-[#f5f0e8]/40">
        Updated {new Date(wellnessData.calculated_at).toLocaleString()}
      </div>
    </div>
  )
}
