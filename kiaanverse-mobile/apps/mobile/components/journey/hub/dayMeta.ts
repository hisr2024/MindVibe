/**
 * dayMeta — Static 14-day journey metadata, ported 1:1 from the web's
 * `/lib/journey/dayMeta.ts`. Drives the "Micro Practice" card on the
 * Today sub-tab.
 *
 * Each day has a theme (what the day is about), a focus (the inner
 * Shakti being cultivated), and a 1-2 sentence micro-practice.
 *
 * Day 14 deliberately says "Practice continues" — no trophy moment.
 */

export interface JourneyDayMeta {
  /** 1-indexed day number. */
  day: number;
  theme: string;
  focus: string;
  microPractice: string;
}

export const JOURNEY_DAY_META: JourneyDayMeta[] = [
  {
    day: 1,
    theme: 'Stillness within chaos',
    focus: 'Dhriti (Steadfastness)',
    microPractice:
      'Pause for 60 seconds wherever you are. Notice three sounds around you without labelling them.',
  },
  {
    day: 2,
    theme: 'Listening to the body',
    focus: 'Shama (Calm)',
    microPractice:
      'Place one hand on your chest. Take five slow breaths and feel the rise and fall.',
  },
  {
    day: 3,
    theme: 'Naming what you feel',
    focus: 'Viveka (Discernment)',
    microPractice:
      'Silently name the emotion you are feeling right now — just one word, no story.',
  },
  {
    day: 4,
    theme: 'Sitting with discomfort',
    focus: 'Kshama (Patience)',
    microPractice:
      'When a small frustration arises today, wait ten seconds before responding.',
  },
  {
    day: 5,
    theme: 'Releasing what is held',
    focus: 'Vairagya (Non-attachment)',
    microPractice:
      'Choose one expectation you are holding today and consciously set it down.',
  },
  {
    day: 6,
    theme: 'Observing without reacting',
    focus: 'Sakshi (Witness awareness)',
    microPractice:
      'Watch one strong thought pass through your mind without following it.',
  },
  {
    day: 7,
    theme: 'Returning to breath',
    focus: 'Pranayama (Breath mastery)',
    microPractice:
      'Breathe in for four counts, hold for four, breathe out for six. Repeat three times.',
  },
  {
    day: 8,
    theme: 'Kindness toward self',
    focus: 'Ahimsa (Non-harm)',
    microPractice:
      'Replace one self-critical thought today with the words "I am doing my best."',
  },
  {
    day: 9,
    theme: 'Seeing patterns clearly',
    focus: 'Jnana (Self-knowledge)',
    microPractice:
      'Notice one habitual reaction you had today. Simply notice — no need to change it.',
  },
  {
    day: 10,
    theme: 'Acting without clinging',
    focus: 'Nishkama Karma (Selfless action)',
    microPractice:
      'Do one small helpful thing today without expecting acknowledgment.',
  },
  {
    day: 11,
    theme: 'Embracing uncertainty',
    focus: 'Shraddha (Trust)',
    microPractice:
      'When you catch yourself planning for every outcome, say inwardly "I can handle what comes."',
  },
  {
    day: 12,
    theme: 'Gratitude for the ordinary',
    focus: 'Santosha (Contentment)',
    microPractice:
      'Before a meal, pause and notice the colours and textures on your plate.',
  },
  {
    day: 13,
    theme: 'Strength in gentleness',
    focus: 'Daya (Compassion)',
    microPractice:
      'Offer one genuine, kind word to someone you encounter today.',
  },
  {
    day: 14,
    theme: 'Practice continues',
    focus: 'Abhyasa (Steady practice)',
    microPractice:
      'Choose any micro-practice from the past 13 days and repeat it. The path is yours now.',
  },
];

/**
 * Pick the day-meta that should drive the Micro Practice card today.
 * Mirrors the web mobile contract — uses ISO weekday so Monday is day 1
 * and Sunday is day 7. For weeks 1-2 of a long journey the cycle repeats.
 */
export function getTodayDayMeta(now: Date = new Date()): JourneyDayMeta {
  const dow = now.getDay(); // 0 = Sun … 6 = Sat
  const dayIndex = dow === 0 ? 7 : dow; // 1..7 (Mon..Sun)
  return JOURNEY_DAY_META[dayIndex - 1] ?? JOURNEY_DAY_META[0]!;
}
