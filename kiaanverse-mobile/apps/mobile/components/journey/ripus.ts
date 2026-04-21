/**
 * ShadRipu — the six "inner enemies" of Vedic psychology.
 *
 * Every journey in the catalog names one of these as its adversary; the
 * visual system in turn keys its color stripe, badge, Sanskrit glyph,
 * and progress-ring arc off this registry. Keep this file the single
 * source of truth so the discover list, detail hero, and celebration
 * overlays never drift from one another.
 *
 * Note: the prompt lists Bhaya (fear) which is NOT a classical shadripu
 * — the canonical six are kama, krodha, lobha, moha, mada, matsarya.
 * To honor the spec we include `bhaya` as a seventh "companion"
 * antagonist; the backend's closed `EnemyType` enum still only emits
 * the canonical six, so the UI only shows Bhaya when a template's
 * category / title explicitly names it.
 */

export type RipuKey =
  | 'krodha'
  | 'bhaya'
  | 'kama'
  | 'lobha'
  | 'moha'
  | 'mada'
  | 'matsarya';

export interface Ripu {
  readonly key: RipuKey;
  /** English translation (e.g. "Anger"). */
  readonly name: string;
  /** Sanskrit spelling in Devanagari (e.g. "क्रोध"). */
  readonly sanskrit: string;
  /** Symbolic emoji / glyph used on chips + hero. */
  readonly symbol: string;
  /** Semantic accent color — drives stripe, badge, progress arc. */
  readonly color: string;
}

/** Indexed registry — keep insertion order stable for the filter row. */
export const RIPUS: Readonly<Record<RipuKey, Ripu>> = {
  krodha: {
    key: 'krodha',
    name: 'Anger',
    sanskrit: 'क्रोध',
    symbol: '🔥',
    color: '#EF4444',
  },
  bhaya: {
    key: 'bhaya',
    name: 'Fear',
    sanskrit: 'भय',
    symbol: '💧',
    color: '#3B82F6',
  },
  kama: {
    key: 'kama',
    name: 'Desire',
    sanskrit: 'काम',
    symbol: '🌙',
    color: '#F59E0B',
  },
  lobha: {
    key: 'lobha',
    name: 'Greed',
    sanskrit: 'लोभ',
    symbol: '💰',
    color: '#10B981',
  },
  moha: {
    key: 'moha',
    name: 'Delusion',
    sanskrit: 'मोह',
    symbol: '🌀',
    color: '#8B5CF6',
  },
  mada: {
    key: 'mada',
    name: 'Pride',
    sanskrit: 'मद',
    symbol: '♛',
    color: '#EC4899',
  },
  matsarya: {
    key: 'matsarya',
    name: 'Envy',
    sanskrit: 'मत्सर्य',
    symbol: '🪞',
    color: '#06B6D4',
  },
};

/** Ordered list — used for horizontal-scroll filter rendering. */
export const RIPU_ORDER: readonly RipuKey[] = [
  'krodha',
  'bhaya',
  'kama',
  'lobha',
  'moha',
  'mada',
  'matsarya',
];

/** Default neutral accent used when no ripu is detected in the metadata. */
export const NEUTRAL_ACCENT = '#D4A017';

/**
 * Resolve the ripu associated with a piece of journey metadata. We try
 * the title first (most reliable), then the category label, and finally
 * the description. Returns `null` so the caller can fall back to a
 * neutral accent rather than mis-coloring the card.
 */
export function resolveRipu(fields: {
  readonly title?: string | undefined;
  readonly category?: string | undefined;
  readonly description?: string | undefined;
}): Ripu | null {
  const haystack = [
    fields.title ?? '',
    fields.category ?? '',
    fields.description ?? '',
  ]
    .join(' ')
    .toLowerCase();

  for (const key of RIPU_ORDER) {
    if (haystack.includes(key)) return RIPUS[key];
    const eng = RIPUS[key].name.toLowerCase();
    if (haystack.includes(eng)) return RIPUS[key];
  }
  return null;
}

/**
 * Convert `#RRGGBB` / `#RGB` into `rgba(r,g,b,a)` — used by cards that
 * derive a tinted background + border from a single ripu accent.
 */
export function ripuAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const bigint = parseInt(expanded, 16);
  const r = (bigint >> 16) & 0xff;
  const g = (bigint >> 8) & 0xff;
  const b = bigint & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
