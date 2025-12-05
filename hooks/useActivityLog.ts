'use client'

import { useState, useEffect, useCallback } from 'react'

export type ActivityType = 'journal' | 'chat' | 'mood' | 'tool' | 'subscription'

export interface ActivityLogEntry {
  id: string
  type: ActivityType
  title: string
  description?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface UseActivityLogResult {
  activities: ActivityLogEntry[]
  loading: boolean
  error: string | null
  addActivity: (activity: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void
  clearActivities: () => void
  refetch: () => Promise<void>
}

const ACTIVITY_LOG_KEY = 'mindvibe_activity_log'
const ACTIVITY_DATES_KEY = 'mindvibe_activity_dates'
const MAX_ACTIVITIES = 50

export function useActivityLog(): UseActivityLogResult {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const stored = localStorage.getItem(ACTIVITY_LOG_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setActivities(Array.isArray(parsed) ? parsed : [])
      } else {
        setActivities([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity log')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [])

  const addActivity = useCallback(
    (activity: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
      const newActivity: ActivityLogEntry = {
        ...activity,
        id: `activity_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        timestamp: new Date().toISOString(),
      }

      setActivities((prev) => {
        const updated = [newActivity, ...prev].slice(0, MAX_ACTIVITIES)
        localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updated))
        return updated
      })

      // Track activity date for streak calculation
      const today = new Date().toISOString().split('T')[0]
      try {
        const datesStored = localStorage.getItem(ACTIVITY_DATES_KEY)
        const dates: string[] = datesStored ? JSON.parse(datesStored) : []
        if (!dates.includes(today)) {
          const updatedDates = [today, ...dates].slice(0, 365) // Keep 1 year of dates
          localStorage.setItem(ACTIVITY_DATES_KEY, JSON.stringify(updatedDates))
        }
      } catch {
        // Ignore errors
      }
    },
    []
  )

  const clearActivities = useCallback(() => {
    setActivities([])
    localStorage.removeItem(ACTIVITY_LOG_KEY)
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    activities,
    loading,
    error,
    addActivity,
    clearActivities,
    refetch: fetchActivities,
  }
}

// Helper function to get relative time
export function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
  if (diffDay < 365) {
    const months = Math.floor(diffDay / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  }
  const years = Math.floor(diffDay / 365)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

// Helper to get activity type icon
export function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case 'journal':
      return '📝'
    case 'chat':
      return '💬'
    case 'mood':
      return '🌈'
    case 'tool':
      return '🛠️'
    case 'subscription':
      return '⭐'
    default:
      return '📌'
  }
}

export default useActivityLog
