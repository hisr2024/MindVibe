/**
 * Guided Affirmation Engine - Personalized Positive Affirmations
 *
 * Voice-delivered affirmations tailored to user's needs:
 * - Category-based affirmations (confidence, calm, gratitude, etc.)
 * - Time-of-day appropriate messages
 * - Personalized with user's name and goals
 * - Gita-inspired wisdom affirmations
 * - Multi-language support (Hindi/English)
 *
 * Practical Use Cases:
 * - "KIAAN, give me an affirmation" - Random affirmation
 * - "I need confidence" - Confidence-specific affirmations
 * - Morning affirmation routine
 * - Post-meditation affirmations
 */

// ============ Types & Interfaces ============

/**
 * Affirmation category
 */
export type AffirmationCategory =
  | 'confidence'
  | 'calm'
  | 'gratitude'
  | 'self_love'
  | 'strength'
  | 'healing'
  | 'abundance'
  | 'peace'
  | 'wisdom'
  | 'courage'
  | 'forgiveness'
  | 'morning'
  | 'evening'
  | 'sleep'
  | 'gita_inspired'

/**
 * Single affirmation
 */
export interface Affirmation {
  id: string
  text: string
  textHindi?: string
  category: AffirmationCategory
  voiceStyle: 'warm' | 'gentle' | 'strong' | 'peaceful'
  pauseAfter: number  // seconds
  repeat?: number     // how many times to repeat
}

/**
 * Affirmation set (for routines)
 */
export interface AffirmationSet {
  id: string
  name: string
  description: string
  category: AffirmationCategory
  affirmations: string[]  // IDs
  intro?: string
  outro?: string
  estimatedMinutes: number
}

/**
 * User's affirmation preferences
 */
export interface AffirmationPreferences {
  favoriteCategories: AffirmationCategory[]
  customAffirmations: Affirmation[]
  preferredLanguage: 'english' | 'hindi' | 'both'
  userName?: string
  personalGoals?: string[]
}

/**
 * Engine state
 */
export interface AffirmationState {
  isPlaying: boolean
  currentSet: string | null
  currentIndex: number
  totalInSet: number
}

// ============ Affirmation Library ============

export const AFFIRMATIONS: Affirmation[] = [
  // Confidence
  { id: 'conf_1', text: 'I am capable of achieving great things.', textHindi: 'मैं महान चीजें हासिल करने में सक्षम हूं।', category: 'confidence', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'conf_2', text: 'I trust in my abilities and decisions.', textHindi: 'मुझे अपनी क्षमताओं और निर्णयों पर भरोसा है।', category: 'confidence', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'conf_3', text: 'I am worthy of success and happiness.', textHindi: 'मैं सफलता और खुशी के योग्य हूं।', category: 'confidence', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'conf_4', text: 'My voice matters and deserves to be heard.', category: 'confidence', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'conf_5', text: 'I embrace challenges as opportunities to grow.', category: 'confidence', voiceStyle: 'strong', pauseAfter: 3 },

  // Calm
  { id: 'calm_1', text: 'I am at peace with this moment.', textHindi: 'मैं इस पल के साथ शांति में हूं।', category: 'calm', voiceStyle: 'peaceful', pauseAfter: 4 },
  { id: 'calm_2', text: 'I release all tension from my body and mind.', textHindi: 'मैं अपने शरीर और मन से सारा तनाव छोड़ देता हूं।', category: 'calm', voiceStyle: 'gentle', pauseAfter: 4 },
  { id: 'calm_3', text: 'With every breath, I feel more relaxed.', category: 'calm', voiceStyle: 'peaceful', pauseAfter: 4 },
  { id: 'calm_4', text: 'I choose peace over worry.', category: 'calm', voiceStyle: 'gentle', pauseAfter: 3 },
  { id: 'calm_5', text: 'Calmness flows through me like a gentle river.', category: 'calm', voiceStyle: 'peaceful', pauseAfter: 4 },

  // Gratitude
  { id: 'grat_1', text: 'I am grateful for this new day and its possibilities.', textHindi: 'मैं इस नए दिन और इसकी संभावनाओं के लिए आभारी हूं।', category: 'gratitude', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'grat_2', text: 'I appreciate the abundance in my life.', category: 'gratitude', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'grat_3', text: 'I am thankful for the love that surrounds me.', category: 'gratitude', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'grat_4', text: 'Every challenge is a gift teaching me something valuable.', category: 'gratitude', voiceStyle: 'warm', pauseAfter: 4 },
  { id: 'grat_5', text: 'I find joy in the simple things.', category: 'gratitude', voiceStyle: 'gentle', pauseAfter: 3 },

  // Self Love
  { id: 'love_1', text: 'I love and accept myself completely.', textHindi: 'मैं खुद से पूरी तरह प्यार करता हूं और स्वीकार करता हूं।', category: 'self_love', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'love_2', text: 'I am enough, just as I am.', textHindi: 'मैं पर्याप्त हूं, जैसा मैं हूं।', category: 'self_love', voiceStyle: 'gentle', pauseAfter: 4 },
  { id: 'love_3', text: 'I treat myself with kindness and compassion.', category: 'self_love', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'love_4', text: 'I deserve love, respect, and happiness.', category: 'self_love', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'love_5', text: 'I forgive myself for past mistakes and grow from them.', category: 'self_love', voiceStyle: 'gentle', pauseAfter: 4 },

  // Strength
  { id: 'str_1', text: 'I am stronger than my challenges.', textHindi: 'मैं अपनी चुनौतियों से ज़्यादा मजबूत हूं।', category: 'strength', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'str_2', text: 'I have overcome difficulties before and will do so again.', category: 'strength', voiceStyle: 'strong', pauseAfter: 4 },
  { id: 'str_3', text: 'My strength comes from within.', category: 'strength', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'str_4', text: 'I am resilient and can handle whatever comes my way.', category: 'strength', voiceStyle: 'strong', pauseAfter: 4 },
  { id: 'str_5', text: 'Every setback is a setup for a comeback.', category: 'strength', voiceStyle: 'strong', pauseAfter: 3 },

  // Healing
  { id: 'heal_1', text: 'My body is healing with every breath I take.', textHindi: 'मेरा शरीर हर सांस के साथ ठीक हो रहा है।', category: 'healing', voiceStyle: 'gentle', pauseAfter: 4 },
  { id: 'heal_2', text: 'I release what no longer serves my wellbeing.', category: 'healing', voiceStyle: 'peaceful', pauseAfter: 4 },
  { id: 'heal_3', text: 'I am open to healing on all levels.', category: 'healing', voiceStyle: 'gentle', pauseAfter: 3 },
  { id: 'heal_4', text: 'I nurture my mind, body, and soul.', category: 'healing', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'heal_5', text: 'Each day I am becoming healthier and more vibrant.', category: 'healing', voiceStyle: 'warm', pauseAfter: 4 },

  // Peace
  { id: 'peace_1', text: 'I am a peaceful presence in this world.', textHindi: 'मैं इस दुनिया में एक शांतिपूर्ण उपस्थिति हूं।', category: 'peace', voiceStyle: 'peaceful', pauseAfter: 4 },
  { id: 'peace_2', text: 'I let go of what I cannot control.', category: 'peace', voiceStyle: 'peaceful', pauseAfter: 4 },
  { id: 'peace_3', text: 'Inner peace is my natural state.', category: 'peace', voiceStyle: 'peaceful', pauseAfter: 4 },
  { id: 'peace_4', text: 'I choose harmony in my thoughts and actions.', category: 'peace', voiceStyle: 'gentle', pauseAfter: 3 },
  { id: 'peace_5', text: 'Peace flows through me and touches everyone I meet.', category: 'peace', voiceStyle: 'peaceful', pauseAfter: 4 },

  // Wisdom (Gita-inspired)
  { id: 'gita_1', text: 'I act without attachment to the results.', textHindi: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मैं परिणामों से बिना जुड़े कार्य करता हूं।', category: 'gita_inspired', voiceStyle: 'peaceful', pauseAfter: 5 },
  { id: 'gita_2', text: 'I am the eternal soul, beyond birth and death.', textHindi: 'मैं शाश्वत आत्मा हूं, जन्म और मृत्यु से परे।', category: 'gita_inspired', voiceStyle: 'peaceful', pauseAfter: 5 },
  { id: 'gita_3', text: 'I maintain equanimity in success and failure.', textHindi: 'सुख-दुख, लाभ-हानि, जय-पराजय में समभाव।', category: 'gita_inspired', voiceStyle: 'peaceful', pauseAfter: 5 },
  { id: 'gita_4', text: 'I find peace in performing my duty with dedication.', textHindi: 'मैं अपने कर्तव्य को समर्पण से करने में शांति पाता हूं।', category: 'gita_inspired', voiceStyle: 'warm', pauseAfter: 5 },
  { id: 'gita_5', text: 'The divine light within me guides my path.', textHindi: 'मेरे भीतर का दिव्य प्रकाश मेरे मार्ग को रोशन करता है।', category: 'gita_inspired', voiceStyle: 'peaceful', pauseAfter: 5 },

  // Morning
  { id: 'morn_1', text: 'Today is full of possibilities waiting for me.', textHindi: 'आज संभावनाओं से भरा है जो मेरी प्रतीक्षा कर रही हैं।', category: 'morning', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'morn_2', text: 'I greet this day with energy and enthusiasm.', category: 'morning', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'morn_3', text: 'I am ready to make today beautiful.', category: 'morning', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'morn_4', text: 'I choose to focus on what truly matters today.', category: 'morning', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'morn_5', text: 'My morning sets the tone for a wonderful day.', category: 'morning', voiceStyle: 'warm', pauseAfter: 3 },

  // Evening
  { id: 'eve_1', text: 'I release the day and embrace peaceful rest.', textHindi: 'मैं दिन को छोड़ता हूं और शांतिपूर्ण विश्राम को अपनाता हूं।', category: 'evening', voiceStyle: 'gentle', pauseAfter: 4 },
  { id: 'eve_2', text: 'I did my best today, and that is enough.', category: 'evening', voiceStyle: 'gentle', pauseAfter: 4 },
  { id: 'eve_3', text: 'I am grateful for this day\'s experiences.', category: 'evening', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'eve_4', text: 'I let go of today\'s worries and trust in tomorrow.', category: 'evening', voiceStyle: 'peaceful', pauseAfter: 4 },
  { id: 'eve_5', text: 'Sleep will restore and rejuvenate me.', category: 'evening', voiceStyle: 'gentle', pauseAfter: 4 },

  // Sleep
  { id: 'sleep_1', text: 'I surrender to peaceful, healing sleep.', textHindi: 'मैं शांतिपूर्ण, उपचारात्मक नींद के लिए समर्पण करता हूं।', category: 'sleep', voiceStyle: 'gentle', pauseAfter: 5 },
  { id: 'sleep_2', text: 'My mind is quiet, my body is relaxed.', category: 'sleep', voiceStyle: 'peaceful', pauseAfter: 5 },
  { id: 'sleep_3', text: 'I am safe, I am loved, I can rest now.', category: 'sleep', voiceStyle: 'gentle', pauseAfter: 5 },
  { id: 'sleep_4', text: 'Sweet dreams carry me to morning.', category: 'sleep', voiceStyle: 'peaceful', pauseAfter: 6 },
  { id: 'sleep_5', text: 'I breathe out the day... and breathe in peace.', category: 'sleep', voiceStyle: 'gentle', pauseAfter: 6 },

  // Courage
  { id: 'cour_1', text: 'I have the courage to face my fears.', textHindi: 'मुझमें अपने डर का सामना करने का साहस है।', category: 'courage', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'cour_2', text: 'I step outside my comfort zone with confidence.', category: 'courage', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'cour_3', text: 'Fear does not control me; I control my response to it.', category: 'courage', voiceStyle: 'strong', pauseAfter: 4 },
  { id: 'cour_4', text: 'I am brave enough to be vulnerable.', category: 'courage', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'cour_5', text: 'Every courageous step makes me stronger.', category: 'courage', voiceStyle: 'strong', pauseAfter: 3 },

  // Forgiveness
  { id: 'forg_1', text: 'I forgive others and free myself from resentment.', textHindi: 'मैं दूसरों को माफ करता हूं और खुद को आक्रोश से मुक्त करता हूं।', category: 'forgiveness', voiceStyle: 'gentle', pauseAfter: 4 },
  { id: 'forg_2', text: 'I release the past and embrace the present.', category: 'forgiveness', voiceStyle: 'peaceful', pauseAfter: 4 },
  { id: 'forg_3', text: 'Forgiveness is a gift I give myself.', category: 'forgiveness', voiceStyle: 'warm', pauseAfter: 4 },
  { id: 'forg_4', text: 'I choose understanding over anger.', category: 'forgiveness', voiceStyle: 'gentle', pauseAfter: 3 },
  { id: 'forg_5', text: 'I am at peace with my past.', category: 'forgiveness', voiceStyle: 'peaceful', pauseAfter: 4 },

  // Abundance
  { id: 'abun_1', text: 'Abundance flows to me in expected and unexpected ways.', textHindi: 'प्रचुरता अपेक्षित और अप्रत्याशित तरीकों से मेरे पास आती है।', category: 'abundance', voiceStyle: 'warm', pauseAfter: 4 },
  { id: 'abun_2', text: 'I am open to receiving all the good the universe offers.', category: 'abundance', voiceStyle: 'warm', pauseAfter: 4 },
  { id: 'abun_3', text: 'I have more than enough.', category: 'abundance', voiceStyle: 'warm', pauseAfter: 3 },
  { id: 'abun_4', text: 'I attract positive opportunities into my life.', category: 'abundance', voiceStyle: 'strong', pauseAfter: 3 },
  { id: 'abun_5', text: 'My life is filled with blessings.', category: 'abundance', voiceStyle: 'warm', pauseAfter: 3 }
]

/**
 * Affirmation sets
 */
export const AFFIRMATION_SETS: AffirmationSet[] = [
  {
    id: 'morning_power',
    name: 'Morning Power',
    description: 'Start your day with strength and positivity',
    category: 'morning',
    affirmations: ['morn_1', 'conf_1', 'grat_1', 'str_1', 'morn_3'],
    intro: 'Good morning. Let\'s begin your day with powerful affirmations.',
    outro: 'Carry these affirmations with you throughout the day.',
    estimatedMinutes: 3
  },
  {
    id: 'calm_anxiety',
    name: 'Calming Anxiety',
    description: 'Soothe anxiety with peaceful affirmations',
    category: 'calm',
    affirmations: ['calm_1', 'calm_2', 'peace_2', 'calm_3', 'peace_1'],
    intro: 'Take a deep breath. Let\'s calm your mind together.',
    outro: 'Remember, peace is always available to you.',
    estimatedMinutes: 3
  },
  {
    id: 'bedtime_peace',
    name: 'Bedtime Peace',
    description: 'Prepare for restful sleep',
    category: 'sleep',
    affirmations: ['eve_1', 'eve_2', 'sleep_1', 'sleep_3', 'sleep_5'],
    intro: 'As your day ends, let\'s prepare for peaceful sleep.',
    outro: 'Sleep well. Tomorrow brings new possibilities.',
    estimatedMinutes: 4
  },
  {
    id: 'gita_wisdom',
    name: 'Gita Wisdom',
    description: 'Ancient wisdom for modern life',
    category: 'gita_inspired',
    affirmations: ['gita_1', 'gita_2', 'gita_3', 'gita_4', 'gita_5'],
    intro: 'Let us reflect on the timeless wisdom of the Bhagavad Gita.',
    outro: 'May this wisdom guide your path.',
    estimatedMinutes: 5
  },
  {
    id: 'self_love_journey',
    name: 'Self Love Journey',
    description: 'Cultivate love and acceptance for yourself',
    category: 'self_love',
    affirmations: ['love_1', 'love_2', 'love_3', 'love_4', 'love_5'],
    intro: 'You deserve love. Let\'s remind ourselves of that truth.',
    outro: 'You are worthy of all the love in the world.',
    estimatedMinutes: 3
  }
]

// ============ Engine Class ============

/**
 * Guided Affirmation Engine
 */
export class GuidedAffirmationEngine {
  private state: AffirmationState = {
    isPlaying: false,
    currentSet: null,
    currentIndex: 0,
    totalInSet: 0
  }

  private preferences: AffirmationPreferences = {
    favoriteCategories: [],
    customAffirmations: [],
    preferredLanguage: 'english'
  }

  private timer: ReturnType<typeof setTimeout> | null = null
  private onAffirmation?: (affirmation: Affirmation, index: number, total: number) => void
  private onComplete?: () => void

  constructor(options?: {
    onAffirmation?: (affirmation: Affirmation, index: number, total: number) => void
    onComplete?: () => void
  }) {
    this.onAffirmation = options?.onAffirmation
    this.onComplete = options?.onComplete
  }

  /**
   * Get random affirmation
   */
  getRandomAffirmation(category?: AffirmationCategory): Affirmation {
    const pool = category
      ? AFFIRMATIONS.filter(a => a.category === category)
      : AFFIRMATIONS

    const index = Math.floor(Math.random() * pool.length)
    return pool[index]
  }

  /**
   * Get affirmations by category
   */
  getByCategory(category: AffirmationCategory): Affirmation[] {
    return AFFIRMATIONS.filter(a => a.category === category)
  }

  /**
   * Get time-appropriate affirmation
   */
  getTimeAppropriateAffirmation(): Affirmation {
    const hour = new Date().getHours()

    if (hour >= 5 && hour < 12) {
      return this.getRandomAffirmation('morning')
    } else if (hour >= 21 || hour < 5) {
      return this.getRandomAffirmation('evening')
    } else {
      // Daytime - return confidence or peace
      const categories: AffirmationCategory[] = ['confidence', 'peace', 'gratitude']
      const category = categories[Math.floor(Math.random() * categories.length)]
      return this.getRandomAffirmation(category)
    }
  }

  /**
   * Start affirmation set
   */
  startSet(setId: string): void {
    const set = AFFIRMATION_SETS.find(s => s.id === setId)
    if (!set) return

    this.state = {
      isPlaying: true,
      currentSet: setId,
      currentIndex: 0,
      totalInSet: set.affirmations.length
    }

    this.playNextAffirmation(set)
  }

  /**
   * Stop current set
   */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    this.state = {
      isPlaying: false,
      currentSet: null,
      currentIndex: 0,
      totalInSet: 0
    }
  }

  /**
   * Personalize affirmation text
   */
  personalizeAffirmation(affirmation: Affirmation): string {
    let text = this.preferences.preferredLanguage === 'hindi' && affirmation.textHindi
      ? affirmation.textHindi
      : affirmation.text

    // Replace {name} placeholder if present
    if (this.preferences.userName) {
      text = text.replace('{name}', this.preferences.userName)
    }

    return text
  }

  /**
   * Set preferences
   */
  setPreferences(prefs: Partial<AffirmationPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs }
  }

  /**
   * Add custom affirmation
   */
  addCustomAffirmation(text: string, category: AffirmationCategory): Affirmation {
    const custom: Affirmation = {
      id: `custom_${Date.now()}`,
      text,
      category,
      voiceStyle: 'warm',
      pauseAfter: 3
    }

    this.preferences.customAffirmations.push(custom)
    return custom
  }

  /**
   * Get available sets
   */
  getSets(): AffirmationSet[] {
    return [...AFFIRMATION_SETS]
  }

  /**
   * Get categories
   */
  getCategories(): AffirmationCategory[] {
    return [
      'confidence', 'calm', 'gratitude', 'self_love', 'strength',
      'healing', 'abundance', 'peace', 'wisdom', 'courage',
      'forgiveness', 'morning', 'evening', 'sleep', 'gita_inspired'
    ]
  }

  /**
   * Get state
   */
  getState(): AffirmationState {
    return { ...this.state }
  }

  // ============ Private Methods ============

  private playNextAffirmation(set: AffirmationSet): void {
    if (!this.state.isPlaying || this.state.currentIndex >= set.affirmations.length) {
      // Complete
      this.state.isPlaying = false
      if (this.onComplete) {
        this.onComplete()
      }
      return
    }

    const affirmationId = set.affirmations[this.state.currentIndex]
    const affirmation = AFFIRMATIONS.find(a => a.id === affirmationId)
      ?? this.preferences.customAffirmations.find(a => a.id === affirmationId)

    if (affirmation && this.onAffirmation) {
      this.onAffirmation(affirmation, this.state.currentIndex, this.state.totalInSet)
    }

    // Schedule next
    const delay = (affirmation?.pauseAfter ?? 3) * 1000
    this.timer = setTimeout(() => {
      this.state.currentIndex++
      this.playNextAffirmation(set)
    }, delay + 2000)  // Extra time for TTS
  }
}

// ============ Factory & Singleton ============

let affirmationInstance: GuidedAffirmationEngine | null = null

export function getGuidedAffirmationEngine(): GuidedAffirmationEngine {
  if (!affirmationInstance) {
    affirmationInstance = new GuidedAffirmationEngine()
  }
  return affirmationInstance
}

export function createGuidedAffirmationEngine(options?: {
  onAffirmation?: (affirmation: Affirmation, index: number, total: number) => void
  onComplete?: () => void
}): GuidedAffirmationEngine {
  return new GuidedAffirmationEngine(options)
}

export const guidedAffirmationEngine = getGuidedAffirmationEngine()
