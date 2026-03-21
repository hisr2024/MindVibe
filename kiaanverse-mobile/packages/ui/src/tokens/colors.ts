/**
 * Kiaanverse Color Tokens
 *
 * Cosmic dark theme with golden accents. Every hex value in the entire
 * design system lives here — components must NEVER use hardcoded colors.
 *
 * Palette philosophy: Deep navy backgrounds ground the user in stillness,
 * gold accents invoke the divine, semantic colors guide without alarming.
 */

export const colors = {
  /** Primary gold scale — brand accent, CTAs, highlights */
  primary: {
    900: '#3D2B00',
    700: '#8B6914',
    500: '#D4A017',
    300: '#F0C040',
    100: '#FFF8DC',
  },

  /** Background layers — darkest to lightest elevation */
  background: {
    dark: '#080B1A',
    card: '#0D1229',
    surface: '#131A3D',
  },

  /** Text hierarchy — primary down to accent callouts */
  text: {
    primary: '#F5F0E8',
    secondary: '#C8BFA8',
    muted: '#7A7060',
    accent: '#D4A017',
  },

  /** Feedback colors — accessible on dark backgrounds */
  semantic: {
    success: '#3D8B5E',
    error: '#C0392B',
    warning: '#E67E22',
    info: '#2980B9',
  },

  /** Sacred palette — ceremonial, celebration, spiritual states */
  divine: {
    aura: '#FFD700',
    lotus: '#FF6B6B',
    peacock: '#0F5E8C',
    saffron: '#FF6600',
  },

  /** Transparency utilities for overlays, borders, glows */
  alpha: {
    goldLight: 'rgba(212, 160, 23, 0.08)',
    goldMedium: 'rgba(212, 160, 23, 0.16)',
    goldStrong: 'rgba(212, 160, 23, 0.32)',
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
