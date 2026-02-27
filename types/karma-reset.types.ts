/**
 * Karma Reset Types - Deep Karmic Transformation System
 *
 * Type definitions for MindVibe's deep karma reset, strictly grounded
 * in Bhagavad Gita wisdom with 10 karmic paths and 7-phase transformation.
 */

/** All 10 Gita-aligned karmic path keys */
export type KarmicPathKey =
  | 'kshama'         // Forgiveness (BG 16.3)
  | 'satya'          // Truth (BG 17.15)
  | 'shanti'         // Peace (BG 2.66)
  | 'atma_kshama'    // Self-Forgiveness (BG 6.5)
  | 'seva'           // Selfless Amends (BG 3.19)
  | 'ahimsa'         // Non-Harm (BG 16.2)
  | 'daya'           // Compassion (BG 6.29)
  | 'tyaga'          // Letting Go (BG 18.66)
  | 'tapas'          // Committed Change (BG 17.14)
  | 'shraddha'       // Trust Rebuilding (BG 17.3)

/** Legacy repair type (backward compatibility) */
export type RepairType = 'apology' | 'clarification' | 'calm_followup'

/** Reset flow step identifiers - expanded for deep reset */
export type ResetStep =
  | 'input'
  | 'path_selection'
  | 'breathing'
  | 'deep_journey'
  | 'verse_wisdom'
  | 'sadhana'
  | 'complete'

/** Gita verse with full Sanskrit and translations */
export interface GitaVerse {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  english: string
  hindi: string
}

/** Karmic path display data */
export interface KarmicPath {
  key: KarmicPathKey
  name: string
  sanskrit_name: string
  description: string
  gita_principle: string
  karmic_teaching: string
  guna_analysis: string
  themes: string[]
}

/** Single phase in the 7-phase karma reset journey */
export interface PhaseGuidance {
  phase: number
  name: string
  sanskrit_name: string
  english_name: string
  icon: string
  guidance: string
}

/** Deep reset guidance with all 7 phases */
export interface DeepResetGuidance {
  phases: PhaseGuidance[]
  sadhana: string[]
  core_verse: GitaVerse
  supporting_verses: Array<{
    chapter: number
    verse: number
    key_teaching: string
  }>
}

/** KIAAN structured 4-part reset plan response (legacy) */
export interface KiaanResetResponse {
  breathingLine: string
  rippleSummary: string
  repairAction: string
  forwardIntention: string
}

/** KIAAN metadata with Five Pillar compliance */
export interface KiaanDeepMetadata {
  verses_used: number
  verses: Array<{
    verse_id: string
    chapter: number
    verse_number: number
    sanskrit: string
    transliteration: string
    english: string
    hindi: string
    theme: string
    score: number
  }>
  validation_passed: boolean
  validation_score: number
  five_pillar_score: number
  compliance_level: string
  pillars_met: number
  gita_terms_found: string[]
  wisdom_context: string
}

/** Complete deep karma reset API response */
export interface DeepKarmaResetApiResponse {
  karmic_path: KarmicPath
  deep_guidance: DeepResetGuidance
  reset_guidance: KiaanResetResponse
  kiaan_metadata: KiaanDeepMetadata
  meta: {
    request_id: string
    processing_time_ms: number
    model_used: string
    kiaan_enhanced: boolean
    deep_reset_version: string
    phases_count: number
    karmic_paths_available: number
  }
}

/** Available karmic paths list response */
export interface KarmicPathsResponse {
  paths: Array<{
    key: string
    name: string
    sanskrit_name: string
    description: string
    repair_type_legacy: string
  }>
  total: number
  phases: Array<{
    phase: number
    name: string
    sanskrit_name: string
    english_name: string
    description: string
    icon: string
    purpose: string
  }>
  phases_count: number
}

/** Karma reset input payload */
export interface KarmaResetPayload {
  situation: string
  feeling: string
  repair_type: KarmicPathKey | RepairType
}

/** Legacy API response (backward compat) */
export interface KarmaResetApiResponse {
  status: 'success' | 'partial_success' | 'error'
  reset_guidance?:
    | KiaanResetResponse
    | {
        breathing_line?: string
        ripple_summary?: string
        repair_action?: string
        forward_intention?: string
        pauseAndBreathe?: string
        nameTheRipple?: string
        repair?: string
        moveWithIntention?: string
      }
  raw_text?: string
  model: string
  provider: string
}

/** Repair action configuration */
export interface RepairAction {
  label: string
  value: RepairType
  helper: string
}

/** Karmic path display configuration for the frontend */
export interface KarmicPathConfig {
  key: KarmicPathKey
  name: string
  sanskrit_name: string
  icon: string
  description: string
  color: string
}

/** Phase icon mapping */
export const PHASE_ICONS: Record<string, string> = {
  eye: '\u{1F441}\uFE0F',
  sparkles: '\u2728',
  wind: '\u{1F32C}\uFE0F',
  droplets: '\u{1F4A7}',
  heart: '\u{1F49A}',
  flame: '\u{1F525}',
  book_open: '\u{1F4D6}',
}

/** All 10 karmic paths with display configuration */
export const KARMIC_PATHS_CONFIG: KarmicPathConfig[] = [
  {
    key: 'kshama',
    name: 'Kshama',
    sanskrit_name: '\u0915\u094D\u0937\u092E\u093E',
    icon: '\u{1F49A}',
    description: 'The Path of Forgiveness — sincere acknowledgment and heartfelt apology',
    color: 'from-emerald-500/20 to-green-600/20',
  },
  {
    key: 'satya',
    name: 'Satya',
    sanskrit_name: '\u0938\u0924\u094D\u092F',
    icon: '\u{1F54A}\uFE0F',
    description: 'The Path of Truth — gentle clarification with compassionate speech',
    color: 'from-sky-500/20 to-blue-600/20',
  },
  {
    key: 'shanti',
    name: 'Shanti',
    sanskrit_name: '\u0936\u093E\u0928\u094D\u0924\u093F',
    icon: '\u{1F338}',
    description: 'The Path of Peace — restoring calm through equanimity',
    color: 'from-violet-500/20 to-purple-600/20',
  },
  {
    key: 'atma_kshama',
    name: 'Atma Kshama',
    sanskrit_name: '\u0906\u0924\u094D\u092E \u0915\u094D\u0937\u092E\u093E',
    icon: '\u{1F9D8}',
    description: 'The Path of Self-Forgiveness — releasing self-blame through witness consciousness',
    color: 'from-amber-500/20 to-yellow-600/20',
  },
  {
    key: 'seva',
    name: 'Seva',
    sanskrit_name: '\u0938\u0947\u0935\u093E',
    icon: '\u{1F932}',
    description: 'The Path of Selfless Amends — making amends through nishkama karma',
    color: 'from-orange-500/20 to-red-600/20',
  },
  {
    key: 'ahimsa',
    name: 'Ahimsa',
    sanskrit_name: '\u0905\u0939\u093F\u0902\u0938\u093E',
    icon: '\u{1F54A}\uFE0F',
    description: 'The Path of Non-Harm — gentle repair through compassion',
    color: 'from-rose-500/20 to-pink-600/20',
  },
  {
    key: 'daya',
    name: 'Daya',
    sanskrit_name: '\u0926\u092F\u093E',
    icon: '\u{1FAF6}',
    description: 'The Path of Compassion — empathetic reconnection through universal vision',
    color: 'from-teal-500/20 to-cyan-600/20',
  },
  {
    key: 'tyaga',
    name: 'Tyaga',
    sanskrit_name: '\u0924\u094D\u092F\u093E\u0917',
    icon: '\u{1F343}',
    description: 'The Path of Letting Go — releasing attachment to outcomes through surrender',
    color: 'from-lime-500/20 to-green-600/20',
  },
  {
    key: 'tapas',
    name: 'Tapas',
    sanskrit_name: '\u0924\u092A\u0938\u094D',
    icon: '\u{1F525}',
    description: 'The Path of Committed Transformation — deep behavioral change through austerity',
    color: 'from-red-500/20 to-orange-600/20',
  },
  {
    key: 'shraddha',
    name: 'Shraddha',
    sanskrit_name: '\u0936\u094D\u0930\u0926\u094D\u0927\u093E',
    icon: '\u{1F331}',
    description: 'The Path of Trust Rebuilding — consistent, faith-based action over time',
    color: 'from-indigo-500/20 to-blue-600/20',
  },
]

/** Default repair actions (legacy compat) */
export const REPAIR_ACTIONS = [
  {
    label: 'Apology',
    value: 'apology',
    helper: 'Offer a sincere apology that stays brief and grounded.'
  },
  {
    label: 'Clarification',
    value: 'clarification',
    helper: 'Gently clarify what you meant and invite understanding.'
  },
  {
    label: 'Calm follow-up',
    value: 'calm_followup',
    helper: 'Return with a warm note that re-centers the conversation.'
  }
] as const

/** Repair type icon and label mapping (legacy compat) */
export const REPAIR_TYPE_DISPLAY: Record<RepairType, { icon: string; label: string }> = {
  apology: { icon: '\u{1F49A}', label: 'Apology' },
  clarification: { icon: '\u{1F4AC}', label: 'Clarification' },
  calm_followup: { icon: '\u{1F54A}\uFE0F', label: 'Calm Follow-up' },
}

/** Reset step order for deep journey */
export const RESET_STEP_ORDER: ResetStep[] = [
  'input',
  'path_selection',
  'breathing',
  'deep_journey',
  'verse_wisdom',
  'sadhana',
  'complete'
]
