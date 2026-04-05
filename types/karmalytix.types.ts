/**
 * KarmaLytix Types
 * Sacred Reflections Analysis engine type definitions.
 */

export interface KarmaScore {
  id: number
  userId: string
  scoreDate: string
  emotionalBalance: number
  spiritualGrowth: number
  consistency: number
  selfAwareness: number
  wisdomIntegration: number
  overallScore: number
}

export interface KarmaPattern {
  id: number
  patternType: 'recurring_emotion' | 'growth_trajectory' | 'stagnation' | 'breakthrough' | 'cycle'
  patternName: string
  description: string
  confidenceScore: number
  isActive: boolean
  gitaVerseRef?: { chapter: number; verse: number; theme: string }
  supportingData: Record<string, unknown>
}

export interface KarmaReport {
  id: number
  reportDate: string
  reportType: 'weekly' | 'monthly'
  periodStart: string
  periodEnd: string
  karmaDimensions: {
    emotionalBalance: number
    spiritualGrowth: number
    consistency: number
    selfAwareness: number
    wisdomIntegration: number
  }
  overallKarmaScore: number
  kiaanInsight: string | null
  recommendedVerses: Array<{ chapter: number; verse: number; theme: string }>
  patternsDetected: Record<string, unknown>
  comparisonToPrevious: {
    overallDelta: number
    dimensionDeltas: Record<string, number>
    isFirstReport: boolean
  }
}

export interface KarmaDashboard {
  score: KarmaScore
  patterns: KarmaPattern[]
  latestReport: KarmaReport | null
  history: KarmaReport[]
  privacyNote: string
}

export const DIMENSIONS = {
  emotionalBalance: { en: 'Emotional Balance', sa: '\u092D\u093E\u0935\u0928\u093E \u0938\u0902\u0924\u0941\u0932\u0928', color: '#06B6D4', icon: '\u{1F30A}' },
  spiritualGrowth: { en: 'Spiritual Growth', sa: '\u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0935\u093F\u0915\u093E\u0938', color: '#D4A017', icon: '\u2197' },
  consistency: { en: 'Consistency', sa: '\u0928\u093F\u092F\u092E\u093F\u0924\u0924\u093E', color: '#10B981', icon: '\u{1F56F}' },
  selfAwareness: { en: 'Self-Awareness', sa: '\u0906\u0924\u094D\u092E\u091C\u094D\u091E\u093E\u0928', color: '#8B5CF6', icon: '\u{1F441}' },
  wisdomIntegration: { en: 'Wisdom Integration', sa: '\u091C\u094D\u091E\u093E\u0928 \u0938\u092E\u0928\u094D\u0935\u092F', color: '#F97316', icon: '\u{1F4D6}' },
} as const

export type DimensionKey = keyof typeof DIMENSIONS

export const PATTERNS = {
  recurring_emotion: { label: 'Recurring Emotion', color: '#06B6D4' },
  growth_trajectory: { label: 'Rising Karma', color: '#10B981' },
  stagnation: { label: 'Steady Plateau', color: '#F59E0B' },
  breakthrough: { label: 'Breakthrough', color: '#D4A017' },
  cycle: { label: 'Cyclical Pattern', color: '#8B5CF6' },
} as const
