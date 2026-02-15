/**
 * Table-driven unit tests for getNextStepSuggestion engine.
 *
 * Covers all five tool rules, boundary cases, and session-signal logic.
 */

import { describe, it, expect } from 'vitest'
import {
  getNextStepSuggestion,
  extractThemes,
  type SuggestionInput,
  type Suggestion,
} from '@/lib/suggestions/nextStep'

// ---------------------------------------------------------------------------
// getNextStepSuggestion – table-driven
// ---------------------------------------------------------------------------

interface TestCase {
  name: string
  input: SuggestionInput
  expected: Suggestion | null
}

const cases: TestCase[] = [
  // --- Rule 1: VIYOGA → ARDHA (always) ---
  {
    name: 'viyoga always suggests ardha',
    input: { tool: 'viyoga' },
    expected: {
      targetTool: 'ardha',
      href: '/ardha',
      labelKey: 'navigation.next_step.explore_ardha',
      labelFallback: 'Explore in Ardha \u2192',
    },
  },
  {
    name: 'viyoga suggests ardha regardless of text',
    input: { tool: 'viyoga', userText: 'anything', aiText: 'anything' },
    expected: {
      targetTool: 'ardha',
      href: '/ardha',
      labelKey: 'navigation.next_step.explore_ardha',
      labelFallback: 'Explore in Ardha \u2192',
    },
  },

  // --- Rule 2: ARDHA → KIAAN (always) ---
  {
    name: 'ardha always suggests kiaan',
    input: { tool: 'ardha' },
    expected: {
      targetTool: 'kiaan',
      href: '/kiaan/chat',
      labelKey: 'navigation.next_step.continue_kiaan',
      labelFallback: 'Continue with KIAAN \u2192',
    },
  },

  // --- Rule 3: COMPASS + high-reactivity → VIYOGA ---
  {
    name: 'compass with anger in user text suggests viyoga',
    input: { tool: 'compass', userText: 'I feel so much anger towards them' },
    expected: {
      targetTool: 'viyoga',
      href: '/viyog',
      labelKey: 'navigation.next_step.stabilize_viyoga',
      labelFallback: 'Stabilize with Viyoga \u2192',
    },
  },
  {
    name: 'compass with rage in ai text suggests viyoga',
    input: { tool: 'compass', aiText: 'It seems you are feeling rage inside' },
    expected: {
      targetTool: 'viyoga',
      href: '/viyog',
      labelKey: 'navigation.next_step.stabilize_viyoga',
      labelFallback: 'Stabilize with Viyoga \u2192',
    },
  },
  {
    name: 'compass with "can\'t control" suggests viyoga',
    input: { tool: 'compass', userText: "I can't control my emotions" },
    expected: {
      targetTool: 'viyoga',
      href: '/viyog',
      labelKey: 'navigation.next_step.stabilize_viyoga',
      labelFallback: 'Stabilize with Viyoga \u2192',
    },
  },
  {
    name: 'compass without reactivity keywords suggests emotional-reset',
    input: { tool: 'compass', userText: 'I feel disconnected from my partner' },
    expected: {
      targetTool: 'emotional-reset',
      href: '/emotional-reset',
      labelKey: 'navigation.next_step.emotional_reset',
      labelFallback: 'Process with Emotional Reset \u2192',
    },
  },

  // --- Rule 4: KIAAN + practice keywords → JOURNEY ---
  {
    name: 'kiaan with practice keyword suggests journey',
    input: { tool: 'kiaan', userText: 'I want to start a practice' },
    expected: {
      targetTool: 'journey',
      href: '/journeys',
      labelKey: 'navigation.next_step.enter_journey',
      labelFallback: 'Enter a Journey \u2192',
    },
  },
  {
    name: 'kiaan with repeated theme (>=2) suggests journey',
    input: {
      tool: 'kiaan',
      userText: 'I feel lost',
      sessionSignals: { themeCounts: { anxiety: 2 } },
    },
    expected: {
      targetTool: 'journey',
      href: '/journeys',
      labelKey: 'navigation.next_step.enter_journey',
      labelFallback: 'Enter a Journey \u2192',
    },
  },
  {
    name: 'kiaan with single-occurrence theme returns null',
    input: {
      tool: 'kiaan',
      userText: 'hello',
      sessionSignals: { themeCounts: { anxiety: 1 } },
    },
    expected: null,
  },
  {
    name: 'kiaan without keywords or signals returns null',
    input: { tool: 'kiaan', userText: 'hello', aiText: 'hi there' },
    expected: null,
  },

  // --- Rule 5: JOURNEY + trigger today → VIYOGA ---
  {
    name: 'journey with trigger today suggests viyoga',
    input: { tool: 'journey', userText: 'a trigger happened today at work' },
    expected: {
      targetTool: 'viyoga',
      href: '/viyog',
      labelKey: 'navigation.next_step.stabilize_viyoga',
      labelFallback: 'Stabilize with Viyoga \u2192',
    },
  },
  {
    name: 'journey with triggered this morning suggests viyoga',
    input: { tool: 'journey', userText: 'I got triggered this morning' },
    expected: {
      targetTool: 'viyoga',
      href: '/viyog',
      labelKey: 'navigation.next_step.stabilize_viyoga',
      labelFallback: 'Stabilize with Viyoga \u2192',
    },
  },
  {
    name: 'journey without trigger returns null',
    input: { tool: 'journey', userText: 'completed day 5' },
    expected: null,
  },

  // --- Edge: empty tool ---
  {
    name: 'journey with empty strings returns null',
    input: { tool: 'journey' },
    expected: null,
  },
]

describe('getNextStepSuggestion', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    const result = getNextStepSuggestion(input)
    if (expected === null) {
      expect(result).toBeNull()
    } else {
      expect(result).toEqual(expected)
    }
  })

  it('never returns more than one suggestion', () => {
    // Even with overlapping signals, only one suggestion should come back
    const result = getNextStepSuggestion({
      tool: 'kiaan',
      userText: 'I want to practice anger training',
      sessionSignals: { themeCounts: { anger: 3 } },
    })
    expect(result).toBeTruthy()
    // Should match the practice keyword rule first
    expect(result!.targetTool).toBe('journey')
  })
})

// ---------------------------------------------------------------------------
// extractThemes
// ---------------------------------------------------------------------------

describe('extractThemes', () => {
  it('extracts matching theme keywords from text', () => {
    const themes = extractThemes('I feel so much anxiety and fear about work')
    expect(themes).toContain('anxiety')
    expect(themes).toContain('fear')
    expect(themes).toContain('work')
  })

  it('returns empty array for empty text', () => {
    expect(extractThemes('')).toEqual([])
  })

  it('is case-insensitive', () => {
    const themes = extractThemes('ANGER and Grief')
    expect(themes).toContain('anger')
    expect(themes).toContain('grief')
  })

  it('does not duplicate keywords', () => {
    const themes = extractThemes('anger anger anger')
    const unique = [...new Set(themes)]
    expect(themes).toEqual(unique)
  })
})
