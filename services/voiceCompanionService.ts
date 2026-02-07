/**
 * Voice Companion Service - Unified Backend API Client
 *
 * Handles all backend communication for the Voice Companion:
 * - Conversation sessions (start, message, end)
 * - Guided breathing exercises
 * - Emotional analysis and soul reading
 * - Voice learning and preference tracking
 * - Proactive engagement messages
 * - Daily check-ins
 * - Enhancement sessions (binaural, ambient, breathing)
 */

import { apiFetch } from '@/lib/api'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConversationSession {
  sessionId: string
  phase: string
  emotionalState?: string
  messageCount: number
}

export interface CompanionMessage {
  response: string
  verse?: { chapter: number; verse: number; text: string }
  emotion?: string
  practice?: string
  followUp?: string
  ssml?: string
}

export interface BreathingExercise {
  steps: BreathingStep[]
  totalDuration: number
  pattern: string
  message?: string
}

export interface BreathingStep {
  phase: 'inhale' | 'hold' | 'exhale' | 'rest'
  duration: number
  instruction: string
}

export interface SoulReading {
  emotion: {
    primary: string
    secondary?: string
    intensity: number
    valence: number
  }
  spiritual: {
    gunaBalance: { sattva: number; rajas: number; tamas: number }
    consciousnessLevel: string
    challenges: string[]
  }
  recommendations: string[]
  verses: Array<{ chapter: number; verse: number; text: string }>
}

export interface ProactiveMessage {
  id: string
  type: string
  content: string
  priority: number
}

export interface VoiceProfile {
  speakingRate: number
  pitch: number
  volume: number
  warmth: number
  energy: number
  persona: string
}

// ─── Service ────────────────────────────────────────────────────────────────

class VoiceCompanionService {
  private sessionId: string | null = null
  /** Circuit breaker with timed recovery */
  private apiDisabled = false
  private apiDisabledUntil = 0
  private readonly CIRCUIT_COOLDOWN = 5 * 60 * 1000 // 5 min

  private isApiAvailable(): boolean {
    if (!this.apiDisabled) return true
    if (Date.now() >= this.apiDisabledUntil) {
      this.apiDisabled = false
      return true
    }
    return false
  }

  // ─── Conversation Sessions ──────────────────────────────────────

  /** Start a new divine conversation session (local-first until backend supports it) */
  async startSession(_language: string = 'en'): Promise<ConversationSession | null> {
    // Generate local session — backend conversation endpoints not yet available
    this.sessionId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    return {
      sessionId: this.sessionId,
      phase: 'greeting',
      messageCount: 0,
    }
  }

  /** Send a message within the active session — delegates to voiceQuery */
  async sendMessage(text: string, language: string = 'en'): Promise<CompanionMessage | null> {
    return this.voiceQuery(text, 'voice', language)
  }

  /** End the current conversation session with farewell */
  async endSession(): Promise<string | null> {
    if (!this.sessionId) return null
    this.sessionId = null
    return 'Namaste. May peace be with you.'
  }

  // ─── Voice Query (Stateless Fallback) ───────────────────────────

  /** Stateless voice query - fallback when session management fails */
  async voiceQuery(text: string, context: string = 'voice', language: string = 'en'): Promise<CompanionMessage | null> {
    if (!this.isApiAvailable()) return null
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await apiFetch('/api/voice/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          language,
          context,
          include_audio: false,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return {
          response: data.response || data.message || 'I am here with you.',
          verse: data.verse,
          emotion: data.detected_emotion,
        }
      }

      this.checkAuthFailure(response.status)

      // Fallback to chat API
      const chatController = new AbortController()
      const chatTimeoutId = setTimeout(() => chatController.abort(), 20000)
      const chatResponse = await apiFetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language, context }),
        signal: chatController.signal,
      })
      clearTimeout(chatTimeoutId)

      if (chatResponse.ok) {
        const chatData = await chatResponse.json()
        return {
          response: chatData.response || chatData.message || 'I am here with you.',
        }
      }
      this.checkAuthFailure(chatResponse.status)
      return null
    } catch {
      return null
    }
  }

  // ─── Guided Breathing ───────────────────────────────────────────

  /** Get a guided breathing exercise */
  async getBreathingExercise(_pattern: string = 'peace_breath'): Promise<BreathingExercise> {
    return this.defaultBreathingExercise()
  }

  private defaultBreathingExercise(): BreathingExercise {
    return {
      pattern: 'box_breathing',
      totalDuration: 48,
      steps: [
        { phase: 'inhale', duration: 4, instruction: 'Breathe in slowly...' },
        { phase: 'hold', duration: 4, instruction: 'Hold gently...' },
        { phase: 'exhale', duration: 4, instruction: 'Release slowly...' },
        { phase: 'rest', duration: 4, instruction: 'Rest peacefully...' },
        { phase: 'inhale', duration: 4, instruction: 'Breathe in deeply...' },
        { phase: 'hold', duration: 4, instruction: 'Hold with awareness...' },
        { phase: 'exhale', duration: 4, instruction: 'Let everything go...' },
        { phase: 'rest', duration: 4, instruction: 'Be still...' },
        { phase: 'inhale', duration: 4, instruction: 'One more breath in...' },
        { phase: 'hold', duration: 4, instruction: 'Hold in peace...' },
        { phase: 'exhale', duration: 4, instruction: 'Release completely...' },
        { phase: 'rest', duration: 4, instruction: 'You are at peace.' },
      ],
    }
  }

  // ─── Soul Reading ───────────────────────────────────────────────

  /** Get deep emotional/spiritual analysis (backend endpoint not yet available) */
  async getSoulReading(_text: string): Promise<SoulReading | null> {
    return null
  }

  // ─── Voice Learning ─────────────────────────────────────────────

  /** Start a voice learning session (backend not yet available) */
  async startLearningSession(): Promise<void> {
    // No-op until backend voice-learning endpoints are available
  }

  /** Record a playback event for learning (backend not yet available) */
  async recordPlaybackEvent(_event: 'play' | 'pause' | 'skip' | 'replay' | 'complete'): Promise<void> {
    // No-op until backend voice-learning endpoints are available
  }

  /** Submit conversation feedback (backend not yet available) */
  async submitFeedback(_rating: number, _helpful: boolean): Promise<void> {
    // No-op until backend voice-learning endpoints are available
  }

  // ─── Proactive Engagement ───────────────────────────────────────

  /** Get pending proactive messages for the user (backend not yet available) */
  async getProactiveMessages(): Promise<ProactiveMessage[]> {
    return []
  }

  // ─── Enhancement Sessions ───────────────────────────────────────

  /** Start an enhancement session (backend not yet available) */
  async startEnhancement(_type: 'binaural' | 'spatial' | 'breathing' | 'ambient' | 'sleep' | 'meditation'): Promise<string | null> {
    return null
  }

  // ─── Daily Check-in ─────────────────────────────────────────────

  /** Submit a voice-based mood check-in (backend not yet available) */
  async submitCheckin(_mood: number, _energy: number, _stress: number, _isMorning: boolean = true): Promise<{ affirmation?: string; response?: string } | null> {
    return null
  }

  // ─── Spiritual Progress ─────────────────────────────────────────

  /** Get spiritual journey summary (backend not yet available) */
  async getSpiritualSummary(): Promise<{
    totalVerses: number
    breakthroughs: number
    growthScore: number
    teachingStyle: string
  } | null> {
    return null
  }

  // ─── Circuit Breaker ─────────────────────────────────────────────

  /** Trip circuit breaker with timed recovery on auth failure */
  private checkAuthFailure(status: number): void {
    if (status === 401 || status === 403) {
      if (!this.apiDisabled) {
        this.apiDisabled = true
        this.apiDisabledUntil = Date.now() + this.CIRCUIT_COOLDOWN
      }
    }
  }

  // ─── Getters ────────────────────────────────────────────────────

  getSessionId(): string | null {
    return this.sessionId
  }

  hasActiveSession(): boolean {
    return this.sessionId !== null
  }
}

// Singleton
const voiceCompanionService = new VoiceCompanionService()
export default voiceCompanionService
