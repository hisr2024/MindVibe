/**
 * Inner State Profile – merge utility.
 *
 * Pure function that merges a persisted inner_state_profile with newly
 * extracted session signals.  Rules:
 *
 *   - Recurring themes are strengthened gradually.
 *   - Themes absent for 5+ sessions are decayed.
 *   - Growth signals only increase when repeated across sessions.
 *   - New themes are never invented.
 *   - Reactivity softens via exponential smoothing.
 *   - Awareness and steadiness move slowly.
 *
 * No network dependency — works fully offline.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemeEntry {
  weight: number
  firstSeenSession: number
  lastSeenSession: number
  occurrenceCount: number
}

export interface GrowthEntry {
  level: number
  consecutiveSessions: number
  lastConfirmedSession: number
}

export interface ReactivityEntry {
  intensity: number
  trend: 'softening' | 'stable' | 'escalating'
  sessionCount: number
  lastSeenSession: number
}

export interface InnerStateProfile {
  themes: Record<string, ThemeEntry>
  growthSignals: Record<string, GrowthEntry>
  reactivity: Record<string, ReactivityEntry>
  awareness: Record<string, number>
  steadiness: number
  sessionCount: number
  lastUpdated: string
}

export interface SessionSignals {
  themesDetected: string[]
  growthSignalsDetected: string[]
  reactivityMarkers: Record<string, number | { intensity: number }>
  awarenessIndicators: string[]
  steadinessObserved: number | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const THEME_REINFORCE_STEP = 0.05
const THEME_WEIGHT_CAP = 1.0
const THEME_WEIGHT_FLOOR = 0.05
const THEME_DECAY_AFTER_SESSIONS = 5
const THEME_DECAY_FACTOR = 0.85

const GROWTH_REINFORCE_STEP = 0.03
const GROWTH_LEVEL_CAP = 1.0
const GROWTH_REPEAT_THRESHOLD = 2

const REACTIVITY_ALPHA = 0.15
const AWARENESS_ALPHA = 0.1
const STEADINESS_ALPHA = 0.12

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value))
}

function emptyProfile(): InnerStateProfile {
  return {
    themes: {},
    growthSignals: {},
    reactivity: {},
    awareness: {},
    steadiness: 0.5,
    sessionCount: 0,
    lastUpdated: new Date().toISOString(),
  }
}

function emptySignals(): SessionSignals {
  return {
    themesDetected: [],
    growthSignalsDetected: [],
    reactivityMarkers: {},
    awarenessIndicators: [],
    steadinessObserved: null,
  }
}

// ---------------------------------------------------------------------------
// Core merge
// ---------------------------------------------------------------------------

/**
 * Merge session signals into an existing inner state profile.
 *
 * Returns a new profile object — the inputs are never mutated.
 */
export function mergeProfile(
  existing: Partial<InnerStateProfile> | null | undefined,
  sessionSignals: Partial<SessionSignals> | null | undefined,
): InnerStateProfile {
  const profile: InnerStateProfile = {
    ...emptyProfile(),
    ...(existing ? structuredClone(existing) : {}),
  }
  // Ensure nested objects are present after spread.
  profile.themes = { ...profile.themes }
  profile.growthSignals = { ...profile.growthSignals }
  profile.reactivity = { ...profile.reactivity }
  profile.awareness = { ...profile.awareness }

  const signals: SessionSignals = { ...emptySignals(), ...(sessionSignals ?? {}) }

  const sessionNumber = profile.sessionCount + 1
  profile.sessionCount = sessionNumber

  mergeThemes(profile, signals, sessionNumber)
  mergeGrowthSignals(profile, signals, sessionNumber)
  mergeReactivity(profile, signals, sessionNumber)
  mergeAwareness(profile, signals)
  mergeSteadiness(profile, signals)

  profile.lastUpdated = new Date().toISOString()
  return profile
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

function mergeThemes(
  profile: InnerStateProfile,
  signals: SessionSignals,
  sessionNumber: number,
): void {
  const detected = new Set(signals.themesDetected)

  // Reinforce detected themes.
  for (const key of detected) {
    const entry = profile.themes[key]
    if (entry) {
      entry.weight = clamp(entry.weight + THEME_REINFORCE_STEP, THEME_WEIGHT_FLOOR, THEME_WEIGHT_CAP)
      entry.occurrenceCount += 1
      entry.lastSeenSession = sessionNumber
    } else {
      profile.themes[key] = {
        weight: THEME_REINFORCE_STEP,
        firstSeenSession: sessionNumber,
        lastSeenSession: sessionNumber,
        occurrenceCount: 1,
      }
    }
  }

  // Decay themes absent for 5+ sessions.
  for (const [key, entry] of Object.entries(profile.themes)) {
    const sessionsAbsent = sessionNumber - entry.lastSeenSession
    if (sessionsAbsent >= THEME_DECAY_AFTER_SESSIONS) {
      entry.weight = clamp(
        entry.weight * THEME_DECAY_FACTOR,
        THEME_WEIGHT_FLOOR,
        THEME_WEIGHT_CAP,
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Growth signals
// ---------------------------------------------------------------------------

function mergeGrowthSignals(
  profile: InnerStateProfile,
  signals: SessionSignals,
  sessionNumber: number,
): void {
  const detected = new Set(signals.growthSignalsDetected)

  for (const dimKey of detected) {
    const entry = profile.growthSignals[dimKey]
    if (entry) {
      const prevSession = entry.lastConfirmedSession
      if (sessionNumber - prevSession <= 1) {
        entry.consecutiveSessions += 1
      } else {
        entry.consecutiveSessions = 1
      }
      entry.lastConfirmedSession = sessionNumber

      if (entry.consecutiveSessions >= GROWTH_REPEAT_THRESHOLD) {
        entry.level = clamp(entry.level + GROWTH_REINFORCE_STEP, 0, GROWTH_LEVEL_CAP)
      }
    } else {
      profile.growthSignals[dimKey] = {
        level: 0.0,
        consecutiveSessions: 1,
        lastConfirmedSession: sessionNumber,
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Reactivity
// ---------------------------------------------------------------------------

function mergeReactivity(
  profile: InnerStateProfile,
  signals: SessionSignals,
  sessionNumber: number,
): void {
  const observedKeys = new Set<string>()

  for (const [key, raw] of Object.entries(signals.reactivityMarkers)) {
    observedKeys.add(key)
    const newIntensity = clamp(
      typeof raw === 'number' ? raw : raw.intensity,
      0,
      1,
    )

    const entry = profile.reactivity[key]
    if (entry) {
      const old = entry.intensity
      const blended = old * (1 - REACTIVITY_ALPHA) + newIntensity * REACTIVITY_ALPHA
      entry.intensity = parseFloat(blended.toFixed(4))

      const delta = blended - old
      if (delta < -0.02) {
        entry.trend = 'softening'
      } else if (delta > 0.02) {
        entry.trend = 'escalating'
      } else {
        entry.trend = 'stable'
      }
      entry.sessionCount += 1
      entry.lastSeenSession = sessionNumber
    } else {
      profile.reactivity[key] = {
        intensity: parseFloat(newIntensity.toFixed(4)),
        trend: 'stable',
        sessionCount: 1,
        lastSeenSession: sessionNumber,
      }
    }
  }

  // Soften patterns not observed this session.
  for (const [key, entry] of Object.entries(profile.reactivity)) {
    if (!observedKeys.has(key)) {
      const old = entry.intensity
      const softened = old * (1 - REACTIVITY_ALPHA * 0.5)
      if (softened < old) {
        entry.intensity = parseFloat(softened.toFixed(4))
        entry.trend = 'softening'
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Awareness
// ---------------------------------------------------------------------------

function mergeAwareness(
  profile: InnerStateProfile,
  signals: SessionSignals,
): void {
  for (const area of signals.awarenessIndicators) {
    const current = profile.awareness[area] ?? 0
    const updated = current + AWARENESS_ALPHA * (1 - current)
    profile.awareness[area] = parseFloat(clamp(updated, 0, 1).toFixed(4))
  }
}

// ---------------------------------------------------------------------------
// Steadiness
// ---------------------------------------------------------------------------

function mergeSteadiness(
  profile: InnerStateProfile,
  signals: SessionSignals,
): void {
  if (signals.steadinessObserved == null) return

  const observed = clamp(signals.steadinessObserved, 0, 1)
  const current = profile.steadiness
  const blended = current * (1 - STEADINESS_ALPHA) + observed * STEADINESS_ALPHA
  profile.steadiness = parseFloat(blended.toFixed(4))
}
