/**
 * Karma Problem Types - Real-Life Problem to Karmic Path Resolution
 *
 * Type definitions for mapping real-life problems/situations to
 * karmic paths for transformation through the Karma Reset system.
 */

import type { KarmicPathKey } from './karma-reset.types'

/** Life problem category keys */
export type ProblemCategoryKey =
  | 'relationship_conflict'
  | 'work_career'
  | 'self_worth'
  | 'family_tensions'
  | 'anxiety_health'
  | 'loss_grief'
  | 'betrayal_injustice'
  | 'spiritual_crisis'

/** Shad-Ripu (six inner enemies) that fuel problems */
export type ShadRipu =
  | 'kama'      // Desire/Lust
  | 'krodha'    // Anger
  | 'lobha'     // Greed
  | 'moha'      // Delusion/Attachment
  | 'mada'      // Ego/Pride
  | 'matsarya'  // Envy/Jealousy

/** A specific problem template with karmic path recommendation */
export interface ProblemTemplate {
  id: string
  label: string
  situation_template: string
  feeling_template: string
  shad_ripu: ShadRipu
  primary_path: KarmicPathKey
  secondary_path: KarmicPathKey
  gita_ref: string
  healing_insight: string
  category_key?: string
  category_name?: string
  category_icon?: string
}

/** A category of life problems */
export interface ProblemCategory {
  key: ProblemCategoryKey
  name: string
  sanskrit_name: string
  sanskrit_label: string
  icon: string
  description: string
  color: string
  problem_count: number
}

/** Result of analyzing a situation description */
export interface SituationAnalysis {
  recommended_category: ProblemCategoryKey
  category_name: string
  category_sanskrit: string
  recommended_path: KarmicPathKey
  path_name: string
  path_sanskrit: string
  secondary_path: KarmicPathKey
  confidence: number
  matched_keywords: string[]
  healing_insight: string
  gita_ref: string
  matched_problem: ProblemTemplate | null
  shad_ripu: ShadRipu
}

/** Category icon mapping */
export const CATEGORY_ICONS: Record<string, string> = {
  heart_crack: '\u{1F494}',
  briefcase: '\u{1F4BC}',
  mirror: '\u{1FA9E}',
  home: '\u{1F3E0}',
  brain: '\u{1F9E0}',
  rain: '\u{1F327}\uFE0F',
  shield_broken: '\u{1F6E1}\uFE0F',
  compass: '\u{1F9ED}',
}

/** Problem category display configuration */
export const PROBLEM_CATEGORIES_CONFIG: Array<{
  key: ProblemCategoryKey
  name: string
  sanskrit_label: string
  icon: string
  description: string
  color: string
}> = [
  {
    key: 'relationship_conflict',
    name: 'Relationship Conflicts',
    sanskrit_label: '\u0938\u092E\u094D\u092C\u0928\u094D\u0927 \u0938\u0902\u0918\u0930\u094D\u0937',
    icon: '\u{1F494}',
    description: 'Arguments, misunderstandings, hurt feelings with loved ones',
    color: 'from-rose-500/20 to-pink-600/20',
  },
  {
    key: 'work_career',
    name: 'Work & Career',
    sanskrit_label: '\u0915\u0930\u094D\u092E \u0915\u094D\u0937\u0947\u0924\u094D\u0930',
    icon: '\u{1F4BC}',
    description: 'Workplace conflicts, career anxiety, professional setbacks',
    color: 'from-blue-500/20 to-indigo-600/20',
  },
  {
    key: 'self_worth',
    name: 'Self-Worth & Identity',
    sanskrit_label: '\u0906\u0924\u094D\u092E \u0917\u094C\u0930\u0935',
    icon: '\u{1FA9E}',
    description: 'Self-doubt, imposter syndrome, low confidence',
    color: 'from-amber-500/20 to-yellow-600/20',
  },
  {
    key: 'family_tensions',
    name: 'Family & Parents',
    sanskrit_label: '\u0915\u0941\u091F\u0941\u092E\u094D\u092C \u0915\u0937\u094D\u091F',
    icon: '\u{1F3E0}',
    description: 'Parent-child conflicts, family expectations, generational wounds',
    color: 'from-orange-500/20 to-amber-600/20',
  },
  {
    key: 'anxiety_health',
    name: 'Anxiety & Mental Health',
    sanskrit_label: '\u091A\u093F\u0928\u094D\u0924\u093E \u0930\u094B\u0917',
    icon: '\u{1F9E0}',
    description: 'Anxiety, depression, overthinking, burnout',
    color: 'from-violet-500/20 to-purple-600/20',
  },
  {
    key: 'loss_grief',
    name: 'Loss & Grief',
    sanskrit_label: '\u0936\u094B\u0915 \u0935\u093F\u0937\u093E\u0926',
    icon: '\u{1F327}\uFE0F',
    description: 'Death, separation, end of relationships, loss of purpose',
    color: 'from-slate-500/20 to-gray-600/20',
  },
  {
    key: 'betrayal_injustice',
    name: 'Betrayal & Injustice',
    sanskrit_label: '\u0935\u093F\u0936\u094D\u0935\u093E\u0938\u0918\u093E\u0924',
    icon: '\u{1F6E1}\uFE0F',
    description: 'Being betrayed, cheated, wronged, or facing injustice',
    color: 'from-red-500/20 to-rose-600/20',
  },
  {
    key: 'spiritual_crisis',
    name: 'Spiritual Crisis',
    sanskrit_label: '\u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0938\u0902\u0915\u091F',
    icon: '\u{1F9ED}',
    description: 'Questioning faith, existential dread, feeling disconnected',
    color: 'from-indigo-500/20 to-violet-600/20',
  },
]
