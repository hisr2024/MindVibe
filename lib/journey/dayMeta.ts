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
  /** 1–2 sentence micro-practice for the day */
  microPractice: string
}

/**
 * Default 14-day journey metadata.
 *
 * Copy tone: grounded, non-trophy. Day 14 deliberately says
 * "Practice continues" instead of celebrating a finish line.
 */
export const JOURNEY_DAY_META: JourneyDayMeta[] = [
  { day: 1, theme: 'Stillness within chaos', focus: 'Dhriti (Steadfastness)', microPractice: 'Pause for 60 seconds wherever you are. Notice three sounds around you without labelling them.' },
  { day: 2, theme: 'Listening to the body', focus: 'Shama (Calm)', microPractice: 'Place one hand on your chest. Take five slow breaths and feel the rise and fall.' },
  { day: 3, theme: 'Naming what you feel', focus: 'Viveka (Discernment)', microPractice: 'Silently name the emotion you are feeling right now — just one word, no story.' },
  { day: 4, theme: 'Sitting with discomfort', focus: 'Kshama (Patience)', microPractice: 'When a small frustration arises today, wait ten seconds before responding.' },
  { day: 5, theme: 'Releasing what is held', focus: 'Vairagya (Non-attachment)', microPractice: 'Choose one expectation you are holding today and consciously set it down.' },
  { day: 6, theme: 'Observing without reacting', focus: 'Sakshi (Witness awareness)', microPractice: 'Watch one strong thought pass through your mind without following it.' },
  { day: 7, theme: 'Returning to breath', focus: 'Pranayama (Breath mastery)', microPractice: 'Breathe in for four counts, hold for four, breathe out for six. Repeat three times.' },
  { day: 8, theme: 'Kindness toward self', focus: 'Ahimsa (Non-harm)', microPractice: 'Replace one self-critical thought today with the words "I am doing my best."' },
  { day: 9, theme: 'Seeing patterns clearly', focus: 'Jnana (Self-knowledge)', microPractice: 'Notice one habitual reaction you had today. Simply notice — no need to change it.' },
  { day: 10, theme: 'Acting without clinging', focus: 'Nishkama Karma (Selfless action)', microPractice: 'Do one small helpful thing today without expecting acknowledgment.' },
  { day: 11, theme: 'Embracing uncertainty', focus: 'Shraddha (Trust)', microPractice: 'When you catch yourself planning for every outcome, say inwardly "I can handle what comes."' },
  { day: 12, theme: 'Gratitude for the ordinary', focus: 'Santosha (Contentment)', microPractice: 'Before a meal, pause and notice the colours and textures on your plate.' },
  { day: 13, theme: 'Strength in gentleness', focus: 'Daya (Compassion)', microPractice: 'Offer one genuine, kind word to someone you encounter today.' },
  { day: 14, theme: 'Practice continues', focus: 'Abhyasa (Steady practice)', microPractice: 'Choose any micro-practice from the past 13 days and repeat it. The path is yours now.' },
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
