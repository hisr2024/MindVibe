/**
 * Karma Reset Client Service
 *
 * Client-side service for capturing context from any MindVibe module
 * and generating karma reset guidance with self-reinforcing responses.
 * Calls the existing /api/karma-reset/kiaan/generate backend endpoint.
 */

'use client'

import { apiFetch } from '@/lib/api'
import type {
  KarmicPathKey,
  KarmicPathConfig,
  DeepKarmaResetApiResponse,
} from '@/types/karma-reset.types'
import type {
  KarmaResetContext,
  KarmaResetResult,
} from '@/types/voice-controller.types'

// Re-export for convenience
export type { KarmaResetContext, KarmaResetResult }

/** Map emotion strings to the most appropriate karmic path */
const EMOTION_TO_PATH: Record<string, KarmicPathKey> = {
  guilt: 'kshama',
  shame: 'atma_kshama',
  regret: 'kshama',
  anger: 'shanti',
  anxiety: 'tyaga',
  fear: 'tyaga',
  sadness: 'daya',
  grief: 'daya',
  confusion: 'satya',
  overwhelm: 'shanti',
  loneliness: 'seva',
  betrayal: 'shraddha',
  resentment: 'ahimsa',
}

/** Map emotion strings to shad-ripu (inner enemy) for problem context */
const EMOTION_TO_SHAD_RIPU: Record<string, string> = {
  guilt: 'moha',
  shame: 'moha',
  regret: 'moha',
  anger: 'krodha',
  rage: 'krodha',
  anxiety: 'moha',
  fear: 'moha',
  sadness: 'moha',
  grief: 'moha',
  confusion: 'moha',
  overwhelm: 'moha',
  loneliness: 'moha',
  betrayal: 'krodha',
  resentment: 'krodha',
  jealousy: 'matsarya',
  envy: 'matsarya',
  greed: 'lobha',
  pride: 'mada',
  desire: 'kama',
}

/**
 * Capture context from the current module for karma reset.
 * Assembles all relevant data (source, query, emotion, history).
 */
export function captureContext(
  sourceModule: string,
  userQuery: string,
  emotionalState?: string | null,
  history?: string[],
): KarmaResetContext {
  return {
    sourceModule,
    userQuery,
    emotionalState: emotionalState || null,
    conversationHistory: history || [],
    timestamp: Date.now(),
  }
}

/**
 * Select the most appropriate karmic path based on emotional state.
 * Falls back to 'kshama' (forgiveness) if no match found.
 */
export function selectKarmicPath(emotionalState: string | null): KarmicPathKey {
  if (!emotionalState) return 'kshama'
  const lower = emotionalState.toLowerCase()

  for (const [keyword, path] of Object.entries(EMOTION_TO_PATH)) {
    if (lower.includes(keyword)) return path
  }

  return 'kshama'
}

/**
 * Select the shad-ripu (inner enemy) based on emotional state.
 * Falls back to 'moha' (delusion) if no match found.
 */
export function selectShadRipu(emotionalState: string | null): string {
  if (!emotionalState) return 'moha'
  const lower = emotionalState.toLowerCase()

  for (const [keyword, enemy] of Object.entries(EMOTION_TO_SHAD_RIPU)) {
    if (lower.includes(keyword)) return enemy
  }

  return 'moha'
}

/**
 * Generate karma reset guidance from the backend with self-reinforcing context.
 * Calls /api/karma-reset/kiaan/generate and enriches the response.
 */
export async function generateGuidance(context: KarmaResetContext): Promise<KarmaResetResult> {
  const karmicPath = selectKarmicPath(context.emotionalState)
  const shadRipu = selectShadRipu(context.emotionalState)

  const response = await apiFetch('/api/karma-reset/kiaan/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      situation: context.userQuery,
      feeling: context.emotionalState || 'seeking peace',
      repair_type: karmicPath,
      shad_ripu: shadRipu,
    }),
  })

  if (!response.ok) {
    throw new Error(`Karma reset failed: ${response.status}`)
  }

  const data: DeepKarmaResetApiResponse = await response.json()

  // Build self-reinforcing message that echoes user's own context
  const selfReinforcingMessage = buildSelfReinforcingMessage(context, data)

  return {
    context,
    guidance: data.reset_guidance,
    karmic_path: karmicPath,
    selfReinforcingMessage,
    gitaVerse: data.deep_guidance.core_verse,
    modelUsed: data.meta.model_used,
    nextAction: {
      label: `Continue on the path of ${data.karmic_path.name}`,
      route: '/tools/karma-reset',
    },
  }
}

/**
 * Build a self-reinforcing message that references the user's specific situation.
 * This creates a personal, contextual response rather than generic guidance.
 */
function buildSelfReinforcingMessage(
  context: KarmaResetContext,
  data: DeepKarmaResetApiResponse,
): string {
  const source = context.sourceModule
  const path = data.karmic_path.name
  const emotion = context.emotionalState || 'what you are feeling'

  const templates = [
    `From your reflection in ${source}, I sense ${emotion}. The path of ${path} speaks directly to this — ${data.karmic_path.gita_principle}`,
    `What you shared carries the weight of ${emotion}. ${path} teaches us: ${data.karmic_path.karmic_teaching}`,
    `Your words in ${source} reveal ${emotion}. Through ${path}, the Gita offers: ${data.karmic_path.gita_principle}`,
  ]

  return templates[Math.floor(Math.random() * templates.length)]
}

/**
 * Get all available karmic paths with display configuration.
 * Re-exports the constant for service consumers.
 */
export function getKarmicPaths(): readonly KarmicPathConfig[] {
  // Dynamic import to avoid circular dependency
  const { KARMIC_PATHS_CONFIG } = require('@/types/karma-reset.types')
  return KARMIC_PATHS_CONFIG as readonly KarmicPathConfig[]
}
