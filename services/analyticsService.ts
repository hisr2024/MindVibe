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
  userId: string,
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
      { method: 'GET' },
      userId
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch analytics overview:', error)
  }

  // Return mock data as fallback
  const mockData = getMockOverviewMetrics()
  setCached(cacheKey, mockData)
  return mockData
}

/**
 * Get mood trends data
 */
export async function getMoodTrends(
  userId: string,
  period: AnalyticsPeriod = 'weekly'
): Promise<MoodTrendData> {
  const cacheKey = `mood_trends_${period}`
  const cached = getCached<MoodTrendData>(cacheKey)
  if (cached) return cached

  try {
    const response = await apiFetch(
      `/api/analytics/mood-trends?period=${period}`,
      { method: 'GET' },
      userId
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch mood trends:', error)
  }

  const mockData = getMockMoodTrends(period)
  setCached(cacheKey, mockData)
  return mockData
}

/**
 * Get journal statistics
 */
export async function getJournalStatistics(
  userId: string
): Promise<JournalStatistics> {
  const cacheKey = 'journal_stats'
  const cached = getCached<JournalStatistics>(cacheKey)
  if (cached) return cached

  try {
    const response = await apiFetch(
      '/api/analytics/journal-stats',
      { method: 'GET' },
      userId
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch journal statistics:', error)
  }

  const mockData = getMockJournalStatistics()
  setCached(cacheKey, mockData)
  return mockData
}

/**
 * Get KIAAN insights data
 */
export async function getKIAANInsights(
  userId: string
): Promise<KIAANInsightData> {
  const cacheKey = 'kiaan_insights'
  const cached = getCached<KIAANInsightData>(cacheKey)
  if (cached) return cached

  try {
    const response = await apiFetch(
      '/api/analytics/kiaan-insights',
      { method: 'GET' },
      userId
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch KIAAN insights:', error)
  }

  const mockData = getMockKIAANInsights()
  setCached(cacheKey, mockData)
  return mockData
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(
  userId: string,
  weekStart?: string
): Promise<WeeklySummaryData | null> {
  const cacheKey = `weekly_summary_${weekStart || 'current'}`
  const cached = getCached<WeeklySummaryData>(cacheKey)
  if (cached) return cached

  try {
    const params = weekStart ? `?weekStart=${weekStart}` : ''
    const response = await apiFetch(
      `/api/analytics/weekly-summary${params}`,
      { method: 'GET' },
      userId
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data)
      return data
    }
  } catch (error) {
    console.warn('Failed to fetch weekly summary:', error)
  }

  const mockData = getMockWeeklySummary()
  setCached(cacheKey, mockData)
  return mockData
}

/**
 * Get achievements
 */
export async function getAchievements(userId: string): Promise<Achievement[]> {
  const cacheKey = 'achievements'
  const cached = getCached<Achievement[]>(cacheKey)
  if (cached) return cached

  try {
    const response = await apiFetch(
      '/api/analytics/achievements',
      { method: 'GET' },
      userId
    )

    if (response.ok) {
      const data = await response.json()
      setCached(cacheKey, data.achievements || data)
      return data.achievements || data
    }
  } catch (error) {
    console.warn('Failed to fetch achievements:', error)
  }

  const mockData = getMockAchievements()
  setCached(cacheKey, mockData)
  return mockData
}

/**
 * Export data
 */
export async function exportData(
  userId: string,
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
      },
      userId
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
// Mock Data Functions (fallback for demo)
// ============================================

function getMockOverviewMetrics(): OverviewMetrics {
  return {
    totalEntries: 42,
    totalWords: 12450,
    avgWordsPerEntry: 296,
    currentStreak: 7,
    longestStreak: 14,
    avgMoodScore: 7.2,
    moodTrend: 'up',
    kiaanConversations: 28,
    kiaanMessages: 156,
    lastActivityDate: new Date().toISOString(),
  }
}

function getMockMoodTrends(period: AnalyticsPeriod): MoodTrendData {
  const dataPoints = period === 'daily' ? 7 : period === 'weekly' ? 4 : 12
  const data = Array.from({ length: dataPoints }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (dataPoints - 1 - i) * (period === 'daily' ? 1 : 7))
    return {
      date: date.toISOString().split('T')[0],
      score: 5 + Math.random() * 4,
      label: ['😊', '😌', '😐', '😔', '😊'][Math.floor(Math.random() * 5)],
    }
  })

  return {
    period,
    data,
    averageScore: 7.2,
    highestScore: 9,
    lowestScore: 5,
    trend: 'improving',
    changePercentage: 8.5,
  }
}

function getMockJournalStatistics(): JournalStatistics {
  return {
    totalEntries: 42,
    totalWords: 12450,
    avgWordsPerEntry: 296,
    currentStreak: 7,
    longestStreak: 14,
    sentimentDistribution: {
      positive: 45,
      neutral: 35,
      negative: 15,
      mixed: 5,
    },
    topTags: [
      { tag: 'gratitude', count: 15, percentage: 35 },
      { tag: 'work', count: 12, percentage: 28 },
      { tag: 'family', count: 8, percentage: 19 },
      { tag: 'health', count: 5, percentage: 12 },
      { tag: 'goals', count: 2, percentage: 6 },
    ],
    writingTimeDistribution: [
      { hour: 8, dayOfWeek: 1, count: 5 },
      { hour: 21, dayOfWeek: 1, count: 8 },
      { hour: 8, dayOfWeek: 2, count: 3 },
      { hour: 22, dayOfWeek: 3, count: 6 },
    ],
    entriesByMonth: [
      { month: 'Jan', count: 8 },
      { month: 'Feb', count: 10 },
      { month: 'Mar', count: 12 },
      { month: 'Apr', count: 12 },
    ],
    avgEntriesPerWeek: 3.5,
  }
}

function getMockKIAANInsights(): KIAANInsightData {
  return {
    totalConversations: 28,
    totalMessages: 156,
    avgMessagesPerConversation: 5.6,
    avgResponseTime: 1.2,
    topTopics: [
      { tag: 'stress', count: 12, percentage: 30 },
      { tag: 'relationships', count: 8, percentage: 20 },
      { tag: 'work', count: 7, percentage: 17 },
      { tag: 'mindfulness', count: 6, percentage: 15 },
      { tag: 'sleep', count: 5, percentage: 13 },
    ],
    engagementLevel: 'high',
    usageByHour: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      messageCount: Math.floor(Math.random() * 10) + (hour >= 8 && hour <= 22 ? 5 : 0),
    })),
    usageByDay: [
      { dayOfWeek: 0, dayName: 'Sun', messageCount: 18 },
      { dayOfWeek: 1, dayName: 'Mon', messageCount: 24 },
      { dayOfWeek: 2, dayName: 'Tue', messageCount: 22 },
      { dayOfWeek: 3, dayName: 'Wed', messageCount: 28 },
      { dayOfWeek: 4, dayName: 'Thu', messageCount: 20 },
      { dayOfWeek: 5, dayName: 'Fri', messageCount: 26 },
      { dayOfWeek: 6, dayName: 'Sat', messageCount: 18 },
    ],
    recentConversations: [],
    streakDays: 7,
  }
}

function getMockWeeklySummary(): WeeklySummaryData {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    moodSummary: {
      avgScore: 7.5,
      trend: 'up',
      bestDay: 'Wednesday',
      challengingDay: 'Monday',
    },
    journalSummary: {
      entriesCount: 5,
      totalWords: 1450,
      topTopics: ['gratitude', 'work', 'family'],
    },
    kiaanSummary: {
      conversationCount: 4,
      messageCount: 24,
      topTopics: ['stress management', 'mindfulness'],
    },
    insights: [
      {
        type: 'mood',
        title: 'Positive Trend',
        description: 'Your mood has improved 15% compared to last week!',
        icon: '📈',
      },
      {
        type: 'journal',
        title: 'Consistent Writer',
        description: 'You maintained your 7-day writing streak.',
        icon: '✍️',
      },
    ],
    achievements: [],
    highlightQuote:
      'The mind is everything. What you think, you become. - Buddha',
    comparisonToPreviousWeek: {
      moodChange: 15,
      entriesChange: 10,
      kiaanChange: -5,
    },
  }
}

function getMockAchievements(): Achievement[] {
  return [
    {
      id: 'first_entry',
      name: 'First Steps',
      description: 'Write your first journal entry',
      icon: '📝',
      earnedAt: new Date().toISOString(),
      category: 'journal',
      rarity: 'common',
    },
    {
      id: 'week_streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day writing streak',
      icon: '🔥',
      earnedAt: new Date().toISOString(),
      category: 'streak',
      rarity: 'uncommon',
    },
    {
      id: 'kiaan_explorer',
      name: 'KIAAN Explorer',
      description: 'Have 10 conversations with KIAAN',
      icon: '💬',
      progress: 8,
      target: 10,
      category: 'kiaan',
      rarity: 'uncommon',
    },
    {
      id: 'mood_master',
      name: 'Mood Master',
      description: 'Track your mood for 30 days',
      icon: '😊',
      progress: 21,
      target: 30,
      category: 'mood',
      rarity: 'rare',
    },
  ]
}
