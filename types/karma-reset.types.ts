/**
 * Karma Reset Types
 * Type definitions for MindVibe Karma Reset Guide
 */

/** Repair type options */
export type RepairType = 'apology' | 'clarification' | 'calm_followup'

/** KIAAN structured 4-part reset plan response */
export interface KiaanResetResponse {
  pauseAndBreathe: string
  nameTheRipple: string
  repair: string
  moveWithIntention: string
}

/** Reset flow step identifiers */
export type ResetStep = 
  | 'input' 
  | 'breathing' 
  | 'plan'
  | 'complete'

/** Repair action configuration */
export interface RepairAction {
  label: string
  value: RepairType
  helper: string
}

/** Karma reset input payload */
export interface KarmaResetPayload {
  what_happened: string
  who_felt_it: string
  repair_type: RepairType
}

/** API response for karma reset */
export interface KarmaResetApiResponse {
  status: 'success' | 'partial_success' | 'error'
  reset_guidance?: KiaanResetResponse
  raw_text?: string
  model: string
  provider: string
}

/** Default repair actions - immutable constant */
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

/** Repair type icon and label mapping */
export const REPAIR_TYPE_DISPLAY: Record<RepairType, { icon: string; label: string }> = {
  apology: { icon: '💚', label: 'Apology' },
  clarification: { icon: '💬', label: 'Clarification' },
  calm_followup: { icon: '🕊️', label: 'Calm Follow-up' },
}

/** Reset step order for progression */
export const RESET_STEP_ORDER: ResetStep[] = [
  'input', 
  'breathing', 
  'plan',
  'complete'
]
