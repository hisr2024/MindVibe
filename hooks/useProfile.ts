'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ProfileData {
  name: string
  email: string
  bio?: string
  avatarUrl?: string
  createdAt: string
  privacy?: {
    showProfile: boolean
    dataSharing: boolean
  }
}

export interface ActivityStats {
  totalJournalEntries: number
  totalChatSessions: number
  totalMoodCheckIns: number
  daysActiveStreak: number
  memberSince: string
}

interface UseProfileResult {
  profile: ProfileData | null
  stats: ActivityStats | null
  loading: boolean
  error: string | null
  updateProfile: (data: Partial<ProfileData>) => void
  refetch: () => Promise<void>
}

const PROFILE_STORAGE_KEY = 'mindvibe_profile'
const JOURNAL_STORAGE_KEY = 'mindvibe_journals'
const CHAT_STORAGE_KEY = 'mindvibe_chat_history'
const MOOD_STORAGE_KEY = 'mindvibe_moods'

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateStats = useCallback((): ActivityStats => {
    // Get journal entries count
    let totalJournalEntries = 0
    try {
      const journals = localStorage.getItem(JOURNAL_STORAGE_KEY)
      if (journals) {
        const parsed = JSON.parse(journals)
        totalJournalEntries = Array.isArray(parsed) ? parsed.length : 0
      }
    } catch {
      // Ignore parse errors
    }

    // Get chat sessions count
    let totalChatSessions = 0
    try {
      const chats = localStorage.getItem(CHAT_STORAGE_KEY)
      if (chats) {
        const parsed = JSON.parse(chats)
        totalChatSessions = Array.isArray(parsed) ? parsed.length : 0
      }
    } catch {
      // Ignore parse errors
    }

    // Get mood check-ins count
    let totalMoodCheckIns = 0
    try {
      const moods = localStorage.getItem(MOOD_STORAGE_KEY)
      if (moods) {
        const parsed = JSON.parse(moods)
        totalMoodCheckIns = Array.isArray(parsed) ? parsed.length : 0
      }
    } catch {
      // Ignore parse errors
    }

    // Calculate streak (simplified - count consecutive days with activity)
    const daysActiveStreak = calculateStreak()

    // Get member since date
    const profileData = localStorage.getItem(PROFILE_STORAGE_KEY)
    let memberSince = new Date().toISOString()
    if (profileData) {
      try {
        const parsed = JSON.parse(profileData)
        memberSince = parsed.createdAt || memberSince
      } catch {
        // Ignore parse errors
      }
    }

    return {
      totalJournalEntries,
      totalChatSessions,
      totalMoodCheckIns,
      daysActiveStreak,
      memberSince,
    }
  }, [])

  const calculateStreak = (): number => {
    // Simplified streak calculation
    const activityKey = 'mindvibe_activity_dates'
    try {
      const stored = localStorage.getItem(activityKey)
      if (!stored) return 1

      const dates = JSON.parse(stored) as string[]
      if (!Array.isArray(dates) || dates.length === 0) return 1

      // Sort dates descending
      const sortedDates = dates
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime())

      let streak = 1
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < sortedDates.length - 1; i++) {
        const current = new Date(sortedDates[i])
        current.setHours(0, 0, 0, 0)
        const next = new Date(sortedDates[i + 1])
        next.setHours(0, 0, 0, 0)

        const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }

      return streak
    } catch {
      return 1
    }
  }

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY)

      if (stored) {
        setProfile(JSON.parse(stored))
      } else {
        // Default profile
        const defaultProfile: ProfileData = {
          name: 'MindVibe User',
          email: 'user@mindvibe.app',
          bio: '',
          createdAt: new Date().toISOString(),
          privacy: {
            showProfile: true,
            dataSharing: false,
          },
        }
        setProfile(defaultProfile)
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile))
      }

      setStats(calculateStats())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [calculateStats])

  const updateProfile = useCallback((data: Partial<ProfileData>) => {
    setProfile((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...data }
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    stats,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  }
}

export default useProfile
