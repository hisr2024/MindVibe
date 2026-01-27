/**
 * useAdvancedVoiceLearning - Advanced voice learning features hook
 *
 * Provides access to advanced KIAAN Voice learning capabilities:
 * - Analytics dashboard data
 * - Proactive engagement management
 * - Offline sync handling
 * - Voice personalization
 * - Spiritual journey memory
 * - Quality metrics
 * - Interaction pattern insights
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ==================== Types ====================

export interface DashboardSnapshot {
  timestamp: string
  overallSatisfaction: number
  satisfactionTrend: 'improving' | 'stable' | 'declining'
  totalSessions: number
  activeUsers24h: number
  averageSessionDuration: number
  feedbackResponseRate: number
  cacheHitRate: number
  topEmotions: Array<[string, number]>
  engagementScore: number
  alerts: Array<{
    type: string
    message: string
    timestamp: string
  }>
}

export interface ProactiveMessage {
  id: string
  trigger: string
  tone: string
  message: string
  scheduledTime: string
  priority: number
}

export interface VoiceProfile {
  speakingRate: number
  pitchAdjustment: number
  volumeAdjustment: number
  pauseMultiplier: number
  emphasisLevel: number
  warmthLevel: number
  energyLevel: number
  accentPreference: string
  preferredPersona: string | null
  accessibilityMode: boolean
}

export interface SpiritualSummary {
  journeyAgeDays: number
  versesEncountered: number
  topResonantVerses: Array<{
    verseId: string
    score: number
  }>
  breakthroughsCount: number
  validatedBreakthroughs: number
  activeStruggles: number
  overcomeStruggles: number
  milestonesAchieved: number
  growthScores: Record<string, number>
  strongestDimensions: Array<[string, number]>
  teachingStyle: string
  reflectionHours: number
  journeysCompleted: number
}

export interface QualityTrend {
  dimension: string
  averageScore: number
  scoreVariance: number
  sampleCount: number
  trendDirection: 'improving' | 'stable' | 'declining'
}

export interface InteractionAnalytics {
  totalInteractions: number
  responseLength: {
    preferred: number
    tolerance: [number, number]
    confidence: number
  }
  attentionSpan: {
    averageDuration: number
    completionRate: number
    optimalSegment: number
    fatiguePoint: number | null
  }
  voiceTextPreference: {
    voiceInput: number
    voiceOutput: number
    voicePreferredContent: string[]
    textPreferredContent: string[]
  }
  activeHours: number[]
  preferredSessionDuration: number
}

export interface SyncStatus {
  totalItems: number
  byStatus: Record<string, number>
  syncInProgress: boolean
  connectionStatus: boolean
}

export interface OfflineFeedback {
  type: string
  rating?: number
  completed?: boolean
  listenDuration?: number
  responseText?: string
  context?: Record<string, unknown>
}

// ==================== API Functions ====================

const API_BASE = '/api/voice-learning/advanced'

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

// ==================== Analytics Dashboard Hook ====================

export function useAnalyticsDashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSnapshot = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchApi<DashboardSnapshot>('/analytics/snapshot')
      setSnapshot(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSatisfactionTrend = useCallback(async (days: number = 7) => {
    return fetchApi<Array<{
      period: string
      average: number
      count: number
    }>>(`/analytics/satisfaction-trend?days=${days}`)
  }, [])

  const fetchQualityTrends = useCallback(async (days: number = 7) => {
    return fetchApi<Record<string, QualityTrend>>(`/analytics/quality-trends?days=${days}`)
  }, [])

  useEffect(() => {
    fetchSnapshot()
  }, [fetchSnapshot])

  return {
    snapshot,
    loading,
    error,
    refresh: fetchSnapshot,
    fetchSatisfactionTrend,
    fetchQualityTrends,
  }
}

// ==================== Proactive Engagement Hook ====================

export function useProactiveEngagement() {
  const [pendingMessages, setPendingMessages] = useState<ProactiveMessage[]>([])
  const [engagementPattern, setEngagementPattern] = useState<{
    preferredHours: number[]
    lastEngagement: string | null
    responseRate: number
  } | null>(null)

  const fetchPendingMessages = useCallback(async () => {
    const data = await fetchApi<ProactiveMessage[]>('/engagement/pending')
    setPendingMessages(data)
    return data
  }, [])

  const fetchPattern = useCallback(async () => {
    const data = await fetchApi<typeof engagementPattern>('/engagement/pattern')
    setEngagementPattern(data)
    return data
  }, [])

  const recordActivity = useCallback(async (
    activityType: string,
    metadata?: Record<string, unknown>
  ) => {
    return fetchApi('/engagement/activity', {
      method: 'POST',
      body: JSON.stringify({ activityType, metadata }),
    })
  }, [])

  const markMessageDelivered = useCallback(async (messageId: string) => {
    return fetchApi(`/engagement/message/${messageId}/delivered`, {
      method: 'POST',
    })
  }, [])

  const respondToMessage = useCallback(async (
    messageId: string,
    responded: boolean,
    responseDelay?: number
  ) => {
    return fetchApi(`/engagement/message/${messageId}/response`, {
      method: 'POST',
      body: JSON.stringify({ responded, responseDelay }),
    })
  }, [])

  return {
    pendingMessages,
    engagementPattern,
    fetchPendingMessages,
    fetchPattern,
    recordActivity,
    markMessageDelivered,
    respondToMessage,
  }
}

// ==================== Offline Sync Hook ====================

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const queueRef = useRef<OfflineFeedback[]>([])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queueRef.current.length > 0) {
      syncQueue()
    }
  }, [isOnline])

  const fetchSyncStatus = useCallback(async () => {
    const data = await fetchApi<SyncStatus>('/sync/status')
    setSyncStatus(data)
    return data
  }, [])

  const queueFeedback = useCallback((feedback: OfflineFeedback) => {
    queueRef.current.push({
      ...feedback,
      context: {
        ...feedback.context,
        queuedAt: new Date().toISOString(),
      },
    })

    // Store in localStorage for persistence
    try {
      localStorage.setItem('voiceLearning_offlineQueue', JSON.stringify(queueRef.current))
    } catch {
      // Handle storage full
    }

    return queueRef.current.length
  }, [])

  const syncQueue = useCallback(async () => {
    if (!isOnline || queueRef.current.length === 0) {
      return { synced: 0, failed: 0 }
    }

    try {
      const result = await fetchApi<{ synced: number; failed: number }>('/sync/batch', {
        method: 'POST',
        body: JSON.stringify({ items: queueRef.current }),
      })

      // Clear synced items
      if (result.synced > 0) {
        queueRef.current = queueRef.current.slice(result.synced)
        localStorage.setItem('voiceLearning_offlineQueue', JSON.stringify(queueRef.current))
      }

      return result
    } catch {
      return { synced: 0, failed: queueRef.current.length }
    }
  }, [isOnline])

  const analyzeOffline = useCallback((text: string) => {
    // Simple offline sentiment analysis
    const keywords: Record<string, string[]> = {
      anxiety: ['worried', 'anxious', 'nervous', 'stressed', 'overwhelmed'],
      sadness: ['sad', 'depressed', 'unhappy', 'lonely', 'hopeless'],
      anger: ['angry', 'furious', 'frustrated', 'irritated', 'annoyed'],
      gratitude: ['grateful', 'thankful', 'blessed', 'appreciative'],
      serenity: ['peaceful', 'calm', 'serene', 'tranquil', 'relaxed'],
    }

    const textLower = text.toLowerCase()
    const scores: Record<string, number> = {}

    for (const [emotion, words] of Object.entries(keywords)) {
      const matches = words.filter((w) => textLower.includes(w))
      if (matches.length > 0) {
        scores[emotion] = Math.min(1, matches.length / 3)
      }
    }

    const topEmotion = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]

    return {
      primaryEmotion: topEmotion?.[0] || 'neutral',
      confidence: topEmotion?.[1] || 0.3,
      isOffline: true,
    }
  }, [])

  // Load persisted queue on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('voiceLearning_offlineQueue')
      if (stored) {
        queueRef.current = JSON.parse(stored)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  return {
    syncStatus,
    isOnline,
    queueLength: queueRef.current.length,
    fetchSyncStatus,
    queueFeedback,
    syncQueue,
    analyzeOffline,
  }
}

// ==================== Voice Personalization Hook ====================

export function useVoicePersonalization() {
  const [profile, setProfile] = useState<VoiceProfile | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchApi<VoiceProfile>('/personalization/profile')
      setProfile(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<VoiceProfile>) => {
    const data = await fetchApi<VoiceProfile>('/personalization/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    setProfile(data)
    return data
  }, [])

  const applyPersona = useCallback(async (persona: string) => {
    const data = await fetchApi<VoiceProfile>('/personalization/persona', {
      method: 'POST',
      body: JSON.stringify({ persona }),
    })
    setProfile(data)
    return data
  }, [])

  const provideFeedback = useCallback(async (
    feedbackType: 'too_fast' | 'too_slow' | 'too_loud' | 'too_quiet' | 'too_high_pitch' | 'too_low_pitch'
  ) => {
    return fetchApi('/personalization/feedback', {
      method: 'POST',
      body: JSON.stringify({ feedbackType }),
    })
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    refresh: fetchProfile,
    updateProfile,
    applyPersona,
    provideFeedback,
  }
}

// ==================== Spiritual Memory Hook ====================

export function useSpiritualMemory() {
  const [summary, setSummary] = useState<SpiritualSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchApi<SpiritualSummary>('/spiritual/summary')
      setSummary(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const recordVerseResonance = useCallback(async (
    verseId: string,
    chapter: number,
    verseNumber: number,
    translation: string,
    resonanceScore: number,
    context: string,
    reflection?: string
  ) => {
    return fetchApi('/spiritual/verse-resonance', {
      method: 'POST',
      body: JSON.stringify({
        verseId,
        chapter,
        verseNumber,
        translation,
        resonanceScore,
        context,
        reflection,
      }),
    })
  }, [])

  const recordBreakthrough = useCallback(async (
    description: string,
    growthDimensions: string[],
    triggerVerse?: string,
    triggerJourney?: string
  ) => {
    return fetchApi('/spiritual/breakthrough', {
      method: 'POST',
      body: JSON.stringify({
        description,
        growthDimensions,
        triggerVerse,
        triggerJourney,
      }),
    })
  }, [])

  const getRecommendedVerse = useCallback(async (struggleCategory: string) => {
    return fetchApi<{
      verseId: string
      reason: string
      resonanceScore?: number
    } | null>(`/spiritual/recommend-verse?category=${struggleCategory}`)
  }, [])

  const getUncelebratedMilestones = useCallback(async () => {
    return fetchApi<Array<{
      id: string
      title: string
      description: string
      achievedAt: string
    }>>('/spiritual/milestones/uncelebrated')
  }, [])

  const celebrateMilestone = useCallback(async (milestoneId: string) => {
    return fetchApi(`/spiritual/milestone/${milestoneId}/celebrate`, {
      method: 'POST',
    })
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return {
    summary,
    loading,
    refresh: fetchSummary,
    recordVerseResonance,
    recordBreakthrough,
    getRecommendedVerse,
    getUncelebratedMilestones,
    celebrateMilestone,
  }
}

// ==================== Interaction Patterns Hook ====================

export function useInteractionPatterns() {
  const [analytics, setAnalytics] = useState<InteractionAnalytics | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchApi<InteractionAnalytics>('/patterns/analytics')
      setAnalytics(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const getOptimalResponseLength = useCallback(async (
    contentCategory?: string
  ) => {
    const params = contentCategory ? `?category=${contentCategory}` : ''
    return fetchApi<number>(`/patterns/optimal-length${params}`)
  }, [])

  const shouldUseVoice = useCallback(async (contentCategory: string) => {
    return fetchApi<{ useVoice: boolean; confidence: number }>(
      `/patterns/should-use-voice?category=${contentCategory}`
    )
  }, [])

  const isGoodTimeToEngage = useCallback(async () => {
    return fetchApi<{ isGood: boolean; reason: string }>('/patterns/good-time')
  }, [])

  const recordInteraction = useCallback(async (
    eventType: string,
    durationSeconds?: number,
    completionRate?: number,
    contentCategory?: string
  ) => {
    return fetchApi('/patterns/interaction', {
      method: 'POST',
      body: JSON.stringify({
        eventType,
        durationSeconds,
        completionRate,
        contentCategory,
      }),
    })
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics,
    loading,
    refresh: fetchAnalytics,
    getOptimalResponseLength,
    shouldUseVoice,
    isGoodTimeToEngage,
    recordInteraction,
  }
}

// ==================== Combined Hook ====================

export interface AdvancedVoiceLearningOptions {
  enableAnalytics?: boolean
  enableProactive?: boolean
  enableOfflineSync?: boolean
  enablePersonalization?: boolean
  enableSpiritualMemory?: boolean
  enablePatterns?: boolean
}

export function useAdvancedVoiceLearning(options: AdvancedVoiceLearningOptions = {}) {
  const {
    enableAnalytics = true,
    enableProactive = true,
    enableOfflineSync = true,
    enablePersonalization = true,
    enableSpiritualMemory = true,
    enablePatterns = true,
  } = options

  // Always call all hooks unconditionally to follow React hooks rules
  // Then conditionally expose their results based on options
  const analyticsHook = useAnalyticsDashboard()
  const proactiveHook = useProactiveEngagement()
  const offlineSyncHook = useOfflineSync()
  const personalizationHook = useVoicePersonalization()
  const spiritualMemoryHook = useSpiritualMemory()
  const patternsHook = useInteractionPatterns()

  // Return null for disabled features to maintain API compatibility
  const analytics = enableAnalytics ? analyticsHook : null
  const proactive = enableProactive ? proactiveHook : null
  const offlineSync = enableOfflineSync ? offlineSyncHook : null
  const personalization = enablePersonalization ? personalizationHook : null
  const spiritualMemory = enableSpiritualMemory ? spiritualMemoryHook : null
  const patterns = enablePatterns ? patternsHook : null

  return {
    analytics,
    proactive,
    offlineSync,
    personalization,
    spiritualMemory,
    patterns,
    isReady: Boolean(
      (!enableAnalytics || analyticsHook.snapshot) &&
      (!enablePersonalization || personalizationHook.profile) &&
      (!enableSpiritualMemory || spiritualMemoryHook.summary)
    ),
  }
}

export default useAdvancedVoiceLearning
