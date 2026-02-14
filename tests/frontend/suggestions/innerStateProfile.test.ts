/**
 * Tests for inner state profile merge logic.
 *
 * Covers theme reinforcement/decay, growth repeat-gating,
 * reactivity EMA, awareness slow increase, steadiness blending,
 * and edge cases (null/empty inputs, immutability).
 */

import { describe, it, expect } from 'vitest'
import {
  mergeProfile,
  type InnerStateProfile,
  type SessionSignals,
} from '@/lib/suggestions/innerStateProfile'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProfile(overrides: Partial<InnerStateProfile> = {}): InnerStateProfile {
  return {
    themes: {},
    growthSignals: {},
    reactivity: {},
    awareness: {},
    steadiness: 0.5,
    sessionCount: 0,
    lastUpdated: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeSignals(overrides: Partial<SessionSignals> = {}): SessionSignals {
  return {
    themesDetected: [],
    growthSignalsDetected: [],
    reactivityMarkers: {},
    awarenessIndicators: [],
    steadinessObserved: null,
    ...overrides,
  }
}

const THEME_REINFORCE_STEP = 0.05
const THEME_DECAY_FACTOR = 0.85
const THEME_WEIGHT_FLOOR = 0.05
const GROWTH_REINFORCE_STEP = 0.03

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('mergeProfile – edge cases', () => {
  it('creates scaffold from null profile', () => {
    const result = mergeProfile(null, null)
    expect(result.sessionCount).toBe(1)
    expect(result.themes).toEqual({})
    expect(typeof result.lastUpdated).toBe('string')
  })

  it('creates scaffold from undefined', () => {
    const result = mergeProfile(undefined, undefined)
    expect(result.sessionCount).toBe(1)
  })

  it('increments session even with null signals', () => {
    const result = mergeProfile(makeProfile({ sessionCount: 5 }), null)
    expect(result.sessionCount).toBe(6)
  })

  it('does not mutate the input profile', () => {
    const profile = makeProfile({
      themes: {
        anger: { weight: 0.3, firstSeenSession: 1, lastSeenSession: 1, occurrenceCount: 1 },
      },
    })
    const originalWeight = profile.themes.anger.weight
    mergeProfile(profile, makeSignals({ themesDetected: ['anger'] }))
    expect(profile.themes.anger.weight).toBe(originalWeight)
  })
})

// ---------------------------------------------------------------------------
// Theme merging
// ---------------------------------------------------------------------------

describe('mergeProfile – themes', () => {
  it('seeds new theme at reinforce step', () => {
    const result = mergeProfile(null, makeSignals({ themesDetected: ['anxiety'] }))
    expect(result.themes.anxiety).toBeDefined()
    expect(result.themes.anxiety.weight).toBeCloseTo(THEME_REINFORCE_STEP)
    expect(result.themes.anxiety.occurrenceCount).toBe(1)
  })

  it('reinforces existing theme', () => {
    const profile = makeProfile({
      themes: {
        anxiety: { weight: 0.2, firstSeenSession: 1, lastSeenSession: 3, occurrenceCount: 3 },
      },
      sessionCount: 3,
    })
    const result = mergeProfile(profile, makeSignals({ themesDetected: ['anxiety'] }))
    expect(result.themes.anxiety.weight).toBeCloseTo(0.2 + THEME_REINFORCE_STEP)
    expect(result.themes.anxiety.occurrenceCount).toBe(4)
    expect(result.themes.anxiety.lastSeenSession).toBe(4)
  })

  it('caps theme weight at 1.0', () => {
    const profile = makeProfile({
      themes: {
        anger: { weight: 0.98, firstSeenSession: 1, lastSeenSession: 10, occurrenceCount: 10 },
      },
      sessionCount: 10,
    })
    const result = mergeProfile(profile, makeSignals({ themesDetected: ['anger'] }))
    expect(result.themes.anger.weight).toBeLessThanOrEqual(1.0)
  })

  it('does not decay theme before 5 sessions absent', () => {
    const profile = makeProfile({
      themes: {
        grief: { weight: 0.5, firstSeenSession: 1, lastSeenSession: 7, occurrenceCount: 5 },
      },
      sessionCount: 10,
    })
    const result = mergeProfile(profile, makeSignals())
    expect(result.themes.grief.weight).toBe(0.5)
  })

  it('decays theme at 5+ sessions absent', () => {
    const profile = makeProfile({
      themes: {
        grief: { weight: 0.5, firstSeenSession: 1, lastSeenSession: 5, occurrenceCount: 5 },
      },
      sessionCount: 10,
    })
    const result = mergeProfile(profile, makeSignals())
    const expected = Math.max(THEME_WEIGHT_FLOOR, 0.5 * THEME_DECAY_FACTOR)
    expect(result.themes.grief.weight).toBeCloseTo(expected)
  })

  it('never decays below floor', () => {
    const profile = makeProfile({
      themes: {
        loss: { weight: THEME_WEIGHT_FLOOR, firstSeenSession: 1, lastSeenSession: 1, occurrenceCount: 1 },
      },
      sessionCount: 100,
    })
    const result = mergeProfile(profile, makeSignals())
    expect(result.themes.loss.weight).toBeGreaterThanOrEqual(THEME_WEIGHT_FLOOR)
  })

  it('never invents themes not in signals', () => {
    const profile = makeProfile({
      themes: {
        anger: { weight: 0.3, firstSeenSession: 1, lastSeenSession: 1, occurrenceCount: 1 },
      },
    })
    const result = mergeProfile(profile, makeSignals({ themesDetected: ['anxiety'] }))
    expect(Object.keys(result.themes).sort()).toEqual(['anger', 'anxiety'])
  })
})

// ---------------------------------------------------------------------------
// Growth signals
// ---------------------------------------------------------------------------

describe('mergeProfile – growth signals', () => {
  it('seeds first sighting at level 0', () => {
    const result = mergeProfile(null, makeSignals({ growthSignalsDetected: ['equanimity'] }))
    expect(result.growthSignals.equanimity.level).toBe(0)
    expect(result.growthSignals.equanimity.consecutiveSessions).toBe(1)
  })

  it('does not increase level below repeat threshold', () => {
    const profile = makeProfile({
      growthSignals: {
        equanimity: { level: 0, consecutiveSessions: 1, lastConfirmedSession: 1 },
      },
      sessionCount: 5,
    })
    const result = mergeProfile(profile, makeSignals({ growthSignalsDetected: ['equanimity'] }))
    expect(result.growthSignals.equanimity.level).toBe(0) // gap resets streak
  })

  it('increases level after consecutive repetitions', () => {
    const profile = makeProfile({
      growthSignals: {
        equanimity: { level: 0, consecutiveSessions: 1, lastConfirmedSession: 1 },
      },
      sessionCount: 1,
    })
    const result = mergeProfile(profile, makeSignals({ growthSignalsDetected: ['equanimity'] }))
    expect(result.growthSignals.equanimity.consecutiveSessions).toBe(2)
    expect(result.growthSignals.equanimity.level).toBeCloseTo(GROWTH_REINFORCE_STEP)
  })

  it('caps level at 1.0', () => {
    const profile = makeProfile({
      growthSignals: {
        devotion: { level: 0.99, consecutiveSessions: 10, lastConfirmedSession: 10 },
      },
      sessionCount: 10,
    })
    const result = mergeProfile(profile, makeSignals({ growthSignalsDetected: ['devotion'] }))
    expect(result.growthSignals.devotion.level).toBeLessThanOrEqual(1.0)
  })

  it('resets streak on gap but preserves level', () => {
    const profile = makeProfile({
      growthSignals: {
        compassion: { level: 0.15, consecutiveSessions: 5, lastConfirmedSession: 3 },
      },
      sessionCount: 10,
    })
    const result = mergeProfile(profile, makeSignals({ growthSignalsDetected: ['compassion'] }))
    expect(result.growthSignals.compassion.consecutiveSessions).toBe(1)
    expect(result.growthSignals.compassion.level).toBe(0.15)
  })
})

// ---------------------------------------------------------------------------
// Reactivity
// ---------------------------------------------------------------------------

describe('mergeProfile – reactivity', () => {
  it('seeds new reactivity pattern', () => {
    const result = mergeProfile(null, makeSignals({ reactivityMarkers: { anger: 0.7 } }))
    expect(result.reactivity.anger.intensity).toBeCloseTo(0.7, 1)
    expect(result.reactivity.anger.trend).toBe('stable')
    expect(result.reactivity.anger.sessionCount).toBe(1)
  })

  it('blends intensity via EMA – softening', () => {
    const profile = makeProfile({
      reactivity: {
        anger: { intensity: 0.8, trend: 'stable', sessionCount: 3, lastSeenSession: 3 },
      },
      sessionCount: 3,
    })
    const result = mergeProfile(profile, makeSignals({ reactivityMarkers: { anger: 0.2 } }))
    const expected = 0.8 * 0.85 + 0.2 * 0.15
    expect(result.reactivity.anger.intensity).toBeCloseTo(expected, 2)
    expect(result.reactivity.anger.trend).toBe('softening')
  })

  it('detects escalating trend', () => {
    const profile = makeProfile({
      reactivity: {
        panic: { intensity: 0.3, trend: 'stable', sessionCount: 2, lastSeenSession: 2 },
      },
      sessionCount: 2,
    })
    const result = mergeProfile(profile, makeSignals({ reactivityMarkers: { panic: 0.9 } }))
    expect(result.reactivity.panic.trend).toBe('escalating')
  })

  it('softens unobserved patterns', () => {
    const profile = makeProfile({
      reactivity: {
        anger: { intensity: 0.6, trend: 'stable', sessionCount: 5, lastSeenSession: 5 },
      },
      sessionCount: 5,
    })
    const result = mergeProfile(profile, makeSignals())
    expect(result.reactivity.anger.intensity).toBeLessThan(0.6)
    expect(result.reactivity.anger.trend).toBe('softening')
  })

  it('accepts dict format for intensity', () => {
    const result = mergeProfile(null, makeSignals({
      reactivityMarkers: { fear: { intensity: 0.5 } },
    }))
    expect(result.reactivity.fear.intensity).toBeCloseTo(0.5, 1)
  })
})

// ---------------------------------------------------------------------------
// Awareness
// ---------------------------------------------------------------------------

describe('mergeProfile – awareness', () => {
  it('slowly increases new awareness area', () => {
    const result = mergeProfile(null, makeSignals({ awarenessIndicators: ['body_sensations'] }))
    expect(result.awareness.body_sensations).toBeGreaterThan(0)
    expect(result.awareness.body_sensations).toBeLessThan(0.2)
  })

  it('gradually grows existing awareness', () => {
    const profile = makeProfile({ awareness: { breath: 0.5 } })
    const result = mergeProfile(profile, makeSignals({ awarenessIndicators: ['breath'] }))
    const expected = 0.5 + 0.1 * (1.0 - 0.5) // 0.55
    expect(result.awareness.breath).toBeCloseTo(expected, 2)
  })

  it('leaves unobserved awareness unchanged', () => {
    const profile = makeProfile({ awareness: { breath: 0.5 } })
    const result = mergeProfile(profile, makeSignals())
    expect(result.awareness.breath).toBe(0.5)
  })
})

// ---------------------------------------------------------------------------
// Steadiness
// ---------------------------------------------------------------------------

describe('mergeProfile – steadiness', () => {
  it('blends via EMA', () => {
    const profile = makeProfile({ steadiness: 0.5 })
    const result = mergeProfile(profile, makeSignals({ steadinessObserved: 0.8 }))
    const expected = 0.5 * 0.88 + 0.8 * 0.12
    expect(result.steadiness).toBeCloseTo(expected, 2)
  })

  it('unchanged when not observed', () => {
    const profile = makeProfile({ steadiness: 0.5 })
    const result = mergeProfile(profile, makeSignals({ steadinessObserved: null }))
    expect(result.steadiness).toBe(0.5)
  })

  it('stays within 0-1', () => {
    const profile = makeProfile({ steadiness: 0.99 })
    const result = mergeProfile(profile, makeSignals({ steadinessObserved: 1.5 }))
    expect(result.steadiness).toBeLessThanOrEqual(1.0)
  })
})

// ---------------------------------------------------------------------------
// Multi-session integration
// ---------------------------------------------------------------------------

describe('mergeProfile – multi-session simulation', () => {
  it('growth increases gradually over 10 sessions', () => {
    let profile: InnerStateProfile | null = null
    for (let i = 0; i < 10; i++) {
      profile = mergeProfile(profile, makeSignals({ growthSignalsDetected: ['self_awareness'] }))
    }
    expect(profile!.growthSignals.self_awareness.level).toBeGreaterThan(0)
    expect(profile!.growthSignals.self_awareness.level).toBeLessThanOrEqual(1)
    expect(profile!.growthSignals.self_awareness.consecutiveSessions).toBe(10)
  })

  it('theme decays after many absent sessions', () => {
    // Build up weight above the floor first so decay is observable.
    let profile: InnerStateProfile | null = null
    for (let i = 0; i < 5; i++) {
      profile = mergeProfile(profile, makeSignals({ themesDetected: ['guilt'] }))
    }
    const initialWeight = profile!.themes.guilt.weight
    expect(initialWeight).toBeGreaterThan(THEME_WEIGHT_FLOOR)

    for (let i = 0; i < 10; i++) {
      profile = mergeProfile(profile, makeSignals())
    }

    expect(profile!.themes.guilt.weight).toBeLessThan(initialWeight)
    expect(profile!.themes.guilt.weight).toBeGreaterThanOrEqual(THEME_WEIGHT_FLOOR)
  })

  it('no themes invented across sessions', () => {
    let profile: InnerStateProfile | null = null
    const allThemes = new Set<string>()
    for (const themes of [['anger'], ['anxiety', 'anger'], ['fear'], []]) {
      themes.forEach((t) => allThemes.add(t))
      profile = mergeProfile(profile, makeSignals({ themesDetected: themes }))
    }
    expect(Object.keys(profile!.themes).sort()).toEqual([...allThemes].sort())
  })
})
