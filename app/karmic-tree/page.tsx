'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TreeAnimation, FloatingLeaf, StatCard } from '@/components/karmic-tree'
import { FadeIn } from '@/components/ui'

// Sample milestones - in production these would come from analytics
const sampleMilestones = [
  { id: 1, milestone: 'First check-in', icon: '🌱', position: { x: 20, y: 70 } },
  { id: 2, milestone: '7-day streak', icon: '🔥', position: { x: 75, y: 65 } },
  { id: 3, milestone: '10 KIAAN chats', icon: '💬', position: { x: 15, y: 40 } },
  { id: 4, milestone: 'First journal', icon: '📝', position: { x: 80, y: 35 } },
  { id: 5, milestone: 'Mood improved', icon: '✨', position: { x: 50, y: 25 } },
]

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

function getSeason(moodTrend: number, journalStreak: number): Season {
  const score = (moodTrend * 0.6) + (journalStreak * 0.4)
  if (score >= 7) return 'summer'
  if (score >= 5) return 'spring'
  if (score >= 3) return 'autumn'
  return 'winter'
}

function getSeasonDescription(season: Season): string {
  const descriptions = {
    summer: 'Full bloom – Your mindfulness practice is thriving!',
    spring: 'Growing – Positive momentum building.',
    autumn: 'Reflection – A time for deeper introspection.',
    winter: 'Rest & renewal – Nurturing your roots.',
  }
  return descriptions[season]
}

export default function KarmicTreePage() {
  // These would normally come from analytics API
  const [stats, setStats] = useState({
    moodScore: 7.2,
    moodTrend: 'up' as const,
    journalStreak: 7,
    kiaanConversations: 28,
    totalEntries: 42,
  })
  
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null)
  
  const season = getSeason(stats.moodScore, stats.journalStreak)
  
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 pb-16 mobile-safe-padding">
      <FadeIn>
        <header className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70 mb-2">Your Growth</p>
          <h1 className="text-3xl font-bold text-orange-50 md:text-4xl mb-2">Karmic Tree</h1>
          <p className="text-sm text-orange-100/70 max-w-md mx-auto">
            Watch your personal growth bloom. Your tree reflects your journey.
          </p>
        </header>
      </FadeIn>
      
      {/* Season Badge */}
      <FadeIn delay={0.1}>
        <div className="flex justify-center mb-6">
          <motion.div 
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-4 py-2"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-xl">
              {season === 'summer' ? '☀️' : season === 'spring' ? '🌸' : season === 'autumn' ? '🍂' : '❄️'}
            </span>
            <div>
              <span className="text-sm font-semibold text-orange-50 capitalize">{season}</span>
              <p className="text-xs text-orange-100/60">{getSeasonDescription(season)}</p>
            </div>
          </motion.div>
        </div>
      </FadeIn>
      
      {/* Tree Visualization */}
      <FadeIn delay={0.2}>
        <div className="relative rounded-3xl border border-orange-500/15 bg-gradient-to-b from-[#0d0d10]/90 to-[#0b0b0f] p-6 mb-8 overflow-hidden">
          {/* Background gradient glow */}
          <div className="absolute inset-0 bg-gradient-radial from-orange-500/10 via-transparent to-transparent opacity-50" />
          
          <TreeAnimation
            moodScore={stats.moodScore}
            journalStreak={stats.journalStreak}
            kiaanConversations={stats.kiaanConversations}
            season={season}
          />
          
          {/* Floating achievement leaves */}
          {sampleMilestones.map((m, i) => (
            <FloatingLeaf
              key={m.id}
              milestone={m.milestone}
              icon={m.icon}
              position={m.position}
              delay={1.5 + i * 0.2}
              onClick={() => setSelectedMilestone(m.milestone)}
            />
          ))}
        </div>
      </FadeIn>
      
      {/* Selected Milestone Toast */}
      {selectedMilestone && (
        <motion.div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-slate-900 font-semibold shadow-lg">
            🎉 Achievement: {selectedMilestone}
          </div>
        </motion.div>
      )}
      
      {/* Stats Grid */}
      <FadeIn delay={0.4}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Avg Mood"
            value={stats.moodScore.toFixed(1)}
            icon="😊"
            trend={stats.moodTrend}
            color="green"
          />
          <StatCard
            label="Journal Streak"
            value={`${stats.journalStreak} days`}
            icon="📝"
            trend="up"
            color="orange"
          />
          <StatCard
            label="KIAAN Chats"
            value={stats.kiaanConversations}
            icon="💬"
            color="blue"
          />
          <StatCard
            label="Total Entries"
            value={stats.totalEntries}
            icon="📊"
            color="orange"
          />
        </div>
      </FadeIn>
      
      {/* Growth Tips */}
      <FadeIn delay={0.5}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <h2 className="text-lg font-semibold text-orange-50 mb-4">Nurture Your Tree</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-orange-400/15 bg-white/5 p-4">
              <span className="text-2xl mb-2 block">🌞</span>
              <p className="text-sm font-semibold text-orange-50">Daily check-ins</p>
              <p className="text-xs text-orange-100/70 mt-1">Track your mood to help your tree bloom</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-white/5 p-4">
              <span className="text-2xl mb-2 block">💧</span>
              <p className="text-sm font-semibold text-orange-50">Journal regularly</p>
              <p className="text-xs text-orange-100/70 mt-1">Water your roots with reflection</p>
            </div>
            <div className="rounded-2xl border border-orange-400/15 bg-white/5 p-4">
              <span className="text-2xl mb-2 block">🌱</span>
              <p className="text-sm font-semibold text-orange-50">Chat with KIAAN</p>
              <p className="text-xs text-orange-100/70 mt-1">Gain wisdom to strengthen your growth</p>
            </div>
          </div>
        </section>
      </FadeIn>
    </main>
  )
}
