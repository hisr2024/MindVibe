/**
 * Kiaanverse Color Tokens — Canonical KIAANVERSE Android Palette
 *
 * Cosmic dark theme with golden accents. Every hex value in the entire
 * design system lives here — components must NEVER use hardcoded colors.
 *
 * Palette philosophy: Deep cosmic void grounds the user in stillness,
 * gold accents (used sparingly, <20% of elements) invoke the divine,
 * peacock & Krishna blue carry action, semantic tool colors guide the
 * six emotional tool flows (anger, fear, desire, greed, delusion, pride).
 */

// ---------------------------------------------------------------------------
// Canonical named constants — import these for the KIAANVERSE spec spellings.
// ---------------------------------------------------------------------------

// Backgrounds (the darkness law — never pure #000000)
export const COSMIC_VOID = '#050714'; // Primary bg — the space between stars
export const YAMUNA_DEEP = '#0B0E2A'; // Card backgrounds
export const SACRED_INDIGO = '#161A42'; // Elevated surfaces
export const TEMPLE_SHADOW = '#1E2448'; // Highest elevation

// Accents (the gold law — sacred fire, used sparingly like sandalwood paste)
export const DIVINE_GOLD = '#D4A017'; // Primary accent — sparingly
export const GOLD_BRIGHT = '#F0C040'; // Shimmer peak
export const GOLD_SOFT = '#F5E27A'; // Lightest gold
export const KRISHNA_BLUE = '#1B4FBB'; // Action, links
export const PEACOCK_TEAL = '#0E7490'; // Secondary action
export const PEACOCK_BRIGHT = '#06B6D4'; // Highlight

// Text
export const SACRED_WHITE = '#F0EBE1'; // Primary text (NOT #FFFFFF)
export const TEXT_SECONDARY = '#A89474'; // Secondary text
export const TEXT_MUTED = '#6B6355'; // Timestamps, hints

// Semantic tool colors — one per emotional transformation tool
export const ANGER_RED = '#EF4444'; // Krodha / Emotional Reset
export const FEAR_BLUE = '#3B82F6'; // Bhaya
export const DESIRE_AMBER = '#F59E0B'; // Kama / Ardha
export const GREED_GREEN = '#10B981'; // Lobha
export const DELUSION_PURPLE = '#8B5CF6'; // Moha
export const PRIDE_PINK = '#EC4899'; // Mada

// ---------------------------------------------------------------------------
// Structured token object (backwards-compatible with existing consumers).
// ---------------------------------------------------------------------------

export const colors = {
  /** Primary gold scale — brand accent, CTAs, highlights. Use sparingly. */
  primary: {
    900: '#3D2B00',
    700: '#8B6914',
    500: DIVINE_GOLD,
    300: GOLD_BRIGHT,
    200: GOLD_SOFT,
    100: '#FFF8DC',
  },

  /** Background layers — darkest cosmic void to highest temple shadow */
  background: {
    void: COSMIC_VOID,
    dark: COSMIC_VOID,
    card: YAMUNA_DEEP,
    surface: SACRED_INDIGO,
    elevated: TEMPLE_SHADOW,
  },

  /** Text hierarchy — sacred white down to muted timestamps */
  text: {
    primary: SACRED_WHITE,
    secondary: TEXT_SECONDARY,
    muted: TEXT_MUTED,
    accent: DIVINE_GOLD,
  },

  /** Feedback colors — accessible on the cosmic void backdrop */
  semantic: {
    success: '#3D8B5E',
    error: '#C0392B',
    warning: '#E67E22',
    info: '#2980B9',
  },

  /** Emotional tool palette — one color per transformation journey */
  tools: {
    anger: ANGER_RED,
    fear: FEAR_BLUE,
    desire: DESIRE_AMBER,
    greed: GREED_GREEN,
    delusion: DELUSION_PURPLE,
    pride: PRIDE_PINK,
  },

  /** Sacred palette — ceremonial, celebration, spiritual states */
  divine: {
    aura: '#FFD700',
    lotus: '#FF6B6B',
    krishna: KRISHNA_BLUE,
    peacock: PEACOCK_TEAL,
    peacockBright: PEACOCK_BRIGHT,
    saffron: '#FF6600',
  },

  /** Transparency utilities for overlays, borders, glows */
  alpha: {
    goldLight: 'rgba(212, 160, 23, 0.08)',
    goldMedium: 'rgba(212, 160, 23, 0.16)',
    goldStrong: 'rgba(212, 160, 23, 0.32)',
    krishnaSoft: 'rgba(27, 79, 187, 0.12)',
    peacockSoft: 'rgba(6, 182, 212, 0.12)',
    blackLight: 'rgba(0, 0, 0, 0.2)',
    blackMedium: 'rgba(0, 0, 0, 0.4)',
    blackHeavy: 'rgba(0, 0, 0, 0.7)',
    whiteLight: 'rgba(255, 255, 255, 0.05)',
    whiteMedium: 'rgba(255, 255, 255, 0.10)',
    whiteStrong: 'rgba(255, 255, 255, 0.20)',
  },

  /** Raw values — use only in theme definitions, not components */
  raw: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
} as const;

export type Colors = typeof colors;
