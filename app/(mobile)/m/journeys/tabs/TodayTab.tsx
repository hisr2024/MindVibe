/**
 * TodayTab — Default tab: daily practice hub with stats, today's steps,
 * micro practice, streak, and quick access to active journeys.
 */

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { DashboardResponse, JourneyTemplate, EnemyType } from '@/types/journeyEngine.types'
import { JOURNEY_DAY_META } from '@/lib/journey/dayMeta'
import { MobileStatsBar } from '../components/MobileStatsBar'
import { TodayPracticeCard } from '../components/TodayPracticeCard'
import { MicroPracticeCard } from '../components/MicroPracticeCard'
import { MobileStreakCard } from '../components/MobileStreakCard'
import { ActiveJourneyCardMobile } from '../components/ActiveJourneyCardMobile'
import { JourneyCardSkeleton } from '../skeletons/JourneyCardSkeleton'

interface TodayTabProps {
  dashboard: DashboardResponse | null
  templates: JourneyTemplate[]
  isLoading: boolean
  onRefresh: () => void
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning, Warrior'
  if (hour >= 12 && hour < 18) return 'Your practice awaits'
  if (hour >= 18 && hour < 22) return 'Evening reflection'
  return 'The night belongs to the seeker'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function TodayTab({ dashboard, isLoading }: TodayTabProps) {
  const greeting = useMemo(getGreeting, [])
  const dateStr = useMemo(formatDate, [])

  // Pick a micro practice based on day-of-week (1-7 mapped to day 1-7 of the 14-day meta)
  const todayDayMeta = useMemo(() => {
    const dow = new Date().getDay() // 0=Sun
    const dayIndex = dow === 0 ? 7 : dow // 1=Mon .. 7=Sun
    return JOURNEY_DAY_META[dayIndex - 1] // 0-indexed
  }, [])

  // Map today_steps to their journey's primary enemy for color coding
  const stepsWithEnemy = useMemo(() => {
    if (!dashboard) return []
    return dashboard.today_steps.map((step) => {
      const journey = dashboard.active_journeys.find(
        (j) => j.journey_id === step.journey_id,
      )
      return {
        step,
        primaryEnemy: journey?.primary_enemies[0] as EnemyType | undefined,
      }
    })
  }, [dashboard])

  return (
    <div className="px-4 pb-6 space-y-5">
      {/* Greeting header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-2"
      >
        <h1 className="font-divine text-[22px] italic text-[#EDE8DC]">
          {greeting}
        </h1>
        <p className="text-[10px] text-[#6B6355] font-ui tracking-wide mt-0.5">
          {dateStr}
        </p>
      </motion.div>

      {/* Stats bar */}
      <MobileStatsBar dashboard={dashboard} isLoading={isLoading} />

      {/* Today's Practice */}
      {isLoading ? (
        <JourneyCardSkeleton count={2} />
      ) : stepsWithEnemy.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui">
              Today&apos;s Practice
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4A017]/15 text-[#D4A017] font-ui">
              {stepsWithEnemy.length} {stepsWithEnemy.length === 1 ? 'step' : 'steps'}
            </span>
          </div>
          <div className="space-y-3">
            {stepsWithEnemy.map(({ step, primaryEnemy }, i) => (
              <TodayPracticeCard
                key={step.step_id}
                step={step}
                primaryEnemy={primaryEnemy}
                index={i}
              />
            ))}
          </div>
        </section>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center"
        >
          <motion.div
            className="text-3xl mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {'\u0950'}
          </motion.div>
          <p className="text-sm text-[#EDE8DC] font-ui">You are at peace today.</p>
          <p className="text-[11px] text-[#6B6355] font-ui mt-1">
            All your steps are complete.
          </p>
        </motion.div>
      )}

      {/* Micro Practice of the Day */}
      {todayDayMeta && <MicroPracticeCard dayMeta={todayDayMeta} />}

      {/* Streak Card */}
      {dashboard && (
        <MobileStreakCard
          currentStreak={dashboard.current_streak}
          totalDaysPracticed={dashboard.total_days_practiced}
        />
      )}

      {/* Quick access: active journeys */}
      {dashboard && dashboard.active_journeys.length > 0 && (
        <section>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui mb-2">
            Continue Your Journey
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {dashboard.active_journeys.map((journey, i) => (
              <div key={journey.journey_id} className="flex-shrink-0 w-[260px]">
                <ActiveJourneyCardMobile journey={journey} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
