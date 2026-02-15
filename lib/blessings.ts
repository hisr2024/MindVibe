/**
 * Micro-Blessings System
 *
 * Short, Gita-aligned affirmations returned after key interactions.
 * Each blessing is a 1-2 line offering — never preachy, always warm.
 * Seeded by the current hour so blessings rotate naturally.
 */

type BlessingContext =
  | 'mood-grateful'
  | 'mood-heavy'
  | 'mood-restless'
  | 'mood-tender'
  | 'mood-seeking'
  | 'mood-default'
  | 'tool-complete'
  | 'journal-saved'
  | 'breathing-done'
  | 'greeting'

const BLESSINGS: Record<BlessingContext, string[]> = {
  'mood-grateful': [
    'Gratitude is the highest prayer. You carry it well.',
    'A grateful heart sees the sacred in everything.',
    'Krishna says: the wise see all beings in themselves. You are seeing clearly.',
  ],
  'mood-heavy': [
    'Even the heaviest clouds pass. You are not what weighs on you.',
    'In stillness, even sorrow becomes a teacher.',
    'Krishna reminds: you are never alone in your struggle.',
  ],
  'mood-restless': [
    'The restless mind finds peace through gentle practice. Begin here.',
    'Like the ocean beneath waves, your depth is undisturbed.',
    'Breathe. The answers are already within you.',
  ],
  'mood-tender': [
    'Tenderness is not weakness — it is the courage to feel.',
    'Your soft heart is your greatest strength.',
    'Be gentle with yourself today. You deserve that kindness.',
  ],
  'mood-seeking': [
    'The seeker who asks has already begun to find.',
    'Every question you carry is a door waiting to open.',
    'Krishna says: I am the beginning, middle, and end of all beings. You are on the path.',
  ],
  'mood-default': [
    'You showed up. That is enough.',
    'Every moment of awareness is a step toward peace.',
    'May this moment bring you closer to your truth.',
  ],
  'tool-complete': [
    'Well done. Each step of clarity is a gift to yourself.',
    'You chose growth today. That takes courage.',
    'The work you just did ripples outward. Trust it.',
  ],
  'journal-saved': [
    'Your words are sacred. Thank you for sharing them.',
    'Writing is a form of prayer. This one was heard.',
    'Your reflection will be here whenever you need it.',
  ],
  'breathing-done': [
    'You gave yourself the gift of stillness. Namaste.',
    'Three breaths can change a day. You just proved it.',
    'Peace is not somewhere else. It was in that breath.',
  ],
  greeting: [
    'Welcome back. Your presence here matters.',
    'I am glad you are here.',
    'This space is yours. Take what you need.',
  ],
}

/**
 * Returns a blessing for the given context.
 * Uses hour-seeded selection for variety without randomness within a session.
 */
export function getBlessing(context: BlessingContext): string {
  const pool = BLESSINGS[context] || BLESSINGS['mood-default']
  const seed = new Date().getHours() + new Date().getDate() * 24
  const index = seed % pool.length
  return pool[index]
}

/**
 * Maps a mood value (e.g. from check-in) to a blessing context.
 */
export function moodToContext(mood: string): BlessingContext {
  const map: Record<string, BlessingContext> = {
    excellent: 'mood-grateful',
    good: 'mood-grateful',
    neutral: 'mood-default',
    low: 'mood-heavy',
    'very low': 'mood-heavy',
    grateful: 'mood-grateful',
    heavy: 'mood-heavy',
    restless: 'mood-restless',
    tender: 'mood-tender',
    seeking: 'mood-seeking',
    'seeking peace': 'mood-seeking',
  }
  return map[mood.toLowerCase()] || 'mood-default'
}
