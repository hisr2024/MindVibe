/**
 * Next-step suggestion engine.
 *
 * Pure function that returns at most ONE suggestion link based on the
 * current tool, user text, AI text, and session signals.
 *
 * Rules:
 *   VIYOGA  → suggest ARDHA
 *   ARDHA   → suggest KIAAN
 *   COMPASS + high-reactivity keywords → suggest VIYOGA
 *   KIAAN   + practice/training request OR repeated theme ≥2 → suggest JOURNEY
 *   JOURNEY + "trigger happened today" → suggest VIYOGA
 *
 * No network dependency — works fully offline.
 */

export type ToolId = 'viyoga' | 'ardha' | 'kiaan' | 'compass' | 'journey'

export interface SessionSignals {
  /** Map of theme keywords to occurrence counts in this session */
  themeCounts: Record<string, number>
}

export interface SuggestionInput {
  tool: ToolId
  userText?: string
  aiText?: string
  sessionSignals?: SessionSignals
}

export interface Suggestion {
  targetTool: ToolId
  href: string
  labelKey: string
  labelFallback: string
}

/** Keywords that signal high emotional reactivity in Compass context */
const HIGH_REACTIVITY_PATTERN =
  /\b(anger|rage|furious|panic|shaking|can['']t control|out of control)\b/i

/** Keywords that signal the user wants structured practice / training */
const PRACTICE_PATTERN =
  /\b(practice|training|journey|discipline)\b/i

/** Indicates a recent trigger event in a journey context */
const TRIGGER_PATTERN =
  /\btrigger(?:ed)?\b.*?\b(today|happened|just now|right now|this morning|this evening|earlier)\b/i

/**
 * Theme keywords extracted from user text to track session-level repetition.
 * Intentionally broad to catch major emotional themes.
 */
export const THEME_KEYWORDS = [
  'anger',
  'anxiety',
  'relationship',
  'work',
  'family',
  'fear',
  'guilt',
  'sadness',
  'loss',
  'grief',
  'purpose',
  'clarity',
  'control',
] as const

/**
 * Extract theme keywords found in `text`.
 * Returns deduplicated array of matched themes (lowercase).
 */
export function extractThemes(text: string): string[] {
  if (!text) return []
  const lower = text.toLowerCase()
  return THEME_KEYWORDS.filter((kw) => lower.includes(kw))
}

/**
 * Returns at most one next-step suggestion, or null.
 */
export function getNextStepSuggestion(input: SuggestionInput): Suggestion | null {
  const { tool, userText = '', aiText = '', sessionSignals } = input

  // Rule 1: VIYOGA → suggest ARDHA
  if (tool === 'viyoga') {
    return {
      targetTool: 'ardha',
      href: '/ardha',
      labelKey: 'navigation.next_step.explore_ardha',
      labelFallback: 'Explore in Ardha \u2192',
    }
  }

  // Rule 2: ARDHA → suggest KIAAN
  if (tool === 'ardha') {
    return {
      targetTool: 'kiaan',
      href: '/kiaan/chat',
      labelKey: 'navigation.next_step.continue_kiaan',
      labelFallback: 'Continue with KIAAN \u2192',
    }
  }

  // Rule 3: COMPASS + high-reactivity keywords → suggest VIYOGA
  if (tool === 'compass') {
    const combined = `${userText} ${aiText}`
    if (HIGH_REACTIVITY_PATTERN.test(combined)) {
      return {
        targetTool: 'viyoga',
        href: '/viyog',
        labelKey: 'navigation.next_step.stabilize_viyoga',
        labelFallback: 'Stabilize with Viyoga \u2192',
      }
    }
    return null
  }

  // Rule 4: KIAAN + practice/training OR repeated theme ≥ 2
  if (tool === 'kiaan') {
    const combined = `${userText} ${aiText}`
    if (PRACTICE_PATTERN.test(combined)) {
      return {
        targetTool: 'journey',
        href: '/journey-engine',
        labelKey: 'navigation.next_step.enter_journey',
        labelFallback: 'Enter a Journey \u2192',
      }
    }
    if (sessionSignals) {
      const hasRepeatedTheme = Object.values(sessionSignals.themeCounts).some(
        (count) => count >= 2,
      )
      if (hasRepeatedTheme) {
        return {
          targetTool: 'journey',
          href: '/journey-engine',
          labelKey: 'navigation.next_step.enter_journey',
          labelFallback: 'Enter a Journey \u2192',
        }
      }
    }
    return null
  }

  // Rule 5: JOURNEY + trigger happened today → suggest VIYOGA
  if (tool === 'journey') {
    const combined = `${userText} ${aiText}`
    if (TRIGGER_PATTERN.test(combined)) {
      return {
        targetTool: 'viyoga',
        href: '/viyog',
        labelKey: 'navigation.next_step.stabilize_viyoga',
        labelFallback: 'Stabilize with Viyoga \u2192',
      }
    }
    return null
  }

  return null
}
