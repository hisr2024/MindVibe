'use client'

/**
 * MoodJourneyPanel - Self-Awareness Mirror for KIAAN companion.
 *
 * Shows the user their emotional journey over time:
 * - Mood frequency distribution (visual bars)
 * - Emotional trend (improving / stable / needs attention)
 * - Daily mood timeline
 * - Pattern insights and growth areas
 * - Friendship milestones and streaks
 */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface MoodTrendsData {
  mood_distribution: Record<string, number>
  top_moods: string[]
  trend: string
  total_entries: number
  insights: string[]
  growth_areas: string[]
  strengths: string[]
  timeline: { date: string; primary_mood: string; mood_count: number }[]
  period_days: number
}

interface MilestoneData {
  total_sessions: number
  total_messages: number
  current_streak: number
  longest_streak: number
  sessions_with_improvement: number
  total_days_active: number
  friendship_level: string
  milestones: {
    threshold: number
    title: string
    description: string
    level: string
    achieved: boolean
  }[]
}

interface MoodJourneyPanelProps {
  onClose: () => void
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '\uD83D\uDE0A', sad: '\uD83D\uDE22', anxious: '\uD83D\uDE30',
  angry: '\uD83D\uDE24', confused: '\uD83E\uDD14', peaceful: '\uD83E\uDDD8',
  hopeful: '\u2728', lonely: '\uD83D\uDC99', grateful: '\uD83D\uDE4F',
  neutral: '\uD83D\uDE0C', excited: '\uD83C\uDF89', overwhelmed: '\uD83C\uDF0A',
  hurt: '\uD83D\uDC94', jealous: '\uD83D\uDE15', guilty: '\uD83D\uDE14',
  fearful: '\uD83D\uDE28', frustrated: '\uD83D\uDE23', stressed: '\uD83E\uDD2F',
}

const TREND_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  improving: { label: 'Growing Stronger', color: 'text-emerald-400', icon: '\u2191' },
  stable: { label: 'Steady Ground', color: 'text-blue-400', icon: '\u2192' },
  needs_attention: { label: 'Needs Care', color: 'text-amber-400', icon: '\u2193' },
}

const MILESTONE_ICONS: Record<string, string> = {
  new_friend: '\uD83C\uDF31', familiar: '\uD83C\uDF3F', close: '\uD83C\uDF33',
  deep: '\uD83C\uDF38', divine: '\uD83D\uDD49\uFE0F', eternal: '\u2728',
  streak: '\uD83D\uDD25',
}

export default function MoodJourneyPanel({ onClose }: MoodJourneyPanelProps) {
  const [tab, setTab] = useState<'trends' | 'milestones'>('trends')
  const [trends, setTrends] = useState<MoodTrendsData | null>(null)
  const [milestones, setMilestones] = useState<MilestoneData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [trendsRes, milestonesRes] = await Promise.all([
        apiFetch('/api/companion/insights/mood-trends?days=30'),
        apiFetch('/api/companion/insights/milestones'),
      ])

      if (trendsRes.ok) setTrends(await trendsRes.json())
      if (milestonesRes.ok) setMilestones(await milestonesRes.json())
    } catch {
      // Silently fail — panel shows "no data yet"
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const trendConfig = TREND_CONFIG[trends?.trend || 'stable']

  return (
    <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/80">Your Journey</h3>
        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setTab('trends')}
              className={`px-3 py-1 text-[10px] rounded-md transition-all ${
                tab === 'trends' ? 'bg-white/10 text-white/90' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Mood Map
            </button>
            <button
              onClick={() => setTab('milestones')}
              className={`px-3 py-1 text-[10px] rounded-md transition-all ${
                tab === 'milestones' ? 'bg-white/10 text-white/90' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Milestones
            </button>
          </div>
          <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
          </div>
        ) : tab === 'trends' ? (
          <TrendsView trends={trends} trendConfig={trendConfig} />
        ) : (
          <MilestonesView milestones={milestones} />
        )}
      </div>
    </div>
  )
}

function TrendsView({
  trends,
  trendConfig,
}: {
  trends: MoodTrendsData | null
  trendConfig: { label: string; color: string; icon: string }
}) {
  if (!trends || trends.total_entries === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-white/40 text-xs">Start chatting with KIAAN to see your mood patterns here.</p>
      </div>
    )
  }

  const maxPercent = Math.max(...Object.values(trends.mood_distribution), 1)

  return (
    <div className="space-y-4">
      {/* Trend indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
        <span className={`text-lg ${trendConfig.color}`}>{trendConfig.icon}</span>
        <div>
          <p className={`text-xs font-medium ${trendConfig.color}`}>{trendConfig.label}</p>
          <p className="text-[10px] text-white/30">Last 30 days - {trends.total_entries} check-ins</p>
        </div>
      </div>

      {/* Mood distribution bars */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Mood Map</p>
        {Object.entries(trends.mood_distribution).slice(0, 8).map(([mood, percent]) => (
          <div key={mood} className="flex items-center gap-2">
            <span className="text-xs w-4">{MOOD_EMOJI[mood] || ''}</span>
            <span className="text-[10px] text-white/50 w-16 truncate capitalize">{mood}</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-700"
                style={{ width: `${(percent / maxPercent) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-white/30 w-8 text-right">{percent}%</span>
          </div>
        ))}
      </div>

      {/* Timeline (last 7 days) */}
      {trends.timeline.length > 0 && (
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Recent Days</p>
          <div className="flex gap-1.5">
            {trends.timeline.slice(-7).map((day) => (
              <div key={day.date} className="flex-1 text-center">
                <div className="w-full aspect-square rounded-lg bg-white/5 flex items-center justify-center mb-0.5">
                  <span className="text-sm">{MOOD_EMOJI[day.primary_mood] || '\uD83D\uDE0C'}</span>
                </div>
                <p className="text-[8px] text-white/30">{day.date.slice(8)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {trends.insights.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Insights</p>
          {trends.insights.map((insight, i) => (
            <p key={i} className="text-[11px] text-white/60 pl-3 border-l-2 border-violet-500/30">
              {insight}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function MilestonesView({ milestones }: { milestones: MilestoneData | null }) {
  if (!milestones) {
    return (
      <div className="text-center py-6">
        <p className="text-white/40 text-xs">Start your journey to unlock milestones.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center px-2 py-2 rounded-xl bg-white/5">
          <p className="text-lg font-bold text-violet-400">{milestones.total_sessions}</p>
          <p className="text-[9px] text-white/30">Sessions</p>
        </div>
        <div className="text-center px-2 py-2 rounded-xl bg-white/5">
          <p className="text-lg font-bold text-amber-400">{milestones.current_streak}</p>
          <p className="text-[9px] text-white/30">Streak</p>
        </div>
        <div className="text-center px-2 py-2 rounded-xl bg-white/5">
          <p className="text-lg font-bold text-emerald-400">{milestones.sessions_with_improvement}</p>
          <p className="text-[9px] text-white/30">Improved</p>
        </div>
      </div>

      {/* Friendship level */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
        <span className="text-lg">{
          milestones.friendship_level === 'deep' ? '\uD83C\uDF38' :
          milestones.friendship_level === 'close' ? '\uD83C\uDF33' :
          milestones.friendship_level === 'familiar' ? '\uD83C\uDF3F' :
          '\uD83C\uDF31'
        }</span>
        <div>
          <p className="text-xs font-medium text-violet-300 capitalize">{milestones.friendship_level} Friend</p>
          <p className="text-[10px] text-white/30">{milestones.total_days_active} days together</p>
        </div>
      </div>

      {/* Milestones list */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-white/40 uppercase tracking-wider">Milestones</p>
        {milestones.milestones.map((m, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              m.achieved ? 'bg-white/5' : 'bg-white/[0.02] opacity-50'
            }`}
          >
            <span className="text-sm">{MILESTONE_ICONS[m.level] || '\u2B50'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-medium ${m.achieved ? 'text-white/80' : 'text-white/30'}`}>
                {m.title}
              </p>
              <p className="text-[9px] text-white/30 truncate">{m.description}</p>
            </div>
            {m.achieved && (
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
