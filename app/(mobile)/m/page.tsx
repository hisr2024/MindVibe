'use client'

/**
 * Mobile Home Page
 *
 * The main dashboard for the MindVibe mobile experience.
 * Touch-optimized with quick actions, mood check-in, journey progress,
 * and dynamic daily wisdom. Includes loading skeletons and graceful
 * error handling for offline-first support.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Compass,
  PenLine,
  Zap,
  ChevronRight,
  BookOpen,
  Star,
  Grid3X3,
  RefreshCw,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

// Mood options with emojis and colors - score maps to backend (-2 to 2 scale)
const MOOD_OPTIONS = [
  { id: 'great', label: 'Great', emoji: '😊', color: 'from-green-500 to-emerald-400', score: 2 },
  { id: 'good', label: 'Good', emoji: '🙂', color: 'from-yellow-500 to-amber-400', score: 1 },
  { id: 'okay', label: 'Okay', emoji: '😐', color: 'from-blue-500 to-cyan-400', score: 0 },
  { id: 'low', label: 'Low', emoji: '😔', color: 'from-purple-500 to-indigo-400', score: -1 },
  { id: 'struggling', label: 'Struggling', emoji: '😢', color: 'from-red-500 to-pink-400', score: -2 },
]

// Quick action cards
const QUICK_ACTIONS = [
  {
    id: 'kiaan',
    label: 'Talk to KIAAN',
    description: 'AI wisdom companion',
    icon: Sparkles,
    href: '/m/kiaan',
    gradient: 'from-orange-500/20 to-amber-500/20',
    iconColor: 'text-orange-400',
  },
  {
    id: 'journal',
    label: 'Write in Journal',
    description: 'Sacred reflections',
    icon: PenLine,
    href: '/m/journal',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
  },
  {
    id: 'journeys',
    label: 'Continue Journey',
    description: 'Transformational path',
    icon: Compass,
    href: '/m/journeys',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-400',
  },
  {
    id: 'wisdom',
    label: 'Daily Wisdom',
    description: 'Ancient teachings',
    icon: BookOpen,
    href: '/m/wisdom',
    gradient: 'from-teal-500/20 to-green-500/20',
    iconColor: 'text-teal-400',
  },
  {
    id: 'tools',
    label: 'All Tools',
    description: 'Spiritual toolkit',
    icon: Grid3X3,
    href: '/m/tools',
    gradient: 'from-indigo-500/20 to-violet-500/20',
    iconColor: 'text-indigo-400',
  },
]

interface DashboardData {
  activeJourney?: {
    id: string
    title: string
    progress: number
    currentDay: number
    totalDays: number
  }
  streak: number
  todayMood?: string
  insightsCount: number
  journalEntries: number
}

interface DailyWisdom {
  translation: string
  chapter: number
  verse: number
}

// Fallback wisdom for when API is unavailable
const FALLBACK_WISDOM: DailyWisdom = {
  translation: 'You have the right to perform your actions, but you are not entitled to the fruits of the actions.',
  chapter: 2,
  verse: 47,
}

/** Loading skeleton for the home page */
function HomeSkeleton() {
  return (
    <div className="px-4 pt-2 pb-8 space-y-6 animate-pulse">
      {/* Greeting skeleton */}
      <div className="pt-safe">
        <div className="h-4 w-28 bg-white/[0.06] rounded-lg" />
        <div className="h-7 w-48 bg-white/[0.08] rounded-lg mt-2" />
      </div>

      {/* Mood card skeleton */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <div className="h-4 w-36 bg-white/[0.06] rounded-lg mb-4" />
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 h-16 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="h-6 w-8 bg-white/[0.06] rounded mx-auto mb-1" />
            <div className="h-3 w-14 bg-white/[0.04] rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div>
        <div className="h-4 w-24 bg-white/[0.06] rounded-lg mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
          ))}
        </div>
      </div>

      {/* Wisdom skeleton */}
      <div className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
    </div>
  )
}

export default function MobileHomePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    streak: 0,
    insightsCount: 0,
    journalEntries: 0,
  })
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [moodSaved, setMoodSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dailyWisdom, setDailyWisdom] = useState<DailyWisdom>(FALLBACK_WISDOM)
  const [hasError, setHasError] = useState(false)

  // Get greeting based on time of day
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours()
    if (hour < 5) return 'Late night'
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Good night'
  }, [])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setHasError(false)

      const [dashboardRes, wisdomRes] = await Promise.allSettled([
        apiFetch('/api/analytics/dashboard'),
        apiFetch('/api/kiaan/friend/daily-wisdom'),
      ])

      // Process dashboard data
      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
        const data = await dashboardRes.value.json()
        setDashboardData({
          activeJourney: data.active_journey
            ? {
                id: data.active_journey.id,
                title: data.active_journey.title,
                progress: data.active_journey.progress || 0,
                currentDay: data.active_journey.current_day || data.active_journey.currentDay || 1,
                totalDays: data.active_journey.total_days || data.active_journey.totalDays || 14,
              }
            : undefined,
          streak: data.streak || 0,
          todayMood: data.today_mood || null,
          insightsCount: data.insights_count || 0,
          journalEntries: data.journal_entries || 0,
        })
        if (data.today_mood) {
          setSelectedMood(data.today_mood)
        }
      }

      // Process daily wisdom
      if (wisdomRes.status === 'fulfilled' && wisdomRes.value.ok) {
        const data = await wisdomRes.value.json()
        if (data.translation || data.insight) {
          setDailyWisdom({
            translation: data.translation || data.insight || FALLBACK_WISDOM.translation,
            chapter: data.chapter || 2,
            verse: data.verse_number || data.verse || 47,
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Start loading after brief delay to prevent flash
    const timer = setTimeout(() => {
      fetchDashboardData()
    }, 100)
    return () => clearTimeout(timer)
  }, [fetchDashboardData])

  // Handle mood selection
  const handleMoodSelect = useCallback(async (moodId: string) => {
    triggerHaptic('success')
    setSelectedMood(moodId)
    setMoodSaved(true)

    // Reset the "saved" indicator after 2s
    setTimeout(() => setMoodSaved(false), 2000)

    const moodOption = MOOD_OPTIONS.find(m => m.id === moodId)
    if (!moodOption) return

    try {
      await apiFetch('/api/moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: moodOption.score }),
      })
    } catch {
      // Mood will be synced later via offline queue
    }
  }, [triggerHaptic])

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await fetchDashboardData()
  }, [fetchDashboardData])

  // Handle quick action tap
  const handleQuickAction = useCallback((href: string) => {
    triggerHaptic('selection')
    router.push(href)
  }, [router, triggerHaptic])

  const userName = user?.name || user?.email?.split('@')[0] || 'Friend'

  if (isLoading) {
    return (
      <MobileAppShell title="MindVibe" showHeader={false}>
        <HomeSkeleton />
      </MobileAppShell>
    )
  }

  return (
    <MobileAppShell
      title="MindVibe"
      showHeader={false}
      enablePullToRefresh
      onRefresh={handleRefresh}
    >
      <div className="px-4 pt-2 pb-8 space-y-6">
        {/* Header with greeting */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-safe"
        >
          <p className="text-sm text-slate-400">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-white mt-1">
            {userName}{' '}
            <motion.span
              className="inline-block"
              style={{ transformOrigin: '70% 70%' }}
              animate={{
                rotate: [0, 14, -8, 14, -4, 0],
              }}
              transition={{
                duration: 2.5,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              👋
            </motion.span>
          </h1>
        </motion.header>

        {/* Mood Check-in Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-300">How are you feeling?</h2>
              <AnimatePresence mode="wait">
                {moodSaved ? (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-xs text-green-400 font-medium"
                  >
                    Saved
                  </motion.span>
                ) : selectedMood ? (
                  <motion.span
                    key="checkin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-slate-500"
                  >
                    Today&apos;s check-in
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Mood selector */}
            <div className="flex justify-between gap-2">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedMood === mood.id
                return (
                  <motion.button
                    key={mood.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? `bg-gradient-to-br ${mood.color} shadow-lg`
                        : 'bg-white/[0.04] active:bg-white/[0.08]'
                    }`}
                    aria-label={`I feel ${mood.label}`}
                    aria-pressed={isSelected}
                  >
                    <span className="text-2xl" role="img" aria-hidden="true">
                      {mood.emoji}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {mood.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.section>

        {/* Stats row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="p-3 rounded-xl text-center bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-xl font-bold text-orange-400">
                {dashboardData.streak}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Day Streak</p>
          </div>

          <div className="p-3 rounded-xl text-center bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <PenLine className="w-4 h-4 text-purple-400" />
              <span className="text-xl font-bold text-purple-400">
                {dashboardData.journalEntries}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Reflections</p>
          </div>

          <div className="p-3 rounded-xl text-center bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xl font-bold text-cyan-400">
                {dashboardData.insightsCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Insights</p>
          </div>
        </motion.section>

        {/* Active Journey Card */}
        {dashboardData.activeJourney && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                handleQuickAction(
                  `/m/journeys/${dashboardData.activeJourney?.id}`
                )
              }
              className="w-full p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-cyan-400 font-medium mb-1">
                    Active Journey
                  </p>
                  <h3 className="text-base font-semibold text-white">
                    {dashboardData.activeJourney.title}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${dashboardData.activeJourney.progress}%`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">
                    Day {dashboardData.activeJourney.currentDay} of{' '}
                    {dashboardData.activeJourney.totalDays}
                  </span>
                  <span className="text-cyan-400 font-medium">
                    {dashboardData.activeJourney.progress}%
                  </span>
                </div>
              </div>
            </motion.button>
          </motion.section>
        )}

        {/* Quick Actions Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-sm font-medium text-slate-400 mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickAction(action.href)}
                className={`p-4 rounded-2xl text-left bg-gradient-to-br ${action.gradient} border border-white/[0.06] active:border-white/[0.12]`}
              >
                <action.icon className={`w-6 h-6 ${action.iconColor} mb-2`} />
                <h3 className="text-sm font-semibold text-white">
                  {action.label}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {action.description}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Daily Wisdom Preview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('/m/wisdom')}
            className="w-full p-4 rounded-2xl text-left bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border border-teal-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-teal-400 font-medium">
                  Daily Wisdom
                </p>
                <p className="text-sm text-white mt-0.5 line-clamp-2">
                  &ldquo;{dailyWisdom.translation}&rdquo;
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  — Bhagavad Gita {dailyWisdom.chapter}.{dailyWisdom.verse}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
            </div>
          </motion.button>
        </motion.section>

        {/* Connection error hint */}
        <AnimatePresence>
          {hasError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/15"
            >
              <RefreshCw className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <p className="text-xs text-orange-300">
                Some data may be outdated. Pull down to refresh.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileAppShell>
  )
}
