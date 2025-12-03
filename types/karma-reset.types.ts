/**
 * Karma Reset Types
 * Type definitions for MindVibe Karma Reset Guide
 */

/** Repair type options */
export type RepairType = 'apology' | 'clarification' | 'calm_followup'

/** KIAAN structured reset response */
export interface KiaanResetResponse {
  pause: string
  ripple: {
    what_happened: string
    impact: string
  }
  repair: {
    type: RepairType
    action: string
  }
  intention: string
}

/** Reset flow step identifiers */
export type ResetStep = 
  | 'input' 
  | 'breathing' 
  | 'pause' 
  | 'ripple' 
  | 'repair' 
  | 'intention' 
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

/** Default repair actions */
export const REPAIR_ACTIONS: RepairAction[] = [
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
]

/** Reset step order for progression */
export const RESET_STEP_ORDER: ResetStep[] = [
  'input', 
  'breathing', 
  'pause', 
  'ripple', 
  'repair', 
  'intention', 
  'complete'
]
