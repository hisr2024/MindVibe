/**
 * Risk Assessment Component
 *
 * Displays mental health risk score with factor breakdown and recommendations.
 *
 * Quantum Enhancement #6: Advanced Analytics Dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, TrendingDown, Activity } from 'lucide-react'

interface RiskFactor {
  value: number
  risk: number
}

interface RiskAssessmentData {
  risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  description: string
  factors: {
    mood_average: RiskFactor
    trend: { direction: string; risk: number }
    volatility: RiskFactor
    low_mood_frequency: { percentage: number; risk: number }
  }
  recommendations: string[]
  assessed_at: string
}

interface RiskAssessmentProps {
  className?: string
}

const RISK_LEVEL_CONFIG = {
  low: {
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    icon: CheckCircle,
    label: 'Low Risk',
    description: 'Stable mental health patterns'
  },
  medium: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    icon: AlertTriangle,
    label: 'Medium Risk',
    description: 'Some patterns warrant attention'
  },
  high: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    icon: Shield,
    label: 'High Risk',
    description: 'Significant patterns detected'
  }
}

export function RiskAssessment({ className = '' }: RiskAssessmentProps) {
  const [riskData, setRiskData] = useState<RiskAssessmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRiskAssessment()
  }, [])

  const fetchRiskAssessment = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/advanced/risk-assessment')

      if (!response.ok) {
        throw new Error('Failed to fetch risk assessment')
      }

      const data = await response.json()
      setRiskData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk assessment')
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

  if (error || !riskData) {
    return (
      <div className={`rounded-3xl border border-red-500/15 bg-black/50 p-6 ${className}`}>
        <p className="text-red-400 text-center">{error || 'No data available'}</p>
      </div>
    )
  }

  const config = RISK_LEVEL_CONFIG[riskData.risk_level]
  const Icon = config.icon

  return (
    <div className={`rounded-3xl border border-orange-500/15 bg-black/50 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-orange-50 mb-1 flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-400" />
          Risk Assessment
        </h3>
        <p className="text-sm text-orange-100/60">Mental health stability indicators</p>
      </div>

      {/* Risk Score Gauge */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke="rgba(255, 115, 39, 0.1)"
              strokeWidth="12"
            />
            {/* Risk score circle */}
            <motion.circle
              cx="80"
              cy="80"
              r="64"
              fill="none"
              stroke={config.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 64}`}
              strokeDashoffset={`${2 * Math.PI * 64 * (1 - riskData.risk_score / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 64 * (1 - riskData.risk_score / 100) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className="h-8 w-8 mb-1" style={{ color: config.color }} />
            <div className="text-3xl font-bold" style={{ color: config.color }}>
              {riskData.risk_score}
            </div>
            <div className="text-xs text-orange-100/60">Risk Score</div>
          </div>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div className="flex justify-center mb-4">
        <div
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: config.bg,
            color: config.color
          }}
        >
          {config.label}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-center text-orange-100/80 mb-6">{riskData.description}</p>

      {/* Risk Factors */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-semibold text-orange-50">Contributing Factors</h4>

        {/* Mood Average */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-orange-50">Mood Average</span>
            </div>
            <span className="text-sm font-semibold text-orange-50">
              {riskData.factors.mood_average.value.toFixed(1)}/10
            </span>
          </div>
          <div className="h-2 rounded-full bg-orange-500/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${(riskData.factors.mood_average.risk / 40) * 100}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
          <p className="text-xs text-orange-100/60">
            Contributes {riskData.factors.mood_average.risk.toFixed(1)} points to risk score
          </p>
        </div>

        {/* Trend */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-orange-50">Mood Trend</span>
            </div>
            <span className="text-sm font-semibold text-orange-50 capitalize">
              {riskData.factors.trend.direction}
            </span>
          </div>
          <div className="h-2 rounded-full bg-orange-500/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${(riskData.factors.trend.risk / 30) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <p className="text-xs text-orange-100/60">
            Contributes {riskData.factors.trend.risk.toFixed(1)} points to risk score
          </p>
        </div>

        {/* Volatility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-orange-50">Volatility</span>
            </div>
            <span className="text-sm font-semibold text-orange-50">
              {riskData.factors.volatility.value.toFixed(2)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-orange-500/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-purple-400"
              initial={{ width: 0 }}
              animate={{ width: `${(riskData.factors.volatility.risk / 20) * 100}%` }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          </div>
          <p className="text-xs text-orange-100/60">
            Contributes {riskData.factors.volatility.risk.toFixed(1)} points to risk score
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {riskData.recommendations.length > 0 && (
        <div className="rounded-2xl border border-indigo-400/30 bg-indigo-950/20 p-4">
          <h4 className="text-sm font-semibold text-orange-50 mb-2 flex items-center gap-2">
            <span>💡</span>
            <span>Recommendations</span>
          </h4>
          <ul className="space-y-2">
            {riskData.recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-orange-100/80 flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 p-3 rounded-2xl border border-yellow-400/20 bg-yellow-950/10">
        <p className="text-xs text-yellow-100/70 leading-relaxed">
          ⚠️ <strong>Important:</strong> This assessment is for informational purposes only and is not a medical
          diagnosis. If you're experiencing a mental health crisis, please contact a professional or call your local
          crisis hotline.
        </p>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-center text-orange-100/40">
        Assessed {new Date(riskData.assessed_at).toLocaleString()}
      </div>
    </div>
  )
}
