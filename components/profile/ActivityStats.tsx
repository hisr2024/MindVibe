'use client'

import { AnimatedCard, FadeIn } from '@/components/ui'
import type { ActivityStats } from '@/hooks/useProfile'

interface ActivityStatsProps {
  stats: ActivityStats
  className?: string
}

export function ActivityStatsDisplay({ stats, className = '' }: ActivityStatsProps) {
  const statItems = [
    {
      label: 'Journal Entries',
      value: stats.totalJournalEntries,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
    },
    {
      label: 'KIAAN Chats',
      value: stats.totalChatSessions,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'Mood Check-ins',
      value: stats.totalMoodCheckIns,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
    },
    {
      label: 'Day Streak',
      value: stats.daysActiveStreak,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      ),
      suffix: stats.daysActiveStreak === 1 ? ' day' : ' days',
    },
  ]

  return (
    <FadeIn className={className}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <AnimatedCard key={item.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-50">
                  {item.value}
                  {item.suffix}
                </p>
                <p className="text-xs text-orange-100/60">{item.label}</p>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Member Since */}
      <div className="mt-4 text-center">
        <p className="text-xs text-orange-100/50">
          Member since{' '}
          {new Date(stats.memberSince).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </FadeIn>
  )
}

export default ActivityStatsDisplay
