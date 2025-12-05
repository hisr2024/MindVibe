'use client'

import { useEffect, useState } from 'react'
import { MindVibeLockup } from '@/components/branding'

interface ActivityCounts {
  moods: number
  journals: number
  chats: number
  streak: number
}

interface AchievementProgress {
  key: string
  name: string
  description: string
  rarity: string
  badge_icon?: string
  target_value: number
  progress: number
  unlocked: boolean
  unlocked_at?: string | null
  reward_hint?: string | null
}

interface UnlockableOut {
  key: string
  name: string
  description: string
  kind: string
  rarity: string
  unlocked: boolean
  unlocked_at?: string | null
  reward_data?: Record<string, unknown> | null
}

interface TreeNotification {
  message: string
  tone?: 'success' | 'info' | 'warning'
}

interface ProgressResponse {
  level: number
  xp: number
  next_level_xp: number
  progress_percent: number
  tree_stage: string
  activity: ActivityCounts
  achievements: AchievementProgress[]
  unlockables: UnlockableOut[]
  notifications: TreeNotification[]
}

export interface KarmicTreeClientProps {
  /** Additional className */
  className?: string
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Fallback mock data for UI development
const fallbackProgress: ProgressResponse = {
  level: 1,
  xp: 24,
  next_level_xp: 240,
  progress_percent: 10,
  tree_stage: 'seedling',
  activity: { moods: 3, journals: 2, chats: 4, streak: 1 },
  notifications: [
    {
      message: 'Previewing Karmic Tree in offline mode. Connect to sync live progress.',
      tone: 'info'
    }
  ],
  achievements: [
    {
      key: 'first_journal',
      name: 'Reflection Seed',
      description: 'Write your first private journal entry to plant your tree.',
      rarity: 'common',
      badge_icon: '📝',
      target_value: 1,
      progress: 1,
      unlocked: true,
      unlocked_at: new Date().toISOString(),
      reward_hint: 'Unlocks the Dawnlight badge'
    },
    {
      key: 'journal_10',
      name: 'Roots of Reflection',
      description: 'Complete 10 journal entries to deepen your roots.',
      rarity: 'rare',
      badge_icon: '🌱',
      target_value: 10,
      progress: 2,
      unlocked: false,
      reward_hint: 'Unlocks the Amber Grove theme'
    },
    {
      key: 'chat_explorer',
      name: 'KIAAN Explorer',
      description: 'Complete 10 guided chats with KIAAN.',
      rarity: 'common',
      badge_icon: '💬',
      target_value: 10,
      progress: 4,
      unlocked: false,
      reward_hint: 'Unlocks a prompt booster'
    }
  ],
  unlockables: [
    {
      key: 'dawnlight_badge',
      name: 'Dawnlight Badge',
      description: 'A soft sunrise badge for your first reflection.',
      kind: 'badge',
      rarity: 'common',
      unlocked: true,
      unlocked_at: new Date().toISOString(),
      reward_data: { color: '#f97316' }
    },
    {
      key: 'amber_grove_theme',
      name: 'Amber Grove Theme',
      description: 'A warm theme inspired by mindful journaling.',
      kind: 'theme',
      rarity: 'rare',
      unlocked: false
    }
  ]
}

const stageCopy: Record<string, { title: string; body: string }> = {
  seedling: {
    title: 'Seedling',
    body: 'You have planted the first roots of your practice. Keep watering with quick check-ins.'
  },
  sapling: {
    title: 'Sapling',
    body: 'Your branches are forming as you journal and chat. Stay consistent for new leaves.'
  },
  branching: {
    title: 'Branching',
    body: 'Momentum unlocked. Your routines are creating healthy canopy growth.'
  },
  canopy: {
    title: 'Canopy',
    body: 'You are shining. Premium rewards and rare badges await continued care.'
  }
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.4)]"
        style={{ width: `${Math.min(100, percent)}%` }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

function TreeVisualizer({ stage, percent }: { stage: string; percent: number }) {
  const height = Math.min(180, 120 + percent)
  const canopySize = Math.min(240, 120 + percent)
  const pulse = stage === 'canopy' ? 'animate-pulse' : ''

  return (
    <div
      className="relative h-80 w-full overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      role="img"
      aria-label={`Karmic Tree at ${stageCopy[stage]?.title || 'Growing'} stage`}
    >
      <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(249,115,22,0.12), transparent 30%)' }} />
      <div className="absolute bottom-0 left-1/2 h-full w-[2px] -translate-x-1/2 bg-gradient-to-t from-orange-500 via-orange-400 to-amber-200" style={{ height: `${height}%` }} />
      <div
        className={`absolute bottom-[35%] left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-orange-500/40 via-amber-200/30 to-orange-300/30 blur-3xl ${pulse}`}
        style={{ width: `${canopySize}px`, height: `${canopySize}px` }}
      />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-orange-500/20 via-orange-500/5 to-transparent" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-orange-500/20 px-4 py-1 text-xs font-semibold text-orange-50">
        {stageCopy[stage]?.title || 'Growing'}
      </div>
    </div>
  )
}

/**
 * KarmicTreeClient component - client-side karmic tree visualization.
 * 
 * Features:
 * - Fetches from /api/analytics/karmic_tree (uses mock data as fallback)
 * - Displays tree visualization with growth stages
 * - Shows XP progress, achievements, and unlockables
 * - Accessible and keyboard-navigable
 */
export function KarmicTreeClient({ className = '' }: KarmicTreeClientProps) {
  const [data, setData] = useState<ProgressResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch(`${apiBase}/api/analytics/karmic_tree`, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) throw new Error('Request failed')
        const payload = (await response.json()) as ProgressResponse
        setData(payload)
      } catch {
        // Use fallback data for UI development
        setError('Live data unavailable. Showing demo progress.')
        setData(fallbackProgress)
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  const progress = data ?? fallbackProgress
  const stageNarrative = stageCopy[progress.tree_stage] ?? stageCopy.seedling

  const activityPills = [
    { label: 'Journals', value: progress.activity.journals, accent: 'bg-orange-500/15' },
    { label: 'Mood logs', value: progress.activity.moods, accent: 'bg-amber-400/15' },
    { label: 'Chats', value: progress.activity.chats, accent: 'bg-orange-300/15' }
  ]

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <div className="text-orange-100/70 animate-pulse">Loading Karmic Tree...</div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header Section */}
      <div className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-8 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
        <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr] lg:items-start">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <MindVibeLockup theme="sunrise" className="h-10 w-auto drop-shadow-[0_10px_40px_rgba(255,147,89,0.28)]" />
              <span className="rounded-full bg-orange-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-50">
                Karmic Tree
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-orange-50">Grow with mindful actions</h2>
              <p className="max-w-2xl text-sm text-orange-100/80">
                Earn achievements for journaling, mood tracking, and guided chats. Unlock calming themes and badges as your tree expands.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {activityPills.map(item => (
                <div key={item.label} className={`flex items-center justify-between rounded-2xl border border-orange-500/20 px-4 py-3 text-sm font-semibold text-orange-50 ${item.accent}`}>
                  <span>{item.label}</span>
                  <span className="text-orange-200">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 rounded-2xl border border-orange-500/15 bg-black/50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-orange-50">
                <span>Level {progress.level}</span>
                <span>{progress.xp} xp</span>
              </div>
              <ProgressBar percent={progress.progress_percent} />
              <div className="flex items-center justify-between text-xs text-orange-100/70">
                <span>{stageNarrative.title}</span>
                <span>Next level at {progress.next_level_xp} xp</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-orange-500/20 bg-black/50 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <TreeVisualizer stage={progress.tree_stage} percent={progress.progress_percent} />
            <p className="mt-4 text-sm text-orange-100/75">{stageNarrative.body}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {(progress.notifications.length > 0 || error) && (
        <div className="grid gap-3">
          {error && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
              <span>{error}</span>
              <span className="text-xs uppercase tracking-wide text-white/70">info</span>
            </div>
          )}
          {progress.notifications.map((note, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                note.tone === 'success'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                  : note.tone === 'warning'
                    ? 'border-amber-400/40 bg-amber-500/10 text-amber-50'
                    : 'border-orange-500/25 bg-orange-500/5 text-orange-50'
              }`}
            >
              <span>{note.message}</span>
              <span className="text-xs uppercase tracking-wide text-white/70">{note.tone ?? 'info'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stat Blocks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Achievements */}
        <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
          <h3 className="text-lg font-semibold text-orange-50 mb-4">Achievements</h3>
          <div className="space-y-3">
            {progress.achievements.map(achievement => (
              <div
                key={achievement.key}
                className="flex items-start gap-3 rounded-xl border border-orange-500/15 bg-black/30 p-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-xl">
                  {achievement.badge_icon || '🌿'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-orange-50">{achievement.name}</span>
                    <span className={`text-xs ${achievement.unlocked ? 'text-emerald-300' : 'text-orange-200'}`}>
                      {achievement.unlocked ? 'Unlocked' : `${achievement.progress}/${achievement.target_value}`}
                    </span>
                  </div>
                  <p className="text-xs text-orange-100/70 mt-1">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unlockables */}
        <div className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
          <h3 className="text-lg font-semibold text-orange-50 mb-4">Unlockables</h3>
          <div className="space-y-3">
            {progress.unlockables.map(unlockable => (
              <div
                key={unlockable.key}
                className="rounded-xl border border-orange-500/15 bg-black/30 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-orange-50">{unlockable.name}</span>
                  <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-orange-100">
                    {unlockable.kind}
                  </span>
                </div>
                <p className="text-xs text-orange-100/70 mt-1">{unlockable.description}</p>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="uppercase tracking-wide text-orange-200">{unlockable.rarity}</span>
                  <span className={unlockable.unlocked ? 'text-emerald-300' : 'text-orange-200'}>
                    {unlockable.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default KarmicTreeClient
