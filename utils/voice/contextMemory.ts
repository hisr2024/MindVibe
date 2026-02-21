/**
 * KIAAN Context Memory System
 *
 * Enables KIAAN to remember conversations across sessions, creating
 * a true divine companion experience that knows your journey.
 *
 * Features:
 * - Persistent conversation memory (localStorage + IndexedDB)
 * - Emotional journey tracking
 * - Key topics and concerns extraction
 * - Personalized wisdom profile
 * - Session summaries for context
 */

// Types
export interface ConversationMemory {
  id: string
  timestamp: Date
  userMessage: string
  kiaanResponse: string
  detectedEmotion?: string
  topics?: string[]
  wasHelpful?: boolean
}

export interface UserJourneyProfile {
  userId: string
  createdAt: Date
  lastInteraction: Date
  totalConversations: number

  // Emotional patterns
  emotionalJourney: {
    emotion: string
    count: number
    lastOccurred: Date
  }[]

  // Topics the user discusses often
  recurringTopics: {
    topic: string
    count: number
    lastMentioned: Date
  }[]

  // Verses that resonated
  favoriteVerses: {
    verseId: string
    reference: string
    timesShared: number
    userRating?: number
  }[]

  // Personal insights KIAAN has learned
  personalInsights: {
    insight: string
    confidence: number
    learnedAt: Date
  }[]

  // Conversation summaries for quick context
  recentSummaries: {
    date: Date
    summary: string
    keyTopics: string[]
    emotionalState: string
  }[]

  // User preferences
  preferences: {
    preferredLanguage: string
    voiceSpeed: number
    formalityLevel: 'casual' | 'balanced' | 'formal'
    preferredWisdomStyle: 'direct' | 'story' | 'questioning'
  }
}

// Emotion keywords for detection
const EMOTION_KEYWORDS: Record<string, string[]> = {
  anxiety: ['anxious', 'worried', 'nervous', 'fear', 'scared', 'panic', 'stress', 'tense'],
  sadness: ['sad', 'depressed', 'hopeless', 'empty', 'crying', 'tears', 'hurt', 'miserable'],
  anger: ['angry', 'frustrated', 'mad', 'furious', 'annoyed', 'irritated', 'resentful', 'rage'],
  confusion: ['confused', 'lost', 'uncertain', 'doubt', 'unsure', 'direction', 'purpose', 'meaning'],
  peace: ['peaceful', 'calm', 'serene', 'content', 'happy', 'relaxed', 'centered'],
  love: ['love', 'relationship', 'partner', 'connection', 'care', 'affection', 'heart'],
  guilt: ['guilty', 'regret', 'sorry', 'mistake', 'wrong', 'fault'],
  hope: ['hope', 'optimistic', 'better', 'improve', 'growth', 'change', 'forward', 'future'],
  shame: ['ashamed', 'embarrassed', 'humiliated', 'disgrace', 'worthless', 'exposed'],
  overwhelm: ['overwhelmed', 'too much', 'drowning', 'breaking down', 'falling apart', 'can\'t cope'],
  grief: ['mourning', 'lost someone', 'death', 'died', 'passed away', 'funeral', 'miss them'],
  betrayal: ['betrayed', 'cheated', 'backstabbed', 'lied to', 'deceived', 'broken trust'],
  self_doubt: ['not good enough', 'imposter', 'can\'t do it', 'who am i', 'don\'t deserve'],
  excitement: ['excited', 'amazing', 'incredible', 'thrilled', 'wonderful', 'great news'],
  loneliness: ['alone', 'isolated', 'no one', 'nobody', 'disconnected', 'abandoned', 'lonely'],
  gratitude: ['grateful', 'thankful', 'blessed', 'appreciate', 'fortunate'],
}

// Topic keywords for extraction
const TOPIC_KEYWORDS: Record<string, string[]> = {
  work: ['work', 'job', 'career', 'boss', 'office', 'colleague', 'promotion', 'business'],
  family: ['family', 'parent', 'mother', 'father', 'sibling', 'child', 'children', 'spouse', 'marriage'],
  health: ['health', 'sick', 'illness', 'pain', 'body', 'sleep', 'tired', 'energy', 'medical'],
  spirituality: ['spiritual', 'meditation', 'prayer', 'god', 'divine', 'soul', 'karma', 'dharma'],
  relationships: ['relationship', 'friend', 'partner', 'dating', 'breakup', 'trust', 'betrayal'],
  purpose: ['purpose', 'meaning', 'life', 'direction', 'goal', 'dream', 'passion', 'calling'],
  self_improvement: ['improve', 'better', 'growth', 'learn', 'change', 'habit', 'discipline'],
  finances: ['money', 'financial', 'debt', 'savings', 'income', 'expenses', 'wealth']
}

// Storage keys
const STORAGE_KEYS = {
  profile: 'kiaan_user_profile',
  conversations: 'kiaan_conversations',
  lastSync: 'kiaan_last_sync',
  encKey: 'kiaan_enc_key',
}

// ─── AES-GCM Encryption for sensitive emotional data ────────────────────────

async function getOrCreateEncryptionKey(): Promise<CryptoKey | null> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return null
    const stored = localStorage.getItem(STORAGE_KEYS.encKey)
    if (stored) {
      const keyData = Uint8Array.from(atob(stored), c => c.charCodeAt(0))
      return crypto.subtle.importKey('raw', keyData, 'AES-GCM', true, ['encrypt', 'decrypt'])
    }
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
    const exported = await crypto.subtle.exportKey('raw', key)
    localStorage.setItem(STORAGE_KEYS.encKey, btoa(String.fromCharCode(...new Uint8Array(exported))))
    return key
  } catch { return null }
}

async function encryptData(data: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return data
  const key = await getOrCreateEncryptionKey()
  if (!key) return data
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(data)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return 'ENC:' + btoa(String.fromCharCode(...combined))
}

async function decryptData(data: string): Promise<string> {
  if (!data.startsWith('ENC:')) return data
  if (typeof crypto === 'undefined' || !crypto.subtle) return data
  const key = await getOrCreateEncryptionKey()
  if (!key) return data
  try {
    const combined = Uint8Array.from(atob(data.slice(4)), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.warn('Failed to decrypt context memory data — returning empty state', error)
    return '{}'
  }
}

/**
 * Context Memory Manager
 */
class ContextMemoryManager {
  private profile: UserJourneyProfile | null = null
  private conversations: ConversationMemory[] = []
  private isInitialized = false

  /**
   * Initialize the memory system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Load profile from localStorage (decrypt if encrypted)
      const storedProfile = localStorage.getItem(STORAGE_KEYS.profile)
      if (storedProfile) {
        const decrypted = await decryptData(storedProfile)
        this.profile = JSON.parse(decrypted)
        if (this.profile) {
          this.profile.createdAt = new Date(this.profile.createdAt)
          this.profile.lastInteraction = new Date(this.profile.lastInteraction)
        }
      } else {
        this.profile = this.createNewProfile()
        this.saveProfile()
      }

      // Load recent conversations (decrypt if encrypted)
      const storedConversations = localStorage.getItem(STORAGE_KEYS.conversations)
      if (storedConversations) {
        const decrypted = await decryptData(storedConversations)
        this.conversations = JSON.parse(decrypted)
        this.conversations = this.conversations.map(c => ({
          ...c,
          timestamp: new Date(c.timestamp)
        }))
      }

      this.isInitialized = true
    } catch {
      // Create fresh profile on error
      this.profile = this.createNewProfile()
      this.conversations = []
      this.isInitialized = true
    }
  }

  /**
   * Create a new user profile
   */
  private createNewProfile(): UserJourneyProfile {
    return {
      userId: this.generateUserId(),
      createdAt: new Date(),
      lastInteraction: new Date(),
      totalConversations: 0,
      emotionalJourney: [],
      recurringTopics: [],
      favoriteVerses: [],
      personalInsights: [],
      recentSummaries: [],
      preferences: {
        preferredLanguage: 'en',
        voiceSpeed: 0.95,
        formalityLevel: 'balanced',
        preferredWisdomStyle: 'direct'
      }
    }
  }

  /**
   * Generate a unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  /**
   * Save profile to storage (encrypted)
   */
  private saveProfile(): void {
    if (this.profile) {
      const data = JSON.stringify(this.profile)
      encryptData(data).then(encrypted => {
        localStorage.setItem(STORAGE_KEYS.profile, encrypted)
      }).catch(() => {
        localStorage.setItem(STORAGE_KEYS.profile, data)
      })
    }
  }

  /**
   * Save conversations to storage (encrypted, keep last 100)
   */
  private saveConversations(): void {
    const recentConversations = this.conversations.slice(-100)
    const data = JSON.stringify(recentConversations)
    encryptData(data).then(encrypted => {
      localStorage.setItem(STORAGE_KEYS.conversations, encrypted)
    }).catch(() => {
      localStorage.setItem(STORAGE_KEYS.conversations, data)
    })
  }

  /**
   * Record a new conversation exchange
   */
  async recordConversation(
    userMessage: string,
    kiaanResponse: string,
    wasHelpful?: boolean
  ): Promise<void> {
    await this.initialize()
    if (!this.profile) return

    // Detect emotion and topics
    const detectedEmotion = this.detectEmotion(userMessage)
    const topics = this.extractTopics(userMessage)

    // Create memory
    const memory: ConversationMemory = {
      id: `conv_${Date.now()}`,
      timestamp: new Date(),
      userMessage,
      kiaanResponse,
      detectedEmotion,
      topics,
      wasHelpful
    }

    // Add to conversations
    this.conversations.push(memory)
    this.saveConversations()

    // Update profile
    this.profile.totalConversations++
    this.profile.lastInteraction = new Date()

    // Update emotional journey
    if (detectedEmotion) {
      this.updateEmotionalJourney(detectedEmotion)
    }

    // Update recurring topics
    topics.forEach(topic => this.updateTopics(topic))

    // Extract and store personal insights
    this.extractInsights(userMessage)

    this.saveProfile()

  }

  /**
   * Detect primary emotion from user message
   */
  private detectEmotion(message: string): string | undefined {
    const lowerMessage = message.toLowerCase()
    let maxMatches = 0
    let detectedEmotion: string | undefined

    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      const matches = keywords.filter(kw => lowerMessage.includes(kw)).length
      if (matches > maxMatches) {
        maxMatches = matches
        detectedEmotion = emotion
      }
    }

    return detectedEmotion
  }

  /**
   * Extract topics from user message
   */
  private extractTopics(message: string): string[] {
    const lowerMessage = message.toLowerCase()
    const topics: string[] = []

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      const hasKeyword = keywords.some(kw => lowerMessage.includes(kw))
      if (hasKeyword) {
        topics.push(topic)
      }
    }

    return topics
  }

  /**
   * Update emotional journey tracking
   */
  private updateEmotionalJourney(emotion: string): void {
    if (!this.profile) return

    const existing = this.profile.emotionalJourney.find(e => e.emotion === emotion)
    if (existing) {
      existing.count++
      existing.lastOccurred = new Date()
    } else {
      this.profile.emotionalJourney.push({
        emotion,
        count: 1,
        lastOccurred: new Date()
      })
    }

    // Sort by count
    this.profile.emotionalJourney.sort((a, b) => b.count - a.count)
  }

  /**
   * Update recurring topics
   */
  private updateTopics(topic: string): void {
    if (!this.profile) return

    const existing = this.profile.recurringTopics.find(t => t.topic === topic)
    if (existing) {
      existing.count++
      existing.lastMentioned = new Date()
    } else {
      this.profile.recurringTopics.push({
        topic,
        count: 1,
        lastMentioned: new Date()
      })
    }

    // Sort by count
    this.profile.recurringTopics.sort((a, b) => b.count - a.count)
  }

  /**
   * Extract personal insights from messages
   */
  private extractInsights(message: string): void {
    if (!this.profile) return

    // Look for self-revelations
    const insightPatterns = [
      /i(?:'m| am) (?:a |an )?(\w+(?:\s+\w+)?)/gi,  // "I'm a teacher", "I am anxious"
      /i have (?:been )?(\w+(?:\s+\w+)?)/gi,         // "I have been stressed"
      /i always (\w+(?:\s+\w+)?)/gi,                 // "I always worry"
      /i never (\w+(?:\s+\w+)?)/gi,                  // "I never feel confident"
      /my (\w+) (?:is|are) (\w+)/gi                  // "My mother is sick"
    ]

    for (const pattern of insightPatterns) {
      const matches = message.matchAll(pattern)
      for (const match of matches) {
        const insight = match[0]

        // Check if we already have this insight
        const exists = this.profile.personalInsights.some(
          i => i.insight.toLowerCase() === insight.toLowerCase()
        )

        if (!exists && insight.length > 5 && insight.length < 100) {
          this.profile.personalInsights.push({
            insight,
            confidence: 0.7,
            learnedAt: new Date()
          })
        }
      }
    }

    // Keep only last 50 insights
    this.profile.personalInsights = this.profile.personalInsights.slice(-50)
  }

  /**
   * Get context for KIAAN's response.
   *
   * Enhanced multi-turn context: includes a sliding window of the last 10
   * conversation turns so KIAAN can reference what was just discussed,
   * plus long-term emotional and topic patterns.
   */
  async getContextForResponse(): Promise<string> {
    await this.initialize()
    if (!this.profile) return ''

    const contextParts: string[] = []

    // Check if returning user
    const daysSinceFirst = Math.floor(
      (Date.now() - new Date(this.profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    const hoursSinceLast = Math.floor(
      (Date.now() - new Date(this.profile.lastInteraction).getTime()) / (1000 * 60 * 60)
    )

    if (this.profile.totalConversations > 1) {
      if (hoursSinceLast > 24) {
        contextParts.push(`[User returning after ${Math.floor(hoursSinceLast / 24)} days]`)
      }
      contextParts.push(`[Total conversations: ${this.profile.totalConversations}]`)
      if (daysSinceFirst > 30) {
        contextParts.push(`[Long-term user: ${daysSinceFirst} days since first conversation]`)
      }
    }

    // Add emotional patterns
    if (this.profile.emotionalJourney.length > 0) {
      const topEmotions = this.profile.emotionalJourney.slice(0, 3)
        .map(e => `${e.emotion}(${e.count})`)
        .join(', ')
      contextParts.push(`[Emotional patterns: ${topEmotions}]`)
    }

    // Add recurring topics
    if (this.profile.recurringTopics.length > 0) {
      const topTopics = this.profile.recurringTopics.slice(0, 3)
        .map(t => t.topic)
        .join(', ')
      contextParts.push(`[Recurring topics: ${topTopics}]`)
    }

    // Add recent personal insights
    if (this.profile.personalInsights.length > 0) {
      const recentInsights = this.profile.personalInsights.slice(-3)
        .map(i => i.insight)
        .join('; ')
      contextParts.push(`[User has shared: ${recentInsights}]`)
    }

    // ─── Multi-turn sliding window (last 10 exchanges) ──────────────
    // Gives KIAAN short-term memory of what was just discussed
    const recentTurns = this.conversations.slice(-10)
    if (recentTurns.length > 0) {
      const turnSummaries = recentTurns.map(c => {
        const emotionTag = c.detectedEmotion ? ` [${c.detectedEmotion}]` : ''
        const userSnippet = c.userMessage.length > 120 ? c.userMessage.slice(0, 120) + '...' : c.userMessage
        const kiaanSnippet = c.kiaanResponse.length > 120 ? c.kiaanResponse.slice(0, 120) + '...' : c.kiaanResponse
        return `User${emotionTag}: ${userSnippet}\nKIAAN: ${kiaanSnippet}`
      })
      contextParts.push(`[Recent conversation:\n${turnSummaries.join('\n---\n')}]`)
    }

    // Add last conversation summary if available (for cross-session context)
    const lastConversation = this.conversations[this.conversations.length - 1]
    if (lastConversation && hoursSinceLast < 24) {
      contextParts.push(`[Last topic: ${lastConversation.topics?.join(', ') || 'general'}]`)
    }

    return contextParts.join('\n')
  }

  /**
   * Get a personalized greeting based on user history
   */
  async getPersonalizedGreeting(): Promise<string> {
    await this.initialize()
    if (!this.profile) {
      return "Namaste, dear seeker. I am here with you."
    }

    const hoursSinceLast = Math.floor(
      (Date.now() - new Date(this.profile.lastInteraction).getTime()) / (1000 * 60 * 60)
    )

    // First time user
    if (this.profile.totalConversations === 0) {
      return "Namaste, dear seeker. Welcome to this sacred space. I am KIAAN, your guide through the wisdom of the Bhagavad Gita. What brings you here today?"
    }

    // Returning after a long time
    if (hoursSinceLast > 168) { // More than a week
      const topEmotion = this.profile.emotionalJourney[0]?.emotion
      if (topEmotion) {
        return `Namaste, beloved one. It has been some time since we last spoke. I remember our conversations about ${topEmotion}. How has your journey been?`
      }
      return "Namaste, dear friend. It brings me joy to hear your voice again. How have you been since we last spoke?"
    }

    // Returning same day
    if (hoursSinceLast < 12) {
      return "Welcome back, dear one. I am here, ready to continue our journey together. What's on your mind?"
    }

    // Regular returning user
    const topTopic = this.profile.recurringTopics[0]?.topic
    if (topTopic && Math.random() > 0.5) {
      return `Namaste. I sense there is something you wish to explore. Perhaps something about ${topTopic.replace('_', ' ')}? Or shall we discover new wisdom together?`
    }

    const greetings = [
      "Namaste, dear seeker. Your presence is felt. What wisdom shall we explore today?",
      "Welcome back. Like the Ganga that flows eternally, our conversations continue. What brings you here now?",
      "Peace be with you. I have been awaiting our next exchange. Share what is in your heart.",
      "Namaste. The Gita says the soul is eternal, and so is our connection. What shall we discuss?"
    ]

    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  /**
   * Get the user's emotional state summary
   */
  async getEmotionalSummary(): Promise<{
    dominant: string | null
    recent: string | null
    trend: 'improving' | 'stable' | 'concerning' | 'unknown'
  }> {
    await this.initialize()

    if (!this.profile || this.profile.emotionalJourney.length === 0) {
      return { dominant: null, recent: null, trend: 'unknown' }
    }

    const dominant = this.profile.emotionalJourney[0]?.emotion || null

    // Get most recent emotion from conversations
    const recentConversations = this.conversations.slice(-5)
    const recentEmotions = recentConversations
      .map(c => c.detectedEmotion)
      .filter(Boolean)
    const recent = recentEmotions[recentEmotions.length - 1] || null

    // Determine trend
    let trend: 'improving' | 'stable' | 'concerning' | 'unknown' = 'unknown'
    if (recentEmotions.length >= 3) {
      const positiveEmotions = ['peace', 'hope', 'love']
      const negativeEmotions = ['anxiety', 'sadness', 'anger', 'guilt']

      const recentPositive = recentEmotions.filter(e => positiveEmotions.includes(e!)).length
      const recentNegative = recentEmotions.filter(e => negativeEmotions.includes(e!)).length

      if (recentPositive > recentNegative) {
        trend = 'improving'
      } else if (recentNegative > recentPositive + 1) {
        trend = 'concerning'
      } else {
        trend = 'stable'
      }
    }

    return { dominant, recent, trend }
  }

  /**
   * Get conversation history for display
   */
  getRecentConversations(limit: number = 10): ConversationMemory[] {
    return this.conversations.slice(-limit)
  }

  /**
   * Get the user profile
   */
  getProfile(): UserJourneyProfile | null {
    return this.profile
  }

  /**
   * Clear all memory (for privacy)
   */
  clearAllMemory(): void {
    this.profile = this.createNewProfile()
    this.conversations = []
    localStorage.removeItem(STORAGE_KEYS.profile)
    localStorage.removeItem(STORAGE_KEYS.conversations)
    this.saveProfile()
  }
}

// Export singleton instance
export const contextMemory = new ContextMemoryManager()

// Export helper functions
export async function recordKiaanConversation(
  userMessage: string,
  kiaanResponse: string,
  wasHelpful?: boolean
): Promise<void> {
  return contextMemory.recordConversation(userMessage, kiaanResponse, wasHelpful)
}

export async function getKiaanContextForResponse(): Promise<string> {
  return contextMemory.getContextForResponse()
}

export async function getPersonalizedKiaanGreeting(): Promise<string> {
  return contextMemory.getPersonalizedGreeting()
}

export async function getEmotionalSummary() {
  return contextMemory.getEmotionalSummary()
}

export function clearKiaanMemory(): void {
  contextMemory.clearAllMemory()
}
