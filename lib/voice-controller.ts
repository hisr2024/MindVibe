/**
 * Voice Controller Service - Unified KIAAN Voice Guide Integration
 *
 * Classifies user intent from natural language (voice or text), resolves
 * to ecosystem tool routes, and executes navigation or data actions.
 * Builds on the existing ecosystemNavigator for tool matching.
 *
 * Now integrates with the backend Voice Guide engine (Engine 3) for:
 * - Ecosystem-wide navigation via voice commands
 * - Voice input injection into any KIAAN tool
 * - Always-awake assistant capabilities
 */

'use client'

import {
  detectToolSuggestion,
  ECOSYSTEM_TOOLS,
  type EcosystemTool,
} from '@/utils/voice/ecosystemNavigator'
import type {
  IntentAction,
  UserIntent,
  VoiceControllerResult,
} from '@/types/voice-controller.types'

// ─── Navigation Patterns ──────────────────────────────────────────────────────

/** Direct navigation patterns: "take me to X", "open X", "go to X" */
const NAVIGATION_PATTERNS: Array<{ pattern: RegExp; extractTool: (match: RegExpMatchArray) => string }> = [
  { pattern: /(?:take me to|go to|open|show me|navigate to|switch to)\s+(.+)/i, extractTool: (m) => m[1].trim() },
  { pattern: /^(?:let's|lets)\s+(?:go to|try|use|open)\s+(.+)/i, extractTool: (m) => m[1].trim() },
  { pattern: /^(?:start|begin|launch)\s+(.+)/i, extractTool: (m) => m[1].trim() },
]

/** Tool input injection patterns: "tell ardha that...", "write in journal..." */
const INPUT_INJECTION_PATTERNS: Array<{ pattern: RegExp; extractToolAndContent: (match: RegExpMatchArray) => { tool: string; content: string } }> = [
  {
    pattern: /(?:tell|say to|input to|type in|write in|send to)\s+(\w+)\s+(?:that\s+)?(.+)/i,
    extractToolAndContent: (m) => ({ tool: m[1].trim(), content: m[2].trim() }),
  },
  {
    pattern: /(?:add|put|enter)\s+(?:this\s+)?(?:in|into|to)\s+(\w+)[:]\s*(.+)/i,
    extractToolAndContent: (m) => ({ tool: m[1].trim(), content: m[2].trim() }),
  },
  {
    pattern: /(?:journal|reflect|note)[:]\s*(.+)/i,
    extractToolAndContent: (m) => ({ tool: 'sacred-reflections', content: m[1].trim() }),
  },
]

/** Karma reset trigger patterns */
const KARMA_RESET_PATTERNS = [
  /karma\s*reset/i,
  /reset\s*(?:my\s*)?karma/i,
  /karmic\s*(?:transformation|healing|cleansing)/i,
  /deep\s*reset/i,
]

/** Verse lookup patterns: "read verse 2.47", "what is BG 2.47?" */
const VERSE_PATTERNS = [
  /(?:read|show|what is|explain)\s+(?:verse|bg|gita|bhagavad gita)\s*(\d+)[.:](\d+)/i,
  /(?:bg|gita)\s*(\d+)[.:](\d+)/i,
]

/** Control command patterns */
const CONTROL_PATTERNS: Array<{ pattern: RegExp; command: string }> = [
  { pattern: /^(?:stop|cancel|end|quit|close)/i, command: 'stop' },
  { pattern: /^(?:pause|wait|hold on)/i, command: 'pause' },
  { pattern: /^(?:resume|continue|go on)/i, command: 'resume' },
]

// ─── Emotion Keywords ─────────────────────────────────────────────────────────

const EMOTION_KEYWORDS: Record<string, string[]> = {
  anxiety: ['anxious', 'worried', 'scared', 'nervous', 'panic', 'fearful', 'restless', 'uneasy'],
  sadness: ['sad', 'depressed', 'down', 'unhappy', 'crying', 'grief', 'mourning', 'heartbroken'],
  anger: ['angry', 'furious', 'mad', 'frustrated', 'irritated', 'rage', 'resentful'],
  guilt: ['guilty', 'ashamed', 'regret', 'sorry', 'remorse', 'blame myself'],
  confusion: ['confused', 'lost', 'uncertain', 'don\'t know', 'unsure', 'stuck'],
  loneliness: ['lonely', 'alone', 'isolated', 'nobody', 'no one understands'],
  overwhelm: ['overwhelmed', 'too much', 'can\'t cope', 'breaking down', 'falling apart'],
  hope: ['hopeful', 'better', 'improving', 'optimistic', 'grateful'],
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Classify user intent from a natural language transcript.
 *
 * Priority order:
 * 1. Control commands (stop, pause, resume)
 * 2. Direct navigation ("take me to Ardha")
 * 3. Tool input injection ("tell journal I feel grateful")
 * 4. Karma reset triggers
 * 5. Verse lookup
 * 6. Ecosystem tool suggestion (keyword + emotion matching)
 * 7. General KIAAN query (fallback)
 */
export function classifyIntent(transcript: string, emotion?: string): UserIntent {
  const text = transcript.trim()
  if (!text) {
    return buildIntent('query', null, text, null, null, [], 0)
  }

  const lower = text.toLowerCase()

  // 1. Control commands
  for (const { pattern, command } of CONTROL_PATTERNS) {
    if (pattern.test(lower)) {
      return buildIntent('control', command, text, null, null, [], 0.95)
    }
  }

  // 2. Direct navigation
  for (const { pattern, extractTool } of NAVIGATION_PATTERNS) {
    const match = lower.match(pattern)
    if (match) {
      const toolName = extractTool(match)
      const resolvedTool = resolveToolByName(toolName)
      if (resolvedTool) {
        return buildIntent('navigate', resolvedTool.id, text, emotion || null, null, [], 0.9)
      }
    }
  }

  // 3. Tool input injection (Voice Guide Engine 3 capability)
  for (const { pattern, extractToolAndContent } of INPUT_INJECTION_PATTERNS) {
    const match = lower.match(pattern)
    if (match) {
      const { tool, content } = extractToolAndContent(match)
      const resolvedTool = resolveToolByName(tool)
      if (resolvedTool) {
        return buildIntent('input_to_tool', resolvedTool.id, text, emotion || null, 'voice_input', [content], 0.85)
      }
    }
  }

  // 4. Karma reset
  for (const pattern of KARMA_RESET_PATTERNS) {
    if (pattern.test(lower)) {
      const detectedEmotion = emotion || detectEmotion(lower)
      return buildIntent('karma_reset', 'karma-reset', text, detectedEmotion, null, [], 0.9)
    }
  }

  // 4. Verse lookup
  for (const pattern of VERSE_PATTERNS) {
    const match = lower.match(pattern)
    if (match) {
      return buildIntent('fetch_data', 'gita-library', text, null, 'verse_lookup', [
        `${match[1]}.${match[2]}`,
      ], 0.95)
    }
  }

  // 5. Ecosystem tool suggestion via existing engine
  const detectedEmotion = emotion || detectEmotion(lower)
  const suggestion = detectToolSuggestion(text, detectedEmotion || undefined)

  if (suggestion && suggestion.confidence >= 0.5) {
    return buildIntent(
      'navigate',
      suggestion.tool.id,
      text,
      detectedEmotion,
      suggestion.reason,
      [],
      suggestion.confidence,
    )
  }

  // 6. Fallback: general KIAAN query
  return buildIntent('query', null, text, detectedEmotion, null, [], 0.5)
}

/**
 * Resolve a classified intent to a navigation route + any params.
 */
export function resolveRoute(intent: UserIntent): { route: string; params: Record<string, string> } {
  if (intent.action === 'control') {
    return { route: '', params: { command: intent.targetTool || '' } }
  }

  if (intent.action === 'fetch_data' && intent.targetTool === 'gita-library') {
    const verseRef = intent.extractedContext.entities[0] || ''
    const [chapter, verse] = verseRef.split('.')
    return {
      route: `/kiaan-vibe/gita/${chapter || ''}`,
      params: { chapter: chapter || '', verse: verse || '' },
    }
  }

  // Voice Guide Engine 3: input injection routes to tool with voice_input param
  if (intent.action === 'input_to_tool' && intent.targetTool) {
    const tool = ECOSYSTEM_TOOLS.find((t) => t.id === intent.targetTool)
    if (tool) {
      const content = intent.extractedContext.entities[0] || intent.query
      return {
        route: `${tool.route}?voice_input=${encodeURIComponent(content)}`,
        params: { voice_input: content },
      }
    }
  }

  if (intent.targetTool) {
    const tool = ECOSYSTEM_TOOLS.find((t) => t.id === intent.targetTool)
    if (tool) {
      return { route: tool.route, params: {} }
    }
  }

  // Default: KIAAN chat
  return { route: '/kiaan/chat', params: { query: intent.query } }
}

/**
 * Execute a classified intent: resolve route and build result.
 * Does NOT perform navigation — returns the result for the caller to handle.
 */
export async function executeIntent(intent: UserIntent): Promise<VoiceControllerResult> {
  const { route } = resolveRoute(intent)

  let response: string | null = null
  let suggestedFollowUp: string | null = null

  if (intent.action === 'navigate' && intent.targetTool) {
    const tool = ECOSYSTEM_TOOLS.find((t) => t.id === intent.targetTool)
    if (tool) {
      response = `Opening ${tool.name}...`
      suggestedFollowUp = tool.friendDescription
    }
  } else if (intent.action === 'input_to_tool' && intent.targetTool) {
    // Voice Guide Engine 3: input injection
    const tool = ECOSYSTEM_TOOLS.find((t) => t.id === intent.targetTool)
    if (tool) {
      response = `Sending your input to ${tool.name}...`
      suggestedFollowUp = `Your voice input has been sent to ${tool.name}. Navigate there to see it.`
    }
  } else if (intent.action === 'query') {
    response = null // Let the caller handle KIAAN chat
    suggestedFollowUp = 'Would you like me to suggest a tool for what you are feeling?'
  } else if (intent.action === 'control') {
    response = `${(intent.targetTool || 'action')} acknowledged.`
  }

  return {
    intent,
    route,
    response,
    karmaResetResult: null,
    suggestedFollowUp,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a UserIntent object */
function buildIntent(
  action: IntentAction,
  targetTool: string | null,
  query: string,
  emotion: string | null,
  topic: string | null,
  entities: string[],
  confidence: number,
): UserIntent {
  return {
    action,
    targetTool,
    query,
    extractedContext: { emotion, topic, entities },
    confidence,
  }
}

/** Detect emotion from text using keyword matching */
function detectEmotion(text: string): string | null {
  const lower = text.toLowerCase()
  let bestMatch: { emotion: string; count: number } | null = null

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let count = 0
    for (const keyword of keywords) {
      if (lower.includes(keyword)) count++
    }
    if (count > 0 && (!bestMatch || count > bestMatch.count)) {
      bestMatch = { emotion, count }
    }
  }

  return bestMatch?.emotion || null
}

/** Resolve a spoken tool name to an ecosystem tool */
function resolveToolByName(spoken: string): EcosystemTool | null {
  const normalized = spoken.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()

  // Exact id or name match
  for (const tool of ECOSYSTEM_TOOLS) {
    const toolId = tool.id.toLowerCase()
    const toolName = tool.name.toLowerCase()
    if (normalized === toolId || normalized === toolName) return tool
  }

  // Partial match: tool name contains spoken text or vice versa
  for (const tool of ECOSYSTEM_TOOLS) {
    const toolId = tool.id.toLowerCase().replace(/-/g, ' ')
    const toolName = tool.name.toLowerCase()
    if (
      toolName.includes(normalized) ||
      normalized.includes(toolName) ||
      toolId.includes(normalized) ||
      normalized.includes(toolId)
    ) {
      return tool
    }
  }

  // Alias matching for common spoken names
  const ALIASES: Record<string, string> = {
    'thought reframing': 'ardha',
    'reframe': 'ardha',
    'detachment': 'viyoga',
    'detach': 'viyoga',
    'letting go': 'viyoga',
    'relationship': 'relationship-compass',
    'compass': 'relationship-compass',
    'karma': 'karma-reset',
    'reset': 'karma-reset',
    'journal': 'sacred-reflections',
    'reflections': 'sacred-reflections',
    'chat': 'kiaan-chat',
    'music': 'kiaan-vibe',
    'meditation': 'kiaan-vibe',
    'companion': 'kiaan-companion',
    'friend': 'kiaan-companion',
    'gita': 'gita-library',
    'verses': 'gita-library',
    'journeys': 'journey-engine',
    'emotional reset': 'emotional-reset',
    'footprint': 'karma-footprint',
    'tree': 'karmic-tree',
  }

  for (const [alias, toolId] of Object.entries(ALIASES)) {
    if (normalized.includes(alias)) {
      return ECOSYSTEM_TOOLS.find((t) => t.id === toolId) || null
    }
  }

  return null
}
