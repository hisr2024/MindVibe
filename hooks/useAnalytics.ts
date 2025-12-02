/**
 * useAnalytics Hook
 * Fetch and manage analytics data
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  AnalyticsData,
  OverviewMetrics,
  MoodTrendData,
  JournalStatistics,
  KIAANInsightData,
  WeeklySummaryData,
  Achievement,
  AnalyticsPeriod,
  DateRange,
  AnalyticsFilters,
  AnalyticsLoadingState,
  AnalyticsErrorState,
} from '@/types/analytics.types'
import {
  getAnalyticsOverview,
  getMoodTrends,
  getJournalStatistics,
  getKIAANInsights,
  getWeeklySummary,
  getAchievements,
  clearAnalyticsCache,
} from '@/services/analyticsService'

interface UseAnalyticsResult {
  // Data
  overview: OverviewMetrics | null
  moodTrends: MoodTrendData | null
  journalStats: JournalStatistics | null
  kiaanInsights: KIAANInsightData | null
  weeklySummary: WeeklySummaryData | null
  achievements: Achievement[]

  // Combined data
  analyticsData: AnalyticsData | null

  // Filters
  filters: AnalyticsFilters
  setFilters: (filters: Partial<AnalyticsFilters>) => void
  setPeriod: (period: AnalyticsPeriod) => void
  setDateRange: (dateRange: DateRange) => void

  // Loading states
  loading: AnalyticsLoadingState
  isAnyLoading: boolean

  // Error states
  errors: AnalyticsErrorState
  hasErrors: boolean

  // Actions
  refresh: () => Promise<void>
  refreshOverview: () => Promise<void>
  refreshMoodTrends: () => Promise<void>
  refreshJournalStats: () => Promise<void>
  refreshKIAANInsights: () => Promise<void>
  refreshWeeklySummary: () => Promise<void>
  clearCache: () => void
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  period: 'weekly',
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
}

const INITIAL_LOADING_STATE: AnalyticsLoadingState = {
  overview: true,
  moodTrends: true,
  journalStats: true,
  kiaanInsights: true,
  weeklySummary: true,
  achievements: true,
}

const INITIAL_ERROR_STATE: AnalyticsErrorState = {
  overview: null,
  moodTrends: null,
  journalStats: null,
  kiaanInsights: null,
  weeklySummary: null,
  achievements: null,
}

export function useAnalytics(userId?: string): UseAnalyticsResult {
  // Data states
  const [overview, setOverview] = useState<OverviewMetrics | null>(null)
  const [moodTrends, setMoodTrends] = useState<MoodTrendData | null>(null)
  const [journalStats, setJournalStats] = useState<JournalStatistics | null>(null)
  const [kiaanInsights, setKIAANInsights] = useState<KIAANInsightData | null>(null)
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryData | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])

  // Filter state
  const [filters, setFiltersState] = useState<AnalyticsFilters>(DEFAULT_FILTERS)

  // Loading states
  const [loading, setLoading] = useState<AnalyticsLoadingState>(INITIAL_LOADING_STATE)

  // Error states
  const [errors, setErrors] = useState<AnalyticsErrorState>(INITIAL_ERROR_STATE)

  // Computed values
  const isAnyLoading = useMemo(
    () => Object.values(loading).some(Boolean),
    [loading]
  )

  const hasErrors = useMemo(
    () => Object.values(errors).some((e) => e !== null),
    [errors]
  )

  const analyticsData = useMemo<AnalyticsData | null>(() => {
    if (!overview || !moodTrends || !journalStats || !kiaanInsights) {
      return null
    }

    return {
      overview,
      moodTrends,
      journalStats,
      kiaanInsights,
      weeklySummary,
      achievements,
      lastUpdated: new Date().toISOString(),
    }
  }, [overview, moodTrends, journalStats, kiaanInsights, weeklySummary, achievements])

  // Fetch functions
  const refreshOverview = useCallback(async () => {
    if (!userId) return

    setLoading((prev) => ({ ...prev, overview: true }))
    setErrors((prev) => ({ ...prev, overview: null }))

    try {
      const data = await getAnalyticsOverview(userId, filters.dateRange)
      setOverview(data)
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        overview: error instanceof Error ? error.message : 'Failed to load overview',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, overview: false }))
    }
  }, [userId, filters.dateRange])

  const refreshMoodTrends = useCallback(async () => {
    if (!userId) return

    setLoading((prev) => ({ ...prev, moodTrends: true }))
    setErrors((prev) => ({ ...prev, moodTrends: null }))

    try {
      const data = await getMoodTrends(userId, filters.period)
      setMoodTrends(data)
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        moodTrends: error instanceof Error ? error.message : 'Failed to load mood trends',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, moodTrends: false }))
    }
  }, [userId, filters.period])

  const refreshJournalStats = useCallback(async () => {
    if (!userId) return

    setLoading((prev) => ({ ...prev, journalStats: true }))
    setErrors((prev) => ({ ...prev, journalStats: null }))

    try {
      const data = await getJournalStatistics(userId)
      setJournalStats(data)
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        journalStats: error instanceof Error ? error.message : 'Failed to load journal stats',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, journalStats: false }))
    }
  }, [userId])

  const refreshKIAANInsights = useCallback(async () => {
    if (!userId) return

    setLoading((prev) => ({ ...prev, kiaanInsights: true }))
    setErrors((prev) => ({ ...prev, kiaanInsights: null }))

    try {
      const data = await getKIAANInsights(userId)
      setKIAANInsights(data)
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        kiaanInsights: error instanceof Error ? error.message : 'Failed to load KIAAN insights',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, kiaanInsights: false }))
    }
  }, [userId])

  const refreshWeeklySummary = useCallback(async () => {
    if (!userId) return

    setLoading((prev) => ({ ...prev, weeklySummary: true }))
    setErrors((prev) => ({ ...prev, weeklySummary: null }))

    try {
      const data = await getWeeklySummary(userId)
      setWeeklySummary(data)
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        weeklySummary: error instanceof Error ? error.message : 'Failed to load weekly summary',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, weeklySummary: false }))
    }
  }, [userId])

  const refreshAchievements = useCallback(async () => {
    if (!userId) return

    setLoading((prev) => ({ ...prev, achievements: true }))
    setErrors((prev) => ({ ...prev, achievements: null }))

    try {
      const data = await getAchievements(userId)
      setAchievements(data)
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        achievements: error instanceof Error ? error.message : 'Failed to load achievements',
      }))
    } finally {
      setLoading((prev) => ({ ...prev, achievements: false }))
    }
  }, [userId])

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      refreshOverview(),
      refreshMoodTrends(),
      refreshJournalStats(),
      refreshKIAANInsights(),
      refreshWeeklySummary(),
      refreshAchievements(),
    ])
  }, [
    refreshOverview,
    refreshMoodTrends,
    refreshJournalStats,
    refreshKIAANInsights,
    refreshWeeklySummary,
    refreshAchievements,
  ])

  // Filter setters
  const setFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const setPeriod = useCallback((period: AnalyticsPeriod) => {
    setFiltersState((prev) => ({ ...prev, period }))
  }, [])

  const setDateRange = useCallback((dateRange: DateRange) => {
    setFiltersState((prev) => ({ ...prev, dateRange }))
  }, [])

  // Clear cache
  const clearCache = useCallback(() => {
    clearAnalyticsCache()
    refresh()
  }, [refresh])

  // Initial fetch
  useEffect(() => {
    refresh()
  }, []) // Only on mount

  // Refetch mood trends when period changes
  useEffect(() => {
    refreshMoodTrends()
  }, [filters.period])

  // Refetch overview when date range changes
  useEffect(() => {
    refreshOverview()
  }, [filters.dateRange])

  return {
    overview,
    moodTrends,
    journalStats,
    kiaanInsights,
    weeklySummary,
    achievements,
    analyticsData,
    filters,
    setFilters,
    setPeriod,
    setDateRange,
    loading,
    isAnyLoading,
    errors,
    hasErrors,
    refresh,
    refreshOverview,
    refreshMoodTrends,
    refreshJournalStats,
    refreshKIAANInsights,
    refreshWeeklySummary,
    clearCache,
  }
}

export default useAnalytics
