/**
 * Analytics Service
 * API integration for analytics dashboard
 */

import { apiFetch } from '@/lib/api'
import type {
  OverviewMetrics,
  MoodTrendData,
  JournalStatistics,
  KIAANInsightData,
  WeeklySummaryData,
  DateRange,
  AnalyticsPeriod,
  ExportOptions,
  ExportProgress,
  Achievement,
} from '@/types/analytics.types'

const ANALYTICS_CACHE_KEY = 'mindvibe_analytics_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Get cached data if still valid
 */
function getCached<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(`${ANALYTICS_CACHE_KEY}_${key}`)
    if (!stored) return null

    const entry: CacheEntry<T> = JSON.parse(stored)
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${ANALYTICS_CACHE_KEY}_${key}`)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

/**
 * Set cached data
 */
function setCached<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() }
    localStorage.setItem(`${ANALYTICS_CACHE_KEY}_${key}`, JSON.stringify(entry))
  } catch {
    // Ignore cache errors
  }
}

/**
 * Get analytics overview metrics
 */
export async function getAnalyticsOverview(
  dateRange?: DateRange
): Promise<OverviewMetrics> {
  const cacheKey = `overview_${dateRange?.start || 'all'}_${dateRange?.end || 'all'}`
  const cached = getCached<OverviewMetrics>(cacheKey)
  if (cached) return cached

  try {
    const params = new URLSearchParams()
    if (dateRange?.start) params.set('start', dateRange.start)
    if (dateRange?.end) params.set('end', dateRange.end)

    const response = await apiFetch(
      `/api/analytics/overview?${params.toString()}`,
      { method: 'GET' }
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch analytics overview:', error)
  }

  // Return honest empty state as fallback (no fake data)
  const emptyData = getEmptyOverviewMetrics()
  setCached(cacheKey, emptyData)
  return emptyData
}

/**
 * Get mood trends data
 */
export async function getMoodTrends(
  period: AnalyticsPeriod = 'weekly'
): Promise<MoodTrendData> {
  const cacheKey = `mood_trends_${period}`
  const cached = getCached<MoodTrendData>(cacheKey)
  if (cached) return cached

  try {
    const response = await apiFetch(
      `/api/analytics/mood-trends?period=${period}`,
      { method: 'GET' }
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch mood trends:', error)
  }

  // Return honest empty state as fallback (no fake data)
  const emptyData = getEmptyMoodTrends(period)
  setCached(cacheKey, emptyData)
  return emptyData
}

/**
 * Get journal statistics
 */
export async function getJournalStatistics(): Promise<JournalStatistics> {
  const cacheKey = 'journal_stats'
  const cached = getCached<JournalStatistics>(cacheKey)
  if (cached) return cached

  try {
    const response = await apiFetch(
      '/api/analytics/journal-stats',
      { method: 'GET' }
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch journal statistics:', error)
  }

  // Return honest empty state as fallback (no fake data)
  const emptyData = getEmptyJournalStatistics()
  setCached(cacheKey, emptyData)
  return emptyData
}

/**
 * Get KIAAN insights data
 */
export async function getKIAANInsights(): Promise<KIAANInsightData> {
  const cacheKey = 'kiaan_insights'
  const cached = getCached<KIAANInsightData>(cacheKey)
  if (cached) return cached

  try {
    const response = await apiFetch(
      '/api/analytics/kiaan-insights',
      { method: 'GET' }
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch KIAAN insights:', error)
  }

  // Return honest empty state as fallback (no fake data)
  const emptyData = getEmptyKIAANInsights()
  setCached(cacheKey, emptyData)
  return emptyData
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(
  weekStart?: string
): Promise<WeeklySummaryData | null> {
  const cacheKey = `weekly_summary_${weekStart || 'current'}`
  const cached = getCached<WeeklySummaryData>(cacheKey)
  if (cached) return cached

  try {
    const params = weekStart ? `?weekStart=${weekStart}` : ''
    const response = await apiFetch(
      `/api/analytics/weekly-summary${params}`,
      { method: 'GET' }
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch weekly summary:', error)
  }

  // Return null when no data available (no fake data)
  const emptyData = getEmptyWeeklySummary()
  if (emptyData) setCached(cacheKey, emptyData)
  return emptyData
}

/**
 * Get achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  const cacheKey = 'achievements'
  const cached = getCached<Achievement[]>(cacheKey)
  if (cached) return cached

  try {
    const response = await apiFetch(
      '/api/analytics/achievements',
      { method: 'GET' }
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data.achievements || data)
      return data.achievements || data
    }
  } catch (error) {
    console.warn('Failed to fetch achievements:', error)
  }

  // Return empty array - achievements are earned through genuine use
  const emptyData = getEmptyAchievements()
  setCached(cacheKey, emptyData)
  return emptyData
}

/**
 * Export data
 */
export async function exportData(
  options: ExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportProgress> {
  try {
    onProgress?.({
      status: 'processing',
      progress: 10,
    })

    const response = await apiFetch(
      '/api/analytics/export',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      }
    )

    if (response.ok) {
      onProgress?.({
        status: 'processing',
        progress: 90,
      })

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      return {
        status: 'completed',
        progress: 100,
        downloadUrl: url,
      }
    }

    return {
      status: 'failed',
      progress: 0,
      error: 'Export failed',
    }
  } catch (error) {
    return {
      status: 'failed',
      progress: 0,
      error: error instanceof Error ? error.message : 'Export failed',
    }
  }
}

/**
 * Clear analytics cache
 */
export function clearAnalyticsCache(): void {
  const keys = Object.keys(localStorage)
  keys.forEach((key) => {
    if (key.startsWith(ANALYTICS_CACHE_KEY)) {
      localStorage.removeItem(key)
    }
  })
}

// ============================================
// Empty State Functions (honest defaults when no data)
// ============================================

/**
 * Returns honest empty state for overview metrics
 * No fake data - only real user data from API
 */
function getEmptyOverviewMetrics(): OverviewMetrics {
  return {
    totalEntries: 0,
    totalWords: 0,
    avgWordsPerEntry: 0,
    currentStreak: 0,
    longestStreak: 0,
    avgMoodScore: 0,
    moodTrend: 'stable',
    kiaanConversations: 0,
    kiaanMessages: 0,
    lastActivityDate: null as unknown as string,
  }
}

/**
 * Returns honest empty state for mood trends
 * No fake data - only real user data from API
 */
function getEmptyMoodTrends(period: AnalyticsPeriod): MoodTrendData {
  return {
    period,
    data: [],
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    trend: 'stable',
    changePercentage: 0,
  }
}

/**
 * Returns honest empty state for journal statistics
 * No fake data - only real user data from API
 */
function getEmptyJournalStatistics(): JournalStatistics {
  return {
    totalEntries: 0,
    totalWords: 0,
    avgWordsPerEntry: 0,
    currentStreak: 0,
    longestStreak: 0,
    sentimentDistribution: {
      positive: 0,
      neutral: 0,
      negative: 0,
      mixed: 0,
    },
    topTags: [],
    writingTimeDistribution: [],
    entriesByMonth: [],
    avgEntriesPerWeek: 0,
  }
}

/**
 * Returns honest empty state for KIAAN insights
 * No fake data - only real user data from API
 */
function getEmptyKIAANInsights(): KIAANInsightData {
  return {
    totalConversations: 0,
    totalMessages: 0,
    avgMessagesPerConversation: 0,
    avgResponseTime: 0,
    topTopics: [],
    engagementLevel: 'low',
    usageByHour: [],
    usageByDay: [],
    recentConversations: [],
    streakDays: 0,
  }
}

/**
 * Returns null for weekly summary when no data
 * No fake data - only real user data from API
 */
function getEmptyWeeklySummary(): WeeklySummaryData | null {
  return null
}

/**
 * Returns empty achievements array
 * No fake data - achievements are earned through genuine use
 */
function getEmptyAchievements(): Achievement[] {
  return []
}
