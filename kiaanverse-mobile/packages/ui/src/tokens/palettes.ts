/**
 * Sacred Palette Tokens — four Vedic-aesthetic color schemes the user can
 * choose between (Indigo/Peacock, Maroon, Dark Green, Black & Gold).
 *
 * Each palette defines:
 *   - bg.gradient   — vertical screen backdrop (top, mid, bottom)
 *   - bg.void       — flat fallback color for non-gradient surfaces
 *   - aura          — three-stop rgba ramp for the breathing top-glow
 *   - accent.*      — the six per-page arrival accents (primary, warm, cool,
 *                     deep, life, divine). Components that previously hardcoded
 *                     KRISHNA_BLUE / PEACOCK_BRIGHT / etc. read from these.
 *   - text.title    — primary title color on dark surfaces
 *   - text.body     — body copy with built-in opacity
 *   - cta           — two-stop gradient for the primary CTA button
 *
 * Gold (`#D4A017` / `#D4A44C`) is preserved as **brand identity** in every
 * palette via `accent.warm` and `accent.divine` so OM glyphs, XP seals, and
 * tier badges stay coherent across schemes.
 *
 * The picker is wired into `useThemeStore` (`@kiaanverse/store`) and threaded
 * through `ThemeProvider` so any component using `useTheme().palette` updates
 * automatically when the user switches.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** All shipping palette ids. Keep in sync with the `PaletteId` union in
 *  `@kiaanverse/store/themeStore.ts` — string literals so they match
 *  structurally without a cross-package import. */
export type PaletteId = 'indigoPeacock' | 'maroon' | 'darkGreen' | 'blackGold';

export interface PaletteAccent {
  readonly primary: string;
  readonly warm: string;
  readonly cool: string;
  readonly deep: string;
  readonly life: string;
  readonly divine: string;
}

export interface Palette {
  readonly id: PaletteId;
  /** Long display label for sheet cards. */
  readonly label: string;
  /** Short label for chips / one-line previews. */
  readonly shortLabel: string;
  readonly bg: {
    readonly void: string;
    readonly gradient: readonly [string, string, string];
  };
  /** Three-stop rgba ramp for the breathing aura at the top of the screen. */
  readonly aura: readonly [string, string, string];
  readonly accent: PaletteAccent;
  readonly text: {
    readonly title: string;
    readonly body: string;
  };
  /** Two-stop CTA gradient (start, end). */
  readonly cta: readonly [string, string];
}

// ---------------------------------------------------------------------------
// Palette definitions
// ---------------------------------------------------------------------------

const indigoPeacock: Palette = {
  id: 'indigoPeacock',
  label: 'Indigo & Peacock',
  shortLabel: 'Indigo',
  bg: {
    void: '#050714',
    gradient: ['#050714', '#0A1228', '#050714'],
  },
  aura: ['rgba(27, 79, 187, 0.28)', 'rgba(14, 116, 144, 0.10)', 'transparent'],
  accent: {
    primary: '#1B4FBB',
    warm: '#D4A017',
    cool: '#06B6D4',
    deep: '#8B5CF6',
    life: '#10B981',
    divine: '#D4A44C',
  },
  text: {
    title: '#F5F0E8',
    body: 'rgba(245, 240, 232, 0.78)',
  },
  cta: ['#1B4FBB', '#0E7490'],
};

const maroon: Palette = {
  id: 'maroon',
  label: 'Maroon & Saffron',
  shortLabel: 'Maroon',
  bg: {
    void: '#1A0606',
    gradient: ['#1A0606', '#2B0A0A', '#3B0E0E'],
  },
  aura: ['rgba(139, 0, 0, 0.32)', 'rgba(180, 83, 9, 0.10)', 'transparent'],
  accent: {
    primary: '#8B1A1A',
    warm: '#D4A017',
    cool: '#C9302C',
    deep: '#6B0F1A',
    life: '#B45309',
    divine: '#D4A44C',
  },
  text: {
    title: '#F5DEB3',
    body: 'rgba(245, 222, 179, 0.78)',
  },
  cta: ['#6B0F1A', '#8B0000'],
};

const darkGreen: Palette = {
  id: 'darkGreen',
  label: 'Forest & Sage',
  shortLabel: 'Forest',
  bg: {
    void: '#0A1F0F',
    gradient: ['#0A1F0F', '#102818', '#163A22'],
  },
  aura: ['rgba(45, 134, 89, 0.30)', 'rgba(143, 188, 143, 0.10)', 'transparent'],
  accent: {
    primary: '#1B4D2E',
    warm: '#D4A017',
    cool: '#2D8659',
    deep: '#5B8C5A',
    life: '#8FBC8F',
    divine: '#D4A44C',
  },
  text: {
    title: '#E8F5E8',
    body: 'rgba(232, 245, 232, 0.78)',
  },
  cta: ['#1B4D2E', '#2D8659'],
};

const blackGold: Palette = {
  id: 'blackGold',
  label: 'Black & Gold',
  shortLabel: 'Gold',
  bg: {
    void: '#000000',
    gradient: ['#000000', '#0A0A0A', '#141414'],
  },
  aura: ['rgba(212, 160, 23, 0.32)', 'rgba(212, 160, 23, 0.08)', 'transparent'],
  accent: {
    primary: '#D4A017',
    warm: '#E8B54A',
    cool: '#B8860B',
    deep: '#8B6914',
    life: '#F0C96D',
    divine: '#FFD700',
  },
  text: {
    title: '#D4A44C',
    body: 'rgba(212, 164, 76, 0.82)',
  },
  cta: ['#D4A017', '#E8B54A'],
};

/** Lookup table — ordered for the picker UI (default first). */
export const PALETTES: Record<PaletteId, Palette> = {
  indigoPeacock,
  maroon,
  darkGreen,
  blackGold,
} as const;

/** Stable display order for the picker bottom sheet. */
export const PALETTE_ORDER: readonly PaletteId[] = [
  'indigoPeacock',
  'maroon',
  'darkGreen',
  'blackGold',
] as const;

export const DEFAULT_PALETTE_ID: PaletteId = 'indigoPeacock';

/** Resolve a palette by id with a safe default — handy when reading from
 *  persisted storage where the user might be on a stale id. */
export function resolvePalette(id: string | null | undefined): Palette {
  if (id && id in PALETTES) {
    return PALETTES[id as PaletteId];
  }
  return PALETTES[DEFAULT_PALETTE_ID];
}
