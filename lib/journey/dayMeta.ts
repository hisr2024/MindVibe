/**
 * Journey Day Metadata — static config for the 14-day guided journey.
 *
 * Each day has a theme (what the day is about) and a focus (the inner force
 * being cultivated). This data is fully static — no backend dependency — so
 * it can be bundled and cached in IndexedDB for offline use.
 */

export interface JourneyDayMeta {
  /** 1-indexed day number */
  day: number
  /** Short thematic title for the day */
  theme: string
  /** The inner force (Shakti) being cultivated */
  focus: string
}

/**
 * Default 14-day journey metadata.
 *
 * Copy tone: grounded, non-trophy. Day 14 deliberately says
 * "Practice continues" instead of celebrating a finish line.
 */
export const JOURNEY_DAY_META: JourneyDayMeta[] = [
  { day: 1, theme: 'Stillness within chaos', focus: 'Dhriti (Steadfastness)' },
  { day: 2, theme: 'Listening to the body', focus: 'Shama (Calm)' },
  { day: 3, theme: 'Naming what you feel', focus: 'Viveka (Discernment)' },
  { day: 4, theme: 'Sitting with discomfort', focus: 'Kshama (Patience)' },
  { day: 5, theme: 'Releasing what is held', focus: 'Vairagya (Non-attachment)' },
  { day: 6, theme: 'Observing without reacting', focus: 'Sakshi (Witness awareness)' },
  { day: 7, theme: 'Returning to breath', focus: 'Pranayama (Breath mastery)' },
  { day: 8, theme: 'Kindness toward self', focus: 'Ahimsa (Non-harm)' },
  { day: 9, theme: 'Seeing patterns clearly', focus: 'Jnana (Self-knowledge)' },
  { day: 10, theme: 'Acting without clinging', focus: 'Nishkama Karma (Selfless action)' },
  { day: 11, theme: 'Embracing uncertainty', focus: 'Shraddha (Trust)' },
  { day: 12, theme: 'Gratitude for the ordinary', focus: 'Santosha (Contentment)' },
  { day: 13, theme: 'Strength in gentleness', focus: 'Daya (Compassion)' },
  { day: 14, theme: 'Practice continues', focus: 'Abhyasa (Steady practice)' },
]

export const TOTAL_JOURNEY_DAYS = 14

/**
 * Get metadata for a specific day (1-indexed).
 * Returns undefined for out-of-range days.
 */
export function getDayMeta(day: number): JourneyDayMeta | undefined {
  return JOURNEY_DAY_META.find((d) => d.day === day)
}

/**
 * Calculate journey progress as a percentage (0–100).
 *
 * Uses completed steps (not current day index) to avoid misleading the user
 * when days are skipped. Clamps to 0–100.
 */
export function calculateProgress(completedDays: number, totalDays: number = TOTAL_JOURNEY_DAYS): number {
  if (totalDays <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((completedDays / totalDays) * 100)))
}
