/**
 * Sacred Reflections — shared constants for the mobile journal feature.
 * Mood palette, suggested tags, and canonical Dialect B animation timings.
 */

export const MOOD_OPTIONS = [
  { id: 'peaceful', label: 'Peaceful', sanskrit: 'शान्त',      emoji: '🌊', color: '#67E8F9', glow: 'rgba(103,232,249,0.3)', bg: 'rgba(103,232,249,0.1)' },
  { id: 'grateful', label: 'Grateful', sanskrit: 'कृतज्ञ',    emoji: '🙏', color: '#6EE7B7', glow: 'rgba(110,231,183,0.3)', bg: 'rgba(110,231,183,0.1)' },
  { id: 'seeking',  label: 'Seeking',  sanskrit: 'जिज्ञासु',  emoji: '🔍', color: '#C4B5FD', glow: 'rgba(196,181,253,0.3)', bg: 'rgba(196,181,253,0.1)' },
  { id: 'heavy',    label: 'Heavy',    sanskrit: 'भारग्रस्त', emoji: '💙', color: '#93C5FD', glow: 'rgba(147,197,253,0.3)', bg: 'rgba(147,197,253,0.1)' },
  { id: 'radiant',  label: 'Radiant',  sanskrit: 'तेजस्वी',   emoji: '✨', color: '#F0C040', glow: 'rgba(240,192,64,0.3)',  bg: 'rgba(240,192,64,0.1)'  },
  { id: 'wounded',  label: 'Wounded',  sanskrit: 'आहत',        emoji: '💔', color: '#FCA5A5', glow: 'rgba(252,165,165,0.3)', bg: 'rgba(252,165,165,0.1)' },
] as const

export type MoodId = (typeof MOOD_OPTIONS)[number]['id']
export type MoodOption = (typeof MOOD_OPTIONS)[number]

export const SUGGESTED_TAGS = [
  'gratitude', 'reflection', 'growth', 'dharma',
  'shadow', 'healing', 'surrender', 'clarity',
  'forgiveness', 'courage', 'grief', 'joy',
] as const

// Dialect B canonical animation constants
export const COUNT_UP_DURATION = 1200
export const RING_DURATION = 1400
export const WORD_STAGGER = 45
export const WORD_DURATION = 250
export const CARD_STAGGER = 80
export const CARD_DURATION = 300
export const BAR_FILL_DURATION = 1000
export const BAR_FILL_DELAY = 200
export const SHIMMER_DURATION = 1600
export const SHEET_DURATION = 280
export const SHEET_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function findMood(id: string | undefined | null): MoodOption | undefined {
  if (!id) return undefined
  return MOOD_OPTIONS.find((m) => m.id === id)
}
