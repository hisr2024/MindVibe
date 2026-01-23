'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

interface VoiceOverview {
  total_queries_today: number
  total_queries_week: number
  total_queries_month: number
  unique_users_today: number
  unique_users_week: number
  unique_users_month: number
  avg_latency_ms: number | null
  p95_latency_ms: number | null
  avg_rating: number | null
  cache_hit_rate: number
  estimated_cost_usd: number
}

interface VoiceTrends {
  daily_stats: Array<{
    date: string
    total_queries: number
    unique_users: number
    avg_latency_ms: number | null
    avg_rating: number | null
    error_count: number
  }>
  language_distribution: Record<string, number>
  voice_type_distribution: Record<string, number>
  concern_distribution: Record<string, number>
  emotion_distribution: Record<string, number>
  enhancement_usage: {
    binaural: number
    spatial: number
    breathing: number
  }
}

interface VoiceQuality {
  avg_stt_confidence: number | null
  avg_tts_latency_ms: number | null
  total_characters_synthesized: number
  total_audio_minutes: number
  cache_hit_rate: number
  error_rate: number
}

interface EnhancementStats {
  total_sessions: number
  binaural_sessions: number
  spatial_sessions: number
  breathing_sessions: number
  avg_duration_seconds: number | null
  avg_effectiveness_rating: number | null
  completion_rate: number
}

const COLORS = ['#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6']
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  sa: 'Sanskrit',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ja: 'Japanese',
  zh: 'Chinese',
}

export default function AdminVoiceAnalyticsPage() {
  const [overview, setOverview] = useState<VoiceOverview | null>(null)
  const [trends, setTrends] = useState<VoiceTrends | null>(null)
  const [quality, setQuality] = useState<VoiceQuality | null>(null)
  const [enhancements, setEnhancements] = useState<EnhancementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDays, setSelectedDays] = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [overviewRes, trendsRes, qualityRes, enhancementsRes] = await Promise.all([
        fetch('/api/admin/voice/overview'),
        fetch(`/api/admin/voice/trends?days=${selectedDays}`),
        fetch(`/api/admin/voice/quality?days=${selectedDays}`),
        fetch(`/api/admin/voice/enhancements?days=${selectedDays}`),
      ])

      if (!overviewRes.ok || !trendsRes.ok || !qualityRes.ok || !enhancementsRes.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const [overviewData, trendsData, qualityData, enhancementsData] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        qualityRes.json(),
        enhancementsRes.json(),
      ])

      setOverview(overviewData)
      setTrends(trendsData)
      setQuality(qualityData)
      setEnhancements(enhancementsData)
    } catch (err) {
      console.error('Failed to fetch voice analytics:', err)
      setError('Failed to load analytics data. Using demo mode.')

      // Set demo data for development
      setOverview({
        total_queries_today: 847,
        total_queries_week: 5432,
        total_queries_month: 21543,
        unique_users_today: 234,
        unique_users_week: 1245,
        unique_users_month: 3421,
        avg_latency_ms: 245,
        p95_latency_ms: 450,
        avg_rating: 4.6,
        cache_hit_rate: 78.5,
        estimated_cost_usd: 45.23,
      })

      setTrends({
        daily_stats: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
          total_queries: Math.floor(Math.random() * 500) + 200,
          unique_users: Math.floor(Math.random() * 150) + 50,
          avg_latency_ms: Math.floor(Math.random() * 100) + 200,
          avg_rating: 4 + Math.random(),
          error_count: Math.floor(Math.random() * 10),
        })),
        language_distribution: { en: 8542, hi: 3421, ta: 1234, te: 987, bn: 654, es: 432 },
        voice_type_distribution: { friendly: 12543, calm: 5432, wisdom: 3456 },
        concern_distribution: { anxiety: 4532, stress: 3421, sleep: 2134, relationships: 1543 },
        emotion_distribution: { neutral: 5432, peace: 3421, sadness: 2134, hope: 1876 },
        enhancement_usage: { binaural: 1234, spatial: 876, breathing: 2345 },
      })

      setQuality({
        avg_stt_confidence: 0.92,
        avg_tts_latency_ms: 145,
        total_characters_synthesized: 45678900,
        total_audio_minutes: 1234.5,
        cache_hit_rate: 78.5,
        error_rate: 0.8,
      })

      setEnhancements({
        total_sessions: 4455,
        binaural_sessions: 1234,
        spatial_sessions: 876,
        breathing_sessions: 2345,
        avg_duration_seconds: 345,
        avg_effectiveness_rating: 4.2,
        completion_rate: 82.5,
      })
    } finally {
      setLoading(false)
    }
  }, [selectedDays])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatNumber = (n: number) => n.toLocaleString()
  const formatMs = (ms: number | null) => (ms ? `${ms}ms` : '-')
  const formatCost = (cost: number) => `$${cost.toFixed(2)}`

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
          <p className="text-slate-400">Loading voice analytics...</p>
        </div>
      </div>
    )
  }

  const languageData = trends
    ? Object.entries(trends.language_distribution)
        .map(([code, count]) => ({
          name: LANGUAGE_NAMES[code] || code,
          value: count,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    : []

  const concernData = trends
    ? Object.entries(trends.concern_distribution)
        .map(([concern, count]) => ({
          concern: concern.charAt(0).toUpperCase() + concern.slice(1),
          count,
        }))
        .sort((a, b) => b.count - a.count)
    : []

  const emotionData = trends
    ? Object.entries(trends.emotion_distribution)
        .map(([emotion, count]) => ({
          name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
          value: count,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            <span className="mr-2">🎙️</span>
            KIAAN Voice Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Real-time voice interaction metrics, TTS quality, and user engagement
          </p>
        </div>
        <select
          value={selectedDays}
          onChange={(e) => setSelectedDays(Number(e.target.value))}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-400">{error}</p>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Voice Queries Today</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {formatNumber(overview?.total_queries_today || 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatNumber(overview?.unique_users_today || 0)} unique users
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Avg Latency</p>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {formatMs(overview?.avg_latency_ms || null)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            P95: {formatMs(overview?.p95_latency_ms || null)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">User Rating</p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">
            {overview?.avg_rating ? `${overview.avg_rating}/5.0` : '-'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Cache hit: {overview?.cache_hit_rate?.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">TTS Cost (Month)</p>
          <p className="mt-1 text-2xl font-bold text-orange-400">
            {formatCost(overview?.estimated_cost_usd || 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatNumber(overview?.total_queries_month || 0)} queries
          </p>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-sm text-slate-400">STT Confidence</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">
            {quality?.avg_stt_confidence ? `${(quality.avg_stt_confidence * 100).toFixed(1)}%` : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-sm text-slate-400">TTS Latency</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">
            {formatMs(quality?.avg_tts_latency_ms || null)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-sm text-slate-400">Audio Generated</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">
            {quality?.total_audio_minutes?.toFixed(0)} min
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-sm text-slate-400">Error Rate</p>
          <p className="mt-1 text-xl font-semibold text-red-400">
            {quality?.error_rate?.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Usage Trend Chart */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Voice Usage Trend</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trends?.daily_stats || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tickFormatter={(val) => val.slice(5)}
            />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              labelStyle={{ color: '#f8fafc' }}
            />
            <Area
              type="monotone"
              dataKey="total_queries"
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.2}
              name="Queries"
            />
            <Area
              type="monotone"
              dataKey="unique_users"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.2}
              name="Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Language Distribution & Emotions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Language Distribution */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Language Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={languageData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {languageData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            {languageData.slice(0, 6).map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion Detection */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Detected Emotions</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={emotionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" width={70} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              />
              <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Concern Distribution */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">User Concerns (Aggregated)</h2>
        <p className="mb-4 text-xs text-slate-500">
          * Topics are aggregated and anonymized. No individual conversation data exposed.
        </p>
        <div className="space-y-3">
          {concernData.map((item) => (
            <div key={item.concern} className="flex items-center gap-4">
              <span className="w-28 text-sm text-slate-300">{item.concern}</span>
              <div className="flex-1">
                <div className="h-4 rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
                    style={{ width: `${(item.count / (concernData[0]?.count || 1)) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-16 text-right text-sm text-slate-400">
                {formatNumber(item.count)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Enhancement Sessions */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Voice Enhancement Sessions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {formatNumber(enhancements?.binaural_sessions || 0)}
            </p>
            <p className="mt-1 text-sm text-slate-400">Binaural Beats</p>
          </div>
          <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {formatNumber(enhancements?.spatial_sessions || 0)}
            </p>
            <p className="mt-1 text-sm text-slate-400">Spatial Audio</p>
          </div>
          <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-4 text-center">
            <p className="text-2xl font-bold text-teal-400">
              {formatNumber(enhancements?.breathing_sessions || 0)}
            </p>
            <p className="mt-1 text-sm text-slate-400">Breathing Sync</p>
          </div>
          <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {enhancements?.completion_rate?.toFixed(1)}%
            </p>
            <p className="mt-1 text-sm text-slate-400">Completion Rate</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="text-sm">
            <span className="text-slate-400">Avg Session Duration: </span>
            <span className="text-slate-200">
              {enhancements?.avg_duration_seconds
                ? `${Math.floor(enhancements.avg_duration_seconds / 60)}m ${enhancements.avg_duration_seconds % 60}s`
                : '-'}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-slate-400">Avg Effectiveness Rating: </span>
            <span className="text-yellow-400">
              {enhancements?.avg_effectiveness_rating
                ? `${enhancements.avg_effectiveness_rating}/5.0`
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Voice Type Distribution */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Voice Type Preferences</h2>
        <div className="flex gap-6 flex-wrap">
          {trends &&
            Object.entries(trends.voice_type_distribution).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
                  <span className="text-xl">
                    {type === 'friendly' ? '😊' : type === 'calm' ? '🧘' : '📖'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-200 capitalize">{type}</p>
                  <p className="text-sm text-slate-400">{formatNumber(count)} uses</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
