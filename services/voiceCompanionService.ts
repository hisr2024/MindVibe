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

  // ─── Conversation Sessions ──────────────────────────────────────

  /** Start a new divine conversation session */
  async startSession(language: string = 'en'): Promise<ConversationSession | null> {
    try {
      const response = await apiFetch('/api/voice/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      })
      if (!response.ok) return null
      const data = await response.json()
      this.sessionId = data.session_id || data.sessionId
      return {
        sessionId: this.sessionId!,
        phase: data.phase || 'greeting',
        emotionalState: data.emotional_state,
        messageCount: 0,
      }
    } catch {
      return null
    }
  }

  /** Send a message within the active session */
  async sendMessage(text: string, language: string = 'en'): Promise<CompanionMessage | null> {
    try {
      const response = await apiFetch('/api/voice/conversation/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          message: text,
          language,
        }),
      })
      if (!response.ok) return null
      const data = await response.json()
      return {
        response: data.response || data.message || 'I am here with you.',
        verse: data.verse,
        emotion: data.emotion || data.detected_emotion,
        practice: data.practice || data.suggested_practice,
        followUp: data.follow_up,
        ssml: data.ssml,
      }
    } catch {
      return null
    }
  }

  /** End the current conversation session with farewell */
  async endSession(): Promise<string | null> {
    if (!this.sessionId) return null
    try {
      const response = await apiFetch(`/api/voice/conversation/end?session_id=${encodeURIComponent(this.sessionId)}`, {
        method: 'POST',
      })
      this.sessionId = null
      if (!response.ok) return null
      const data = await response.json()
      return data.farewell || data.message || 'Namaste. May peace be with you.'
    } catch {
      this.sessionId = null
      return null
    }
  }

  // ─── Voice Query (Stateless Fallback) ───────────────────────────

  /** Stateless voice query - fallback when session management fails */
  async voiceQuery(text: string, context: string = 'voice', language: string = 'en'): Promise<CompanionMessage | null> {
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
      return null
    } catch {
      return null
    }
  }

  // ─── Guided Breathing ───────────────────────────────────────────

  /** Get a guided breathing exercise */
  async getBreathingExercise(pattern: string = 'peace_breath'): Promise<BreathingExercise> {
    try {
      const params = new URLSearchParams()
      if (this.sessionId) params.set('session_id', this.sessionId)
      params.set('emotional_state', pattern)
      const response = await apiFetch(`/api/voice/conversation/breathe?${params.toString()}`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        if (data.steps) return data
      }
    } catch {
      // Fall through to default
    }

    // Default breathing exercise (4-4-4-4 box breathing)
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

  /** Get deep emotional/spiritual analysis */
  async getSoulReading(text: string): Promise<SoulReading | null> {
    try {
      const response = await apiFetch('/kiaan/soul-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context: 'voice' }),
      })
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  // ─── Voice Learning ─────────────────────────────────────────────

  /** Start a voice learning session */
  async startLearningSession(): Promise<void> {
    try {
      await apiFetch('/api/voice-learning/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    } catch {
      // Non-fatal
    }
  }

  /** Record a playback event for learning */
  async recordPlaybackEvent(event: 'play' | 'pause' | 'skip' | 'replay' | 'complete'): Promise<void> {
    try {
      await apiFetch('/api/voice-learning/playback-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: event }),
      })
    } catch {
      // Non-fatal
    }
  }

  /** Submit conversation feedback */
  async submitFeedback(rating: number, helpful: boolean): Promise<void> {
    try {
      await apiFetch('/api/voice-learning/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          feedback_type: 'conversation',
          metadata: { helpful, session_id: this.sessionId },
        }),
      })
    } catch {
      // Non-fatal
    }
  }

  // ─── Proactive Engagement ───────────────────────────────────────

  /** Get pending proactive messages for the user */
  async getProactiveMessages(): Promise<ProactiveMessage[]> {
    try {
      const response = await apiFetch('/api/voice-learning/advanced/engagement/pending')
      if (!response.ok) return []
      const data = await response.json()
      return data.messages || []
    } catch {
      return []
    }
  }

  // ─── Enhancement Sessions ───────────────────────────────────────

  /** Start an enhancement session (binaural, ambient, breathing) */
  async startEnhancement(type: 'binaural' | 'spatial' | 'breathing' | 'ambient' | 'sleep' | 'meditation'): Promise<string | null> {
    try {
      const response = await apiFetch('/api/voice/enhancement/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_type: type }),
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.session_id
    } catch {
      return null
    }
  }

  // ─── Daily Check-in ─────────────────────────────────────────────

  /** Submit a voice-based mood check-in */
  async submitCheckin(mood: number, energy: number, stress: number, isMorning: boolean = true): Promise<{ affirmation?: string; response?: string } | null> {
    try {
      const response = await apiFetch('/api/voice/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_morning: isMorning, mood, energy_level: energy, stress_level: stress }),
      })
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  // ─── Spiritual Progress ─────────────────────────────────────────

  /** Get spiritual journey summary */
  async getSpiritualSummary(): Promise<{
    totalVerses: number
    breakthroughs: number
    growthScore: number
    teachingStyle: string
  } | null> {
    try {
      const response = await apiFetch('/api/voice-learning/advanced/spiritual/summary')
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
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
