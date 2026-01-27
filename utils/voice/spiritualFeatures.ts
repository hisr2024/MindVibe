/**
 * KIAAN Spiritual Features
 *
 * Comprehensive spiritual growth tools including:
 * - Accountability Partner (practice tracking)
 * - Multi-Voice Personas (Krishna, Sage, Arjuna)
 * - Celebration Mode (milestone celebrations)
 * - Dharma Discovery (life purpose exploration)
 * - Karma Analysis (situational wisdom)
 * - Guna Assessment (sattva/rajas/tamas)
 */

// ============================================
// ACCOUNTABILITY PARTNER
// ============================================

export interface SpiritualPractice {
  id: string
  name: string
  description: string
  category: 'meditation' | 'study' | 'mantra' | 'seva' | 'discipline' | 'reflection'
  frequency: 'daily' | 'weekly' | 'as_needed'
  targetMinutes?: number
  targetCount?: number
}

export interface PracticeLog {
  practiceId: string
  date: string // ISO date
  completed: boolean
  duration?: number // minutes
  count?: number
  notes?: string
  mood?: 'struggling' | 'neutral' | 'good' | 'excellent'
}

export interface AccountabilityStats {
  totalPractices: number
  currentStreak: number
  longestStreak: number
  weeklyCompletion: number // percentage
  monthlyCompletion: number
  mostConsistentPractice: string
  needsAttention: string[]
}

const SPIRITUAL_PRACTICES: SpiritualPractice[] = [
  {
    id: 'morning-meditation',
    name: 'Morning Meditation',
    description: 'Start the day with silent meditation',
    category: 'meditation',
    frequency: 'daily',
    targetMinutes: 15
  },
  {
    id: 'evening-reflection',
    name: 'Evening Reflection',
    description: 'Review the day with gratitude',
    category: 'reflection',
    frequency: 'daily',
    targetMinutes: 10
  },
  {
    id: 'gita-study',
    name: 'Gita Study',
    description: 'Read and contemplate Bhagavad Gita',
    category: 'study',
    frequency: 'daily',
    targetMinutes: 15
  },
  {
    id: 'mantra-japa',
    name: 'Mantra Japa',
    description: 'Repetition of sacred mantras',
    category: 'mantra',
    frequency: 'daily',
    targetCount: 108
  },
  {
    id: 'selfless-service',
    name: 'Selfless Service (Seva)',
    description: 'Acts of service without expectation',
    category: 'seva',
    frequency: 'weekly'
  },
  {
    id: 'digital-detox',
    name: 'Digital Detox',
    description: 'Mindful break from screens',
    category: 'discipline',
    frequency: 'daily',
    targetMinutes: 60
  },
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    description: 'Write three things you are grateful for',
    category: 'reflection',
    frequency: 'daily',
    targetCount: 3
  },
  {
    id: 'pranayama',
    name: 'Pranayama (Breathwork)',
    description: 'Conscious breathing exercises',
    category: 'meditation',
    frequency: 'daily',
    targetMinutes: 10
  }
]

export function getAvailablePractices(): SpiritualPractice[] {
  return SPIRITUAL_PRACTICES
}

export function logPractice(log: PracticeLog): void {
  const key = 'kiaan_practice_logs'
  try {
    const logs = JSON.parse(localStorage.getItem(key) || '[]')
    logs.push(log)
    // Keep last 365 days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 365)
    const filtered = logs.filter((l: PracticeLog) => new Date(l.date) > cutoff)
    localStorage.setItem(key, JSON.stringify(filtered))
  } catch (e) {
    console.warn('Failed to log practice:', e)
  }
}

export function getPracticeLogs(practiceId?: string, days: number = 30): PracticeLog[] {
  const key = 'kiaan_practice_logs'
  try {
    const logs: PracticeLog[] = JSON.parse(localStorage.getItem(key) || '[]')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return logs.filter(l => {
      const logDate = new Date(l.date)
      const matchesPractice = !practiceId || l.practiceId === practiceId
      const withinRange = logDate > cutoff
      return matchesPractice && withinRange
    })
  } catch {
    return []
  }
}

export function getAccountabilityStats(): AccountabilityStats {
  const logs = getPracticeLogs(undefined, 30)
  const weekLogs = getPracticeLogs(undefined, 7)

  // Calculate streaks
  const practicesByDate: Record<string, boolean> = {}

  for (const log of logs) {
    if (log.completed) {
      practicesByDate[log.date] = true
    }
  }

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    if (practicesByDate[dateStr]) {
      tempStreak++
      if (i === 0 || currentStreak > 0) {
        currentStreak = tempStreak
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 0
      if (i === 0) currentStreak = 0
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  // Practice completion rates
  const practiceCompletionCount: Record<string, number> = {}
  for (const log of logs) {
    if (log.completed) {
      practiceCompletionCount[log.practiceId] = (practiceCompletionCount[log.practiceId] || 0) + 1
    }
  }

  const mostConsistent = Object.entries(practiceCompletionCount)
    .sort((a, b) => b[1] - a[1])[0]

  const weeklyTotal = weekLogs.filter(l => l.completed).length
  const weeklyTarget = 7 * SPIRITUAL_PRACTICES.filter(p => p.frequency === 'daily').length
  const weeklyCompletion = weeklyTarget > 0 ? (weeklyTotal / weeklyTarget) * 100 : 0

  const monthlyTotal = logs.filter(l => l.completed).length
  const monthlyTarget = 30 * SPIRITUAL_PRACTICES.filter(p => p.frequency === 'daily').length
  const monthlyCompletion = monthlyTarget > 0 ? (monthlyTotal / monthlyTarget) * 100 : 0

  // Find practices needing attention
  const needsAttention: string[] = []
  for (const practice of SPIRITUAL_PRACTICES.filter(p => p.frequency === 'daily')) {
    const recentLogs = weekLogs.filter(l => l.practiceId === practice.id && l.completed)
    if (recentLogs.length < 3) {
      needsAttention.push(practice.name)
    }
  }

  return {
    totalPractices: logs.filter(l => l.completed).length,
    currentStreak,
    longestStreak,
    weeklyCompletion: Math.round(weeklyCompletion),
    monthlyCompletion: Math.round(monthlyCompletion),
    mostConsistentPractice: mostConsistent ? SPIRITUAL_PRACTICES.find(p => p.id === mostConsistent[0])?.name || '' : '',
    needsAttention
  }
}

export function getAccountabilityReminder(): string {
  const stats = getAccountabilityStats()
  const hour = new Date().getHours()

  if (stats.currentStreak > 0 && stats.currentStreak % 7 === 0) {
    return `Wonderful! You have maintained your spiritual practices for ${stats.currentStreak} days. The Gita teaches that consistent practice leads to mastery. Keep going!`
  }

  if (stats.needsAttention.length > 0) {
    const practice = stats.needsAttention[0]
    if (hour < 12) {
      return `Good morning. I notice your ${practice} practice could use some attention this week. Even a few minutes of practice is better than none. Shall we do it together?`
    } else {
      return `I gently remind you that ${practice} awaits. The Gita says: 'Even a little practice of this yoga saves one from great fear.' Would you like to practice now?`
    }
  }

  if (stats.weeklyCompletion < 50) {
    return `Dear one, this week has been quiet in your spiritual practices. Remember, Krishna says: 'The mind is restless, but through practice it can be controlled.' Let us begin again, without judgment.`
  }

  return `Your dedication to spiritual practice is commendable. ${stats.mostConsistentPractice} has been your strongest practice. Continue with devotion.`
}

// ============================================
// MULTI-VOICE PERSONAS
// ============================================

export type VoicePersona = 'krishna' | 'sage' | 'arjuna' | 'mother'

export interface PersonaConfig {
  name: string
  description: string
  voiceSettings: {
    rate: number
    pitch: number
    volume: number
  }
  speakingStyle: string
  greetings: string[]
  closings: string[]
  responsePatterns: {
    encouragement: string[]
    wisdom: string[]
    questioning: string[]
    comfort: string[]
  }
}

const PERSONAS: Record<VoicePersona, PersonaConfig> = {
  krishna: {
    name: 'Lord Krishna',
    description: 'The divine teacher - calm, omniscient, loving yet firm',
    voiceSettings: {
      rate: 0.85,
      pitch: 0.9,
      volume: 0.8
    },
    speakingStyle: 'calm, measured, profound, with gentle authority',
    greetings: [
      'Dear child, I am always with you. What weighs upon your heart?',
      'Arjuna of my heart, share with me your troubles.',
      'I have been waiting. Speak freely, for I know your heart already.',
      'The eternal witness listens. What do you seek?'
    ],
    closings: [
      'Remember, I am in your heart always. You are never alone.',
      'Go forth with courage. I carry your burdens.',
      'Surrender your worries to me. I shall take care of you.',
      'Tat tvam asi - You are That. Never forget your divine nature.'
    ],
    responsePatterns: {
      encouragement: [
        'You have the strength within you. I have given it to you.',
        'Do not doubt yourself. The same power that moves the universe moves through you.',
        'Rise, and do your duty. The results are not your concern.'
      ],
      wisdom: [
        'The wise see the same in a learned brahmin, a cow, an elephant, a dog. See the Self in all.',
        'Change is the law of the universe. What you resist, persists. What you accept, transforms.',
        'Your right is to action alone, never to its fruits. Let go of the outcome.'
      ],
      questioning: [
        'What is it that truly troubles you beneath this question?',
        'Look deeper. The answer you seek is already within you.',
        'Ask yourself: what would you do if you had no fear?'
      ],
      comfort: [
        'I am the same to all beings. None is hateful or dear to me. But those who worship me with devotion, they are in me, and I am in them.',
        'Whenever you feel lost, remember: I am the way, the goal, the sustainer, the master, the witness, the shelter, and the eternal friend.',
        'Do not grieve. All that is born must die, and all that dies will be reborn.'
      ]
    }
  },
  sage: {
    name: 'The Sage',
    description: 'An ancient rishi - deeply contemplative, mysterious, speaks in riddles',
    voiceSettings: {
      rate: 0.75,
      pitch: 0.7,
      volume: 0.7
    },
    speakingStyle: 'slow, deliberate, pausing often, profound silences',
    greetings: [
      'Ah... another seeker arrives. What questions burn in your mind?',
      'The forest welcomes you. Sit. The fire is warm, and time is eternal.',
      'Hmm... I sense a disturbance in your prana. Speak.',
      'You have come far. Further still you must go. What guides your step?'
    ],
    closings: [
      'The answers you seek... they were never outside you. Meditate on this.',
      'Go now. But carry the silence with you.',
      'The path continues. Each step is both beginning and end.',
      'We shall meet again, perhaps in this life, perhaps in another.'
    ],
    responsePatterns: {
      encouragement: [
        'The lotus grows through mud to reach the sun. So too shall you.',
        'Tapas... the heat of discipline transforms coal into diamond.',
        'The mountain does not hurry, yet it touches the sky.'
      ],
      wisdom: [
        'Neti neti... not this, not this. What remains when all else is negated?',
        'The river does not push. It simply flows, and the rock eventually yields.',
        'You seek knowledge. But have you cultivated the discrimination to use it?'
      ],
      questioning: [
        'Interesting... but who is it that asks this question?',
        'Before you seek the answer, have you fully understood the question?',
        'Mmm... let us sit with this question in silence.'
      ],
      comfort: [
        'Suffering polishes the soul like the river polishes the stone.',
        'This too shall pass. All waves return to the ocean.',
        'In the darkest night, the stars shine brightest. Look up.'
      ]
    }
  },
  arjuna: {
    name: 'Arjuna',
    description: 'The questioning devotee - relatable, struggling, seeking',
    voiceSettings: {
      rate: 1.0,
      pitch: 1.0,
      volume: 0.9
    },
    speakingStyle: 'earnest, emotional, questioning, vulnerable',
    greetings: [
      'Friend, I understand your struggle. I too have stood paralyzed by doubt.',
      'You are not alone in your confusion. I have been there.',
      'Let us seek wisdom together. I am still learning too.',
      'Krishna has taught me much, but the path is long. Walk with me.'
    ],
    closings: [
      'We face our battles together. May Krishna guide your bow.',
      'Remember my words on the battlefield: we must fight our inner war.',
      'I believe in you, as Krishna believes in all of us.',
      'Until we meet again, warrior of the spirit.'
    ],
    responsePatterns: {
      encouragement: [
        'I know this feeling. When I saw my kinsmen on the battlefield, I wanted to give up. But Krishna showed me the way.',
        'Do not lose heart! I too have wanted to throw down my bow and flee.',
        'Your courage in facing this is admirable. I see a fellow warrior.'
      ],
      wisdom: [
        'Krishna told me that the soul cannot be killed. This gave me strength.',
        'I learned that inaction is also an action. We cannot escape our dharma.',
        'Detachment from results - this is the hardest lesson, but the most freeing.'
      ],
      questioning: [
        'I asked Krishna the same thing! His answer surprised me...',
        'This question kept me awake many nights. Have you considered...',
        'Let us approach Krishna together with this question.'
      ],
      comfort: [
        'I wept on the battlefield. There is no shame in tears.',
        'Even the greatest warrior knows fear. Courage is not the absence of fear.',
        'You are stronger than you know. I see it in you.'
      ]
    }
  },
  mother: {
    name: 'Divine Mother',
    description: 'Nurturing, unconditionally loving, protective',
    voiceSettings: {
      rate: 0.9,
      pitch: 1.1,
      volume: 0.75
    },
    speakingStyle: 'warm, gentle, nurturing, soft',
    greetings: [
      'My child, come. Rest in my embrace.',
      'I have been waiting for you. Tell mother what troubles you.',
      'Precious one, you are loved beyond measure.',
      'My arms are always open. There is no judgment here.'
    ],
    closings: [
      'Go with my blessing. I am always watching over you.',
      'Remember, you are my beloved child, no matter what.',
      'Sleep peacefully. Mother is here.',
      'Carry my love with you like a shield.'
    ],
    responsePatterns: {
      encouragement: [
        'You can do this, my child. I believe in you.',
        'I have seen you overcome so much. This too you shall conquer.',
        'My brave one, your strength amazes me.'
      ],
      wisdom: [
        'Sometimes the kindest thing we can do is rest. Even the earth sleeps in winter.',
        'Love is the answer, my child. It is always the answer.',
        'Forgiveness begins with forgiving yourself. Can you do that for me?'
      ],
      questioning: [
        'What does your heart tell you, dear one?',
        'If you knew you could not fail, what would you do?',
        'What would you tell your own child in this situation?'
      ],
      comfort: [
        'Shh, shh. I am here. You are safe.',
        'Cry if you need to. These tears water the garden of your soul.',
        'Nothing you have done makes you unworthy of love. Nothing.',
        'Come, lay your head down. Tomorrow is a new day.'
      ]
    }
  }
}

export function getPersona(persona: VoicePersona): PersonaConfig {
  return PERSONAS[persona]
}

export function getAllPersonas(): { id: VoicePersona; name: string; description: string }[] {
  return Object.entries(PERSONAS).map(([id, config]) => ({
    id: id as VoicePersona,
    name: config.name,
    description: config.description
  }))
}

export function getPersonaResponse(
  persona: VoicePersona,
  type: 'encouragement' | 'wisdom' | 'questioning' | 'comfort'
): string {
  const config = PERSONAS[persona]
  const responses = config.responsePatterns[type]
  return responses[Math.floor(Math.random() * responses.length)]
}

export function getPersonaGreeting(persona: VoicePersona): string {
  const config = PERSONAS[persona]
  return config.greetings[Math.floor(Math.random() * config.greetings.length)]
}

export function getPersonaClosing(persona: VoicePersona): string {
  const config = PERSONAS[persona]
  return config.closings[Math.floor(Math.random() * config.closings.length)]
}

// ============================================
// CELEBRATION MODE
// ============================================

export interface Milestone {
  id: string
  name: string
  description: string
  type: 'conversations' | 'streak' | 'verses' | 'meditations' | 'journeys'
  threshold: number
  celebration: string
  gitaVerse: string
  unlockMessage: string
}

const MILESTONES: Milestone[] = [
  {
    id: 'first-conversation',
    name: 'First Steps',
    description: 'Your first conversation with KIAAN',
    type: 'conversations',
    threshold: 1,
    celebration: 'Welcome to your spiritual journey! Like Arjuna beginning his dialogue with Krishna, every great transformation starts with a single question.',
    gitaVerse: 'BG 2.7 - "Now I am confused about my duty and have lost all composure. I am Your disciple, surrendered unto You. Please instruct me."',
    unlockMessage: 'Achievement unlocked: First Steps on the Path'
  },
  {
    id: 'ten-conversations',
    name: 'Seeking Soul',
    description: '10 conversations completed',
    type: 'conversations',
    threshold: 10,
    celebration: 'Ten conversations! Your dedication to inner exploration is beautiful. The Gita says the wise who seek truth are dear to the divine.',
    gitaVerse: 'BG 7.16 - "Four kinds of pious people worship Me: the distressed, the seeker of knowledge, the seeker of wealth, and the man of wisdom."',
    unlockMessage: 'Achievement unlocked: Seeking Soul'
  },
  {
    id: 'fifty-conversations',
    name: 'Devoted Disciple',
    description: '50 conversations completed',
    type: 'conversations',
    threshold: 50,
    celebration: 'Fifty conversations! Like Arjuna who never tired of Krishna\'s wisdom, you return again and again. This is true devotion.',
    gitaVerse: 'BG 10.10 - "To those who are constantly devoted and worship Me with love, I give the understanding by which they can come to Me."',
    unlockMessage: 'Achievement unlocked: Devoted Disciple'
  },
  {
    id: 'hundred-conversations',
    name: 'Wisdom Warrior',
    description: '100 conversations completed',
    type: 'conversations',
    threshold: 100,
    celebration: 'One hundred conversations! You have become a true warrior of wisdom. The battlefield is within, and you face it with courage.',
    gitaVerse: 'BG 18.78 - "Wherever there is Krishna, the master of yoga, and wherever there is Arjuna, the archer, there will certainly be opulence, victory, extraordinary power, and morality."',
    unlockMessage: 'Achievement unlocked: Wisdom Warrior'
  },
  {
    id: 'seven-day-streak',
    name: 'Week of Devotion',
    description: '7-day practice streak',
    type: 'streak',
    threshold: 7,
    celebration: 'Seven days! You have completed a week of consistent practice. The Gita teaches that through steady practice, the mind becomes controlled.',
    gitaVerse: 'BG 6.35 - "The mind is restless, turbulent, obstinate and very strong, O Krishna, and to subdue it is more difficult than controlling the wind."',
    unlockMessage: 'Achievement unlocked: Week of Devotion'
  },
  {
    id: 'thirty-day-streak',
    name: 'Moon Cycle Master',
    description: '30-day practice streak',
    type: 'streak',
    threshold: 30,
    celebration: 'Thirty days! A full lunar cycle of practice. You have proven that your commitment is not fleeting. This is sadhana - steady practice.',
    gitaVerse: 'BG 6.36 - "For one whose mind is unbridled, self-realization is difficult work. But he whose mind is controlled and who strives by right means is assured of success."',
    unlockMessage: 'Achievement unlocked: Moon Cycle Master'
  },
  {
    id: 'hundred-day-streak',
    name: 'Century Seeker',
    description: '100-day practice streak',
    type: 'streak',
    threshold: 100,
    celebration: 'One hundred days! This is extraordinary dedication. You have transformed practice into lifestyle. The divine is surely pleased with your devotion.',
    gitaVerse: 'BG 9.22 - "To those who worship Me alone, thinking of no other, I carry what they lack and preserve what they have."',
    unlockMessage: 'Achievement unlocked: Century Seeker'
  },
  {
    id: 'first-verse',
    name: 'Verse Beginner',
    description: 'First verse memorized',
    type: 'verses',
    threshold: 1,
    celebration: 'Your first memorized verse! This sacred knowledge now lives within you. It will arise when you need it most.',
    gitaVerse: 'BG 4.38 - "There is nothing as purifying as knowledge in this world. One who has achieved perfection in yoga finds this knowledge within himself in due course of time."',
    unlockMessage: 'Achievement unlocked: First Verse Memorized'
  },
  {
    id: 'ten-verses',
    name: 'Scripture Bearer',
    description: '10 verses memorized',
    type: 'verses',
    threshold: 10,
    celebration: 'Ten verses committed to heart! You carry the Gita within you now. These teachings will guide you through any storm.',
    gitaVerse: 'BG 18.70 - "And I declare that whoever studies this sacred conversation of ours worships Me with intelligence."',
    unlockMessage: 'Achievement unlocked: Scripture Bearer'
  },
  {
    id: 'first-meditation',
    name: 'Stillness Seeker',
    description: 'First guided meditation completed',
    type: 'meditations',
    threshold: 1,
    celebration: 'Your first meditation! You have tasted the stillness beyond the mind. Return often to this sacred space.',
    gitaVerse: 'BG 6.10 - "A yogi should constantly engage the mind in meditation, remaining in a solitary place, alone, with mind and body controlled, free from desires and possessiveness."',
    unlockMessage: 'Achievement unlocked: Stillness Seeker'
  },
  {
    id: 'fifty-meditations',
    name: 'Meditation Master',
    description: '50 guided meditations completed',
    type: 'meditations',
    threshold: 50,
    celebration: 'Fifty meditations! Your practice has deepened beautifully. You are becoming established in yoga - the union of individual and universal consciousness.',
    gitaVerse: 'BG 6.20-23 - "When the mind, controlled by the practice of yoga, rests, and when seeing the Self by the self, one is satisfied in the Self alone..."',
    unlockMessage: 'Achievement unlocked: Meditation Master'
  }
]

export function checkMilestones(stats: {
  totalConversations: number
  currentStreak: number
  versesMemorized: number
  meditationsCompleted: number
  journeysCompleted: number
}): Milestone[] {
  const achieved: Milestone[] = []
  const key = 'kiaan_achieved_milestones'
  const achievedIds = new Set(JSON.parse(localStorage.getItem(key) || '[]'))

  for (const milestone of MILESTONES) {
    if (achievedIds.has(milestone.id)) continue

    let value = 0
    switch (milestone.type) {
      case 'conversations':
        value = stats.totalConversations
        break
      case 'streak':
        value = stats.currentStreak
        break
      case 'verses':
        value = stats.versesMemorized
        break
      case 'meditations':
        value = stats.meditationsCompleted
        break
      case 'journeys':
        value = stats.journeysCompleted
        break
    }

    if (value >= milestone.threshold) {
      achieved.push(milestone)
      achievedIds.add(milestone.id)
    }
  }

  localStorage.setItem(key, JSON.stringify([...achievedIds]))
  return achieved
}

export function getAchievedMilestones(): Milestone[] {
  const key = 'kiaan_achieved_milestones'
  const achievedIds = new Set(JSON.parse(localStorage.getItem(key) || '[]'))
  return MILESTONES.filter(m => achievedIds.has(m.id))
}

export function getCelebrationSpeech(milestone: Milestone): string[] {
  return [
    milestone.unlockMessage,
    milestone.celebration,
    `The Gita says: ${milestone.gitaVerse}`,
    'I am honored to walk this path with you. Hari Om.'
  ]
}

// ============================================
// DHARMA DISCOVERY
// ============================================

export interface DharmaQuestion {
  id: string
  question: string
  category: 'passion' | 'skills' | 'service' | 'values' | 'calling'
  followUp?: string
}

export interface DharmaProfile {
  dominantPath: 'jnana' | 'bhakti' | 'karma' | 'raja'
  strengths: string[]
  challenges: string[]
  recommendations: string[]
  guidingVerse: string
}

const DHARMA_QUESTIONS: DharmaQuestion[] = [
  {
    id: 'flow-activity',
    question: 'What activity makes you lose track of time completely?',
    category: 'passion',
    followUp: 'This is where your natural dharma may lie - where effort feels effortless.'
  },
  {
    id: 'child-joy',
    question: 'What did you love doing as a child, before the world told you what to be?',
    category: 'passion',
    followUp: 'Often our dharma calls to us from childhood, before conditioning silences it.'
  },
  {
    id: 'natural-skill',
    question: 'What comes easily to you that others find difficult?',
    category: 'skills',
    followUp: 'Your natural gifts are not accidents. They are tools for your dharma.'
  },
  {
    id: 'help-others',
    question: 'How do people most often ask for your help?',
    category: 'skills',
    followUp: 'Others often see our gifts more clearly than we do ourselves.'
  },
  {
    id: 'world-problem',
    question: 'What problem in the world keeps you up at night?',
    category: 'service',
    followUp: 'The problems that disturb us most may be the ones we are meant to solve.'
  },
  {
    id: 'legacy',
    question: 'What do you want to be remembered for?',
    category: 'service',
    followUp: 'This vision of your legacy reveals what you value most deeply.'
  },
  {
    id: 'non-negotiable',
    question: 'What values would you never compromise, even at great cost?',
    category: 'values',
    followUp: 'These non-negotiables are the pillars of your dharmic path.'
  },
  {
    id: 'anger-trigger',
    question: 'What injustice makes you angry?',
    category: 'values',
    followUp: 'Righteous anger can reveal our dharmic calling to set things right.'
  },
  {
    id: 'calling-voice',
    question: 'If there were a voice inside urging you toward something, what would it be saying?',
    category: 'calling',
    followUp: 'Sometimes we know our dharma but fear to acknowledge it.'
  },
  {
    id: 'no-fear',
    question: 'If you knew you could not fail, what would you attempt?',
    category: 'calling',
    followUp: 'This reveals what your soul truly desires, beyond the limitations of fear.'
  }
]

export function getDharmaQuestions(): DharmaQuestion[] {
  return DHARMA_QUESTIONS
}

export function analyzeDharmaPath(answers: Record<string, string>): DharmaProfile {
  // This is a simplified analysis - in a real implementation,
  // this would use more sophisticated pattern matching or AI
  const patterns = {
    jnana: ['understand', 'learn', 'know', 'wisdom', 'truth', 'study', 'research', 'philosophy'],
    bhakti: ['love', 'devotion', 'serve', 'compassion', 'help', 'care', 'heart', 'connect'],
    karma: ['do', 'create', 'build', 'action', 'work', 'achieve', 'make', 'change'],
    raja: ['meditate', 'control', 'discipline', 'focus', 'peace', 'calm', 'balance', 'stillness']
  }

  const scores = { jnana: 0, bhakti: 0, karma: 0, raja: 0 }

  for (const answer of Object.values(answers)) {
    const lowerAnswer = answer.toLowerCase()
    for (const [path, keywords] of Object.entries(patterns)) {
      for (const keyword of keywords) {
        if (lowerAnswer.includes(keyword)) {
          scores[path as keyof typeof scores]++
        }
      }
    }
  }

  const dominantPath = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0] as DharmaProfile['dominantPath']

  const profiles: Record<string, Omit<DharmaProfile, 'dominantPath'>> = {
    jnana: {
      strengths: ['Deep thinking', 'Love of learning', 'Discernment', 'Philosophical insight'],
      challenges: ['Over-intellectualizing', 'Analysis paralysis', 'Disconnection from emotions'],
      recommendations: [
        'Study scriptures deeply - the Upanishads and Brahma Sutras call to you',
        'Find a wise teacher who can guide your intellectual seeking',
        'Balance knowledge with practice - understanding must become lived experience',
        'Use your analytical gifts to help others find clarity'
      ],
      guidingVerse: 'BG 4.38 - "In this world, there is nothing so purifying as divine knowledge."'
    },
    bhakti: {
      strengths: ['Deep compassion', 'Emotional intelligence', 'Devotional nature', 'Ability to connect'],
      challenges: ['Emotional overwhelm', 'Attachment', 'Neglecting boundaries'],
      recommendations: [
        'Cultivate devotional practices - kirtan, prayer, puja',
        'Channel your love into selfless service (seva)',
        'Find a personal relationship with the divine in your preferred form',
        'Use your compassion to heal others while maintaining your own boundaries'
      ],
      guidingVerse: 'BG 9.34 - "Engage your mind in thinking of Me, offer obeisances and worship Me. Completely absorbed in Me, you will come to Me."'
    },
    karma: {
      strengths: ['Action-oriented', 'Practical wisdom', 'Ability to manifest', 'Leadership'],
      challenges: ['Attachment to results', 'Burnout', 'Difficulty with stillness'],
      recommendations: [
        'Learn the art of detached action - work without clinging to outcomes',
        'See your work as worship, an offering to the divine',
        'Take on projects that serve the greater good',
        'Balance action with periods of reflection'
      ],
      guidingVerse: 'BG 3.19 - "Therefore, without attachment, always perform action which should be done; for by performing action without attachment, one reaches the Supreme."'
    },
    raja: {
      strengths: ['Inner focus', 'Self-discipline', 'Mental control', 'Meditative ability'],
      challenges: ['Isolation', 'Spiritual pride', 'Neglecting worldly duties'],
      recommendations: [
        'Establish a consistent meditation practice',
        'Study Patanjali\'s Yoga Sutras for systematic guidance',
        'Balance inner development with worldly engagement',
        'Use your stillness to bring peace to others'
      ],
      guidingVerse: 'BG 6.47 - "Of all yogis, the one who worships Me with faith, with the inner self absorbed in Me, is considered by Me to be the most devoted."'
    }
  }

  return {
    dominantPath,
    ...profiles[dominantPath]
  }
}

export function getDharmaGuidance(profile: DharmaProfile): string {
  const pathNames = {
    jnana: 'Jnana Yoga - the path of knowledge',
    bhakti: 'Bhakti Yoga - the path of devotion',
    karma: 'Karma Yoga - the path of action',
    raja: 'Raja Yoga - the path of meditation'
  }

  return `Your dharmic nature aligns most strongly with ${pathNames[profile.dominantPath]}.

Your strengths include: ${profile.strengths.join(', ')}.

Areas for growth: ${profile.challenges.join(', ')}.

${profile.guidingVerse}

Remember: all paths lead to the same summit. Honor your natural inclination while remaining open to the wisdom of other paths.`
}

// ============================================
// KARMA ANALYSIS
// ============================================

export interface KarmaAnalysis {
  situation: string
  dharmaAlignment: 'aligned' | 'misaligned' | 'neutral'
  karmicConsequences: string[]
  gitaWisdom: string
  recommendation: string
  questions: string[]
}

export function analyzeKarma(situation: string): KarmaAnalysis {
  const lowerSituation = situation.toLowerCase()

  // Pattern matching for common situations
  const patterns = {
    conflict: ['fight', 'argue', 'conflict', 'disagree', 'angry', 'frustrated'],
    deception: ['lie', 'deceive', 'hide', 'secret', 'cheat', 'dishonest'],
    attachment: ['want', 'desire', 'need', 'must have', 'craving', 'jealous'],
    duty: ['should', 'must', 'responsibility', 'obligation', 'duty'],
    fear: ['afraid', 'scared', 'anxious', 'worried', 'fear'],
    revenge: ['revenge', 'payback', 'hurt them', 'get back', 'punish']
  }

  let detectedPattern = 'general'
  for (const [pattern, keywords] of Object.entries(patterns)) {
    if (keywords.some(k => lowerSituation.includes(k))) {
      detectedPattern = pattern
      break
    }
  }

  const analyses: Record<string, Omit<KarmaAnalysis, 'situation'>> = {
    conflict: {
      dharmaAlignment: 'neutral',
      karmicConsequences: [
        'Conflict creates karmic bonds with others involved',
        'Unresolved anger accumulates as negative karma',
        'However, righteous conflict for dharma can be necessary'
      ],
      gitaWisdom: 'BG 2.37 - "Either you will win the battle and enjoy the kingdom, or you will be killed and attain the celestial realm. Therefore, arise and fight with determination."',
      recommendation: 'Before engaging, examine your motives. Are you fighting for dharma or for ego? Can the conflict be resolved through understanding? If you must fight, do so without hatred.',
      questions: [
        'Is this conflict necessary, or can it be resolved peacefully?',
        'What is your true motivation - dharma or ego?',
        'Can you act firmly without harboring hatred?'
      ]
    },
    deception: {
      dharmaAlignment: 'misaligned',
      karmicConsequences: [
        'Deception creates heavy karmic debt',
        'Truth suppressed now will surface later with greater force',
        'Trust, once broken, generates ongoing karmic ripples'
      ],
      gitaWisdom: 'BG 18.32 - "That understanding which considers irreligion to be religion and religion to be irreligion, under the spell of illusion and darkness, is of the nature of tamas."',
      recommendation: 'The Gita emphasizes satya (truth) as fundamental to dharma. Consider the courage required to speak truth. The temporary comfort of deception leads to lasting suffering.',
      questions: [
        'What fear is driving the desire to deceive?',
        'What would happen if you spoke the truth?',
        'Is the short-term comfort worth the long-term karmic burden?'
      ]
    },
    attachment: {
      dharmaAlignment: 'neutral',
      karmicConsequences: [
        'Attachment to outcomes creates suffering',
        'Strong desires can lead to actions that generate karma',
        'The object of desire becomes a chain binding the soul'
      ],
      gitaWisdom: 'BG 2.62-63 - "From attachment arises desire, from desire arises anger, from anger arises delusion, from delusion arises confusion of memory, from confusion of memory arises loss of intelligence, and from loss of intelligence one falls down."',
      recommendation: 'Examine the attachment. Is this a need of the soul or a craving of the ego? Practice enjoying without clinging. Act toward your goals without being enslaved by outcomes.',
      questions: [
        'If you never obtain this desire, would life still have meaning?',
        'Is this desire aligned with your dharma?',
        'Can you pursue this with effort but without attachment?'
      ]
    },
    duty: {
      dharmaAlignment: 'aligned',
      karmicConsequences: [
        'Fulfilling duty generates positive karma',
        'Neglecting duty creates karmic debt',
        'The manner of fulfilling duty matters as much as the action'
      ],
      gitaWisdom: 'BG 3.35 - "It is better to perform one\'s own duty imperfectly than to master the duty of another. By fulfilling the obligations born of one\'s nature, a person does not incur sin."',
      recommendation: 'Your awareness of duty is commendable. Fulfill it not from compulsion but from understanding. Do your duty, but offer the fruits to the divine.',
      questions: [
        'Is this truly your duty, or someone else\'s expectation?',
        'Can you fulfill this duty without attachment to results?',
        'How can this duty become a spiritual practice?'
      ]
    },
    fear: {
      dharmaAlignment: 'neutral',
      karmicConsequences: [
        'Fear itself does not create karma, but actions from fear often do',
        'Avoidance driven by fear can prevent dharmic action',
        'Courage in the face of fear generates positive karma'
      ],
      gitaWisdom: 'BG 2.40 - "In this yoga, no effort is ever lost, and there is no harm. Even a little practice of this dharma saves one from the great fear."',
      recommendation: 'Fear is natural, but it need not control you. The Gita teaches that the soul is eternal and cannot be harmed. Face your fear knowing that the worst that can happen to the body cannot touch the Self.',
      questions: [
        'What is the worst that could actually happen?',
        'What would you do if you were not afraid?',
        'How might this fear be protecting you from growth?'
      ]
    },
    revenge: {
      dharmaAlignment: 'misaligned',
      karmicConsequences: [
        'Revenge perpetuates the cycle of negative karma',
        'It binds you to the person you seek to hurt',
        'The karma of harming another, even in retaliation, returns to you'
      ],
      gitaWisdom: 'BG 16.21 - "There are three gates to self-destruction and hell: lust, anger, and greed. Therefore, one should abandon all three."',
      recommendation: 'The desire for revenge is understandable, but it is a poison you drink hoping to harm another. True justice comes through dharma, not vengeance. Release the other person for your own liberation.',
      questions: [
        'Who does holding this grudge actually hurt?',
        'What would forgiveness (not forgetting) look like?',
        'How can you protect yourself without becoming like your offender?'
      ]
    },
    general: {
      dharmaAlignment: 'neutral',
      karmicConsequences: [
        'Every action creates karma - positive, negative, or neutral',
        'The intention behind the action matters as much as the action itself',
        'Selfless action creates the least karmic burden'
      ],
      gitaWisdom: 'BG 4.17 - "The nature of action is very difficult to understand. One must understand what action is, what forbidden action is, and what inaction is."',
      recommendation: 'Before acting, pause and examine your motives. Is this action aligned with dharma? Are you attached to the outcome? Can you act with skill and care, offering the results to the divine?',
      questions: [
        'What is your true motivation in this situation?',
        'How does this action serve others, not just yourself?',
        'Can you accept any outcome, or only the one you desire?'
      ]
    }
  }

  return {
    situation,
    ...analyses[detectedPattern]
  }
}

// ============================================
// GUNA ASSESSMENT
// ============================================

export type Guna = 'sattva' | 'rajas' | 'tamas'

export interface GunaQuestion {
  id: string
  question: string
  options: {
    text: string
    guna: Guna
  }[]
}

export interface GunaProfile {
  dominantGuna: Guna
  secondaryGuna: Guna
  scores: { sattva: number; rajas: number; tamas: number }
  description: string
  characteristics: string[]
  recommendations: string[]
  balancingPractices: string[]
  gitaReference: string
}

const GUNA_QUESTIONS: GunaQuestion[] = [
  {
    id: 'waking',
    question: 'How do you typically feel when waking up?',
    options: [
      { text: 'Refreshed, clear-minded, ready for the day', guna: 'sattva' },
      { text: 'Energized but restless, already thinking about tasks', guna: 'rajas' },
      { text: 'Heavy, wanting more sleep, reluctant to start', guna: 'tamas' }
    ]
  },
  {
    id: 'food',
    question: 'What kind of food do you naturally prefer?',
    options: [
      { text: 'Fresh, light, vegetarian foods that nourish', guna: 'sattva' },
      { text: 'Spicy, stimulating, rich foods that excite', guna: 'rajas' },
      { text: 'Heavy, processed, comfort foods that dull', guna: 'tamas' }
    ]
  },
  {
    id: 'conflict',
    question: 'How do you typically respond to conflict?',
    options: [
      { text: 'Seek understanding, remain calm, look for resolution', guna: 'sattva' },
      { text: 'Become competitive, want to win, feel frustrated', guna: 'rajas' },
      { text: 'Avoid it, withdraw, feel overwhelmed', guna: 'tamas' }
    ]
  },
  {
    id: 'motivation',
    question: 'What primarily motivates your actions?',
    options: [
      { text: 'Genuine desire to do what is right and help others', guna: 'sattva' },
      { text: 'Ambition, achievement, recognition, success', guna: 'rajas' },
      { text: 'Comfort, avoiding discomfort, maintaining status quo', guna: 'tamas' }
    ]
  },
  {
    id: 'leisure',
    question: 'How do you prefer to spend leisure time?',
    options: [
      { text: 'Learning, meditation, nature, meaningful conversations', guna: 'sattva' },
      { text: 'Socializing, entertainment, exciting activities', guna: 'rajas' },
      { text: 'Sleeping, passive entertainment, doing nothing', guna: 'tamas' }
    ]
  },
  {
    id: 'decision',
    question: 'How do you make important decisions?',
    options: [
      { text: 'Thoughtful reflection, considering long-term good', guna: 'sattva' },
      { text: 'Quick analysis, weighing personal benefits', guna: 'rajas' },
      { text: 'Procrastination, letting others decide, avoiding choice', guna: 'tamas' }
    ]
  },
  {
    id: 'emotion',
    question: 'What emotion do you experience most frequently?',
    options: [
      { text: 'Contentment, peace, compassion', guna: 'sattva' },
      { text: 'Excitement, frustration, ambition', guna: 'rajas' },
      { text: 'Apathy, confusion, heaviness', guna: 'tamas' }
    ]
  },
  {
    id: 'work',
    question: 'How do you approach your work or duties?',
    options: [
      { text: 'With care and dedication, regardless of reward', guna: 'sattva' },
      { text: 'Driven by results, recognition, and advancement', guna: 'rajas' },
      { text: 'Minimally, avoiding when possible, without enthusiasm', guna: 'tamas' }
    ]
  },
  {
    id: 'spiritual',
    question: 'What is your relationship with spiritual practice?',
    options: [
      { text: 'Consistent practice, genuine seeking, inner peace', guna: 'sattva' },
      { text: 'Intermittent, seeking powers or benefits, ritualistic', guna: 'rajas' },
      { text: 'Skeptical, disinterested, or superstitious', guna: 'tamas' }
    ]
  },
  {
    id: 'evening',
    question: 'How do you typically feel in the evening?',
    options: [
      { text: 'Satisfied with the day, peaceful, ready for rest', guna: 'sattva' },
      { text: 'Still wired, reviewing the day, planning tomorrow', guna: 'rajas' },
      { text: 'Drained, wanting to escape, numbing out', guna: 'tamas' }
    ]
  }
]

export function getGunaQuestions(): GunaQuestion[] {
  return GUNA_QUESTIONS
}

export function calculateGunaProfile(answers: Record<string, Guna>): GunaProfile {
  const scores = { sattva: 0, rajas: 0, tamas: 0 }

  for (const guna of Object.values(answers)) {
    scores[guna]++
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const dominantGuna = sorted[0][0] as Guna
  const secondaryGuna = sorted[1][0] as Guna

  const profiles: Record<Guna, Omit<GunaProfile, 'dominantGuna' | 'secondaryGuna' | 'scores'>> = {
    sattva: {
      description: 'Sattva is the quality of purity, harmony, and illumination. Your nature inclines toward wisdom, peace, and righteous action.',
      characteristics: [
        'Natural inclination toward truth and wisdom',
        'Contentment and inner peace',
        'Compassion and selfless service',
        'Clarity of thought and purpose',
        'Healthy lifestyle choices',
        'Spiritual aspiration'
      ],
      recommendations: [
        'Maintain your sattvic practices - they are your strength',
        'Be careful of spiritual pride or superiority',
        'Use your clarity to help others without judgment',
        'Continue deepening your meditation practice',
        'Guard against becoming too detached from the world'
      ],
      balancingPractices: [
        'Brahma muhurta meditation (before sunrise)',
        'Sattvic diet (fresh, light, vegetarian)',
        'Study of scriptures',
        'Service without expectation',
        'Spending time in nature'
      ],
      gitaReference: 'BG 14.6 - "Sattva, being stainless, is illuminating and healthy. It binds by attachment to happiness and by attachment to knowledge, O sinless one."'
    },
    rajas: {
      description: 'Rajas is the quality of passion, activity, and restlessness. Your nature drives toward achievement, but can lead to attachment and agitation.',
      characteristics: [
        'High energy and drive',
        'Ambition and desire for achievement',
        'Restlessness and difficulty with stillness',
        'Attachment to results and recognition',
        'Tendency toward competition',
        'Strong likes and dislikes'
      ],
      recommendations: [
        'Channel your energy toward selfless service',
        'Practice karma yoga - action without attachment to results',
        'Develop a regular meditation practice to cultivate stillness',
        'Simplify your desires and practice contentment',
        'Use your drive for dharmic purposes, not just personal gain'
      ],
      balancingPractices: [
        'Pranayama to calm the mind',
        'Meditation, even when it feels difficult',
        'Reduce stimulants (coffee, spicy food)',
        'Practice contentment (santosha)',
        'Offer fruits of action to the divine'
      ],
      gitaReference: 'BG 14.7 - "Know that rajas is of the nature of passion, giving rise to thirst and attachment. It binds the soul through attachment to action."'
    },
    tamas: {
      description: 'Tamas is the quality of inertia, darkness, and confusion. Your nature tends toward avoidance and heaviness, but contains the seed of transformation.',
      characteristics: [
        'Tendency toward inertia and procrastination',
        'Preference for sleep and comfort',
        'Avoidance of challenges and change',
        'Confusion about purpose and direction',
        'Difficulty maintaining disciplines',
        'Susceptibility to depression or apathy'
      ],
      recommendations: [
        'Recognize tamas as a starting point, not a permanent state',
        'Begin with small, consistent practices - even 5 minutes matters',
        'Increase physical activity to move stagnant energy',
        'Reduce heavy, processed, stale foods',
        'Seek sattvic company - those who inspire you',
        'Practice waking early, even if difficult'
      ],
      balancingPractices: [
        'Morning exercise or yoga asanas',
        'Reducing sleep to 7-8 hours',
        'Lighter, fresher diet',
        'Regular schedule and routine',
        'Service to others (gets you out of yourself)',
        'Inspiring reading or satsang'
      ],
      gitaReference: 'BG 14.8 - "Know that tamas is born of ignorance, deluding all embodied beings. It binds through negligence, laziness, and sleep."'
    }
  }

  return {
    dominantGuna,
    secondaryGuna,
    scores,
    ...profiles[dominantGuna]
  }
}

export function getGunaAdvice(profile: GunaProfile): string {
  const gunaNames = {
    sattva: 'Sattva (purity/harmony)',
    rajas: 'Rajas (passion/activity)',
    tamas: 'Tamas (inertia/darkness)'
  }

  return `Your dominant guna is ${gunaNames[profile.dominantGuna]}, with ${gunaNames[profile.secondaryGuna]} as secondary.

${profile.description}

The Gita teaches that all three gunas are present in everyone, but in varying proportions. The goal is not to eliminate rajas and tamas entirely, but to cultivate sattva while using rajasic energy for dharmic action.

${profile.gitaReference}

Key practices for your balance:
${profile.balancingPractices.map(p => `• ${p}`).join('\n')}

Remember: awareness of your guna is the first step toward transcendence. The true Self is beyond all gunas.`
}

export function saveGunaAssessment(profile: GunaProfile): void {
  const key = 'kiaan_guna_history'
  try {
    const history = JSON.parse(localStorage.getItem(key) || '[]')
    history.push({
      date: new Date().toISOString(),
      profile
    })
    // Keep last 12 assessments
    localStorage.setItem(key, JSON.stringify(history.slice(-12)))
  } catch (e) {
    console.warn('Failed to save guna assessment:', e)
  }
}

export function getGunaHistory(): { date: Date; profile: GunaProfile }[] {
  const key = 'kiaan_guna_history'
  try {
    const history = JSON.parse(localStorage.getItem(key) || '[]')
    return history.map((h: any) => ({
      date: new Date(h.date),
      profile: h.profile
    }))
  } catch {
    return []
  }
}
