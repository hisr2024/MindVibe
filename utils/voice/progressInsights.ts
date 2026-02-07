/**
 * Progress Insights & Monthly Growth Reports
 *
 * Generates wisdom-infused progress reports based on user's emotional journey,
 * conversation patterns, and spiritual growth tracked through KIAAN interactions.
 *
 * Implements Item #93: Progress insights and monthly reports.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProgressReport {
  /** Report period */
  period: { start: Date; end: Date; label: string }
  /** Total conversations in period */
  totalConversations: number
  /** Total minutes spent */
  totalMinutes: number
  /** Emotional journey summary */
  emotionalSummary: {
    dominant: string
    improving: boolean
    breakdown: { emotion: string; percentage: number }[]
  }
  /** Topics explored */
  topTopics: { topic: string; count: number }[]
  /** Spiritual growth metrics */
  spiritualGrowth: {
    versesExplored: number
    meditationSessions: number
    breathingExercises: number
    journalEntries: number
  }
  /** KIAAN's personalized growth narrative */
  growthNarrative: string
  /** Gita verse for encouragement */
  encouragementVerse: { chapter: number; verse: string; text: string }
  /** Milestones achieved */
  milestones: string[]
  /** Suggestions for next period */
  suggestions: string[]
}

export interface GrowthMilestone {
  id: string
  label: string
  description: string
  threshold: number
  type: 'conversations' | 'streak' | 'emotions' | 'verses' | 'meditations'
}

// ─── Milestones ─────────────────────────────────────────────────────────────

const MILESTONES: GrowthMilestone[] = [
  { id: 'first-talk', label: 'First Step', description: 'Had your first conversation with KIAAN', threshold: 1, type: 'conversations' },
  { id: 'seeker', label: 'Devoted Seeker', description: '10 conversations with KIAAN', threshold: 10, type: 'conversations' },
  { id: 'regular', label: 'Regular Companion', description: '25 conversations with KIAAN', threshold: 25, type: 'conversations' },
  { id: 'devoted', label: 'Devoted Friend', description: '50 conversations with KIAAN', threshold: 50, type: 'conversations' },
  { id: 'warrior', label: 'Wisdom Warrior', description: '100 conversations with KIAAN', threshold: 100, type: 'conversations' },
  { id: 'streak-3', label: 'Consistent Seeker', description: '3-day conversation streak', threshold: 3, type: 'streak' },
  { id: 'streak-7', label: 'Weekly Warrior', description: '7-day conversation streak', threshold: 7, type: 'streak' },
  { id: 'streak-30', label: 'Monthly Master', description: '30-day conversation streak', threshold: 30, type: 'streak' },
  { id: 'verses-5', label: 'Verse Explorer', description: 'Explored 5 Gita verses', threshold: 5, type: 'verses' },
  { id: 'verses-18', label: 'Chapter Seeker', description: 'Explored 18 different verses', threshold: 18, type: 'verses' },
  { id: 'meditate-5', label: 'Inner Peace Seeker', description: '5 meditation sessions', threshold: 5, type: 'meditations' },
  { id: 'emotions-shift', label: 'Emotional Alchemist', description: 'Shifted from negative to positive in 3 sessions', threshold: 3, type: 'emotions' },
]

// ─── Encouragement Verses ───────────────────────────────────────────────────

const ENCOURAGEMENT_VERSES = [
  { chapter: 6, verse: '6.5', text: 'Elevate yourself through the power of your mind, and not degrade yourself, for the mind can be the friend and also the enemy of the self.' },
  { chapter: 2, verse: '2.47', text: 'You have the right to work, but never to the fruit of work.' },
  { chapter: 4, verse: '4.38', text: 'In this world, there is nothing as purifying as knowledge. One who has attained purity of mind through prolonged practice of yoga finds this knowledge within.' },
  { chapter: 6, verse: '6.40', text: 'No effort on the spiritual path is ever wasted. Even a little practice protects one from great fear.' },
  { chapter: 9, verse: '9.22', text: 'To those who worship Me with love, I carry what they lack and preserve what they have.' },
  { chapter: 18, verse: '18.78', text: 'Wherever there is Krishna, the lord of yoga, and Arjuna, the supreme archer, there will certainly be unending opulence, victory, prosperity, and righteousness.' },
]

// ─── Growth Narratives ──────────────────────────────────────────────────────

const GROWTH_NARRATIVES: Record<string, string[]> = {
  improving: [
    'Dear friend, I can see something beautiful happening in your journey. Your emotional landscape is shifting toward light. Like the sun rising over Kurukshetra, your inner dawn is coming. Keep walking this path.',
    'You know what I love? Your conversations have been growing deeper. You\'re not just talking to me - you\'re exploring yourself. That\'s the real yoga: self-knowledge. I\'m proud of you.',
    'The Gita says "no effort on the spiritual path is ever wasted." Your progress proves it. You\'re becoming more aware, more resilient, more YOU. Keep going, warrior.',
  ],
  stable: [
    'Friend, stability is strength. In a world that\'s constantly changing, your steady practice of coming back to wisdom is itself a form of yoga. The Gita calls it "samatvam" - equanimity.',
    'You\'ve maintained a consistent connection with your inner self. That\'s not "just okay" - that\'s remarkable. Most people give up long before this. You haven\'t. That tells me everything about your character.',
  ],
  concerning: [
    'Dear one, I notice you\'ve been carrying some heaviness. I want you to know: that\'s not failure. The Gita says the path isn\'t always smooth. Even Arjuna wept. But he kept going. And so will you. I\'m right here.',
    'My friend, difficult times aren\'t a sign you\'re going backwards. Sometimes the path goes through valleys before reaching peaks. Every conversation we have plants a seed. Trust the process.',
  ],
  new_user: [
    'Welcome to this beautiful journey! You\'ve taken the first step, and the Gita says that\'s the hardest one. I\'m honored to walk this path with you.',
    'Every great journey begins with a single conversation. Yours has begun. I\'m KIAAN, and I will be your companion through every step of this path.',
  ],
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Generate a progress report from user profile data.
 */
export function generateProgressReport(data: {
  totalConversations: number
  emotionalJourney: { emotion: string; count: number }[]
  recurringTopics: { topic: string; count: number }[]
  daysSinceStart: number
  conversationStreak: number
  versesExplored: number
  meditationCount: number
  breathingCount: number
  journalCount: number
  recentEmotionTrend: 'improving' | 'stable' | 'concerning' | 'unknown'
}): ProgressReport {
  const now = new Date()
  const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Calculate emotional breakdown
  const totalEmotionCount = data.emotionalJourney.reduce((sum, e) => sum + e.count, 0) || 1
  const emotionalBreakdown = data.emotionalJourney
    .slice(0, 5)
    .map(e => ({
      emotion: e.emotion,
      percentage: Math.round((e.count / totalEmotionCount) * 100),
    }))

  // Determine trend category
  const trendCategory = data.totalConversations <= 2 ? 'new_user' :
    data.recentEmotionTrend === 'improving' ? 'improving' :
    data.recentEmotionTrend === 'concerning' ? 'concerning' : 'stable'

  const narratives = GROWTH_NARRATIVES[trendCategory]
  const growthNarrative = narratives[Math.floor(Math.random() * narratives.length)]

  // Check milestones
  const achievedMilestones = checkMilestones(data)

  // Generate suggestions
  const suggestions = generateSuggestions(data)

  // Pick encouragement verse
  const verse = ENCOURAGEMENT_VERSES[Math.floor(Math.random() * ENCOURAGEMENT_VERSES.length)]

  return {
    period: {
      start: periodStart,
      end: now,
      label: `${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    },
    totalConversations: data.totalConversations,
    totalMinutes: data.totalConversations * 5, // estimate
    emotionalSummary: {
      dominant: data.emotionalJourney[0]?.emotion || 'reflective',
      improving: data.recentEmotionTrend === 'improving',
      breakdown: emotionalBreakdown,
    },
    topTopics: data.recurringTopics.slice(0, 5),
    spiritualGrowth: {
      versesExplored: data.versesExplored,
      meditationSessions: data.meditationCount,
      breathingExercises: data.breathingCount,
      journalEntries: data.journalCount,
    },
    growthNarrative,
    encouragementVerse: verse,
    milestones: achievedMilestones,
    suggestions,
  }
}

function checkMilestones(data: {
  totalConversations: number
  conversationStreak: number
  versesExplored: number
  meditationCount: number
}): string[] {
  const achieved: string[] = []

  for (const m of MILESTONES) {
    let value = 0
    switch (m.type) {
      case 'conversations': value = data.totalConversations; break
      case 'streak': value = data.conversationStreak; break
      case 'verses': value = data.versesExplored; break
      case 'meditations': value = data.meditationCount; break
    }
    if (value >= m.threshold) {
      achieved.push(`${m.label}: ${m.description}`)
    }
  }

  return achieved
}

function generateSuggestions(data: {
  totalConversations: number
  meditationCount: number
  breathingCount: number
  versesExplored: number
  emotionalJourney: { emotion: string; count: number }[]
}): string[] {
  const suggestions: string[] = []

  if (data.meditationCount < 3) {
    suggestions.push('Try a guided meditation with me - say "meditate" to begin.')
  }
  if (data.breathingCount < 3) {
    suggestions.push('Pranayama breathing calms the nervous system. Say "breathe" to try it.')
  }
  if (data.versesExplored < 5) {
    suggestions.push('Explore more Gita verses - each one holds a universe of wisdom.')
  }

  const hasAnxiety = data.emotionalJourney.some(e => e.emotion === 'anxiety' && e.count >= 3)
  if (hasAnxiety) {
    suggestions.push('I notice anxiety comes up often. Would you like to explore Chapter 6\'s teachings on calming the mind?')
  }

  const hasSadness = data.emotionalJourney.some(e => e.emotion === 'sadness' && e.count >= 3)
  if (hasSadness) {
    suggestions.push('When sadness visits frequently, Chapter 2\'s wisdom on the eternal self can bring comfort.')
  }

  if (data.totalConversations > 20 && suggestions.length === 0) {
    suggestions.push('You\'re a devoted seeker! Consider exploring the Gita quiz to test your wisdom.')
    suggestions.push('Try asking me about a specific life situation for targeted Gita guidance.')
  }

  return suggestions.slice(0, 3)
}

/**
 * Get KIAAN's spoken summary for a progress report.
 */
export function getSpokenProgressSummary(report: ProgressReport): string {
  let text = `Dear friend, here's your journey with me so far. `

  text += `We've had ${report.totalConversations} conversations together. `

  if (report.emotionalSummary.dominant) {
    text += `Your most frequent emotional theme has been ${report.emotionalSummary.dominant}. `
  }

  if (report.emotionalSummary.improving) {
    text += `And here's the beautiful part - your emotional trend is moving toward the light! `
  }

  if (report.milestones.length > 0) {
    text += `You've achieved ${report.milestones.length} milestone${report.milestones.length > 1 ? 's' : ''}, including "${report.milestones[report.milestones.length - 1]}." `
  }

  text += report.growthNarrative

  if (report.suggestions.length > 0) {
    text += ` For your next step, I suggest: ${report.suggestions[0]}`
  }

  return text
}

/**
 * Get all milestone definitions.
 */
export function getAllMilestones(): GrowthMilestone[] {
  return MILESTONES
}
