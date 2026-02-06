/**
 * useVoiceLearning - Hook for KIAAN Voice Learning Integration
 *
 * Integrates with the voice learning backend to enable:
 * - Session management with cross-session memory
 * - Preference learning from user behavior
 * - Enhanced responses with emotion-aware prosody
 * - Feedback collection for continuous improvement
 * - A/B experiment participation
 *
 * This enables KIAAN to learn and improve like Siri/Alexa.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

// ===== Types =====

export interface VoiceLearningSession {
  sessionId: string
  userId: string
  activeMemories: string[]
  proactivePrompts: string[]
  preferencesApplied: Record<string, unknown>
}

export interface EnhancedResponse {
  text: string
  ssml: string
  emotion: string
  voiceConfig: {
    speakingRate: number
    pitch: number
    volume: number
    voiceName?: string
  }
  memoriesUsed: string[]
  experimentVariant: string | null
  cacheHit: boolean
  enhancementsApplied: string[]
}

export interface SentimentAnalysis {
  emotion: string
  confidence: number
  polarity: number
  intensity: number
  memories: string[]
  crisisDetected: boolean
}

export interface UserPreference {
  key: string
  value: unknown
  confidence: number
}

export interface UseVoiceLearningOptions {
  autoStartSession?: boolean
  language?: string
  onSessionStart?: (session: VoiceLearningSession) => void
  onSessionEnd?: () => void
  onEnhancedResponse?: (response: EnhancedResponse) => void
  onSentimentDetected?: (sentiment: SentimentAnalysis) => void
  onError?: (error: string) => void
}

export interface UseVoiceLearningReturn {
  // Session
  session: VoiceLearningSession | null
  isSessionActive: boolean
  startSession: (initialMood?: string) => Promise<void>
  endSession: () => Promise<void>

  // Enhanced Responses
  enhanceResponse: (text: string, context?: string) => Promise<EnhancedResponse | null>
  isEnhancing: boolean

  // Input Processing
  processInput: (text: string) => Promise<SentimentAnalysis | null>
  isProcessing: boolean

  // Feedback
  recordFeedback: (rating: number, responseHash?: string, metadata?: Record<string, unknown>) => Promise<void>
  recordPlayback: (eventType: 'play' | 'pause' | 'skip' | 'replay' | 'complete', contentHash?: string, durationMs?: number) => Promise<void>

  // Memories
  memories: string[]
  addMemory: (type: string, key: string, content: string, priority?: string) => Promise<void>
  refreshMemories: () => Promise<void>

  // Preferences
  preferences: Record<string, UserPreference>
  refreshPreferences: () => Promise<void>

  // Proactive Prompts
  proactivePrompts: string[]

  // Insights
  getInsights: () => Promise<Record<string, unknown> | null>

  // Error
  error: string | null
}

// ===== Hook Implementation =====

export function useVoiceLearning(options: UseVoiceLearningOptions = {}): UseVoiceLearningReturn {
  const {
    autoStartSession = false,
    language = 'en',
    onSessionStart,
    onSessionEnd,
    onEnhancedResponse,
    onSentimentDetected,
    onError,
  } = options

  // State
  const [session, setSession] = useState<VoiceLearningSession | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [memories, setMemories] = useState<string[]>([])
  const [preferences, setPreferences] = useState<Record<string, UserPreference>>({})
  const [proactivePrompts, setProactivePrompts] = useState<string[]>([])

  // Refs
  const sessionIdRef = useRef<string | null>(null)

  // Auto-start session
  useEffect(() => {
    if (autoStartSession && !session) {
      startSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        // Best effort cleanup - don't await
        apiFetch(`/api/voice-learning/session/${sessionIdRef.current}/end`, {
          method: 'POST',
        }).catch(() => {})
      }
    }
  }, [])

  // Start session
  const startSession = useCallback(async (initialMood?: string) => {
    setError(null)

    try {
      const response = await apiFetch('/api/voice-learning/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_mood: initialMood,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start voice learning session')
      }

      const data = await response.json()

      const newSession: VoiceLearningSession = {
        sessionId: data.session_id,
        userId: data.user_id,
        activeMemories: data.active_memories || [],
        proactivePrompts: data.proactive_prompts || [],
        preferencesApplied: data.preferences_applied || {},
      }

      sessionIdRef.current = newSession.sessionId
      setSession(newSession)
      setMemories(newSession.activeMemories)
      setProactivePrompts(newSession.proactivePrompts)
      onSessionStart?.(newSession)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Session start failed'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [onSessionStart, onError])

  // End session
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return

    try {
      await apiFetch(`/api/voice-learning/session/${sessionIdRef.current}/end`, {
        method: 'POST',
      })

      sessionIdRef.current = null
      setSession(null)
      setMemories([])
      setProactivePrompts([])
      onSessionEnd?.()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Session end failed'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [onSessionEnd, onError])

  // Enhance response
  const enhanceResponse = useCallback(async (
    text: string,
    context: string = 'general'
  ): Promise<EnhancedResponse | null> => {
    setIsEnhancing(true)
    setError(null)

    try {
      const response = await apiFetch('/api/voice-learning/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          context,
          language,
          session_id: sessionIdRef.current,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to enhance response')
      }

      const data = await response.json()

      const enhanced: EnhancedResponse = {
        text: data.text,
        ssml: data.ssml,
        emotion: data.emotion,
        voiceConfig: {
          speakingRate: data.voice_config?.speaking_rate || 0.95,
          pitch: data.voice_config?.pitch || 0,
          volume: data.voice_config?.volume || 1.0,
          voiceName: data.voice_config?.voice_name,
        },
        memoriesUsed: data.memories_used || [],
        experimentVariant: data.experiment_variant,
        cacheHit: data.cache_hit || false,
        enhancementsApplied: data.enhancements_applied || [],
      }

      onEnhancedResponse?.(enhanced)
      return enhanced
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Enhancement failed'
      setError(errorMsg)
      onError?.(errorMsg)
      return null
    } finally {
      setIsEnhancing(false)
    }
  }, [language, onEnhancedResponse, onError])

  // Process input
  const processInput = useCallback(async (
    text: string
  ): Promise<SentimentAnalysis | null> => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await apiFetch('/api/voice-learning/process-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          session_id: sessionIdRef.current,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process input')
      }

      const data = await response.json()

      const sentiment: SentimentAnalysis = {
        emotion: data.emotion,
        confidence: data.confidence,
        polarity: data.polarity,
        intensity: data.intensity,
        memories: data.memories || [],
        crisisDetected: data.crisis_detected || false,
      }

      onSentimentDetected?.(sentiment)
      return sentiment
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Input processing failed'
      setError(errorMsg)
      onError?.(errorMsg)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [onSentimentDetected, onError])

  // Record feedback
  const recordFeedback = useCallback(async (
    rating: number,
    responseHash?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await apiFetch('/api/voice-learning/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          response_hash: responseHash,
          feedback_type: 'rating',
          metadata: {
            ...metadata,
            session_id: sessionIdRef.current,
          },
        }),
      })
    } catch {
      // Silent fail for feedback - don't interrupt UX
    }
  }, [])

  // Record playback event
  const recordPlayback = useCallback(async (
    eventType: 'play' | 'pause' | 'skip' | 'replay' | 'complete',
    contentHash?: string,
    durationMs?: number
  ) => {
    try {
      await apiFetch('/api/voice-learning/playback-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          content_hash: contentHash,
          duration_ms: durationMs,
          metadata: {
            session_id: sessionIdRef.current,
          },
        }),
      })
    } catch {
      // Silent fail for analytics
    }
  }, [])

  // Refresh memories
  const refreshMemories = useCallback(async () => {
    try {
      const response = await apiFetch('/api/voice-learning/memories')

      if (response.ok) {
        const data = await response.json()
        const memoryKeys = (data.memories || []).map((m: { key: string }) => m.key)
        setMemories(memoryKeys)
      }
    } catch {
      // Silent fail
    }
  }, [])

  // Add memory
  const addMemory = useCallback(async (
    type: string,
    key: string,
    content: string,
    priority: string = 'medium'
  ) => {
    try {
      const response = await apiFetch('/api/voice-learning/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memory_type: type,
          key,
          content,
          priority,
        }),
      })

      if (response.ok) {
        // Refresh memories after adding
        await refreshMemories()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add memory'
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [onError, refreshMemories])

  // Refresh preferences
  const refreshPreferences = useCallback(async () => {
    try {
      const response = await apiFetch('/api/voice-learning/preferences')

      if (response.ok) {
        const data = await response.json()
        const prefs: Record<string, UserPreference> = {}

        for (const [key, value] of Object.entries(data.preferences || {})) {
          const prefData = value as { value: unknown; confidence: number }
          prefs[key] = {
            key,
            value: prefData.value,
            confidence: prefData.confidence,
          }
        }

        setPreferences(prefs)
      }
    } catch {
      // Silent fail
    }
  }, [])

  // Get insights
  const getInsights = useCallback(async (): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiFetch('/api/voice-learning/insights')

      if (response.ok) {
        return await response.json()
      }

      return null
    } catch {
      return null
    }
  }, [])

  return {
    // Session
    session,
    isSessionActive: !!session,
    startSession,
    endSession,

    // Enhanced Responses
    enhanceResponse,
    isEnhancing,

    // Input Processing
    processInput,
    isProcessing,

    // Feedback
    recordFeedback,
    recordPlayback,

    // Memories
    memories,
    addMemory,
    refreshMemories,

    // Preferences
    preferences,
    refreshPreferences,

    // Proactive Prompts
    proactivePrompts,

    // Insights
    getInsights,

    // Error
    error,
  }
}

// ===== Utility Hook: Compose with useKiaanVoice =====

/**
 * Hook to integrate voice learning with the existing useKiaanVoice hook.
 *
 * Usage:
 * ```tsx
 * const kiaan = useKiaanVoice({ ... })
 * const learning = useVoiceLearningWithKiaan(kiaan)
 *
 * // Now kiaan responses will automatically:
 * // - Track playback events
 * // - Record sentiment analysis
 * // - Apply learned preferences
 * ```
 */
export interface KiaanVoiceHook {
  state: string
  isSpeaking: boolean
  messages: Array<{ id: string; role: string; content: string }>
  speakResponse: (text: string) => void
  sendToKiaan: (text: string) => Promise<string | null>
}

export function useVoiceLearningWithKiaan(kiaanHook: KiaanVoiceHook) {
  const learning = useVoiceLearning({
    autoStartSession: true,
  })

  const lastMessageIdRef = useRef<string | null>(null)
  const playStartTimeRef = useRef<number>(0)

  // Track playback start/end
  useEffect(() => {
    if (kiaanHook.isSpeaking) {
      playStartTimeRef.current = Date.now()
      learning.recordPlayback('play')
    } else if (playStartTimeRef.current > 0) {
      const duration = Date.now() - playStartTimeRef.current
      learning.recordPlayback('complete', undefined, duration)
      playStartTimeRef.current = 0
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kiaanHook.isSpeaking])

  // Process user messages for sentiment
  useEffect(() => {
    const lastMessage = kiaanHook.messages[kiaanHook.messages.length - 1]
    if (lastMessage && lastMessage.id !== lastMessageIdRef.current && lastMessage.role === 'user') {
      lastMessageIdRef.current = lastMessage.id
      learning.processInput(lastMessage.content)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kiaanHook.messages])

  // Enhanced speak with SSML
  const speakWithLearning = useCallback(async (text: string, context?: string) => {
    const enhanced = await learning.enhanceResponse(text, context)

    if (enhanced?.ssml) {
      // If we have SSML, use backend TTS with SSML
      // For now, fall back to regular speak
      kiaanHook.speakResponse(text)
    } else {
      kiaanHook.speakResponse(text)
    }

    return enhanced
  }, [kiaanHook, learning])

  // Enhanced send with preference application
  const sendWithLearning = useCallback(async (text: string) => {
    // Process input first for sentiment
    await learning.processInput(text)

    // Send to KIAAN
    const response = await kiaanHook.sendToKiaan(text)

    if (response) {
      // Enhance response for voice output
      await learning.enhanceResponse(response, 'chat')
    }

    return response
  }, [kiaanHook, learning])

  return {
    ...learning,
    speakWithLearning,
    sendWithLearning,
  }
}

export default useVoiceLearning
