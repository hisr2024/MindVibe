/**
 * KIAAN Advanced Features
 *
 * Contains:
 * - Proactive Check-ins
 * - Emotion-Adaptive Voice Settings
 * - Background Ambience (temple bells, Om, nature)
 * - Mantra Chanting
 * - Sleep Stories
 * - Personalized Affirmations
 */

// ============================================
// PROACTIVE CHECK-INS
// ============================================

export interface CheckInSuggestion {
  shouldCheckIn: boolean
  reason: string
  message: string
  priority: 'low' | 'medium' | 'high'
}

const CHECK_IN_MESSAGES = {
  longAbsence: [
    "I noticed it's been a while since we last spoke. I've been holding space for you. How have you been?",
    "Welcome back, dear one. Time has passed since our last conversation. I'm curious about your journey.",
    "Namaste. I've missed our dialogues. What brings you back today?",
    "It's good to feel your presence again. The Gita teaches that connections are never truly broken. How are you?"
  ],
  dailyCheckIn: [
    "How is your day unfolding? I'm here if you'd like to share.",
    "Taking a moment to check in. How is your heart today?",
    "The Gita reminds us to pause and reflect. What's present for you right now?",
    "I'm here, ready to listen. What would you like to explore today?"
  ],
  afterDifficultConversation: [
    "I've been thinking about our last conversation. How are you feeling now?",
    "I wanted to follow up with you. Has anything shifted since we last spoke?",
    "Checking in with care. I sensed some heaviness in our last talk. How are things now?",
    "I'm here again, holding space for whatever you're experiencing."
  ],
  morningGreeting: [
    "Good morning! A new day brings new possibilities. Would you like to set an intention together?",
    "The dawn has arrived. How did you sleep? What does today hold for you?",
    "Morning light is here. The Gita says each day is a fresh start. What would you like to cultivate today?"
  ],
  eveningReflection: [
    "The day is winding down. Would you like to reflect on what today brought you?",
    "Evening approaches. How has your day been? I'm here to listen.",
    "As the sun sets, let's honor this day together. What stands out from your experiences today?"
  ]
}

/**
 * Get proactive check-in suggestion based on context
 */
export function getProactiveCheckIn(context: {
  lastInteractionHours: number
  lastEmotionalState?: string
  currentHour: number
  recentCrisis?: boolean
}): CheckInSuggestion {
  const { lastInteractionHours, lastEmotionalState, currentHour, recentCrisis } = context

  // Priority: After difficult conversation or crisis
  if (recentCrisis || ['anxiety', 'sadness', 'anger'].includes(lastEmotionalState || '')) {
    return {
      shouldCheckIn: true,
      reason: 'followUp',
      message: CHECK_IN_MESSAGES.afterDifficultConversation[
        Math.floor(Math.random() * CHECK_IN_MESSAGES.afterDifficultConversation.length)
      ],
      priority: 'high'
    }
  }

  // Long absence (more than 3 days)
  if (lastInteractionHours > 72) {
    return {
      shouldCheckIn: true,
      reason: 'longAbsence',
      message: CHECK_IN_MESSAGES.longAbsence[
        Math.floor(Math.random() * CHECK_IN_MESSAGES.longAbsence.length)
      ],
      priority: 'medium'
    }
  }

  // Morning check-in (6-9 AM)
  if (currentHour >= 6 && currentHour <= 9 && lastInteractionHours > 12) {
    return {
      shouldCheckIn: true,
      reason: 'morning',
      message: CHECK_IN_MESSAGES.morningGreeting[
        Math.floor(Math.random() * CHECK_IN_MESSAGES.morningGreeting.length)
      ],
      priority: 'low'
    }
  }

  // Evening check-in (7-10 PM)
  if (currentHour >= 19 && currentHour <= 22 && lastInteractionHours > 8) {
    return {
      shouldCheckIn: true,
      reason: 'evening',
      message: CHECK_IN_MESSAGES.eveningReflection[
        Math.floor(Math.random() * CHECK_IN_MESSAGES.eveningReflection.length)
      ],
      priority: 'low'
    }
  }

  // General daily check-in (if more than 24 hours)
  if (lastInteractionHours > 24) {
    return {
      shouldCheckIn: true,
      reason: 'daily',
      message: CHECK_IN_MESSAGES.dailyCheckIn[
        Math.floor(Math.random() * CHECK_IN_MESSAGES.dailyCheckIn.length)
      ],
      priority: 'low'
    }
  }

  return {
    shouldCheckIn: false,
    reason: '',
    message: '',
    priority: 'low'
  }
}

// ============================================
// EMOTION-ADAPTIVE VOICE
// ============================================

export interface VoiceSettings {
  rate: number      // 0.5 to 2.0 (1.0 is normal)
  pitch: number     // 0 to 2.0 (1.0 is normal)
  volume: number    // 0 to 1.0
}

export type EmotionalTone = 'neutral' | 'calming' | 'energizing' | 'comforting' | 'grounding' | 'gentle' | 'warm'

const EMOTION_VOICE_MAP: Record<string, { settings: VoiceSettings; tone: EmotionalTone }> = {
  anxiety: {
    settings: { rate: 0.85, pitch: 0.9, volume: 0.85 },
    tone: 'calming'
  },
  sadness: {
    settings: { rate: 0.8, pitch: 0.95, volume: 0.8 },
    tone: 'comforting'
  },
  anger: {
    settings: { rate: 0.75, pitch: 0.85, volume: 0.75 },
    tone: 'grounding'
  },
  fear: {
    settings: { rate: 0.8, pitch: 0.9, volume: 0.8 },
    tone: 'gentle'
  },
  confusion: {
    settings: { rate: 0.85, pitch: 1.0, volume: 0.9 },
    tone: 'calming'
  },
  peace: {
    settings: { rate: 0.9, pitch: 1.0, volume: 0.9 },
    tone: 'warm'
  },
  hope: {
    settings: { rate: 0.95, pitch: 1.05, volume: 0.95 },
    tone: 'warm'
  },
  joy: {
    settings: { rate: 1.0, pitch: 1.1, volume: 1.0 },
    tone: 'energizing'
  },
  neutral: {
    settings: { rate: 0.95, pitch: 1.0, volume: 0.9 },
    tone: 'neutral'
  }
}

/**
 * Get voice settings adapted to user's emotional state
 */
export function getEmotionAdaptiveVoice(emotion: string): { settings: VoiceSettings; tone: EmotionalTone } {
  return EMOTION_VOICE_MAP[emotion] || EMOTION_VOICE_MAP.neutral
}

/**
 * Get intro phrase based on emotional tone
 */
export function getEmotionalIntro(tone: EmotionalTone): string {
  const intros: Record<EmotionalTone, string[]> = {
    calming: [
      "Let's take this slowly together...",
      "Breathe with me for a moment...",
      "There's no rush here. Let's find some calm..."
    ],
    comforting: [
      "I'm here with you in this...",
      "Your feelings are valid and heard...",
      "It's okay to feel this way..."
    ],
    grounding: [
      "Let's plant our feet firmly on the ground...",
      "Feel the solidity beneath you...",
      "You are here, you are real, you are safe..."
    ],
    gentle: [
      "Softly, gently, let's explore this...",
      "Take your time, there's no pressure...",
      "We can move at whatever pace feels right..."
    ],
    warm: [
      "It's wonderful to feel this energy...",
      "Let's embrace this moment together...",
      "What a beautiful space you're in..."
    ],
    energizing: [
      "I can feel the positive energy...",
      "Let's channel this wonderful feeling...",
      "What an inspiring moment this is..."
    ],
    neutral: [
      "I'm here and ready to listen...",
      "Tell me what's on your mind...",
      "I'm fully present with you..."
    ]
  }

  const options = intros[tone]
  return options[Math.floor(Math.random() * options.length)]
}

// ============================================
// BACKGROUND AMBIENCE
// ============================================

export type AmbienceType = 'temple_bells' | 'om_chanting' | 'nature' | 'rain' | 'ocean' | 'birds' | 'flute' | 'silence'

export interface AmbienceConfig {
  type: AmbienceType
  name: string
  description: string
  audioUrl?: string // For future implementation with actual audio files
  oscillatorConfig?: {
    type: OscillatorType
    frequency: number
    duration: number
  }
}

const AMBIENCE_OPTIONS: AmbienceConfig[] = [
  {
    type: 'temple_bells',
    name: 'Temple Bells',
    description: 'Gentle temple bell sounds for sacred atmosphere'
  },
  {
    type: 'om_chanting',
    name: 'Om Chanting',
    description: 'Continuous Om vibration for meditation'
  },
  {
    type: 'nature',
    name: 'Forest Sounds',
    description: 'Peaceful forest with gentle breeze'
  },
  {
    type: 'rain',
    name: 'Gentle Rain',
    description: 'Soft rainfall for relaxation'
  },
  {
    type: 'ocean',
    name: 'Ocean Waves',
    description: 'Rhythmic ocean waves for calm'
  },
  {
    type: 'birds',
    name: 'Morning Birds',
    description: 'Gentle birdsong for upliftment'
  },
  {
    type: 'flute',
    name: 'Bansuri Flute',
    description: 'Traditional Indian flute melody'
  },
  {
    type: 'silence',
    name: 'Sacred Silence',
    description: 'Pure silence for deep meditation'
  }
]

export function getAmbienceOptions(): AmbienceConfig[] {
  return AMBIENCE_OPTIONS
}

/**
 * Generate a simple bell/chime sound using Web Audio API
 */
export function playBellSound(audioContext: AudioContext, volume: number = 0.3): void {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(528, audioContext.currentTime) // 528Hz - healing frequency

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 3)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 3)
}

/**
 * Generate Om-like sound using Web Audio API
 */
export function playOmSound(audioContext: AudioContext, duration: number = 5, volume: number = 0.2): void {
  // Create multiple oscillators for harmonics
  const fundamentalFreq = 136.1 // Om frequency

  const oscillators: OscillatorNode[] = []
  const gains: GainNode[] = []

  // Fundamental and harmonics
  const frequencies = [fundamentalFreq, fundamentalFreq * 2, fundamentalFreq * 3]
  const volumes = [volume, volume * 0.5, volume * 0.25]

  frequencies.forEach((freq, i) => {
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()

    osc.connect(gain)
    gain.connect(audioContext.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, audioContext.currentTime)

    gain.gain.setValueAtTime(0, audioContext.currentTime)
    gain.gain.linearRampToValueAtTime(volumes[i], audioContext.currentTime + 1)
    gain.gain.linearRampToValueAtTime(volumes[i], audioContext.currentTime + duration - 1)
    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration)

    oscillators.push(osc)
    gains.push(gain)
  })

  oscillators.forEach(osc => {
    osc.start(audioContext.currentTime)
    osc.stop(audioContext.currentTime + duration)
  })
}

// ============================================
// MANTRA CHANTING
// ============================================

export interface Mantra {
  sanskrit: string
  transliteration: string
  meaning: string
  purpose: string
  repetitions: number
  pauseBetween: number // seconds
}

const MANTRAS: Mantra[] = [
  {
    sanskrit: "ॐ",
    transliteration: "Om",
    meaning: "The universal sound, the vibration of creation",
    purpose: "Connection to the divine, meditation",
    repetitions: 21,
    pauseBetween: 3
  },
  {
    sanskrit: "ॐ नमः शिवाय",
    transliteration: "Om Namah Shivaya",
    meaning: "I bow to Shiva, the supreme consciousness",
    purpose: "Inner peace, transformation",
    repetitions: 11,
    pauseBetween: 4
  },
  {
    sanskrit: "ॐ शांति शांति शांति",
    transliteration: "Om Shanti Shanti Shanti",
    meaning: "Om Peace Peace Peace",
    purpose: "Peace in body, mind, and spirit",
    repetitions: 3,
    pauseBetween: 5
  },
  {
    sanskrit: "हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे",
    transliteration: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare",
    meaning: "Calling upon the divine presence of Krishna",
    purpose: "Devotion, joy, divine connection",
    repetitions: 9,
    pauseBetween: 4
  },
  {
    sanskrit: "ॐ गं गणपतये नमः",
    transliteration: "Om Gam Ganapataye Namaha",
    meaning: "Salutations to Lord Ganesha",
    purpose: "Removing obstacles, new beginnings",
    repetitions: 11,
    pauseBetween: 4
  },
  {
    sanskrit: "लोकाः समस्ताः सुखिनो भवन्तु",
    transliteration: "Lokah Samastah Sukhino Bhavantu",
    meaning: "May all beings everywhere be happy and free",
    purpose: "Universal love, compassion",
    repetitions: 3,
    pauseBetween: 6
  },
  {
    sanskrit: "सो हं",
    transliteration: "So Ham",
    meaning: "I am That (the universal consciousness)",
    purpose: "Self-realization, breath awareness",
    repetitions: 21,
    pauseBetween: 3
  }
]

export function getMantras(): Mantra[] {
  return MANTRAS
}

export function getMantraByPurpose(purpose: string): Mantra {
  const lowerPurpose = purpose.toLowerCase()

  if (lowerPurpose.includes('peace') || lowerPurpose.includes('calm')) {
    return MANTRAS.find(m => m.transliteration.includes('Shanti'))!
  }
  if (lowerPurpose.includes('obstacle') || lowerPurpose.includes('beginning')) {
    return MANTRAS.find(m => m.transliteration.includes('Ganapataye'))!
  }
  if (lowerPurpose.includes('love') || lowerPurpose.includes('compassion')) {
    return MANTRAS.find(m => m.transliteration.includes('Lokah'))!
  }
  if (lowerPurpose.includes('meditat')) {
    return MANTRAS.find(m => m.transliteration === 'Om')!
  }

  // Default
  return MANTRAS[0]
}

// ============================================
// SLEEP STORIES
// ============================================

export interface SleepStorySegment {
  text: string
  duration: number
  fadeLevel: number // 0-1, how much to fade volume
}

export interface SleepStory {
  title: string
  description: string
  totalDuration: number // minutes
  segments: SleepStorySegment[]
}

export function generateSleepStory(): SleepStory {
  const segments: SleepStorySegment[] = [
    {
      text: "Close your eyes, dear one. Let your body sink into the softness beneath you. Tonight, I will share with you a story from ancient times...",
      duration: 10,
      fadeLevel: 1.0
    },
    {
      text: "Long ago, on the banks of the sacred Yamuna river, there lived a young cowherd named Govinda. His heart was pure, and his smile could brighten the darkest night.",
      duration: 12,
      fadeLevel: 0.95
    },
    {
      text: "One evening, as the sun painted the sky in shades of saffron and gold, Govinda sat beneath a great banyan tree. The tree had stood for a thousand years, its roots reaching deep into the earth, its branches touching the heavens.",
      duration: 15,
      fadeLevel: 0.9
    },
    {
      text: "As he sat in stillness, a gentle breeze carried the sweet scent of jasmine flowers. The leaves whispered ancient secrets, and the river sang its eternal song.",
      duration: 12,
      fadeLevel: 0.85
    },
    {
      text: "Govinda closed his eyes and listened. Not with his ears, but with his heart. And in that sacred silence, he heard the voice of the universe itself.",
      duration: 12,
      fadeLevel: 0.8
    },
    {
      text: "The voice was softer than a mother's lullaby, yet more powerful than thunder. It spoke of eternal truths... that beyond all the changing forms of the world, there is an unchanging presence.",
      duration: 15,
      fadeLevel: 0.75
    },
    {
      text: "You are that presence, the voice whispered. You are the stillness beneath the movement, the silence beneath the sound, the peace beneath all storms.",
      duration: 12,
      fadeLevel: 0.7
    },
    {
      text: "As the stars began to appear, one by one, like diamonds scattered across black velvet, Govinda felt himself becoming lighter and lighter...",
      duration: 12,
      fadeLevel: 0.65
    },
    {
      text: "His worries floated away like leaves on the river. His body relaxed completely. His mind grew quiet and still.",
      duration: 10,
      fadeLevel: 0.6
    },
    {
      text: "And in that perfect stillness, he understood the great secret that Krishna had shared on the battlefield... that the soul is eternal, that love is infinite, that peace is always available within.",
      duration: 15,
      fadeLevel: 0.55
    },
    {
      text: "The night wrapped around him like a gentle shawl. The stars watched over him with loving eyes. And the universe held him, as it holds all beings, in its infinite embrace.",
      duration: 12,
      fadeLevel: 0.5
    },
    {
      text: "Now, you too are held in that same embrace. The same stars watch over you. The same peace is available to you. Let yourself float into its warmth.",
      duration: 12,
      fadeLevel: 0.45
    },
    {
      text: "Your breath becomes slower... deeper... more peaceful. Each exhale releases a little more tension. Each inhale brings a little more calm.",
      duration: 12,
      fadeLevel: 0.4
    },
    {
      text: "Like Govinda beneath the ancient tree... like the river flowing to the sea... you are returning to your source. To the great peace that has always been yours.",
      duration: 15,
      fadeLevel: 0.35
    },
    {
      text: "Sleep now... rest now... dream now... You are safe. You are loved. You are home.",
      duration: 10,
      fadeLevel: 0.3
    },
    {
      text: "Om Shanti... Shanti... Shanti...",
      duration: 20,
      fadeLevel: 0.2
    },
    {
      text: "",
      duration: 60,
      fadeLevel: 0.1
    }
  ]

  return {
    title: "The Cowherd and the Ancient Tree",
    description: "A gentle tale of peace and eternal wisdom",
    totalDuration: Math.ceil(segments.reduce((acc, s) => acc + s.duration, 0) / 60),
    segments
  }
}

// Alternative sleep stories
const SLEEP_STORY_THEMES = [
  {
    title: "The Lotus and the Moon",
    opening: "In a sacred garden where lotus flowers bloomed under silver moonlight, there lived a seeker of truth..."
  },
  {
    title: "Krishna's Flute",
    opening: "When Lord Krishna played his divine flute, all of creation would pause to listen. Even time itself would slow..."
  },
  {
    title: "The River's Journey",
    opening: "A single drop of rain began its journey from the high Himalayas, not knowing it would one day reach the infinite ocean..."
  },
  {
    title: "The Sage's Garden",
    opening: "Deep in the forest, there was a garden where an ancient sage grew not plants, but moments of peace..."
  }
]

export function getSleepStoryThemes(): { title: string; opening: string }[] {
  return SLEEP_STORY_THEMES
}

// ============================================
// AFFIRMATION GENERATOR
// ============================================

export interface Affirmation {
  text: string
  category: string
  gitaReference?: string
}

const AFFIRMATION_TEMPLATES = {
  anxiety: [
    "I am safe in this moment. The storm within me is calming.",
    "I release worry and embrace trust. The universe supports me.",
    "My breath anchors me to peace. I am grounded and secure.",
    "I face uncertainty with courage. I am stronger than my fears.",
    "This too shall pass. I am the unchanging witness within."
  ],
  sadness: [
    "I honor my feelings without being consumed by them.",
    "Grief is love with nowhere to go. I hold it with compassion.",
    "Joy will return. Emotions are visitors, not permanent residents.",
    "I am worthy of comfort and care. I am gentle with myself.",
    "The soul knows no sorrow. I rest in my eternal nature."
  ],
  anger: [
    "I choose peace over reaction. My calm is my power.",
    "I release resentment and free myself from its weight.",
    "Others' actions are theirs; my response is mine.",
    "I transform anger into clarity and understanding.",
    "Beneath my frustration lies unmet needs. I listen with compassion."
  ],
  confusion: [
    "I trust the process of my unfolding. Clarity will come.",
    "Not knowing is the beginning of wisdom. I embrace the mystery.",
    "I am exactly where I need to be on my journey.",
    "The answers I seek are already within me, waiting to emerge.",
    "I release the need to have everything figured out."
  ],
  selfWorth: [
    "I am inherently worthy, not for what I do, but for who I am.",
    "The divine light within me can never be diminished.",
    "I am enough, exactly as I am, in this very moment.",
    "My worth is not determined by others' opinions or judgments.",
    "I am a unique expression of the universe. My existence has meaning."
  ],
  purpose: [
    "My dharma unfolds naturally as I follow my heart.",
    "Every action taken with awareness is meaningful.",
    "I contribute to the world simply by being authentic.",
    "My purpose is not a destination but a way of being.",
    "The universe needs exactly what I have to offer."
  ],
  relationships: [
    "I attract relationships that honor my highest good.",
    "I give love freely without expecting return.",
    "Healthy boundaries are acts of self-love and respect.",
    "I release attachments that no longer serve my growth.",
    "I am whole within myself and enrich others from that wholeness."
  ],
  morning: [
    "Today I choose peace, purpose, and presence.",
    "I greet this day as a gift full of possibility.",
    "My actions today will be offerings to the divine.",
    "I am energized, focused, and ready to embrace whatever comes.",
    "Divine guidance flows through me in all that I do."
  ],
  evening: [
    "I release this day with gratitude and peace.",
    "I forgive myself for any missteps and celebrate my efforts.",
    "Sleep comes easily as I surrender to rest.",
    "Tomorrow will take care of itself. Tonight, I simply rest.",
    "I am grateful for the lessons and blessings of this day."
  ]
}

/**
 * Generate personalized affirmations based on emotional state and topics
 */
export function generateAffirmations(
  emotion?: string,
  topics?: string[],
  timeOfDay?: 'morning' | 'evening'
): Affirmation[] {
  const affirmations: Affirmation[] = []

  // Add time-based affirmations
  if (timeOfDay) {
    const timeAffirmations = AFFIRMATION_TEMPLATES[timeOfDay]
    affirmations.push({
      text: timeAffirmations[Math.floor(Math.random() * timeAffirmations.length)],
      category: timeOfDay
    })
  }

  // Add emotion-based affirmations
  if (emotion && AFFIRMATION_TEMPLATES[emotion as keyof typeof AFFIRMATION_TEMPLATES]) {
    const emotionAffirmations = AFFIRMATION_TEMPLATES[emotion as keyof typeof AFFIRMATION_TEMPLATES]
    affirmations.push({
      text: emotionAffirmations[Math.floor(Math.random() * emotionAffirmations.length)],
      category: emotion
    })
  }

  // Add topic-based affirmations
  if (topics) {
    topics.forEach(topic => {
      if (topic === 'purpose' || topic === 'relationships') {
        const topicAffirmations = AFFIRMATION_TEMPLATES[topic as keyof typeof AFFIRMATION_TEMPLATES]
        if (topicAffirmations) {
          affirmations.push({
            text: topicAffirmations[Math.floor(Math.random() * topicAffirmations.length)],
            category: topic
          })
        }
      }
    })
  }

  // Add self-worth if no specific affirmations
  if (affirmations.length === 0) {
    const selfWorthAffirmations = AFFIRMATION_TEMPLATES.selfWorth
    affirmations.push({
      text: selfWorthAffirmations[Math.floor(Math.random() * selfWorthAffirmations.length)],
      category: 'selfWorth'
    })
  }

  // Limit to 3 affirmations
  return affirmations.slice(0, 3)
}

/**
 * Get a single affirmation with Gita context
 */
export function getAffirmationWithWisdom(category: string): { affirmation: string; gitaWisdom: string } {
  const affirmations = AFFIRMATION_TEMPLATES[category as keyof typeof AFFIRMATION_TEMPLATES] ||
    AFFIRMATION_TEMPLATES.selfWorth
  const affirmation = affirmations[Math.floor(Math.random() * affirmations.length)]

  const gitaWisdoms = [
    "The Gita reminds us: 'You have the right to perform your duties, but you are not entitled to the fruits of your actions.'",
    "Lord Krishna teaches: 'The soul is never born and never dies. It is eternal, unchanging, and beyond destruction.'",
    "From the Gita: 'When your mind is steady and no longer disturbed by the flow of sense objects, you will achieve yoga.'",
    "Krishna says: 'I am the beginning, middle, and end of all beings. I am the wisdom of the wise.'",
    "The Bhagavad Gita offers: 'Those who see the same Self in everyone, and everyone in the Self, they see truly.'"
  ]

  return {
    affirmation,
    gitaWisdom: gitaWisdoms[Math.floor(Math.random() * gitaWisdoms.length)]
  }
}
