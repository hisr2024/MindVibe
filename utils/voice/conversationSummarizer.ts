/**
 * Conversation Summarizer + Emotional Journaling
 *
 * After 10+ exchanges, KIAAN can summarize the session's emotional journey,
 * generate a journal entry, and provide session insights. All processing
 * happens locally - no API calls.
 *
 * Implements Items #26 (Emotional journaling AI) and #89 (Conversation summarizer).
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConversationEntry {
  role: 'user' | 'kiaan'
  text: string
  emotion?: string
  timestamp: Date
}

export interface SessionSummary {
  /** Short title for the session */
  title: string
  /** Emotional journey narrative */
  emotionalJourney: string
  /** Key topics discussed */
  topics: string[]
  /** Verses referenced */
  versesShared: string[]
  /** Dominant emotions detected */
  emotions: { emotion: string; count: number }[]
  /** Whether emotional state improved */
  trend: 'improved' | 'stable' | 'needs-attention'
  /** Auto-generated journal entry */
  journalEntry: string
  /** KIAAN's closing wisdom */
  closingWisdom: string
  /** Session duration */
  durationMinutes: number
  /** Total exchanges */
  exchangeCount: number
}

// ─── Emotion Tracking ───────────────────────────────────────────────────────

const POSITIVE_EMOTIONS = ['peace', 'joy', 'hope', 'gratitude', 'love', 'calm', 'clarity']
const NEGATIVE_EMOTIONS = ['anxiety', 'sadness', 'anger', 'fear', 'confusion', 'loneliness', 'guilt']

function categorizeEmotion(emotion: string): 'positive' | 'negative' | 'neutral' {
  const lower = emotion.toLowerCase()
  if (POSITIVE_EMOTIONS.some(e => lower.includes(e))) return 'positive'
  if (NEGATIVE_EMOTIONS.some(e => lower.includes(e))) return 'negative'
  return 'neutral'
}

// ─── Summarizer ─────────────────────────────────────────────────────────────

/**
 * Generate a comprehensive session summary from conversation entries.
 */
export function summarizeConversation(entries: ConversationEntry[]): SessionSummary {
  if (entries.length === 0) {
    return emptySessionSummary()
  }

  const startTime = entries[0].timestamp
  const endTime = entries[entries.length - 1].timestamp
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

  // Count emotions
  const emotionCounts: Record<string, number> = {}
  const emotionTimeline: Array<{ emotion: string; category: string; index: number }> = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (entry.emotion) {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1
      emotionTimeline.push({
        emotion: entry.emotion,
        category: categorizeEmotion(entry.emotion),
        index: i,
      })
    }
  }

  // Determine emotional trend
  const trend = determineEmotionalTrend(emotionTimeline)

  // Extract topics from user messages
  const userMessages = entries.filter(e => e.role === 'user').map(e => e.text)
  const topics = extractTopics(userMessages)

  // Find verse references
  const kiaanMessages = entries.filter(e => e.role === 'kiaan').map(e => e.text)
  const versesShared = extractVerseReferences(kiaanMessages)

  // Sort emotions by frequency
  const emotions = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)

  // Generate narrative
  const emotionalJourney = generateJourneyNarrative(emotionTimeline, entries.length)
  const title = generateTitle(emotions, topics)
  const journalEntry = generateJournalEntry(topics, emotions, trend, versesShared, durationMinutes)
  const closingWisdom = generateClosingWisdom(trend, emotions)

  return {
    title,
    emotionalJourney,
    topics,
    versesShared,
    emotions,
    trend,
    journalEntry,
    closingWisdom,
    durationMinutes,
    exchangeCount: Math.floor(entries.length / 2),
  }
}

function determineEmotionalTrend(
  timeline: Array<{ category: string; index: number }>
): 'improved' | 'stable' | 'needs-attention' {
  if (timeline.length < 3) return 'stable'

  const midpoint = Math.floor(timeline.length / 2)
  const firstHalf = timeline.slice(0, midpoint)
  const secondHalf = timeline.slice(midpoint)

  const firstPositive = firstHalf.filter(e => e.category === 'positive').length / firstHalf.length
  const secondPositive = secondHalf.filter(e => e.category === 'positive').length / secondHalf.length

  if (secondPositive > firstPositive + 0.15) return 'improved'
  if (secondPositive < firstPositive - 0.15) return 'needs-attention'
  return 'stable'
}

function extractTopics(messages: string[]): string[] {
  const topicKeywords: Record<string, string[]> = {
    'relationships': ['love', 'partner', 'friend', 'family', 'marriage', 'breakup', 'relationship'],
    'work': ['job', 'career', 'work', 'boss', 'office', 'project', 'deadline'],
    'health': ['health', 'sleep', 'tired', 'sick', 'pain', 'exercise', 'eating'],
    'self-discovery': ['purpose', 'meaning', 'who am i', 'identity', 'growth', 'change'],
    'spiritual': ['god', 'meditation', 'prayer', 'soul', 'divine', 'faith', 'spiritual'],
    'emotions': ['feeling', 'emotion', 'mood', 'anxiety', 'sad', 'happy', 'angry'],
    'loss': ['lost', 'grief', 'death', 'miss', 'gone', 'passed'],
    'future': ['future', 'worry', 'plan', 'dream', 'goal', 'tomorrow'],
  }

  const combined = messages.join(' ').toLowerCase()
  const found: string[] = []

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(k => combined.includes(k))) {
      found.push(topic)
    }
  }

  return found.length > 0 ? found : ['general conversation']
}

function extractVerseReferences(messages: string[]): string[] {
  const combined = messages.join(' ')
  const versePattern = /Chapter\s+(\d+)(?:,?\s*(?:verse|v\.?)\s*(\d+))?/gi
  const verses: string[] = []
  let match

  while ((match = versePattern.exec(combined)) !== null) {
    verses.push(match[2] ? `${match[1]}.${match[2]}` : `Chapter ${match[1]}`)
  }

  return [...new Set(verses)]
}

function generateTitle(
  emotions: Array<{ emotion: string; count: number }>,
  topics: string[]
): string {
  const topEmotion = emotions[0]?.emotion || 'reflection'
  const topTopic = topics[0] || 'wisdom'
  return `A conversation about ${topTopic} and ${topEmotion}`
}

function generateJourneyNarrative(
  timeline: Array<{ emotion: string; category: string; index: number }>,
  totalEntries: number
): string {
  if (timeline.length === 0) return 'A quiet, reflective conversation.'

  const start = timeline[0]
  const end = timeline[timeline.length - 1]

  if (start.category === 'negative' && end.category === 'positive') {
    return `You began carrying ${start.emotion}, and through our conversation, you found your way to ${end.emotion}. That\'s a beautiful journey.`
  }
  if (start.category === 'positive' && end.category === 'positive') {
    return `You came with ${start.emotion} and left with ${end.emotion}. What a wonderful space to be in.`
  }
  if (start.category === 'negative' && end.category === 'negative') {
    return `You\'re still working through ${end.emotion}, and that\'s okay. Healing isn\'t linear. Every conversation plants a seed.`
  }

  return `Our conversation explored several emotions, from ${start.emotion} to ${end.emotion}. Each feeling was valid and each was honored.`
}

function generateJournalEntry(
  topics: string[],
  emotions: Array<{ emotion: string; count: number }>,
  trend: string,
  verses: string[],
  minutes: number
): string {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const topEmotion = emotions[0]?.emotion || 'reflective'
  const topicList = topics.join(', ')

  let entry = `${date} - Spoke with KIAAN for ${minutes} minute${minutes !== 1 ? 's' : ''}.\n\n`
  entry += `Today I was feeling ${topEmotion}. We talked about ${topicList}. `

  if (verses.length > 0) {
    entry += `KIAAN shared wisdom from Gita ${verses.join(', ')}. `
  }

  if (trend === 'improved') {
    entry += `By the end of our conversation, I felt lighter. Something shifted. `
  } else if (trend === 'needs-attention') {
    entry += `I\'m still processing what we discussed. It\'s okay to sit with difficult feelings. `
  } else {
    entry += `The conversation helped me reflect and understand myself better. `
  }

  entry += `\n\nKey insight: ${getInsightForEmotion(topEmotion)}`

  return entry
}

function getInsightForEmotion(emotion: string): string {
  const insights: Record<string, string> = {
    anxiety: 'My anxiety is my mind trying to protect me from a future that hasn\'t happened yet. I can choose to be present instead.',
    sadness: 'My sadness tells me that something mattered deeply. That\'s not weakness - that\'s love.',
    anger: 'My anger is energy that needs direction, not suppression. I can channel it into change.',
    peace: 'This peace is my natural state. I don\'t have to earn it - I just have to remember it.',
    hope: 'This hope is the light that guides me. I will nurture it with daily practice.',
    confusion: 'My confusion is the beginning of new understanding. I don\'t need all the answers today.',
    love: 'Love is the strongest force in the universe. I will let it guide my actions.',
    gratitude: 'Gratitude transforms what I have into enough. Today, I have enough.',
  }
  return insights[emotion.toLowerCase()] || 'Every conversation with wisdom is a step forward on my journey.'
}

function generateClosingWisdom(
  trend: string,
  emotions: Array<{ emotion: string; count: number }>
): string {
  if (trend === 'improved') {
    return 'Friend, I noticed something beautiful in our conversation: you came in one state and left in a better one. That doesn\'t happen by accident. YOUR willingness to explore, to feel, to be honest - that\'s what created the shift. Remember this feeling. It\'s yours.'
  }
  if (trend === 'needs-attention') {
    return 'Friend, today was heavy, and I want you to know: that\'s okay. Not every conversation needs to end with a resolution. Sometimes just speaking your truth is the healing. I\'m here tomorrow, and the day after, and always. You\'re not alone in this.'
  }
  return 'Another conversation, another seed of wisdom planted. The Gita says no effort on the spiritual path is ever wasted. Everything we discussed today will bear fruit - maybe not tomorrow, but in its own time. Trust the process, dear one.'
}

function emptySessionSummary(): SessionSummary {
  return {
    title: 'A moment of quiet reflection',
    emotionalJourney: 'Sometimes silence speaks louder than words.',
    topics: [],
    versesShared: [],
    emotions: [],
    trend: 'stable',
    journalEntry: 'Today I opened KIAAN but sat in quiet reflection. Even that counts.',
    closingWisdom: 'The Gita honors both speech and silence. Your presence here matters.',
    durationMinutes: 0,
    exchangeCount: 0,
  }
}

/**
 * Check if a conversation is long enough to offer a summary.
 */
export function shouldOfferSummary(messageCount: number): boolean {
  return messageCount >= 10
}
