/**
 * TodayTab — Default tab: daily practice hub with Sanskrit greetings,
 * stats, today's steps, micro practice, streak heatmap, and recommendations.
 */

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { DashboardResponse, JourneyTemplate, EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO } from '@/types/journeyEngine.types'
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

interface GreetingData {
  sanskrit: string
  english: string
}

function getGreeting(): GreetingData {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { sanskrit: '\u0938\u0941\u092A\u094D\u0930\u092D\u093E\u0924\u092E\u094D', english: 'Good Morning, Warrior' }
  if (hour >= 12 && hour < 18) return { sanskrit: '\u0928\u092E\u0938\u094D\u0915\u093E\u0930', english: 'Your practice awaits' }
  if (hour >= 18 && hour < 22) return { sanskrit: '\u0938\u0902\u0927\u094D\u092F\u093E \u0935\u0902\u0926\u0928\u093E', english: 'Evening reflection' }
  return { sanskrit: '\u0930\u093E\u0924\u094D\u0930\u0940 \u0915\u0947 \u0938\u093E\u0927\u0915', english: 'The night belongs to the seeker' }
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function TodayTab({ dashboard, templates, isLoading }: TodayTabProps) {
  const greeting = useMemo(() => getGreeting(), [])
  const dateStr = useMemo(() => formatDate(), [])

  const todayDayMeta = useMemo(() => {
    const dow = new Date().getDay()
    const dayIndex = dow === 0 ? 7 : dow
    return JOURNEY_DAY_META[dayIndex - 1]
  }, [])

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

  // Recommendations: templates targeting weakest enemies
  const recommendations = useMemo(() => {
    if (!dashboard || !templates.length) return []
    const activeCount = dashboard.active_journeys.length
    if (activeCount >= 5) return []

    // Find enemies with lowest mastery
    const sorted = [...dashboard.enemy_progress].sort(
      (a, b) => a.mastery_level - b.mastery_level,
    )
    const weakest = sorted.slice(0, 2).map((p) => p.enemy)

    return templates
      .filter((t) => t.primary_enemy_tags.some((e) => weakest.includes(e)))
      .slice(0, 2)
  }, [dashboard, templates])

  return (
    <div className="px-4 pb-6 space-y-5">
      {/* Greeting header with Sanskrit */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-2"
      >
        <h1 className="font-divine text-[22px] italic text-[#D4A017]">
          {greeting.sanskrit}
        </h1>
        <p className="text-sm font-ui text-[#EDE8DC] mt-0.5">
          {greeting.english}
        </p>
        <p className="text-[10px] text-[#6B6355] font-ui tracking-wide mt-0.5">
          {dateStr}
        </p>
      </motion.div>

      {/* Abhyaas verse marquee */}
      <div className="overflow-hidden relative h-5">
        <motion.p
          className="absolute whitespace-nowrap text-[10px] text-[#D4A017]/40 font-divine italic"
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {'\u0905\u092D\u094D\u092F\u093E\u0938\u0947\u0928 \u0924\u0941 \u0915\u094C\u0928\u094D\u0924\u0947\u092F \u0935\u0948\u0930\u093E\u0917\u094D\u092F\u0947\u0923 \u091A \u0917\u0943\u0939\u094D\u092F\u0924\u0947 \u2014 Through practice and detachment, it is mastered (BG 6.35)'}
        </motion.p>
      </div>

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
            All your steps are complete. Rest in the Atman.
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

      {/* Recommendations (if <5 active) */}
      {recommendations.length > 0 && (
        <section>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui mb-2">
            Recommended for You
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recommendations.map((template) => {
              const enemy = template.primary_enemy_tags[0] as EnemyType | undefined
              const info = enemy ? ENEMY_INFO[enemy] : null
              const accentColor = info?.color ?? '#D4A017'

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-shrink-0 w-[200px] rounded-2xl overflow-hidden"
                  style={{
                    border: `1px solid ${accentColor}25`,
                    background: `linear-gradient(160deg, ${accentColor}15, rgba(5,7,20,0.98))`,
                  }}
                >
                  <div className="p-3.5">
                    {info && (
                      <p className="text-[10px] font-divine italic mb-1" style={{ color: accentColor }}>
                        {info.devanagari} {info.name}
                      </p>
                    )}
                    <h4 className="text-[13px] font-ui font-semibold text-[#EDE8DC] line-clamp-1">
                      {template.title}
                    </h4>
                    <p className="text-[10px] text-[#6B6355] font-ui mt-0.5">
                      {template.duration_days} days
                    </p>
                    <Link
                      href="/m/journeys"
                      className="mt-2 block text-center rounded-lg py-1.5 text-[11px] font-ui font-semibold text-[#050714]"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
                      }}
                    >
                      Start {'\u2192'}
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
