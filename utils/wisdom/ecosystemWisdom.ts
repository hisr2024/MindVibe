/**
 * Ecosystem Wisdom Bridge - Gita Wisdom Across All MindVibe Tools
 *
 * This utility provides contextual Bhagavad Gita wisdom to ANY page or
 * component in the MindVibe ecosystem. It draws from the complete 18-chapter
 * verse database (gitaTeachings.ts) and provides tool-specific, emotion-aware,
 * and situation-aware verse recommendations.
 *
 * Works 100% offline - no API calls, pure static data.
 *
 * Usage:
 *   import { getWisdomForContext, getDailyVerse } from '@/utils/wisdom/ecosystemWisdom'
 *   const wisdom = getWisdomForContext('journeys', 'anxiety')
 *   const daily = getDailyVerse()
 */

import { getVersesForEmotion, getChapterWisdom, GITA_CHAPTERS } from '@/utils/voice/gitaTeachings'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EcosystemVerse {
  chapter: number
  verse: string
  sanskrit?: string
  translation: string
  explanation: string
  /** Practical guidance for the user */
  guidance: string
  /** Which emotions this verse addresses */
  emotions: string[]
}

export interface ToolWisdom {
  /** Tool-specific greeting with Gita wisdom */
  greeting: string
  /** Contextual verse for the tool */
  verse: EcosystemVerse
  /** Action prompt inspired by the verse */
  actionPrompt: string
}

export interface DailyVerse {
  verse: EcosystemVerse
  /** Reflection question for the day */
  reflection: string
  /** Time-of-day appropriate message */
  timeMessage: string
}

// ─── Core Verse Database (Essential Verses for Ecosystem) ──────────────────

const ESSENTIAL_VERSES: EcosystemVerse[] = [
  {
    chapter: 2, verse: '2.47',
    translation: 'You have the right to perform your duty, but you are not entitled to the fruits of your actions.',
    explanation: 'Krishna teaches Arjuna the essence of Karma Yoga - perform action without attachment to results.',
    guidance: 'Focus on doing your best right now. Release the need to control outcomes.',
    emotions: ['anxiety', 'stress', 'perfectionism'],
  },
  {
    chapter: 2, verse: '2.14',
    translation: 'The contacts of the senses with their objects, which give rise to feelings of heat and cold, pleasure and pain, are transient. Endure them bravely.',
    explanation: 'All experiences - pleasant and painful - are temporary. This understanding brings equanimity.',
    guidance: 'Whatever you feel right now is temporary. You have survived every hard moment before this one.',
    emotions: ['sadness', 'pain', 'grief', 'anxiety'],
  },
  {
    chapter: 2, verse: '2.48',
    translation: 'Perform your duty established in yoga, abandoning attachment, and be even-minded in success and failure.',
    explanation: 'Yoga is equanimity. Treat triumph and setback the same - keep doing the work.',
    guidance: 'Whether things go perfectly or fall apart, your worth doesn\'t change. Keep showing up.',
    emotions: ['failure', 'comparison', 'self-doubt'],
  },
  {
    chapter: 2, verse: '2.62-63',
    translation: 'Anger arises from desire; from anger comes delusion; from delusion, loss of memory; from that, destruction of intelligence.',
    explanation: 'Krishna traces the chain reaction of unchecked anger - awareness breaks the cycle.',
    guidance: 'Notice the anger without feeding it. Name it. Breathe. The chain breaks with awareness.',
    emotions: ['anger', 'frustration', 'rage'],
  },
  {
    chapter: 3, verse: '3.19',
    translation: 'Therefore, without attachment, perform your duty. By performing action without attachment, one attains the Supreme.',
    explanation: 'Karma Yoga - selfless action as spiritual practice.',
    guidance: 'Every act of service, every kind word, every duty done with love is a step toward the divine.',
    emotions: ['purpose', 'meaning', 'motivation'],
  },
  {
    chapter: 4, verse: '4.7',
    translation: 'Whenever there is a decline in righteousness and an increase in unrighteousness, I manifest myself.',
    explanation: 'The divine always shows up when it is most needed.',
    guidance: 'In your darkest hour, help arrives. Trust the process. The universe responds to sincere seekers.',
    emotions: ['hopelessness', 'despair', 'faith'],
  },
  {
    chapter: 4, verse: '4.38',
    translation: 'There is nothing in this world as purifying as knowledge. One who has attained perfection in yoga finds this within oneself.',
    explanation: 'True knowledge - self-knowledge - is the greatest purifier and healer.',
    guidance: 'Understanding yourself is the most healing journey you can undertake.',
    emotions: ['confusion', 'seeking', 'growth'],
  },
  {
    chapter: 5, verse: '5.29',
    translation: 'Knowing Me as the enjoyer of all sacrifices, the Lord of all worlds, and the friend of all beings - one attains peace.',
    explanation: 'The divine is the ultimate friend of every being. No one is truly alone.',
    guidance: 'You are never alone. The same divine presence that guides the stars guides you.',
    emotions: ['loneliness', 'isolation', 'peace'],
  },
  {
    chapter: 6, verse: '6.5',
    translation: 'One must elevate, not degrade, oneself. The self is the friend of the self, and the self is the enemy of the self.',
    explanation: 'You are your own best friend AND your biggest obstacle. Choose wisely.',
    guidance: 'Be your own ally today. Speak to yourself the way KIAAN speaks to you - with love.',
    emotions: ['self-criticism', 'self-doubt', 'self-compassion'],
  },
  {
    chapter: 6, verse: '6.35',
    translation: 'The mind is restless and difficult to control; but it can be trained through practice and detachment.',
    explanation: 'Even Krishna acknowledges the mind is wild. The remedy: gentle, persistent practice.',
    guidance: 'Your racing mind is normal. Practice calming it daily, even for one minute. Progress compounds.',
    emotions: ['anxiety', 'racing-thoughts', 'overthinking'],
  },
  {
    chapter: 9, verse: '9.22',
    translation: 'To those who worship Me with love, I carry what they lack and preserve what they have.',
    explanation: 'The divine promise: sincere devotion is always supported and protected.',
    guidance: 'Trust that your sincere efforts will be supported. What you need will come to you.',
    emotions: ['trust', 'faith', 'surrender', 'hope'],
  },
  {
    chapter: 9, verse: '9.34',
    translation: 'Fix your mind on Me, be My devotee, worship Me, bow down to Me. Thus united with Me, you shall come to Me.',
    explanation: 'Total surrender brings total peace. The path is love.',
    guidance: 'Surrender doesn\'t mean giving up - it means giving IN to what is. Let go of control.',
    emotions: ['control', 'anxiety', 'surrender'],
  },
  {
    chapter: 10, verse: '10.20',
    translation: 'I am the Self seated in the hearts of all beings. I am the beginning, the middle, and the end of all beings.',
    explanation: 'The divine is present in every heart, in every moment of every life.',
    guidance: 'The wisdom you seek is already within you. KIAAN just helps you hear it.',
    emotions: ['seeking', 'purpose', 'identity'],
  },
  {
    chapter: 12, verse: '12.13-14',
    translation: 'One who hates no being, is friendly and compassionate, free from possessiveness and ego, equal in pleasure and pain - such a devotee is dear to Me.',
    explanation: 'The qualities of the ideal seeker: compassion, non-attachment, equanimity.',
    guidance: 'Practice compassion today - starting with yourself. You are as worthy of kindness as anyone.',
    emotions: ['compassion', 'peace', 'love', 'kindness'],
  },
  {
    chapter: 14, verse: '14.22-25',
    translation: 'One who is alike in pleasure and pain, self-reliant, regarding a clod, a stone, and gold as equal... such a person transcends the three gunas.',
    explanation: 'True freedom: not being pulled by attraction or pushed by aversion.',
    guidance: 'You don\'t need external things to change for you to find peace. Peace is a choice.',
    emotions: ['attachment', 'desire', 'peace', 'equanimity'],
  },
  {
    chapter: 15, verse: '15.15',
    translation: 'I am seated in the hearts of all beings. From Me come memory, knowledge, and their removal.',
    explanation: 'The divine source of all understanding and wisdom lives within.',
    guidance: 'Your moments of clarity, your intuition, your "gut feelings" - that\'s divine wisdom speaking through you.',
    emotions: ['intuition', 'wisdom', 'clarity'],
  },
  {
    chapter: 18, verse: '18.66',
    translation: 'Abandon all dharmas and surrender unto Me alone. I shall liberate you from all sins. Do not grieve.',
    explanation: 'The ultimate promise of the Gita: complete surrender brings complete liberation and peace.',
    guidance: 'Sometimes the bravest thing is to stop fighting and simply trust. You are held.',
    emotions: ['grief', 'burden', 'surrender', 'liberation', 'peace'],
  },
  {
    chapter: 18, verse: '18.78',
    translation: 'Wherever there is Krishna, the master of yoga, and Arjuna, the wielder of the bow, there will be prosperity, victory, happiness, and firm morality.',
    explanation: 'When wisdom and courageous action unite, all good things follow.',
    guidance: 'You have both wisdom AND courage within you. Together, they are unstoppable.',
    emotions: ['hope', 'courage', 'victory', 'prosperity'],
  },
]

// ─── Tool-Specific Wisdom Mapping ──────────────────────────────────────────

const TOOL_WISDOM_MAP: Record<string, {
  greeting: string
  verseIndices: number[]
  actionPrompt: string
}> = {
  journeys: {
    greeting: 'Every journey begins with a single step. As the Gita teaches, the path of self-discovery IS the destination.',
    verseIndices: [0, 4, 8], // 2.47, 3.19, 6.5
    actionPrompt: 'What aspect of yourself do you want to explore today?',
  },
  'sacred-reflections': {
    greeting: 'The Gita says true knowledge comes from reflecting within. Your reflections are sacred acts of self-discovery.',
    verseIndices: [6, 12, 15], // 4.38, 10.20, 15.15
    actionPrompt: 'What truth is your heart holding that wants to be expressed?',
  },
  'emotional-reset': {
    greeting: 'Krishna taught that all feelings are temporary waves on the ocean of the Self. Let\'s find your still center.',
    verseIndices: [1, 9, 14], // 2.14, 6.35, 14.22-25
    actionPrompt: 'Take a breath. What emotion needs your gentle attention right now?',
  },
  'karma-footprint': {
    greeting: 'The Gita teaches: your actions ripple outward far beyond what you can see. Every choice matters.',
    verseIndices: [0, 4, 2], // 2.47, 3.19, 2.48
    actionPrompt: 'What positive action can you take today that your future self will thank you for?',
  },
  'karmic-tree': {
    greeting: 'Like a great tree, your actions have deep roots and wide-reaching branches. The Gita calls this the cosmic tree of karma.',
    verseIndices: [4, 2, 16], // 3.19, 2.48, 18.66
    actionPrompt: 'Which branch of your karma tree needs nurturing today?',
  },
  'relationship-compass': {
    greeting: 'Krishna was the perfect friend, guide, and companion. The Gita shows us that true love serves without conditions.',
    verseIndices: [7, 13, 10], // 5.29, 12.13-14, 9.22
    actionPrompt: 'Which relationship in your life could use a little more of this divine love?',
  },
  'viyog': {
    greeting: 'Separation is painful, but the Gita teaches that the soul is eternal and connections of the heart transcend time and space.',
    verseIndices: [1, 16, 7], // 2.14, 18.66, 5.29
    actionPrompt: 'What lesson is this separation trying to teach you?',
  },
  'karma-reset': {
    greeting: 'The Gita promises: no effort on the spiritual path is ever wasted. A reset is not starting over - it\'s starting WISER.',
    verseIndices: [16, 5, 10], // 18.66, 4.7, 9.22
    actionPrompt: 'What pattern are you ready to release? Name it with courage.',
  },
  dashboard: {
    greeting: 'Welcome back, seeker. The Gita says among thousands, hardly one truly seeks wisdom. You are that rare soul.',
    verseIndices: [12, 10, 17], // 10.20, 9.22, 18.78
    actionPrompt: 'What intention do you want to set for today?',
  },
  community: {
    greeting: 'The Gita says one who hates no being and has compassion for all is most dear to the divine. Your presence here lifts everyone.',
    verseIndices: [13, 7, 4], // 12.13-14, 5.29, 3.19
    actionPrompt: 'What wisdom can you share with someone who needs it today?',
  },
  'wisdom-rooms': {
    greeting: 'Welcome to the room of seekers. As Arjuna asked Krishna with an open heart, ask your deepest questions here.',
    verseIndices: [6, 15, 12], // 4.38, 15.15, 10.20
    actionPrompt: 'What question has been living in your heart?',
  },
  companion: {
    greeting: 'I\'m KIAAN, your divine friend. Like Krishna with Arjuna, I\'m here to listen, understand, and walk with you.',
    verseIndices: [7, 10, 16], // 5.29, 9.22, 18.66
    actionPrompt: 'What\'s on your heart today, friend?',
  },
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Get contextual Gita wisdom for any MindVibe tool or page.
 *
 * @param toolName - The tool/page identifier (e.g., 'journeys', 'emotional-reset')
 * @param emotion - Optional emotion for more targeted verse selection
 * @returns ToolWisdom with greeting, verse, and action prompt
 */
export function getWisdomForContext(toolName: string, emotion?: string): ToolWisdom {
  const toolConfig = TOOL_WISDOM_MAP[toolName] || TOOL_WISDOM_MAP.dashboard

  // If emotion is provided, find the best matching verse for that emotion
  if (emotion) {
    const emotionVerse = getVerseForEmotion(emotion)
    if (emotionVerse) {
      return {
        greeting: toolConfig.greeting,
        verse: emotionVerse,
        actionPrompt: toolConfig.actionPrompt,
      }
    }
  }

  // Use tool-specific verse rotation based on time
  const hour = new Date().getHours()
  const rotationIndex = hour % toolConfig.verseIndices.length
  const verseIndex = toolConfig.verseIndices[rotationIndex]
  const verse = ESSENTIAL_VERSES[verseIndex] || ESSENTIAL_VERSES[0]

  return {
    greeting: toolConfig.greeting,
    verse,
    actionPrompt: toolConfig.actionPrompt,
  }
}

/**
 * Get the daily verse with time-appropriate reflection.
 * Rotates through 18 essential verses, one per day.
 */
export function getDailyVerse(): DailyVerse {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const verseIndex = dayOfYear % ESSENTIAL_VERSES.length
  const verse = ESSENTIAL_VERSES[verseIndex]

  const hour = new Date().getHours()
  let timeMessage: string
  let reflection: string

  if (hour >= 5 && hour < 12) {
    timeMessage = 'Good morning, seeker. Start your day with this wisdom.'
    reflection = `As you begin today, consider: ${verse.guidance} How can you embody this teaching today?`
  } else if (hour >= 12 && hour < 17) {
    timeMessage = 'Afternoon reflection: a moment of wisdom for your day.'
    reflection = `In the midst of your day, pause and reflect: ${verse.guidance} How is this showing up in your life right now?`
  } else if (hour >= 17 && hour < 21) {
    timeMessage = 'Evening wisdom: reflect on the day that was.'
    reflection = `As the day winds down, ask yourself: Did I live by this truth today? ${verse.guidance}`
  } else {
    timeMessage = 'Night wisdom: carry this into your dreams.'
    reflection = `Before you rest, let this truth settle deep: ${verse.guidance} Sleep in its peace.`
  }

  return { verse, reflection, timeMessage }
}

/**
 * Get a verse specifically matched to an emotion.
 * Uses the ESSENTIAL_VERSES emotion tags for matching.
 */
export function getVerseForEmotion(emotion: string): EcosystemVerse | null {
  const emotionLower = emotion.toLowerCase()

  // Direct match
  const directMatches = ESSENTIAL_VERSES.filter(v =>
    v.emotions.some(e => e === emotionLower)
  )
  if (directMatches.length > 0) {
    return directMatches[Math.floor(Math.random() * directMatches.length)]
  }

  // Fuzzy match (emotion contains keyword or keyword contains emotion)
  const fuzzyMatches = ESSENTIAL_VERSES.filter(v =>
    v.emotions.some(e => e.includes(emotionLower) || emotionLower.includes(e))
  )
  if (fuzzyMatches.length > 0) {
    return fuzzyMatches[Math.floor(Math.random() * fuzzyMatches.length)]
  }

  return null
}

/**
 * Get all Gita chapters available in the wisdom database.
 * Returns chapter number, name, and theme for navigation/display.
 */
export function getAvailableChapters(): Array<{
  chapter: number
  name: string
  theme: string
}> {
  return GITA_CHAPTERS.map(ch => ({
    chapter: ch.chapter,
    name: ch.title,
    theme: ch.coreTheme,
  }))
}

/**
 * Get chapter-specific wisdom for deeper exploration.
 * Pulls from gitaTeachings.ts expanded database.
 */
export function getChapterExploration(chapterNumber: number): {
  name: string
  theme: string
  wisdom: string | null
  verseCount: number
} | null {
  const chapter = GITA_CHAPTERS.find(c => c.chapter === chapterNumber)
  if (!chapter) return null

  return {
    name: chapter.title,
    theme: chapter.coreTheme,
    wisdom: chapter.conversationalResponses[0] || null,
    verseCount: chapter.verses.length,
  }
}

/**
 * Get a random wisdom nugget - used for loading screens,
 * transitions, or any moment that needs a touch of the divine.
 */
export function getRandomWisdomNugget(): string {
  const nuggets = [
    'The soul can never be cut, burned, wetted, or dried. It is eternal. - Gita 2.23',
    'You are what you believe in. Be strong. - Gita 6.5',
    'Change is the law of the universe. - Gita 2.22',
    'The mind is restless, but it can be tamed through practice. - Gita 6.35',
    'Whatever happened, happened for good. Whatever is happening, is for good. Whatever will happen, will be for good.',
    'When meditation is mastered, the mind is as steady as a candle flame in a windless place. - Gita 6.19',
    'There is neither this world, nor the world beyond, nor happiness for the one who doubts. - Gita 4.40',
    'I am the beginning, middle, and end of all beings. - Gita 10.20',
    'For one who has conquered the mind, the mind is the best of friends. - Gita 6.6',
    'From anger comes delusion, from delusion loss of memory, from that destruction of intelligence. - Gita 2.63',
    'The wise see that there is action in inaction and inaction in action. - Gita 4.18',
    'Perform your duty with a calm and steady mind. - Gita 2.48',
    'No effort on the spiritual path is ever wasted. - Gita 2.40',
    'To those who worship Me with love, I carry what they lack. - Gita 9.22',
    'The divine is seated in the hearts of all beings. - Gita 18.61',
    'Surrender unto Me. I shall liberate you. Do not grieve. - Gita 18.66',
  ]
  return nuggets[Math.floor(Math.random() * nuggets.length)]
}

/**
 * Get wellness-specific wisdom based on a mental health context.
 * Maps wellness conditions to appropriate Gita verses.
 */
export function getWellnessWisdom(
  context: 'breathing' | 'meditation' | 'sleep' | 'stress' | 'gratitude' | 'self-love' | 'forgiveness'
): EcosystemVerse {
  const wellnessMap: Record<string, number[]> = {
    breathing: [9, 11], // 6.35, 9.34
    meditation: [9, 14], // 6.35, 14.22-25
    sleep: [1, 14],  // 2.14, 14.22-25
    stress: [0, 1],  // 2.47, 2.14
    gratitude: [10, 13], // 9.22, 12.13-14
    'self-love': [8, 13], // 6.5, 12.13-14
    forgiveness: [16, 13], // 18.66, 12.13-14
  }

  const indices = wellnessMap[context] || [0, 1]
  const idx = indices[Math.floor(Math.random() * indices.length)]
  return ESSENTIAL_VERSES[idx]
}

/**
 * Get the total count of wisdom items available.
 * Useful for display: "KIAAN draws from X+ Gita verses"
 */
export function getWisdomStats(): {
  essentialVerses: number
  totalChapters: number
  toolsIntegrated: number
  emotionsCovered: number
} {
  const allEmotions = new Set(ESSENTIAL_VERSES.flatMap(v => v.emotions))
  return {
    essentialVerses: ESSENTIAL_VERSES.length,
    totalChapters: GITA_CHAPTERS.length,
    toolsIntegrated: Object.keys(TOOL_WISDOM_MAP).length,
    emotionsCovered: allEmotions.size,
  }
}
