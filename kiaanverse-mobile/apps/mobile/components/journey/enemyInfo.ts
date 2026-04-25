/**
 * enemyInfo — Canonical six-enemies (षड्रिपु) registry, mirrored 1:1
 * from the web mobile experience (`/types/journeyEngine.types.ts`).
 *
 * Single source of truth for every Journey surface: Today's Practice
 * cards, Active Battles cards, Begin a New Journey grid, Battleground
 * radar, the verse strips, and the Step Player accent colour.
 *
 * Keys match the backend's `EnemyType` enum exactly. Bhaya (fear) is
 * deliberately NOT one of the six; the web registry omits it too.
 */

export type EnemyKey =
  | 'kama'
  | 'krodha'
  | 'lobha'
  | 'moha'
  | 'mada'
  | 'matsarya';

export interface EnemyDisplayInfo {
  key: EnemyKey;
  /** English name shown next to the Devanagari label. */
  name: string;
  /** Romanised Sanskrit (Kama, Krodha, Lobha, Moha, Mada, Matsarya). */
  sanskrit: string;
  /** Devanagari script for header/eyebrow rendering. */
  devanagari: string;
  /** Short one-line description used by Battleground enemy cards. */
  description: string;
  /** Hex accent colour. */
  color: string;
  /** Comma-separated `R,G,B` for use in `rgba(${rgb}, 0.x)` expressions. */
  colorRGB: string;
  /** Canonical anchoring verse (chapter, verse). */
  keyVerse: { chapter: number; verse: number };
  /** Romanised key verse line. */
  keyVerseText: string;
  /** Antidote virtue (label only). */
  antidote: string;
  /** Sanskrit name of the practice that conquers this enemy. */
  conqueredBy: string;
  /** Modern-context examples for the "TODAY THIS LOOKS LIKE" strip. */
  modernContext: string;
}

export const ENEMY_INFO: Record<EnemyKey, EnemyDisplayInfo> = {
  kama: {
    key: 'kama',
    name: 'Desire',
    sanskrit: 'Kama',
    devanagari: 'काम',
    description: 'The wanting mind that is never satisfied',
    color: '#DC2626',
    colorRGB: '220,38,38',
    keyVerse: { chapter: 3, verse: 37 },
    keyVerseText: 'kāma eṣa krodha eṣa rajo-guṇa-samudbhavaḥ',
    antidote: 'Contentment (Santosha)',
    conqueredBy: 'Nishkama Karma — desireless action',
    modernContext:
      'Endless scrolling, compulsive shopping, relationship obsession',
  },
  krodha: {
    key: 'krodha',
    name: 'Anger',
    sanskrit: 'Krodha',
    devanagari: 'क्रोध',
    description: 'The reactive fire that destroys wisdom',
    color: '#B45309',
    colorRGB: '180,83,9',
    keyVerse: { chapter: 2, verse: 63 },
    keyVerseText: 'krodhād bhavati sammohaḥ',
    antidote: 'Patience (Kshama)',
    conqueredBy: 'Viveka — discrimination and pause before reaction',
    modernContext: 'Road rage, social media outrage, reactive arguments',
  },
  lobha: {
    key: 'lobha',
    name: 'Greed',
    sanskrit: 'Lobha',
    devanagari: 'लोभ',
    description: 'The grasping hand that can never hold enough',
    color: '#059669',
    colorRGB: '5,150,105',
    keyVerse: { chapter: 14, verse: 17 },
    keyVerseText: 'lobhaḥ pravṛttiḥ ārambhaḥ karmaṇām aśamaḥ spṛhā',
    antidote: 'Generosity (Dana)',
    conqueredBy: 'Dana — generous giving without expectation',
    modernContext: "Hoarding, financial anxiety, never feeling 'enough'",
  },
  moha: {
    key: 'moha',
    name: 'Delusion',
    sanskrit: 'Moha',
    devanagari: 'मोह',
    description: 'The fog of ego that mistakes the temporary for real',
    color: '#6D28D9',
    colorRGB: '109,40,217',
    keyVerse: { chapter: 2, verse: 52 },
    keyVerseText: 'yadā te moha-kalilaṁ buddhir vyatitariṣyati',
    antidote: 'Wisdom (Viveka)',
    conqueredBy: 'Viveka-Vairagya — discrimination and detachment',
    modernContext: 'Toxic relationships, identity attachment, fear of change',
  },
  mada: {
    key: 'mada',
    name: 'Pride',
    sanskrit: 'Mada',
    devanagari: 'मद',
    description: 'The inflated self that forgets its true nature',
    color: '#1D4ED8',
    colorRGB: '29,78,216',
    keyVerse: { chapter: 16, verse: 4 },
    keyVerseText: "darpo 'bhimānatā krodhaḥ pāruṣyam eva ca",
    antidote: 'Humility (Vinaya)',
    conqueredBy: 'Namrata — genuine humility, seeing self in all',
    modernContext: 'Arrogance, inability to accept feedback, need to be right',
  },
  matsarya: {
    key: 'matsarya',
    name: 'Envy',
    sanskrit: 'Matsarya',
    devanagari: 'मात्सर्य',
    description: 'The comparing mind that cannot celebrate others',
    color: '#9D174D',
    colorRGB: '157,23,77',
    keyVerse: { chapter: 12, verse: 13 },
    keyVerseText: 'adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca',
    antidote: 'Sympathetic Joy (Mudita)',
    conqueredBy: "Mudita — sympathetic joy in others' success",
    modernContext:
      'Social media comparison, jealousy of colleagues, resentment',
  },
};

/** Canonical filter / radar order. */
export const ENEMY_ORDER: EnemyKey[] = [
  'kama',
  'krodha',
  'lobha',
  'moha',
  'mada',
  'matsarya',
];

/** Return enemy info or null when the key is missing/unknown. */
export function getEnemyInfo(key: string | undefined | null): EnemyDisplayInfo | null {
  if (!key) return null;
  const lower = key.toLowerCase() as EnemyKey;
  return ENEMY_INFO[lower] ?? null;
}

/** Resolve the enemy key from a free-text title or category. */
export function detectEnemyKey(...sources: (string | undefined | null)[]): EnemyKey | null {
  const haystack = sources.filter(Boolean).join(' ').toLowerCase();
  for (const key of ENEMY_ORDER) {
    if (haystack.includes(key)) return key;
  }
  return null;
}

/** Build an `rgba(r,g,b,alpha)` string from an enemy's colorRGB token. */
export function enemyAlpha(key: EnemyKey | null | undefined, alpha: number): string {
  const info = key ? ENEMY_INFO[key] : null;
  const rgb = info?.colorRGB ?? '212,160,23';
  return `rgba(${rgb},${alpha})`;
}

/** UI label for the backend's 1-5 difficulty integer. */
export function getDifficultyLabel(d: number | undefined): 'Easy' | 'Moderate' | 'Hard' {
  if (d === undefined || d <= 1) return 'Easy';
  if (d <= 3) return 'Moderate';
  return 'Hard';
}
