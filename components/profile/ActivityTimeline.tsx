'use client'

import { FadeIn, AnimatedCard } from '@/components/ui'
import { type ActivityLogEntry, getRelativeTime, getActivityIcon } from '@/hooks/useActivityLog'

interface ActivityTimelineProps {
  activities: ActivityLogEntry[]
  maxItems?: number
  className?: string
}

export function ActivityTimeline({ activities, maxItems = 10, className = '' }: ActivityTimelineProps) {
  const displayActivities = activities.slice(0, maxItems)

  if (displayActivities.length === 0) {
    return (
      <FadeIn className={className}>
        <AnimatedCard className="p-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-orange-50 mb-2">No Activity Yet</h3>
          <p className="text-sm text-orange-100/60">
            Your recent activities will appear here. Start journaling or chatting with KIAAN!
          </p>
        </AnimatedCard>
      </FadeIn>
    )
  }

  return (
    <FadeIn className={className}>
      <div className="space-y-3">
        {displayActivities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-orange-500/10 bg-black/20 hover:bg-orange-500/5 transition-colors"
          >
            {/* Icon */}
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 text-lg">
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-orange-50 truncate">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-xs text-orange-100/60 truncate mt-0.5">
                  {activity.description}
                </p>
              )}
            </div>

            {/* Timestamp */}
            <span className="text-xs text-orange-100/50 shrink-0">
              {getRelativeTime(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>

      {activities.length > maxItems && (
        <p className="text-center text-xs text-orange-100/50 mt-4">
          Showing {maxItems} of {activities.length} activities
        </p>
      )}
    </FadeIn>
  )
}

export default ActivityTimeline
