/**
 * Mood Forecast Chart Component
 *
 * Displays 7-day mood predictions with confidence interval bands.
 *
 * Quantum Enhancement #6: Advanced Analytics Dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'

interface MoodPrediction {
  date: string
  predicted_score: number
  confidence_low: number
  confidence_high: number
  confidence_level: number
}

interface ForecastData {
  forecast_days: number
  predictions: MoodPrediction[]
  model_info: {
    type: string
    training_data_points: number
    last_updated: string
  }
}

interface MoodForecastChartProps {
  forecastDays?: number
  className?: string
}

export function MoodForecastChart({ forecastDays = 7, className = '' }: MoodForecastChartProps) {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchForecast()
  }, [forecastDays])

  const fetchForecast = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/advanced/mood-predictions?forecast_days=${forecastDays}`, { credentials: 'include' })

      if (!response.ok) {
        throw new Error('Failed to fetch mood forecast')
      }

      const data = await response.json()
      setForecastData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecast')
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

  if (error || !forecastData) {
    return (
      <div className={`rounded-3xl border border-red-500/15 bg-black/50 p-6 ${className}`}>
        <p className="text-red-400 text-center">{error || 'No data available'}</p>
      </div>
    )
  }

  // Transform data for chart
  const chartData = forecastData.predictions.map((pred) => ({
    date: new Date(pred.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    predicted: pred.predicted_score,
    confidenceLow: pred.confidence_low,
    confidenceHigh: pred.confidence_high,
    confidence: pred.confidence_level
  }))

  // Calculate average predicted score
  const scores = forecastData.predictions.map(p => p.predicted_score)
  const avgPredicted = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0

  // Determine trend
  const firstScore = forecastData.predictions[0]?.predicted_score || 0
  const lastScore = forecastData.predictions[forecastData.predictions.length - 1]?.predicted_score || 0
  const trend = lastScore > firstScore ? 'improving' : lastScore < firstScore ? 'declining' : 'stable'

  return (
    <div className={`rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#f5f0e8] mb-1 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#d4a44c]" />
            Mood Forecast
          </h3>
          <p className="text-sm text-[#f5f0e8]/60">
            {forecastDays}-day prediction with confidence intervals
          </p>
        </div>

        {/* Trend Badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            trend === 'improving'
              ? 'bg-green-500/20 text-green-400'
              : trend === 'declining'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          {trend === 'improving' ? '📈 Improving' : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 p-3">
          <div className="text-xs text-[#f5f0e8]/60 mb-1">Avg Predicted</div>
          <div className="text-2xl font-bold text-[#f5f0e8]">{avgPredicted.toFixed(1)}</div>
        </div>
        <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 p-3">
          <div className="text-xs text-[#f5f0e8]/60 mb-1">Best Day</div>
          <div className="text-2xl font-bold text-green-400">
            {(scores.length > 0 ? Math.max(...scores) : 0).toFixed(1)}
          </div>
        </div>
        <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 p-3">
          <div className="text-xs text-[#f5f0e8]/60 mb-1">Lowest Day</div>
          <div className="text-2xl font-bold text-red-400">
            {(scores.length > 0 ? Math.min(...scores) : 0).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 164, 76, 0.1)" />
            <XAxis
              dataKey="date"
              stroke="rgba(212, 164, 76, 0.6)"
              tick={{ fill: 'rgba(212, 164, 76, 0.8)', fontSize: 11 }}
            />
            <YAxis
              domain={[0, 10]}
              stroke="rgba(212, 164, 76, 0.6)"
              tick={{ fill: 'rgba(212, 164, 76, 0.8)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(212, 164, 76, 0.3)',
                borderRadius: '12px',
                padding: '8px 12px'
              }}
              labelStyle={{ color: '#FFF5E6', fontSize: 12 }}
              itemStyle={{ color: '#FF7327', fontSize: 11 }}
            />

            {/* Confidence band (area) */}
            <Area
              type="monotone"
              dataKey="confidenceHigh"
              stroke="none"
              fill="rgba(59, 130, 246, 0.1)"
            />
            <Area
              type="monotone"
              dataKey="confidenceLow"
              stroke="none"
              fill="rgba(59, 130, 246, 0.1)"
            />

            {/* Prediction line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info Box */}
      <div className="rounded-2xl border border-blue-400/30 bg-blue-950/20 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-100/80 leading-relaxed">
            <strong>About this forecast:</strong> Predictions are based on your last{' '}
            {forecastData.model_info.training_data_points} mood entries and historical patterns.
            Confidence decreases for dates further in the future. The shaded area shows the prediction range.
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="mt-3 text-xs text-center text-[#f5f0e8]/40">
        Model: {forecastData.model_info.type} • Updated{' '}
        {new Date(forecastData.model_info.last_updated).toLocaleString()}
      </div>
    </div>
  )
}
