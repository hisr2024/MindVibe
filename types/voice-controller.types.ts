/**
 * Voice Controller Types
 *
 * Type definitions for the voice-driven navigation and intent classification
 * system that powers KIAAN's universal voice input and ecosystem routing.
 */

import type { KarmicPathKey, GitaVerse, KiaanResetResponse } from './karma-reset.types'

/** Supported intent actions from voice or text input */
export type IntentAction =
  | 'navigate'      // Go to a page/tool
  | 'query'         // Ask KIAAN a question
  | 'karma_reset'   // Invoke karma reset with context
  | 'fetch_data'    // Retrieve information (e.g., verse lookup)
  | 'control'       // Start/stop/pause an action

/** Classified user intent from natural language input */
export interface UserIntent {
  action: IntentAction
  targetTool: string | null
  query: string
  extractedContext: {
    emotion: string | null
    topic: string | null
    entities: string[]
  }
  confidence: number
}

/** Result of voice controller processing an intent */
export interface VoiceControllerResult {
  intent: UserIntent
  route: string | null
  response: string | null
  karmaResetResult: KarmaResetResult | null
  suggestedFollowUp: string | null
}

/** Context captured for karma reset invocations */
export interface KarmaResetContext {
  sourceModule: string
  userQuery: string
  emotionalState: string | null
  conversationHistory: string[]
  timestamp: number
}

/** Result of a karma reset with self-reinforcing guidance */
export interface KarmaResetResult {
  context: KarmaResetContext
  guidance: KiaanResetResponse
  karmic_path: KarmicPathKey
  selfReinforcingMessage: string
  gitaVerse: GitaVerse
  nextAction: {
    label: string
    route: string
  } | null
}
