/**
 * Analytics Types
 * Type definitions for MindVibe analytics dashboard
 */

/** Time period options for analytics */
export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'

/** Date range for analytics queries */
export interface DateRange {
  start: string
  end: string
}

/** Overview metrics displayed in summary cards */
export interface OverviewMetrics {
  totalEntries: number
  totalWords: number
  avgWordsPerEntry: number
  currentStreak: number
  longestStreak: number
  avgMoodScore: number
  moodTrend: 'up' | 'down' | 'stable'
  kiaanConversations: number
  kiaanMessages: number
  lastActivityDate: string | null
}

/** Single mood data point for charts */
export interface MoodDataPoint {
  date: string
  score: number
  label?: string
  notes?: string
}

/** Mood trend data for visualization */
export interface MoodTrendData {
  period: AnalyticsPeriod
  data: MoodDataPoint[]
  averageScore: number
  highestScore: number
  lowestScore: number
  trend: 'improving' | 'declining' | 'stable'
  changePercentage: number
}

/** Sentiment distribution */
export interface SentimentDistribution {
  positive: number
  neutral: number
  negative: number
  mixed: number
}

/** Common tag/topic with frequency */
export interface TagFrequency {
  tag: string
  count: number
  percentage: number
}

/** Writing time distribution (heatmap data) */
export interface WritingTimeData {
  hour: number
  dayOfWeek: number
  count: number
}

/** Journal statistics */
export interface JournalStatistics {
  totalEntries: number
  totalWords: number
  avgWordsPerEntry: number
  currentStreak: number
  longestStreak: number
  sentimentDistribution: SentimentDistribution
  topTags: TagFrequency[]
  writingTimeDistribution: WritingTimeData[]
  entriesByMonth: { month: string; count: number }[]
  avgEntriesPerWeek: number
}

/** KIAAN conversation summary */
export interface KIAANConversation {
  id: string
  startedAt: string
  messageCount: number
  duration: number
  topics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

/** KIAAN usage by hour */
export interface KIAANUsageByHour {
  hour: number
  messageCount: number
}

/** KIAAN usage by day */
export interface KIAANUsageByDay {
  dayOfWeek: number
  dayName: string
  messageCount: number
}

/** KIAAN insights data */
export interface KIAANInsightData {
  totalConversations: number
  totalMessages: number
  avgMessagesPerConversation: number
  avgResponseTime: number
  topTopics: TagFrequency[]
  engagementLevel: 'high' | 'medium' | 'low'
  usageByHour: KIAANUsageByHour[]
  usageByDay: KIAANUsageByDay[]
  recentConversations: KIAANConversation[]
  streakDays: number
}

/** Achievement definition */
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  earnedAt?: string
  progress?: number
  target?: number
  category: 'journal' | 'mood' | 'kiaan' | 'streak' | 'milestone'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

/** Insight from weekly summary */
export interface WeeklyInsight {
  type: 'mood' | 'journal' | 'kiaan' | 'general'
  title: string
  description: string
  icon?: string
}

/** Weekly summary data */
export interface WeeklySummaryData {
  weekStart: string
  weekEnd: string
  moodSummary: {
    avgScore: number
    trend: 'up' | 'down' | 'stable'
    bestDay: string | null
    challengingDay: string | null
  }
  journalSummary: {
    entriesCount: number
    totalWords: number
    topTopics: string[]
  }
  kiaanSummary: {
    conversationCount: number
    messageCount: number
    topTopics: string[]
  }
  insights: WeeklyInsight[]
  achievements: Achievement[]
  highlightQuote?: string
  comparisonToPreviousWeek: {
    moodChange: number
    entriesChange: number
    kiaanChange: number
  }
}

/** Export format options */
export type ExportFormat = 'csv' | 'json' | 'pdf'

/** Data types available for export */
export type ExportDataType = 'journal' | 'mood' | 'kiaan' | 'all'

/** Export options */
export interface ExportOptions {
  format: ExportFormat
  dataTypes: ExportDataType[]
  dateRange: DateRange
  includeMetadata?: boolean
  includeAnalytics?: boolean
}

/** Export progress */
export interface ExportProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  downloadUrl?: string
  error?: string
}

/** Complete analytics data */
export interface AnalyticsData {
  overview: OverviewMetrics
  moodTrends: MoodTrendData
  journalStats: JournalStatistics
  kiaanInsights: KIAANInsightData
  weeklySummary: WeeklySummaryData | null
  achievements: Achievement[]
  lastUpdated: string
}

/** Analytics filter state */
export interface AnalyticsFilters {
  period: AnalyticsPeriod
  dateRange: DateRange
  dataType?: ExportDataType
}

/** Analytics loading state */
export interface AnalyticsLoadingState {
  overview: boolean
  moodTrends: boolean
  journalStats: boolean
  kiaanInsights: boolean
  weeklySummary: boolean
  achievements: boolean
}

/** Analytics error state */
export interface AnalyticsErrorState {
  overview: string | null
  moodTrends: string | null
  journalStats: string | null
  kiaanInsights: string | null
  weeklySummary: string | null
  achievements: string | null
}

/** Chart theme for light/dark mode */
export interface ChartTheme {
  backgroundColor: string
  textColor: string
  gridColor: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  positiveColor: string
  negativeColor: string
  neutralColor: string
}

/** Default chart themes */
export const DARK_CHART_THEME: ChartTheme = {
  backgroundColor: '#0d0d10',
  textColor: '#f5e6d3',
  gridColor: 'rgba(255, 115, 39, 0.1)',
  primaryColor: '#ff7327',
  secondaryColor: '#fbbf24',
  accentColor: '#f59e0b',
  positiveColor: '#10b981',
  negativeColor: '#ef4444',
  neutralColor: '#6b7280',
}

export const LIGHT_CHART_THEME: ChartTheme = {
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  gridColor: 'rgba(0, 0, 0, 0.1)',
  primaryColor: '#ff7327',
  secondaryColor: '#fbbf24',
  accentColor: '#f59e0b',
  positiveColor: '#10b981',
  negativeColor: '#ef4444',
  neutralColor: '#6b7280',
}
