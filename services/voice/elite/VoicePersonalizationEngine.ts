/**
 * Voice Personalization Engine - Adaptive User Preference Learning
 *
 * Learns and adapts to user's voice preferences over time:
 * - Preferred voice speed, pitch, and tone
 * - Favorite ambient sounds and volumes
 * - Best times for sessions
 * - Content preferences
 * - Language mixing preferences (Hindi-English)
 *
 * Practical Use Cases:
 * - Auto-adjusts voice based on time of day
 * - Remembers user dislikes ("too fast", "too loud")
 * - Suggests content based on history
 * - Personalizes greetings and responses
 */

// ============ Types & Interfaces ============

/**
 * Voice preference settings
 */
export interface VoicePreferences {
  speed: number              // 0.5-2.0 (1 = normal)
  pitch: number              // 0.5-2.0 (1 = normal)
  volume: number             // 0-1
  voiceType: string          // Preferred TTS voice
  pauseDuration: number      // Pause multiplier (0.5-2)
  emotionalTone: 'warm' | 'neutral' | 'calm' | 'energetic'
}

/**
 * Time-based preferences
 */
export interface TimePreferences {
  morningGreeting: string
  eveningGreeting: string
  preferredMorningVolume: number
  preferredEveningVolume: number
  preferredSessionTimes: string[]  // HH:MM format
  quietHoursStart?: string
  quietHoursEnd?: string
}

/**
 * Content preferences
 */
export interface ContentPreferences {
  favoriteTopics: string[]
  dislikedTopics: string[]
  preferredSessionLength: number  // minutes
  preferredMeditationTypes: string[]
  languageMixLevel: 'english_only' | 'light_hindi' | 'moderate_hindi' | 'heavy_hindi'
  preferredAmbientSounds: string[]
  dislikedSounds: string[]
}

/**
 * User interaction history
 */
export interface InteractionHistory {
  totalSessions: number
  averageSessionLength: number
  completionRate: number
  lastSessionDate: Date | null
  streakDays: number
  feedbackHistory: UserFeedback[]
  usageByHour: Record<number, number>  // Hour -> session count
  usageByDay: Record<number, number>   // Day of week -> session count
}

/**
 * User feedback entry
 */
export interface UserFeedback {
  timestamp: Date
  type: 'speed' | 'volume' | 'content' | 'voice' | 'general'
  sentiment: 'positive' | 'negative' | 'neutral'
  comment?: string
  context?: string
}

/**
 * Complete user profile
 */
export interface UserVoiceProfile {
  id: string
  createdAt: Date
  updatedAt: Date
  voicePreferences: VoicePreferences
  timePreferences: TimePreferences
  contentPreferences: ContentPreferences
  interactionHistory: InteractionHistory
  customPhrases: Record<string, string>  // Personalized phrases
  nicknames: string[]  // What to call the user
}

/**
 * Engine state
 */
export interface PersonalizationState {
  isLoaded: boolean
  currentProfile: UserVoiceProfile | null
  adaptationsApplied: string[]
  suggestedContent: string[]
}

/**
 * Personalization suggestion
 */
export interface PersonalizationSuggestion {
  type: 'voice' | 'content' | 'time' | 'sound'
  suggestion: string
  reason: string
  confidence: number
}

// ============ Default Profile ============

const DEFAULT_PROFILE: UserVoiceProfile = {
  id: 'default',
  createdAt: new Date(),
  updatedAt: new Date(),
  voicePreferences: {
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voiceType: 'default',
    pauseDuration: 1.0,
    emotionalTone: 'warm'
  },
  timePreferences: {
    morningGreeting: 'Good morning! How are you feeling today?',
    eveningGreeting: 'Good evening. How was your day?',
    preferredMorningVolume: 0.7,
    preferredEveningVolume: 0.6,
    preferredSessionTimes: ['07:00', '21:00'],
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  },
  contentPreferences: {
    favoriteTopics: [],
    dislikedTopics: [],
    preferredSessionLength: 15,
    preferredMeditationTypes: ['breathing', 'body_scan'],
    languageMixLevel: 'light_hindi',
    preferredAmbientSounds: ['rain_gentle', 'singing_bowl'],
    dislikedSounds: []
  },
  interactionHistory: {
    totalSessions: 0,
    averageSessionLength: 0,
    completionRate: 0,
    lastSessionDate: null,
    streakDays: 0,
    feedbackHistory: [],
    usageByHour: {},
    usageByDay: {}
  },
  customPhrases: {},
  nicknames: []
}

// ============ Engine Class ============

/**
 * Voice Personalization Engine
 *
 * Learns user preferences and adapts the voice experience.
 */
export class VoicePersonalizationEngine {
  private profile: UserVoiceProfile = { ...DEFAULT_PROFILE }
  private state: PersonalizationState = {
    isLoaded: false,
    currentProfile: null,
    adaptationsApplied: [],
    suggestedContent: []
  }

  private storageKey = 'kiaan_voice_profile'

  /**
   * Initialize and load profile
   */
  async initialize(userId?: string): Promise<void> {
    await this.loadProfile(userId)
    this.state.isLoaded = true
    this.state.currentProfile = this.profile
  }

  /**
   * Load profile from storage
   */
  async loadProfile(userId?: string): Promise<UserVoiceProfile> {
    if (typeof window === 'undefined') {
      return this.profile
    }

    try {
      const key = userId ? `${this.storageKey}_${userId}` : this.storageKey
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.profile = {
          ...DEFAULT_PROFILE,
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
          interactionHistory: {
            ...DEFAULT_PROFILE.interactionHistory,
            ...parsed.interactionHistory,
            lastSessionDate: parsed.interactionHistory?.lastSessionDate
              ? new Date(parsed.interactionHistory.lastSessionDate)
              : null
          }
        }
      }
    } catch (error) {
      console.error('VoicePersonalizationEngine: Failed to load profile', error)
    }

    return this.profile
  }

  /**
   * Save profile to storage
   */
  async saveProfile(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      this.profile.updatedAt = new Date()
      const key = this.profile.id !== 'default'
        ? `${this.storageKey}_${this.profile.id}`
        : this.storageKey
      localStorage.setItem(key, JSON.stringify(this.profile))
    } catch (error) {
      console.error('VoicePersonalizationEngine: Failed to save profile', error)
    }
  }

  /**
   * Get current voice settings (time-adjusted)
   */
  getCurrentVoiceSettings(): VoicePreferences {
    const hour = new Date().getHours()
    const isEvening = hour >= 20 || hour < 6
    const isMorning = hour >= 6 && hour < 10

    const base = { ...this.profile.voicePreferences }

    // Time-based adjustments
    if (isEvening) {
      base.speed *= 0.9  // Slower at night
      base.volume = this.profile.timePreferences.preferredEveningVolume
      base.emotionalTone = 'calm'
    } else if (isMorning) {
      base.volume = this.profile.timePreferences.preferredMorningVolume
      base.emotionalTone = 'warm'
    }

    // Check quiet hours
    if (this.isQuietHours()) {
      base.volume *= 0.7
    }

    this.state.adaptationsApplied = []
    if (isEvening) this.state.adaptationsApplied.push('evening_mode')
    if (isMorning) this.state.adaptationsApplied.push('morning_mode')
    if (this.isQuietHours()) this.state.adaptationsApplied.push('quiet_hours')

    return base
  }

  /**
   * Get personalized greeting
   */
  getGreeting(userName?: string): string {
    const hour = new Date().getHours()
    const name = userName ?? this.profile.nicknames[0] ?? ''
    const nameStr = name ? `, ${name}` : ''

    if (hour >= 5 && hour < 12) {
      return this.profile.timePreferences.morningGreeting.replace('{name}', nameStr)
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon${nameStr}. How are you doing?`
    } else if (hour >= 17 && hour < 21) {
      return this.profile.timePreferences.eveningGreeting.replace('{name}', nameStr)
    } else {
      return `Hello${nameStr}. It's late. How can I help you relax?`
    }
  }

  /**
   * Record voice feedback
   */
  recordFeedback(
    type: UserFeedback['type'],
    sentiment: UserFeedback['sentiment'],
    comment?: string
  ): void {
    const feedback: UserFeedback = {
      timestamp: new Date(),
      type,
      sentiment,
      comment
    }

    this.profile.interactionHistory.feedbackHistory.push(feedback)

    // Auto-adjust based on feedback
    if (type === 'speed') {
      if (sentiment === 'negative' && comment?.toLowerCase().includes('fast')) {
        this.profile.voicePreferences.speed *= 0.95
      } else if (sentiment === 'negative' && comment?.toLowerCase().includes('slow')) {
        this.profile.voicePreferences.speed *= 1.05
      }
    }

    if (type === 'volume') {
      if (sentiment === 'negative' && comment?.toLowerCase().includes('loud')) {
        this.profile.voicePreferences.volume *= 0.9
      } else if (sentiment === 'negative' && comment?.toLowerCase().includes('quiet')) {
        this.profile.voicePreferences.volume *= 1.1
      }
    }

    // Keep within bounds
    this.profile.voicePreferences.speed = Math.max(0.5, Math.min(2, this.profile.voicePreferences.speed))
    this.profile.voicePreferences.volume = Math.max(0.1, Math.min(1, this.profile.voicePreferences.volume))

    this.saveProfile()
  }

  /**
   * Record session start
   */
  recordSessionStart(): void {
    const now = new Date()
    this.profile.interactionHistory.totalSessions++
    this.profile.interactionHistory.lastSessionDate = now

    // Track usage patterns
    const hour = now.getHours()
    const day = now.getDay()
    this.profile.interactionHistory.usageByHour[hour] =
      (this.profile.interactionHistory.usageByHour[hour] ?? 0) + 1
    this.profile.interactionHistory.usageByDay[day] =
      (this.profile.interactionHistory.usageByDay[day] ?? 0) + 1

    // Update streak
    const lastSession = this.profile.interactionHistory.lastSessionDate
    if (lastSession) {
      const daysSinceLastSession = Math.floor(
        (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceLastSession <= 1) {
        this.profile.interactionHistory.streakDays++
      } else {
        this.profile.interactionHistory.streakDays = 1
      }
    }

    this.saveProfile()
  }

  /**
   * Record session completion
   */
  recordSessionEnd(durationMinutes: number, completed: boolean): void {
    const history = this.profile.interactionHistory

    // Update average session length
    const totalTime = history.averageSessionLength * (history.totalSessions - 1) + durationMinutes
    history.averageSessionLength = totalTime / history.totalSessions

    // Update completion rate
    const completedCount = history.completionRate * (history.totalSessions - 1) + (completed ? 1 : 0)
    history.completionRate = completedCount / history.totalSessions

    this.saveProfile()
  }

  /**
   * Add favorite topic
   */
  addFavoriteTopic(topic: string): void {
    if (!this.profile.contentPreferences.favoriteTopics.includes(topic)) {
      this.profile.contentPreferences.favoriteTopics.push(topic)
      this.saveProfile()
    }
  }

  /**
   * Add disliked topic
   */
  addDislikedTopic(topic: string): void {
    if (!this.profile.contentPreferences.dislikedTopics.includes(topic)) {
      this.profile.contentPreferences.dislikedTopics.push(topic)
      this.saveProfile()
    }
  }

  /**
   * Set nickname
   */
  setNickname(name: string): void {
    if (!this.profile.nicknames.includes(name)) {
      this.profile.nicknames.unshift(name)
      this.saveProfile()
    }
  }

  /**
   * Get content suggestions based on history
   */
  getContentSuggestions(): PersonalizationSuggestion[] {
    const suggestions: PersonalizationSuggestion[] = []
    const history = this.profile.interactionHistory
    const prefs = this.profile.contentPreferences

    // Suggest based on favorite topics
    if (prefs.favoriteTopics.length > 0) {
      suggestions.push({
        type: 'content',
        suggestion: `Content related to: ${prefs.favoriteTopics.slice(0, 3).join(', ')}`,
        reason: 'Based on your interests',
        confidence: 0.9
      })
    }

    // Suggest based on time patterns
    const bestHour = this.getBestSessionHour()
    if (bestHour !== null) {
      suggestions.push({
        type: 'time',
        suggestion: `Schedule sessions around ${bestHour}:00`,
        reason: 'This is when you use KIAAN most',
        confidence: 0.85
      })
    }

    // Suggest sounds based on history
    if (prefs.preferredAmbientSounds.length > 0) {
      suggestions.push({
        type: 'sound',
        suggestion: `Use ${prefs.preferredAmbientSounds[0]} ambient sounds`,
        reason: 'Your preferred soundscape',
        confidence: 0.8
      })
    }

    // Suggest session length
    if (history.averageSessionLength > 0) {
      suggestions.push({
        type: 'content',
        suggestion: `${Math.round(history.averageSessionLength)} minute sessions`,
        reason: 'Your average session length',
        confidence: 0.75
      })
    }

    this.state.suggestedContent = suggestions.map(s => s.suggestion)
    return suggestions
  }

  /**
   * Get profile
   */
  getProfile(): UserVoiceProfile {
    return { ...this.profile }
  }

  /**
   * Get state
   */
  getState(): PersonalizationState {
    return { ...this.state }
  }

  /**
   * Update preferences directly
   */
  updatePreferences(updates: Partial<VoicePreferences>): void {
    this.profile.voicePreferences = {
      ...this.profile.voicePreferences,
      ...updates
    }
    this.saveProfile()
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.profile = { ...DEFAULT_PROFILE, id: this.profile.id }
    this.saveProfile()
  }

  // ============ Private Methods ============

  private isQuietHours(): boolean {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const start = this.profile.timePreferences.quietHoursStart
    const end = this.profile.timePreferences.quietHoursEnd

    if (!start || !end) return false

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
      return currentTime >= start || currentTime < end
    }
    return currentTime >= start && currentTime < end
  }

  private getBestSessionHour(): number | null {
    const usage = this.profile.interactionHistory.usageByHour
    let maxCount = 0
    let bestHour: number | null = null

    for (const [hour, count] of Object.entries(usage)) {
      if (count > maxCount) {
        maxCount = count
        bestHour = parseInt(hour)
      }
    }

    return bestHour
  }
}

// ============ Factory & Singleton ============

let personalizationInstance: VoicePersonalizationEngine | null = null

export function getVoicePersonalizationEngine(): VoicePersonalizationEngine {
  if (!personalizationInstance) {
    personalizationInstance = new VoicePersonalizationEngine()
  }
  return personalizationInstance
}

export function createVoicePersonalizationEngine(): VoicePersonalizationEngine {
  return new VoicePersonalizationEngine()
}

export const voicePersonalizationEngine = getVoicePersonalizationEngine()
