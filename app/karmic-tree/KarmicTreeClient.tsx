'use client'

import { useEffect, useMemo, useState } from 'react'
import { MindVibeLockup } from '@/components/branding'
import { AnimatedCard, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui'
import { apiFetch } from '@/lib/api'
import { AnalyticsDashboard } from '@/components/analytics'

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

/**
 * Honest empty state when API is unavailable.
 * No fake data — only real user data from the API should populate these fields.
 */
const fallbackProgress: ProgressResponse = {
  level: 0,
  xp: 0,
  next_level_xp: 100,
  progress_percent: 0,
  tree_stage: 'seedling',
  activity: { moods: 0, journals: 0, chats: 0, streak: 0 },
  notifications: [
    {
      message: 'Unable to load live data. Connect to the internet to see your real progress.',
      tone: 'warning'
    }
  ],
  achievements: [],
  unlockables: []
}

const rarityAccent: Record<string, string> = {
  common: 'border-[#d4a44c]/30 text-[#f5f0e8]',
  rare: 'border-[#d4a44c]/60 text-[#f5f0e8]',
  epic: 'border-purple-400/60 text-purple-100',
  legendary: 'border-pink-400/70 text-pink-100'
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
        className="h-full rounded-full bg-gradient-to-r from-[#d4a44c] via-[#e8b54a] to-[#d4a44c] shadow-[0_0_25px_rgba(249,115,22,0.4)]"
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  )
}

function AchievementBadge({ achievement }: { achievement: AchievementProgress }) {
  const percentage = Math.min(100, Math.round((achievement.progress / achievement.target_value) * 100))
  const accent = rarityAccent[achievement.rarity] || 'border-[#d4a44c]/30 text-[#f5f0e8]'

  return (
    <div className={`flex flex-col gap-2 rounded-2xl border bg-slate-950/60 p-4 shadow-lg shadow-[#d4a44c]/5 ${accent}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a44c]/10 text-xl">
            {achievement.badge_icon || '🌿'}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f5f0e8]">{achievement.name}</p>
            <p className="text-xs text-[#f5f0e8]/70">{achievement.description}</p>
          </div>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wide text-[#f5f0e8]/80">
          {achievement.rarity}
        </span>
      </div>
      <ProgressBar percent={percentage} />
      <div className="flex items-center justify-between text-xs text-[#f5f0e8]/70">
        <span>
          {achievement.progress} / {achievement.target_value}
        </span>
        <span className={achievement.unlocked ? 'text-emerald-300' : 'text-[#e8b54a]'}>
          {achievement.unlocked ? 'Unlocked' : 'In progress'}
        </span>
      </div>
      {achievement.reward_hint && (
        <p className="text-[11px] text-[#f5f0e8]/60">{achievement.reward_hint}</p>
      )}
    </div>
  )
}

function UnlockableCard({ unlockable }: { unlockable: UnlockableOut }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#d4a44c]/20 bg-slate-950/70 p-4 shadow-lg shadow-[#d4a44c]/10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-[#f5f0e8]">{unlockable.name}</p>
          <p className="text-xs text-[#f5f0e8]/70">{unlockable.description}</p>
        </div>
        <span className="rounded-full bg-[#d4a44c]/15 px-3 py-1 text-[11px] uppercase tracking-wide text-[#f5f0e8]">
          {unlockable.kind}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-[#f5f0e8]/70">
        <span className="uppercase tracking-wide text-[11px] text-[#e8b54a]">{unlockable.rarity}</span>
        <span className={unlockable.unlocked ? 'text-emerald-300' : 'text-[#e8b54a]'}>
          {unlockable.unlocked ? 'Unlocked' : 'Locked'}
        </span>
      </div>
    </div>
  )
}

function TreeVisualizer({ stage, percent }: { stage: string; percent: number }) {
  const height = Math.min(180, 120 + percent)
  const canopySize = Math.min(240, 120 + percent)
  const pulse = stage === 'canopy' ? 'animate-pulse' : ''

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-[#d4a44c]/20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(249,115,22,0.12), transparent 30%)' }} />
      <div className="absolute bottom-0 left-1/2 h-full w-[2px] -translate-x-1/2 bg-gradient-to-t from-[#d4a44c] via-[#d4a44c] to-[#f0c96d]" style={{ height: `${height}%` }} />
      <div
        className={`absolute bottom-[35%] left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-[#d4a44c]/40 via-[#f0c96d]/30 to-[#e8b54a]/30 blur-3xl ${pulse}`}
        style={{ width: `${canopySize}px`, height: `${canopySize}px` }}
      />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#d4a44c]/20 via-[#d4a44c]/5 to-transparent" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-[#d4a44c]/20 px-4 py-1 text-xs font-semibold text-[#f5f0e8]">
        {stageCopy[stage]?.title || 'Growing'}
      </div>
    </div>
  )
}

export default function KarmicTreeClient() {
  const [data, setData] = useState<ProgressResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | undefined>()

  useEffect(() => {
    // Resolve user ID for analytics
    const profile = localStorage.getItem('mindvibe_profile')
    if (profile) {
      try {
        const parsed = JSON.parse(profile)
        setUserId(parsed.email || 'local-user')
      } catch {
        setUserId('local-user')
      }
    } else {
      setUserId('local-user')
    }

    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await apiFetch('/api/karmic-tree/progress', {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) throw new Error('Request failed')
        const payload = (await response.json()) as ProgressResponse
        setData(payload)
      } catch (err) {
        console.error('Karmic Tree fetch failed', err)
        setError('Live data unavailable. Your real progress will appear when connected.')
        setData(fallbackProgress)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  const progress = data ?? fallbackProgress

  const stageNarrative = useMemo(() => stageCopy[progress.tree_stage] ?? stageCopy.seedling, [progress.tree_stage])

  const activityPills = [
    { label: 'Journals', value: progress.activity.journals, accent: 'bg-[#d4a44c]/15' },
    { label: 'Mood logs', value: progress.activity.moods, accent: 'bg-[#d4a44c]/15' },
    { label: 'Chats', value: progress.activity.chats, accent: 'bg-[#e8b54a]/15' }
  ]

  const notifications = [...(progress.notifications || []), ...(error ? [{ message: error, tone: 'warning' as const }] : [])]

  return (
    <main className="mx-auto max-w-6xl space-y-6 sm:space-y-8 md:space-y-10 px-3 sm:px-4 pb-28 sm:pb-16 pt-4 sm:pt-8 md:pt-12">
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-4 sm:p-6 md:p-8 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
          <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-[#d4a44c]/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-[#e8b54a]/10 blur-3xl" />

          <div className="relative grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-[1.4fr,1fr] lg:items-start">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <MindVibeLockup theme="sunrise" className="h-10 w-auto drop-shadow-[0_10px_40px_rgba(255,147,89,0.28)]" />
                <span className="rounded-full bg-[#d4a44c]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5f0e8]">
                  Karmic Tree
                </span>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-[#f5f0e8] md:text-4xl">Grow with mindful actions</h1>
                <p className="max-w-2xl text-[#f5f0e8]/80">
                  Earn achievements for journaling, mood tracking, and guided chats. Unlock calming themes and badges as your tree expands.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {activityPills.map(item => (
                  <div key={item.label} className={`flex items-center justify-between rounded-2xl border border-[#d4a44c]/20 px-4 py-3 text-sm font-semibold text-[#f5f0e8] ${item.accent}`}>
                    <span>{item.label}</span>
                    <span className="text-[#e8b54a]">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 rounded-2xl border border-[#d4a44c]/15 bg-black/50 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-[#f5f0e8]">
                  <span>Level {progress.level}</span>
                  <span>{progress.xp} xp</span>
                </div>
                <ProgressBar percent={progress.progress_percent} />
                <div className="flex items-center justify-between text-xs text-[#f5f0e8]/70">
                  <span>{stageNarrative.title}</span>
                  <span>Next level at {progress.next_level_xp} xp</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#d4a44c]/20 bg-black/50 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
              <TreeVisualizer stage={progress.tree_stage} percent={progress.progress_percent} />
              <p className="mt-4 text-sm text-[#f5f0e8]/75">{stageNarrative.body}</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {notifications.length > 0 && (
        <div className="grid gap-3">
          {notifications.map((note, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                note.tone === 'success'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                  : note.tone === 'warning'
                    ? 'border-[#d4a44c]/40 bg-[#d4a44c]/10 text-[#f5f0e8]'
                    : 'border-[#d4a44c]/25 bg-[#d4a44c]/5 text-[#f5f0e8]'
              }`}
            >
              <span>{note.message}</span>
              <span className="text-xs uppercase tracking-wide text-white/70">{note.tone ?? 'info'}</span>
            </div>
          ))}
        </div>
      )}

      <StaggerContainer className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StaggerItem className="lg:col-span-2">
          <AnimatedCard className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-[#e8b54a]/80">Achievements</p>
                <h2 className="text-xl font-semibold text-[#f5f0e8]">Unlock branches as you care for yourself</h2>
              </div>
              <span className="rounded-full bg-[#d4a44c]/20 px-3 py-1 text-[11px] font-semibold text-[#f5f0e8]">
                Privacy-safe counts only
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {progress.achievements.map(achievement => (
                <AchievementBadge key={achievement.key} achievement={achievement} />
              ))}
            </div>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#f5f0e8]">Unlockables</h3>
              <span className="rounded-full bg-[#d4a44c]/15 px-3 py-1 text-[11px] uppercase tracking-wide text-[#f5f0e8]">Rewards</span>
            </div>
            <div className="space-y-3">
              {progress.unlockables.map(unlockable => (
                <UnlockableCard key={unlockable.key} unlockable={unlockable} />
              ))}
            </div>
          </AnimatedCard>
        </StaggerItem>
      </StaggerContainer>

      {/* ─── Analytics Section ─── */}
      <FadeIn>
        <div className="rounded-2xl sm:rounded-3xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-4 sm:p-6 md:p-8 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{'\u{1F4CA}'}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#f5f0e8]">Your Analytics</h2>
            </div>
            <p className="text-sm text-[#f5f0e8]/60">
              Real insights from your wellness journey — all data comes from your actual activity.
            </p>
          </div>
          <AnalyticsDashboard userId={userId} />
        </div>
      </FadeIn>
    </main>
  )
}
