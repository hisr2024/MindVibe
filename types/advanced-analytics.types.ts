/**
 * Advanced Analytics Types
 *
 * Type definitions for MindVibe's advanced mood analytics,
 * karmic ripple analysis, and emotional intelligence tracking.
 */

// =============================================================================
// GUNA (QUALITY) TYPES
// =============================================================================

/** The three Gunas from Bhagavad Gita Chapter 14 */
export type Guna = 'sattva' | 'rajas' | 'tamas'

/** Guna balance across all three qualities */
export interface GunaBalance {
  sattva: number // 0-1: Purity, harmony, peace
  rajas: number // 0-1: Passion, activity, restlessness
  tamas: number // 0-1: Inertia, darkness, confusion
}

// =============================================================================
// EMOTION VECTOR TYPES
// =============================================================================

/** Emotional quadrants from Russell's Circumplex Model */
export type EmotionalQuadrant =
  | 'activated_pleasant' // High arousal + positive (joy, excitement)
  | 'activated_unpleasant' // High arousal + negative (anxiety, anger)
  | 'deactivated_pleasant' // Low arousal + positive (calm, content)
  | 'deactivated_unpleasant' // Low arousal + negative (sad, depressed)

/** Multi-dimensional emotion representation */
export interface EmotionVector {
  valence: number // -1 (unpleasant) to +1 (pleasant)
  arousal: number // -1 (deactivated) to +1 (activated)
  intensity: number // 0 (mild) to 1 (intense)
  quadrant: EmotionalQuadrant
  guna: Guna
  distance_from_center: number // Distance from neutral (0-√2)
}

// =============================================================================
// COGNITIVE DISTORTION TYPES
// =============================================================================

/** CBT cognitive distortions */
export type CognitiveDistortion =
  | 'all_or_nothing'
  | 'catastrophizing'
  | 'overgeneralization'
  | 'mind_reading'
  | 'fortune_telling'
  | 'emotional_reasoning'
  | 'should_statements'
  | 'labeling'
  | 'personalization'
  | 'discounting_positive'

/** Readable labels for distortions */
export const DISTORTION_LABELS: Record<CognitiveDistortion, string> = {
  all_or_nothing: 'All-or-Nothing Thinking',
  catastrophizing: 'Catastrophizing',
  overgeneralization: 'Overgeneralization',
  mind_reading: 'Mind Reading',
  fortune_telling: 'Fortune Telling',
  emotional_reasoning: 'Emotional Reasoning',
  should_statements: 'Should Statements',
  labeling: 'Labeling',
  personalization: 'Personalization',
  discounting_positive: 'Discounting the Positive',
}

// =============================================================================
// MOOD ANALYSIS TYPES
// =============================================================================

/** Complete mood analysis result */
export interface MoodAnalysis {
  primary_emotion: string
  secondary_emotions: string[]
  emotion_vector: EmotionVector
  distortions_detected: CognitiveDistortion[]
  distortion_severity: number // 0-1
  life_domains: string[]
  temporal_orientation: 'past' | 'present' | 'future'
  guna_balance: GunaBalance
  recommended_yoga_path: YogaPath
  breathing_protocol: BreathingProtocol
  reset_intensity: 'gentle' | 'moderate' | 'deep'
  analysis_confidence: number // 0-1
}

/** Yoga paths from Bhagavad Gita */
export type YogaPath = 'karma' | 'jnana' | 'bhakti' | 'dhyana'

/** Yoga path readable labels */
export const YOGA_PATH_LABELS: Record<YogaPath, string> = {
  karma: 'Karma Yoga (Path of Action)',
  jnana: 'Jnana Yoga (Path of Knowledge)',
  bhakti: 'Bhakti Yoga (Path of Devotion)',
  dhyana: 'Dhyana Yoga (Path of Meditation)',
}

/** Breathing protocol types */
export type BreathingProtocol = 'calming' | 'energizing' | 'balanced'

// =============================================================================
// KARMIC RIPPLE TYPES
// =============================================================================

/** Timeframe for karmic ripple effects */
export type RippleTimeframe =
  | 'immediate'
  | 'short_term'
  | 'medium_term'
  | 'long_term'
  | 'transgenerational'

/** Single ripple effect */
export interface RippleEffect {
  description: string
  timeframe: RippleTimeframe
  affected_domain: string
  intensity: number // 0-1
  valence: 'positive' | 'negative' | 'neutral'
  guna: Guna
  reversibility: number // 0 (irreversible) to 1 (fully reversible)
}

/** Karmic intent behind an action */
export type KarmicIntent = 'sattvic' | 'rajasic' | 'tamasic'

/** Action type in karmic analysis */
export type ActionType = 'thought' | 'speech' | 'body'

/** Complete karmic chain analysis */
export interface KarmicChain {
  initial_action: string
  action_type: ActionType
  initial_intent: KarmicIntent
  guna_quality: Guna
  ripple_effects: RippleEffect[]
  samskara_impact: string
  vasana_pattern: string
  repair_path: string
  gita_wisdom: string
  nishkama_alternative: string
  total_karma_weight: number // -1 to +1
  reversibility_score: number // 0-1
}

/** Repair action for karmic damage */
export interface RepairAction {
  action_description: string
  action_type: ActionType
  timing: string
  difficulty: number // 0-1
  expected_outcome: string
  gita_support: string
}

/** Complete karmic reset plan */
export interface KarmicResetPlan {
  situation: string
  who_affected: string
  repair_type: string
  mood_analysis: MoodAnalysis | null
  karmic_chain: KarmicChain | null
  breathing_guidance: string
  ripple_acknowledgment: string
  repair_actions: RepairAction[]
  forward_intention: string
  key_verse: string
  mantra: string
  daily_practice: string
}

/** Ripple visualization data for frontend */
export interface RippleVisualizationData {
  center_action: string
  center_intent: KarmicIntent
  center_guna: Guna
  ripple_circles: RippleCircle[]
  total_karma: number
  can_heal: boolean
}

/** Single ripple circle for visualization */
export interface RippleCircle {
  id: string
  radius: number // 1-5
  intensity: number // 0-1
  color: string // Hex color
  label: string
  domain: string
  timeframe: RippleTimeframe
  reversibility: number
}

// =============================================================================
// EMOTIONAL INTELLIGENCE TYPES
// =============================================================================

/** Emotional baseline calculated from history */
export interface EmotionalBaseline {
  mean_valence: number
  mean_arousal: number
  valence_variability: number
  arousal_variability: number
  primary_quadrant: EmotionalQuadrant
  typical_guna_balance: GunaBalance
  data_points: number
  confidence: number
  last_updated: string | null
}

/** Resilience metrics */
export interface ResilienceMetrics {
  average_recovery_time_hours: number
  recovery_consistency: number
  positive_reframe_rate: number
  emotional_regulation_score: number
  expanding_emotional_range: boolean
  decreasing_distortion_frequency: boolean
  improving_guna_balance: boolean
  resilience_score: number // 0-100
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
}

/** Trigger pattern identified from history */
export interface TriggerPattern {
  trigger_description: string
  trigger_domain: string
  resulting_emotions: string[]
  average_intensity: number
  frequency: number
  first_observed: string | null
  last_observed: string | null
  associated_distortions: string[]
  successful_interventions: string[]
}

/** Growth milestone achieved */
export interface GrowthMilestone {
  milestone_type: string
  description: string
  achieved_at: string
  significance: number
}

/** Complete emotional intelligence profile */
export interface EmotionalIntelligenceProfile {
  user_id: string
  baseline: EmotionalBaseline
  resilience: ResilienceMetrics
  trigger_patterns: TriggerPattern[]
  growth_milestones: GrowthMilestone[]
  emotional_journey_summary: string
  days_tracked: number
  total_sessions: number
  focus_areas: string[]
  recommended_practices: string[]
}

/** Deviation from baseline */
export interface BaselineDeviation {
  current_valence: number
  current_arousal: number
  baseline_valence: number
  baseline_arousal: number
  valence_deviation: number
  arousal_deviation: number
  distance_from_baseline: number
  valence_direction: string
  arousal_direction: string
  is_significantly_different: boolean
  baseline_confidence: number
}

// =============================================================================
// GITA-PSYCHOLOGY INTEGRATION TYPES
// =============================================================================

/** Gita concept enum */
export type GitaConcept =
  | 'atman'
  | 'ahamkara'
  | 'sakshi'
  | 'karma'
  | 'nishkama_karma'
  | 'svadharma'
  | 'maya'
  | 'sthitaprajna'
  | 'prasada'
  | 'vairagya'
  | 'abhyasa'
  | 'shraddha'
  | 'sattva'
  | 'rajas'
  | 'tamas'

/** Bridge between psychology and Gita */
export interface PsychologicalBridge {
  psychological_concept: string
  psychological_description: string
  gita_concept: GitaConcept
  gita_explanation: string
  integration_insight: string
  practical_technique: string
  supporting_verses: string[]
}

/** Yoga path guidance */
export interface YogaPathGuidance {
  primary_path: YogaPath
  secondary_path: YogaPath
  rationale: string
  immediate_practice: string
  daily_practice: string
  key_verses: string[]
  mantra: string
}

/** Guna transformation plan */
export interface GunaTransformationPlan {
  current_state: string
  target_state: string
  mechanism: string
  practices: string[]
  gita_wisdom: string
  pitfalls_to_avoid: string[]
  key_verses: string[]
}

/** Complete psychological integration */
export interface PsychologicalIntegration {
  key_insight: string
  distortion_wisdom: PsychologicalBridge[]
  yoga_path_guidance: YogaPathGuidance
  guna_transformation: GunaTransformationPlan
  integrated_practice: {
    morning: string
    during_day: string
    evening: string
    when_triggered: string
  }
  daily_intention: string
}

/** Verse prescription for specific state */
export interface VersePrescription {
  reference: string
  theme: string
  translation: string
  application: string
  practice: string
  psychological_parallel: string
}

// =============================================================================
// ADAPTIVE BREATHING TYPES
// =============================================================================

/** Adaptive breathing pattern */
export interface AdaptiveBreathingPattern {
  name: string
  inhale: number
  hold_in: number
  exhale: number
  hold_out: number
  duration_seconds: number
  narration: string[]
  science: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/** Advanced analysis API response */
export interface AdvancedAnalysisResponse {
  success: boolean
  mood_analysis: MoodAnalysis
  karmic_insight: {
    karmic_pattern: string
    samskara_type: string
    recommended_action: string
    gita_principle: string
    karmic_note?: string
  }
  gita_themes: string[]
  breathing_pattern: AdaptiveBreathingPattern
  psychological_integration: PsychologicalIntegration
}

/** Emotional intelligence profile API response */
export interface ProfileResponse {
  success: boolean
  profile: EmotionalIntelligenceProfile
  current_deviation?: BaselineDeviation
}
