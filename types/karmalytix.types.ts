/**
 * KarmaLytix Types
 * Sacred Reflections Analysis engine type definitions.
 * Field names match snake_case API responses (no camelCase conversion middleware).
 */

export interface KarmaScore {
  id: number
  user_id: string
  score_date: string
  emotional_balance: number
  spiritual_growth: number
  consistency: number
  self_awareness: number
  wisdom_integration: number
  overall_score: number
}

export interface KarmaPattern {
  id: number
  pattern_type: 'recurring_emotion' | 'growth_trajectory' | 'stagnation' | 'breakthrough' | 'cycle'
  pattern_name: string
  description: string
  confidence_score: number
  is_active: boolean
  gita_verse_ref?: { chapter: number; verse: number; theme: string }
  supporting_data: Record<string, unknown>
}

export interface KarmaReport {
  id: number
  report_date: string
  report_type: 'weekly' | 'monthly'
  period_start: string
  period_end: string
  karma_dimensions: {
    emotional_balance: number
    spiritual_growth: number
    consistency: number
    self_awareness: number
    wisdom_integration: number
  }
  overall_karma_score: number
  kiaan_insight: string | null
  recommended_verses: Array<{ chapter: number; verse: number; theme: string }>
  patterns_detected: Record<string, unknown>
  comparison_to_previous: {
    overall_delta: number
    dimension_deltas: Record<string, number>
    is_first_report: boolean
  }
}

export interface KarmaDashboard {
  score: KarmaScore
  patterns: KarmaPattern[]
  latest_report: KarmaReport | null
  history: KarmaReport[]
  privacy_note: string
}

export const DIMENSIONS = {
  emotional_balance: { en: 'Emotional Balance', sa: '\u092D\u093E\u0935\u0928\u093E \u0938\u0902\u0924\u0941\u0932\u0928', color: '#06B6D4', icon: '\u{1F30A}' },
  spiritual_growth: { en: 'Spiritual Growth', sa: '\u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0935\u093F\u0915\u093E\u0938', color: '#D4A017', icon: '\u2197' },
  consistency: { en: 'Consistency', sa: '\u0928\u093F\u092F\u092E\u093F\u0924\u0924\u093E', color: '#10B981', icon: '\u{1F56F}' },
  self_awareness: { en: 'Self-Awareness', sa: '\u0906\u0924\u094D\u092E\u091C\u094D\u091E\u093E\u0928', color: '#8B5CF6', icon: '\u{1F441}' },
  wisdom_integration: { en: 'Wisdom Integration', sa: '\u091C\u094D\u091E\u093E\u0928 \u0938\u092E\u0928\u094D\u0935\u092F', color: '#F97316', icon: '\u{1F4D6}' },
} as const

export type DimensionKey = keyof typeof DIMENSIONS

export const PATTERNS = {
  recurring_emotion: { label: 'Recurring Emotion', color: '#06B6D4' },
  growth_trajectory: { label: 'Rising Karma', color: '#10B981' },
  stagnation: { label: 'Steady Plateau', color: '#F59E0B' },
  breakthrough: { label: 'Breakthrough', color: '#D4A017' },
  cycle: { label: 'Cyclical Pattern', color: '#8B5CF6' },
} as const
