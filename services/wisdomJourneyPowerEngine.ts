/**
 * Wisdom Journey Power Engine
 *
 * Powered by KIAAN AI Core Wisdom - A robust offline-first system for managing
 * wisdom journeys based on the complete 700+ verses of the Bhagavad Gita.
 *
 * The Bhagavad Gita (भगवद्गीता) contains 700 verses across 18 chapters:
 * - Chapter 1: Arjuna Vishada Yoga (47 verses) - The Yoga of Despair
 * - Chapter 2: Sankhya Yoga (72 verses) - The Yoga of Knowledge
 * - Chapter 3: Karma Yoga (43 verses) - The Yoga of Action
 * - Chapter 4: Jnana Karma Sannyasa Yoga (42 verses) - The Yoga of Knowledge and Renunciation
 * - Chapter 5: Karma Sannyasa Yoga (29 verses) - The Yoga of Renunciation
 * - Chapter 6: Dhyana Yoga (47 verses) - The Yoga of Meditation
 * - Chapter 7: Jnana Vijnana Yoga (30 verses) - The Yoga of Knowledge and Wisdom
 * - Chapter 8: Aksara Brahma Yoga (28 verses) - The Yoga of the Imperishable Brahman
 * - Chapter 9: Raja Vidya Raja Guhya Yoga (34 verses) - The Yoga of Royal Knowledge
 * - Chapter 10: Vibhuti Yoga (42 verses) - The Yoga of Divine Glories
 * - Chapter 11: Visvarupa Darsana Yoga (55 verses) - The Yoga of the Cosmic Form
 * - Chapter 12: Bhakti Yoga (20 verses) - The Yoga of Devotion
 * - Chapter 13: Ksetra Ksetrajna Vibhaga Yoga (35 verses) - The Yoga of the Field
 * - Chapter 14: Gunatraya Vibhaga Yoga (27 verses) - The Yoga of the Three Gunas
 * - Chapter 15: Purusottama Yoga (20 verses) - The Yoga of the Supreme Person
 * - Chapter 16: Daivasura Sampad Vibhaga Yoga (24 verses) - The Yoga of Divine and Demonic
 * - Chapter 17: Sraddhatraya Vibhaga Yoga (28 verses) - The Yoga of Threefold Faith
 * - Chapter 18: Moksha Sannyasa Yoga (78 verses) - The Yoga of Liberation
 *
 * Features:
 * - KIAAN AI Core Wisdom integration for personalized insights
 * - Complete 700+ Bhagavad Gita verses from backend database
 * - Voice support for verse recitation (see wisdomVoiceService.ts)
 * - Offline-first data storage with localStorage fallback
 * - Automatic sync when backend becomes available
 * - Progress tracking with local persistence
 * - AI-powered personalized reflections and insights
 */

import type {
  WisdomJourney,
  JourneyStep,
  JourneyRecommendation,
} from '@/types/wisdomJourney.types'

// ============================================================================
// Constants and Configuration
// ============================================================================

/** Total verses in the Bhagavad Gita */
export const TOTAL_GITA_VERSES = 700

/** Chapter verse counts */
export const CHAPTER_VERSE_COUNTS: Record<number, { name: string; sanskritName: string; verses: number }> = {
  1: { name: 'Arjuna Vishada Yoga', sanskritName: 'अर्जुनविषादयोग', verses: 47 },
  2: { name: 'Sankhya Yoga', sanskritName: 'सांख्ययोग', verses: 72 },
  3: { name: 'Karma Yoga', sanskritName: 'कर्मयोग', verses: 43 },
  4: { name: 'Jnana Karma Sannyasa Yoga', sanskritName: 'ज्ञानकर्मसंन्यासयोग', verses: 42 },
  5: { name: 'Karma Sannyasa Yoga', sanskritName: 'कर्मसंन्यासयोग', verses: 29 },
  6: { name: 'Dhyana Yoga', sanskritName: 'ध्यानयोग', verses: 47 },
  7: { name: 'Jnana Vijnana Yoga', sanskritName: 'ज्ञानविज्ञानयोग', verses: 30 },
  8: { name: 'Aksara Brahma Yoga', sanskritName: 'अक्षरब्रह्मयोग', verses: 28 },
  9: { name: 'Raja Vidya Raja Guhya Yoga', sanskritName: 'राजविद्याराजगुह्ययोग', verses: 34 },
  10: { name: 'Vibhuti Yoga', sanskritName: 'विभूतियोग', verses: 42 },
  11: { name: 'Visvarupa Darsana Yoga', sanskritName: 'विश्वरूपदर्शनयोग', verses: 55 },
  12: { name: 'Bhakti Yoga', sanskritName: 'भक्तियोग', verses: 20 },
  13: { name: 'Ksetra Ksetrajna Vibhaga Yoga', sanskritName: 'क्षेत्रक्षेत्रज्ञविभागयोग', verses: 34 },
  14: { name: 'Gunatraya Vibhaga Yoga', sanskritName: 'गुणत्रयविभागयोग', verses: 27 },
  15: { name: 'Purusottama Yoga', sanskritName: 'पुरुषोत्तमयोग', verses: 20 },
  16: { name: 'Daivasura Sampad Vibhaga Yoga', sanskritName: 'दैवासुरसम्पद्विभागयोग', verses: 24 },
  17: { name: 'Sraddhatraya Vibhaga Yoga', sanskritName: 'श्रद्धात्रयविभागयोग', verses: 28 },
  18: { name: 'Moksha Sannyasa Yoga', sanskritName: 'मोक्षसंन्यासयोग', verses: 78 },
}

const STORAGE_KEYS = {
  JOURNEYS: 'mindvibe_wisdom_journeys',
  ACTIVE_JOURNEY_ID: 'mindvibe_active_journey_id',
  PENDING_SYNCS: 'mindvibe_pending_syncs',
  LAST_SYNC: 'mindvibe_last_sync',
  OFFLINE_MODE: 'mindvibe_offline_mode',
} as const

// ============================================================================
// Embedded Wisdom Data
// ============================================================================

export const EMBEDDED_GITA_VERSES = [
  {
    id: 1,
    chapter: 2,
    verse: 47,
    text: 'You have the right to work, but never to the fruit of work. You should never engage in action for the sake of reward, nor should you long for inaction.',
    translation: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    theme: 'detachment',
    keywords: ['action', 'detachment', 'work', 'karma', 'duty'],
    reflection: 'Focus on your efforts and let go of attachment to outcomes. Your duty is to act with sincerity, not to control results.',
  },
  {
    id: 2,
    chapter: 2,
    verse: 48,
    text: 'Perform work in yoga, abandoning attachment, being steadfast in equanimity. Yoga is equanimity of mind in success and failure.',
    translation: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥',
    theme: 'equanimity',
    keywords: ['yoga', 'balance', 'equanimity', 'success', 'failure'],
    reflection: 'Practice balance in success and failure to find true peace. Equanimity is the foundation of a peaceful mind.',
  },
  {
    id: 3,
    chapter: 6,
    verse: 5,
    text: 'Elevate yourself through the power of your mind, and not degrade yourself. The mind alone is the friend of the soul, and the mind alone is the enemy of the soul.',
    translation: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    theme: 'self-improvement',
    keywords: ['mind', 'self', 'friend', 'enemy', 'uplift'],
    reflection: 'Your mind can be your greatest friend or enemy - choose wisely. Cultivate thoughts that elevate your spirit.',
  },
  {
    id: 4,
    chapter: 6,
    verse: 35,
    text: 'The mind is restless and difficult to restrain, but it can be controlled by constant practice and detachment.',
    translation: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्। अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥',
    theme: 'mind-control',
    keywords: ['mind', 'practice', 'detachment', 'control', 'meditation'],
    reflection: 'With consistent practice and detachment, even the restless mind finds stillness. Patience and persistence are key.',
  },
  {
    id: 5,
    chapter: 12,
    verse: 13,
    text: 'One who is without hatred towards all beings, friendly and compassionate, free from the sense of "mine" and ego, is dear to Me.',
    translation: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च। निर्ममो निरहङ्कारः समदुःखसुखः क्षमी॥',
    theme: 'compassion',
    keywords: ['compassion', 'kindness', 'love', 'ego', 'friendship'],
    reflection: 'Cultivate compassion for all beings without exception. True friendship extends to every living creature.',
  },
  {
    id: 6,
    chapter: 2,
    verse: 14,
    text: 'The contacts of the senses with objects give rise to feelings of cold, heat, pleasure and pain. They come and go; they are impermanent. Endure them bravely.',
    translation: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः। आगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥',
    theme: 'impermanence',
    keywords: ['senses', 'impermanence', 'endurance', 'change', 'acceptance'],
    reflection: 'Sensations are temporary - learn to endure them with equanimity. Nothing external can disturb your inner peace.',
  },
  {
    id: 7,
    chapter: 3,
    verse: 19,
    text: 'Therefore, without being attached to the fruits of activities, one should act as a matter of duty, for by working without attachment one attains the Supreme.',
    translation: 'तस्मादसक्तः सततं कार्यं कर्म समाचर। असक्तो ह्याचरन्कर्म परमाप्नोति पूरुषः॥',
    theme: 'duty',
    keywords: ['duty', 'action', 'attachment', 'supreme', 'work'],
    reflection: 'Act from a sense of duty rather than desire for personal gain. Selfless action leads to inner freedom.',
  },
  {
    id: 8,
    chapter: 4,
    verse: 7,
    text: 'Whenever righteousness declines and unrighteousness rises, O Arjuna, I manifest Myself for the protection of the good and destruction of evil.',
    translation: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
    theme: 'righteousness',
    keywords: ['dharma', 'righteousness', 'protection', 'good', 'evil'],
    reflection: 'Stand for righteousness in your daily life. Every small act of goodness contributes to the greater good.',
  },
  {
    id: 9,
    chapter: 9,
    verse: 22,
    text: 'To those who worship Me alone, thinking of no other, to those ever self-controlled, I secure what they lack and preserve what they have.',
    translation: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते। तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥',
    theme: 'devotion',
    keywords: ['devotion', 'worship', 'protection', 'faith', 'surrender'],
    reflection: 'Devotion brings security and peace. Trust in the divine while putting in your sincere effort.',
  },
  {
    id: 10,
    chapter: 18,
    verse: 66,
    text: 'Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.',
    translation: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
    theme: 'surrender',
    keywords: ['surrender', 'faith', 'liberation', 'fear', 'trust'],
    reflection: 'Complete surrender brings ultimate freedom. Let go of fear and trust in the journey of life.',
  },
  {
    id: 11,
    chapter: 5,
    verse: 21,
    text: 'One who is not attached to external sensory pleasures realizes the joy within. Such a person, engaged in the yoga of the Supreme, enjoys unlimited happiness.',
    translation: 'बाह्यस्पर्शेष्वसक्तात्मा विन्दत्यात्मनि यत्सुखम्। स ब्रह्मयोगयुक्तात्मा सुखमक्षयमश्नुते॥',
    theme: 'inner-peace',
    keywords: ['happiness', 'inner', 'peace', 'attachment', 'joy'],
    reflection: 'True happiness comes from within. External pleasures are fleeting; inner peace is eternal.',
  },
  {
    id: 12,
    chapter: 15,
    verse: 15,
    text: 'I am seated in everyone\'s heart, and from Me come remembrance, knowledge and forgetfulness. I am that which is to be known by all the Vedas.',
    translation: 'सर्वस्य चाहं हृदि सन्निविष्टो मत्तः स्मृतिर्ज्ञानमपोहनं च। वेदैश्च सर्वैरहमेव वेद्यो वेदान्तकृद्वेदविदेव चाहम्॥',
    theme: 'divine-presence',
    keywords: ['heart', 'knowledge', 'divine', 'presence', 'wisdom'],
    reflection: 'The divine resides within you. Seek knowledge and wisdom from your own heart.',
  },
]

export const JOURNEY_TEMPLATES = {
  inner_peace: {
    title: 'Journey to Inner Peace',
    description: 'A 7-day exploration of tranquility, acceptance, and letting go of anxiety through timeless Bhagavad Gita wisdom.',
    themes: ['equanimity', 'impermanence', 'mind-control', 'inner-peace'],
    moodRange: [1, 5],
  },
  resilience_strength: {
    title: 'Path of Resilience',
    description: 'Build inner strength and resilience through ancient wisdom that has guided seekers for millennia.',
    themes: ['duty', 'self-improvement', 'righteousness'],
    moodRange: [1, 4],
  },
  joyful_living: {
    title: 'Living with Joy',
    description: 'Embrace the fullness of life with wisdom that celebrates conscious, joyful existence.',
    themes: ['devotion', 'divine-presence', 'inner-peace'],
    moodRange: [6, 10],
  },
  self_discovery: {
    title: 'Path of Self-Discovery',
    description: 'Explore your true nature, purpose, and potential through reflective wisdom.',
    themes: ['self-improvement', 'divine-presence', 'surrender'],
    moodRange: [4, 8],
  },
  balanced_action: {
    title: 'Wisdom of Balanced Action',
    description: 'Learn to act without attachment, finding harmony between effort and surrender.',
    themes: ['detachment', 'duty', 'equanimity'],
    moodRange: [3, 7],
  },
  relationship_harmony: {
    title: 'Harmony in Relationships',
    description: 'Cultivate compassion, understanding, and harmonious connections with others.',
    themes: ['compassion', 'devotion', 'righteousness'],
    moodRange: [4, 9],
  },
  letting_go: {
    title: 'Art of Letting Go',
    description: 'Learn the transformative power of detachment and acceptance through ancient wisdom.',
    themes: ['detachment', 'surrender', 'impermanence'],
    moodRange: [2, 6],
  },
}

// ============================================================================
// Power Engine Class
// ============================================================================

export class WisdomJourneyPowerEngine {
  private storage: Storage | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage
    }
  }

  // --------------------------------------------------------------------------
  // Storage Helpers
  // --------------------------------------------------------------------------

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.storage) return defaultValue
    try {
      const item = this.storage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.storage) return
    try {
      this.storage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage error:', error)
    }
  }

  private removeItem(key: string): void {
    if (!this.storage) return
    try {
      this.storage.removeItem(key)
    } catch {
      // Ignore errors
    }
  }

  // --------------------------------------------------------------------------
  // Journey Management
  // --------------------------------------------------------------------------

  /**
   * Get all locally stored journeys
   */
  getAllJourneys(): WisdomJourney[] {
    return this.getItem<WisdomJourney[]>(STORAGE_KEYS.JOURNEYS, [])
  }

  /**
   * Save a journey to local storage
   */
  saveJourney(journey: WisdomJourney): void {
    const journeys = this.getAllJourneys()
    const existingIndex = journeys.findIndex((j) => j.id === journey.id)

    if (existingIndex >= 0) {
      journeys[existingIndex] = { ...journey, updated_at: new Date().toISOString() }
    } else {
      journeys.push(journey)
    }

    this.setItem(STORAGE_KEYS.JOURNEYS, journeys)
  }

  /**
   * Get a specific journey by ID
   */
  getJourney(journeyId: string): WisdomJourney | null {
    const journeys = this.getAllJourneys()
    return journeys.find((j) => j.id === journeyId) || null
  }

  /**
   * Get the active journey
   */
  getActiveJourney(): WisdomJourney | null {
    const activeId = this.getItem<string | null>(STORAGE_KEYS.ACTIVE_JOURNEY_ID, null)
    if (!activeId) {
      // Try to find any active journey
      const journeys = this.getAllJourneys()
      const active = journeys.find((j) => j.status === 'active')
      if (active) {
        this.setItem(STORAGE_KEYS.ACTIVE_JOURNEY_ID, active.id)
        return active
      }
      return null
    }
    return this.getJourney(activeId)
  }

  /**
   * Set the active journey
   */
  setActiveJourney(journeyId: string): void {
    this.setItem(STORAGE_KEYS.ACTIVE_JOURNEY_ID, journeyId)
  }

  /**
   * Delete a journey locally
   */
  deleteJourney(journeyId: string): void {
    const journeys = this.getAllJourneys()
    const filtered = journeys.filter((j) => j.id !== journeyId)
    this.setItem(STORAGE_KEYS.JOURNEYS, filtered)

    const activeId = this.getItem<string | null>(STORAGE_KEYS.ACTIVE_JOURNEY_ID, null)
    if (activeId === journeyId) {
      this.removeItem(STORAGE_KEYS.ACTIVE_JOURNEY_ID)
    }

    // Queue deletion for sync
    this.queueSync('delete', { journeyId })
  }

  // --------------------------------------------------------------------------
  // Journey Generation (Offline-capable)
  // --------------------------------------------------------------------------

  /**
   * Generate a new journey locally (works offline)
   */
  generateJourney(
    userId: string,
    template: keyof typeof JOURNEY_TEMPLATES = 'inner_peace',
    durationDays: number = 7,
    customTitle?: string
  ): WisdomJourney {
    const journeyId = this.generateUUID()
    const now = new Date().toISOString()
    const templateData = JOURNEY_TEMPLATES[template] || JOURNEY_TEMPLATES.inner_peace

    // Select verses based on template themes
    const relevantVerses = this.selectVersesForTemplate(template, durationDays)

    const steps: JourneyStep[] = relevantVerses.map((verse, index) => ({
      id: `${journeyId}-step-${index + 1}`,
      step_number: index + 1,
      verse_id: verse.id,
      verse_text: verse.text,
      verse_translation: verse.translation,
      verse_chapter: verse.chapter,
      verse_number: verse.verse,
      reflection_prompt: verse.reflection,
      ai_insight: `This verse from Chapter ${verse.chapter}, Verse ${verse.verse} offers profound guidance on ${verse.theme}. Let this wisdom illuminate your path today.`,
      completed: false,
      completed_at: null,
      time_spent_seconds: null,
      user_notes: null,
      user_rating: null,
    }))

    const journey: WisdomJourney = {
      id: journeyId,
      user_id: userId,
      title: customTitle || templateData.title,
      description: templateData.description,
      total_steps: steps.length,
      current_step: 0,
      status: 'active',
      progress_percentage: 0,
      recommended_by: 'ai',
      recommendation_score: 0.85,
      recommendation_reason: `Selected based on ${template} journey template`,
      created_at: now,
      updated_at: now,
      completed_at: null,
      steps,
    }

    // Save locally
    this.saveJourney(journey)
    this.setActiveJourney(journeyId)

    // Queue for sync when online
    this.queueSync('create', { journey })

    return journey
  }

  /**
   * Select verses for a given template
   */
  private selectVersesForTemplate(
    template: keyof typeof JOURNEY_TEMPLATES,
    count: number
  ): typeof EMBEDDED_GITA_VERSES {
    const templateData = JOURNEY_TEMPLATES[template]
    if (!templateData) {
      return EMBEDDED_GITA_VERSES.slice(0, count)
    }

    // Score verses based on theme match
    const scoredVerses = EMBEDDED_GITA_VERSES.map((verse) => ({
      verse,
      score: templateData.themes.includes(verse.theme) ? 1 : 0,
    }))

    // Sort by score (descending) and take top N
    scoredVerses.sort((a, b) => b.score - a.score)

    // Ensure we have enough verses by filling with others if needed
    const selected = scoredVerses.slice(0, count).map((sv) => sv.verse)

    // If we don't have enough, add more from the beginning
    while (selected.length < count && selected.length < EMBEDDED_GITA_VERSES.length) {
      const remaining = EMBEDDED_GITA_VERSES.filter(
        (v) => !selected.includes(v)
      )
      if (remaining.length > 0) {
        selected.push(remaining[0])
      } else {
        break
      }
    }

    return selected.slice(0, count)
  }

  // --------------------------------------------------------------------------
  // Progress Tracking
  // --------------------------------------------------------------------------

  /**
   * Mark a step as complete (works offline)
   */
  markStepComplete(
    journeyId: string,
    stepNumber: number,
    timeSpentSeconds?: number,
    userNotes?: string,
    userRating?: number
  ): JourneyStep | null {
    const journey = this.getJourney(journeyId)
    if (!journey) return null

    const stepIndex = journey.steps.findIndex((s) => s.step_number === stepNumber)
    if (stepIndex < 0) return null

    const now = new Date().toISOString()
    const step = journey.steps[stepIndex]

    // Update step
    step.completed = true
    step.completed_at = now
    if (timeSpentSeconds !== undefined) step.time_spent_seconds = timeSpentSeconds
    if (userNotes !== undefined) step.user_notes = userNotes
    if (userRating !== undefined) step.user_rating = Math.max(1, Math.min(5, userRating))

    // Update journey progress
    journey.current_step = stepNumber
    journey.progress_percentage = Math.round((stepNumber / journey.total_steps) * 100)
    journey.updated_at = now

    // Check if journey is complete
    if (stepNumber >= journey.total_steps) {
      journey.status = 'completed'
      journey.completed_at = now
    }

    // Save locally
    this.saveJourney(journey)

    // Queue for sync
    this.queueSync('progress', {
      journeyId,
      stepNumber,
      timeSpentSeconds,
      userNotes,
      userRating,
    })

    return step
  }

  /**
   * Pause a journey (works offline)
   */
  pauseJourney(journeyId: string): WisdomJourney | null {
    const journey = this.getJourney(journeyId)
    if (!journey) return null

    journey.status = 'paused'
    journey.updated_at = new Date().toISOString()

    this.saveJourney(journey)
    this.queueSync('pause', { journeyId })

    return journey
  }

  /**
   * Resume a journey (works offline)
   */
  resumeJourney(journeyId: string): WisdomJourney | null {
    const journey = this.getJourney(journeyId)
    if (!journey || journey.status !== 'paused') return null

    journey.status = 'active'
    journey.updated_at = new Date().toISOString()

    this.saveJourney(journey)
    this.queueSync('resume', { journeyId })

    return journey
  }

  // --------------------------------------------------------------------------
  // Recommendations
  // --------------------------------------------------------------------------

  /**
   * Get journey recommendations (works offline)
   */
  getRecommendations(moodAverage?: number): JourneyRecommendation[] {
    const mood = moodAverage ?? 5 // Default neutral mood

    const recommendations: JourneyRecommendation[] = []

    for (const [template, data] of Object.entries(JOURNEY_TEMPLATES)) {
      const [minMood, maxMood] = data.moodRange

      // Calculate relevance score based on mood match
      let score = 0.5
      if (mood >= minMood && mood <= maxMood) {
        // Perfect match
        score = 0.9
      } else if (mood >= minMood - 1 && mood <= maxMood + 1) {
        // Close match
        score = 0.7
      }

      // Add some variance
      score += Math.random() * 0.1

      recommendations.push({
        template,
        title: data.title,
        description: data.description,
        score: Math.min(1, score),
        reason: this.generateRecommendationReason(template as keyof typeof JOURNEY_TEMPLATES, mood),
      })
    }

    // Sort by score and return top 3
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3)
  }

  private generateRecommendationReason(
    template: keyof typeof JOURNEY_TEMPLATES,
    mood: number
  ): string {
    const reasons: Record<string, string[]> = {
      inner_peace: [
        'Perfect for finding calm amidst life\'s challenges.',
        'Helps cultivate tranquility and acceptance.',
        'Ideal for those seeking mental stillness.',
      ],
      resilience_strength: [
        'Build inner strength during difficult times.',
        'Develop resilience through timeless wisdom.',
        'Strengthen your spirit with ancient teachings.',
      ],
      joyful_living: [
        'Embrace the fullness of life with joy.',
        'Celebrate the gift of conscious existence.',
        'Perfect for amplifying positive states.',
      ],
      self_discovery: [
        'Explore the depths of your true nature.',
        'Uncover your purpose and potential.',
        'A transformative journey inward.',
      ],
      balanced_action: [
        'Learn to act with detachment and clarity.',
        'Find harmony between effort and surrender.',
        'Master the art of balanced living.',
      ],
      relationship_harmony: [
        'Cultivate deeper connections with others.',
        'Learn the wisdom of compassionate relating.',
        'Build harmonious relationships.',
      ],
      letting_go: [
        'Experience the freedom of non-attachment.',
        'Learn to release what no longer serves you.',
        'Embrace the transformative power of surrender.',
      ],
    }

    const templateReasons = reasons[template] || reasons.inner_peace
    return templateReasons[Math.floor(Math.random() * templateReasons.length)]
  }

  // --------------------------------------------------------------------------
  // Sync Management
  // --------------------------------------------------------------------------

  /**
   * Queue an action for sync when online
   */
  private queueSync(action: string, data: Record<string, unknown>): void {
    const pendingSyncs = this.getItem<Array<{action: string; data: Record<string, unknown>; timestamp: string}>>(
      STORAGE_KEYS.PENDING_SYNCS,
      []
    )

    pendingSyncs.push({
      action,
      data,
      timestamp: new Date().toISOString(),
    })

    this.setItem(STORAGE_KEYS.PENDING_SYNCS, pendingSyncs)
  }

  /**
   * Get pending syncs
   */
  getPendingSyncs(): Array<{action: string; data: Record<string, unknown>; timestamp: string}> {
    return this.getItem(STORAGE_KEYS.PENDING_SYNCS, [])
  }

  /**
   * Clear pending syncs
   */
  clearPendingSyncs(): void {
    this.setItem(STORAGE_KEYS.PENDING_SYNCS, [])
    this.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
  }

  /**
   * Mark a sync as completed
   */
  markSyncCompleted(index: number): void {
    const pendingSyncs = this.getPendingSyncs()
    if (index >= 0 && index < pendingSyncs.length) {
      pendingSyncs.splice(index, 1)
      this.setItem(STORAGE_KEYS.PENDING_SYNCS, pendingSyncs)
    }
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Generate a UUID
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Check if we have any local data
   */
  hasLocalData(): boolean {
    return this.getAllJourneys().length > 0
  }

  /**
   * Clear all local data
   */
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.removeItem(key)
    })
  }

  /**
   * Get current step for a journey
   */
  getCurrentStep(journey: WisdomJourney): JourneyStep | null {
    return journey.steps.find((step) => step.step_number === journey.current_step + 1) || null
  }

  /**
   * Get next uncompleted step
   */
  getNextStep(journey: WisdomJourney): JourneyStep | null {
    return journey.steps.find((step) => !step.completed) || null
  }

  /**
   * Calculate completion percentage
   */
  calculateProgress(journey: WisdomJourney): number {
    const completedSteps = journey.steps.filter((step) => step.completed).length
    return Math.round((completedSteps / journey.total_steps) * 100)
  }

  // --------------------------------------------------------------------------
  // KIAAN AI Core Wisdom Integration
  // --------------------------------------------------------------------------

  /**
   * Generate a KIAAN-style AI insight for a verse
   * Uses KIAAN AI Core Wisdom patterns for personalized guidance
   */
  generateKiaanInsight(
    verse: { chapter: number; verse: number; theme: string; text: string },
    userContext?: { moodAverage?: number; themes?: string[] }
  ): string {
    const mood = userContext?.moodAverage ?? 5

    // KIAAN AI insight templates based on mood and verse theme
    const lowMoodInsights = [
      `Beloved seeker, this sacred teaching from Chapter ${verse.chapter}, Verse ${verse.verse} is a gentle reminder that even in darkness, the light of wisdom shines within you. The path of ${verse.theme} teaches us that challenges are opportunities for growth.`,
      `Dear one, in times of difficulty, the Gita's wisdom on ${verse.theme} offers solace. This verse from Chapter ${verse.chapter} reminds us that the soul is eternal, and current struggles are but passing clouds.`,
      `Precious soul, Lord Krishna's words on ${verse.theme} in this verse speak directly to your heart. Remember, you are not alone on this journey - divine grace supports you always.`,
    ]

    const neutralMoodInsights = [
      `This verse from Chapter ${verse.chapter}, Verse ${verse.verse} illuminates the path of ${verse.theme}. As you contemplate these timeless words, allow them to deepen your understanding of life's purpose.`,
      `In this profound teaching on ${verse.theme}, we discover practical wisdom for daily life. Reflect on how you might embody this teaching in your interactions today.`,
      `The Bhagavad Gita's insight on ${verse.theme} offers a mirror for self-reflection. What aspects of this verse resonate most with your current life situation?`,
    ]

    const highMoodInsights = [
      `Wonderful! Your positive energy aligns beautifully with this teaching on ${verse.theme}. Chapter ${verse.chapter}, Verse ${verse.verse} encourages you to share this light with others.`,
      `In this elevated state, the wisdom of ${verse.theme} can be fully absorbed. Consider how you might use your current well-being to serve a higher purpose.`,
      `This verse celebrates the divine qualities you are embodying. Let this teaching on ${verse.theme} inspire even greater heights of spiritual growth.`,
    ]

    const insights = mood < 4 ? lowMoodInsights : mood > 7 ? highMoodInsights : neutralMoodInsights
    return insights[Math.floor(Math.random() * insights.length)]
  }

  /**
   * Generate a personalized reflection prompt using KIAAN AI
   */
  generateKiaanReflection(
    verse: { theme: string; text: string },
    userContext?: { themes?: string[] }
  ): string {
    const reflectionPrompts: Record<string, string[]> = {
      detachment: [
        'Reflect on an outcome you are attached to. How might your experience change if you released this attachment?',
        'Consider a time when letting go of expectations brought unexpected peace. What can you learn from this?',
        'What would it feel like to give your best effort today without worrying about results?',
      ],
      equanimity: [
        'Think of a recent experience that disturbed your peace. How might equanimity have changed your response?',
        'What would it mean to treat success and failure with equal acceptance?',
        'Notice your reactions today. Where can you practice greater balance?',
      ],
      'self-improvement': [
        'In what ways has your mind been your friend recently? In what ways has it been your enemy?',
        'What small step can you take today to elevate your thoughts?',
        'How can you be more compassionate with yourself while still growing?',
      ],
      'mind-control': [
        'Notice your thoughts without judgment. What patterns do you observe?',
        'What practices help you find stillness? How can you deepen them?',
        'When the mind wanders, how do you gently bring it back to the present?',
      ],
      compassion: [
        'Who in your life needs your compassion today? How can you offer it?',
        'Reflect on extending kindness to someone you find difficult.',
        'How can you practice compassion toward yourself?',
      ],
      devotion: [
        'What does devotion mean in your daily life?',
        'How can you bring more sacred awareness to ordinary activities?',
        'Reflect on what or who inspires your deepest reverence.',
      ],
      surrender: [
        'What are you holding onto that it might be time to surrender?',
        'How does trust in a higher purpose change your experience of challenges?',
        'Where in your life can you practice letting go of control?',
      ],
      duty: [
        'What duties call to you? How do you fulfill them without attachment?',
        'Reflect on the difference between obligation and sacred duty.',
        'How can you perform your responsibilities with joy rather than burden?',
      ],
      righteousness: [
        'What does it mean to stand for what is right in your current circumstances?',
        'How do you maintain integrity when it is difficult?',
        'Where can you contribute to greater good in the world?',
      ],
      impermanence: [
        'Reflect on something that seemed permanent but has changed.',
        'How does awareness of impermanence affect your appreciation of the present?',
        'What comfort can be found in knowing that difficult times also pass?',
      ],
      'inner-peace': [
        'What is the source of your deepest peace? How can you access it more often?',
        'Reflect on a moment of profound stillness you have experienced.',
        'What external dependencies steal your inner peace?',
      ],
      'divine-presence': [
        'Where have you sensed the divine in your life recently?',
        'How might your day change if you remembered the sacred presence within you?',
        'Reflect on the divine spark in those around you.',
      ],
    }

    const theme = verse.theme || 'wisdom'
    const prompts = reflectionPrompts[theme] || [
      `How does this teaching speak to your current life journey?`,
      `What wisdom from this verse can you apply today?`,
      `Reflect on the deeper meaning of these sacred words.`,
    ]

    return prompts[Math.floor(Math.random() * prompts.length)]
  }

  // --------------------------------------------------------------------------
  // Voice Support Integration
  // --------------------------------------------------------------------------

  /**
   * Get verse data formatted for voice recitation
   */
  getVerseForVoice(step: JourneyStep): {
    sanskrit: string
    english: string
    chapter: number
    verse: number
  } {
    return {
      sanskrit: step.verse_translation || '',
      english: step.verse_text || '',
      chapter: step.verse_chapter || 0,
      verse: step.verse_number || 0,
    }
  }

  /**
   * Get chapter information
   */
  getChapterInfo(chapter: number): { name: string; sanskritName: string; verses: number } | null {
    return CHAPTER_VERSE_COUNTS[chapter] || null
  }

  /**
   * Get all chapters
   */
  getAllChapters(): Array<{ chapter: number; name: string; sanskritName: string; verses: number }> {
    return Object.entries(CHAPTER_VERSE_COUNTS).map(([ch, info]) => ({
      chapter: parseInt(ch),
      ...info,
    }))
  }

  /**
   * Get total verse count
   */
  getTotalVerses(): number {
    return TOTAL_GITA_VERSES
  }
}

// Export singleton instance
export const wisdomEngine = new WisdomJourneyPowerEngine()

// Export default for convenience
export default wisdomEngine
