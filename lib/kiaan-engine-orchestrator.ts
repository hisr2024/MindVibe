/**
 * KIAAN Engine Orchestrator — Unified Three-Engine Pipeline
 *
 * Runs Guidance, Friend, and Navigation engines in parallel (<100ms total).
 * Produces an instant local response, then decides if OpenAI enhancement is needed.
 *
 * Architecture:
 * User input → Promise.all([Friend, Guidance, Navigation]) → Merged Response
 *           → Instant voice/text response
 *           → Background: OpenAI enhances (1-3s, non-blocking)
 *
 * Power-aware: ultra-low mode runs Friend only; balanced/performance runs all 3.
 */

import { generateLocalResponse, type FriendEngineResult } from '@/lib/kiaan-friend-engine'
import { selectWisdom, getGroundedWisdom, type WisdomResult } from '@/lib/wisdom-core'
import { classifyIntent } from '@/lib/voice-controller'
import type { UserIntent } from '@/types/voice-controller.types'
import { detectToolSuggestion, type ToolSuggestion } from '@/utils/voice/ecosystemNavigator'
import { getPowerMode, type PowerMode } from '@/lib/kiaan-power-manager'
import { engineSyncBus } from '@/lib/kiaan-engine-sync'
import { responseCache } from '@/lib/kiaan-response-cache'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OrchestratorResult {
  // Friend Engine
  friendResponse: FriendEngineResult
  // Guidance Engine
  verseMatch: WisdomResult | null
  wisdomText: string | null
  // Navigation Engine
  intent: UserIntent
  toolSuggestion: ToolSuggestion | null
  // Merged
  localResponse: string
  needsEnhancement: boolean
  processingTimeMs: number
  powerMode: PowerMode
}

// Conversation state tracked across turns
interface ConversationContext {
  turnCount: number
  recentVerseRefs: string[]
  currentPhase: string
  lastMood: string | null
}

const context: ConversationContext = {
  turnCount: 0,
  recentVerseRefs: [],
  currentPhase: 'connect',
  lastMood: null,
}

// ─── Main Orchestrator ──────────────────────────────────────────────────────

/**
 * Process user input through all three engines and return a merged response.
 * Total target: <100ms on-device.
 */
export async function orchestrate(
  userInput: string,
  language: string = 'en',
): Promise<OrchestratorResult> {
  const startTime = performance.now()
  const powerMode = getPowerMode()

  // Check cache first (<5ms)
  const cached = responseCache.get(userInput)
  if (cached) {
    return {
      ...cached,
      processingTimeMs: performance.now() - startTime,
      powerMode,
    }
  }

  context.turnCount++

  // ─── Ultra-low power: Friend Engine only ──────────────────────
  if (powerMode === 'ultra-low') {
    const friendResult = generateLocalResponse(userInput, context.turnCount, context.lastMood ? [context.lastMood] : [], context.recentVerseRefs)
    const result: OrchestratorResult = {
      friendResponse: friendResult,
      verseMatch: null,
      wisdomText: null,
      intent: { action: 'query', targetTool: null, query: userInput, extractedContext: { emotion: friendResult.mood, topic: friendResult.topic, entities: [] }, confidence: 0.5 },
      toolSuggestion: null,
      localResponse: friendResult.response,
      needsEnhancement: false,
      processingTimeMs: performance.now() - startTime,
      powerMode,
    }

    engineSyncBus.publish('mood-detected', { mood: friendResult.mood, intensity: friendResult.mood_intensity })
    return result
  }

  // ─── Balanced/Performance: All 3 engines in parallel ──────────
  const [friendResult, intent, toolSuggestion] = await Promise.all([
    // Engine 1: Friend Engine (<50ms)
    Promise.resolve(generateLocalResponse(userInput, context.turnCount, context.lastMood ? [context.lastMood] : [], context.recentVerseRefs)),
    // Engine 3: Navigation Engine (<5ms)
    Promise.resolve(classifyIntent(userInput)),
    // Engine 3b: Ecosystem tool suggestion (<5ms)
    Promise.resolve(detectToolSuggestion(userInput, undefined)),
  ])

  // Engine 2: Guidance Engine — depends on Friend's mood detection (<20ms)
  let verseMatch: WisdomResult | null = null
  let wisdomText: string | null = null
  const shouldIncludeWisdom = shouldOfferGuidance(friendResult, context)

  if (shouldIncludeWisdom) {
    try {
      verseMatch = selectWisdom(friendResult.mood, friendResult.topic, context.recentVerseRefs)
      if (verseMatch) {
        const grounded = getGroundedWisdom(friendResult.mood, friendResult.topic, context.recentVerseRefs)
        wisdomText = grounded?.wisdom || null
        context.recentVerseRefs.push(verseMatch.verse_ref)
        // Keep last 10 verse refs for variety
        if (context.recentVerseRefs.length > 10) context.recentVerseRefs.shift()
      }
    } catch {
      // Wisdom lookup failed — continue without it
    }
  }

  // ─── Merge responses from all 3 engines ───────────────────────
  const localResponse = mergeResponses(friendResult, wisdomText, toolSuggestion, intent)
  const needsEnhancement = shouldEnhance(friendResult, intent)

  // ─── Publish engine state to sync bus ─────────────────────────
  engineSyncBus.publish('mood-detected', { mood: friendResult.mood, intensity: friendResult.mood_intensity })
  engineSyncBus.publish('intent-classified', { action: intent.action, tool: intent.targetTool })
  if (verseMatch) {
    engineSyncBus.publish('verse-matched', { ref: verseMatch.verse_ref, theme: verseMatch.theme })
  }
  if (toolSuggestion) {
    engineSyncBus.publish('tool-suggested', { tool: toolSuggestion.tool.id, reason: toolSuggestion.reason })
  }

  context.lastMood = friendResult.mood
  context.currentPhase = friendResult.phase

  const result: OrchestratorResult = {
    friendResponse: friendResult,
    verseMatch,
    wisdomText,
    intent,
    toolSuggestion,
    localResponse,
    needsEnhancement,
    processingTimeMs: performance.now() - startTime,
    powerMode,
  }

  // Cache the result for common patterns
  responseCache.set(userInput, result)

  return result
}

// ─── Response Merging ───────────────────────────────────────────────────────

function mergeResponses(
  friend: FriendEngineResult,
  wisdom: string | null,
  tool: ToolSuggestion | null,
  intent: UserIntent,
): string {
  const parts: string[] = []

  // Always include friend's empathetic response
  parts.push(friend.response)

  // Add wisdom if available and appropriate
  if (wisdom) {
    parts.push(wisdom)
  }

  // Add tool suggestion if navigation intent or strong emotional match
  if (intent.action === 'navigate' && tool) {
    parts.push(tool.message)
  } else if (tool && tool.confidence >= 0.7) {
    parts.push(tool.message)
  }

  return parts.join('\n\n')
}

// ─── Decision Functions ─────────────────────────────────────────────────────

/**
 * Should the Guidance Engine offer Gita wisdom?
 * Phase-gated: only in UNDERSTAND/GUIDE/EMPOWER phases (not CONNECT/LISTEN)
 */
function shouldOfferGuidance(friend: FriendEngineResult, ctx: ConversationContext): boolean {
  const guidancePhases = ['understand', 'guide', 'empower']
  if (!guidancePhases.includes(friend.phase)) return false

  // Crisis detected — always offer wisdom for comfort
  if (friend.wisdom_used) return true

  // After 2+ turns, start offering guidance
  return ctx.turnCount >= 2
}

/**
 * Should we send to OpenAI for deeper response?
 * Simple greetings, navigation, and control don't need enhancement.
 */
function shouldEnhance(friend: FriendEngineResult, intent: UserIntent): boolean {
  // Navigation/control intents are fully handled locally
  if (intent.action === 'navigate' || intent.action === 'control') return false

  // Simple greetings don't need enhancement
  if (friend.intent === 'sharing_joy' && friend.mood_intensity < 0.5) return false

  // Deep emotional content benefits from OpenAI's nuance
  if (friend.mood_intensity >= 0.7) return true

  // Crisis always gets enhanced
  if (friend.response.includes('crisis') || friend.response.includes('helpline')) return true

  // Complex philosophical questions
  if (friend.intent === 'asking_question') return true

  // Default: enhance for richer response
  return true
}

/**
 * Reset conversation context (new session)
 */
export function resetOrchestrator(): void {
  context.turnCount = 0
  context.recentVerseRefs = []
  context.currentPhase = 'connect'
  context.lastMood = null
}
