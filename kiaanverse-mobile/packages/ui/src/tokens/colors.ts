/**
 * Kiaanverse Color Tokens
 *
 * Ported from MindVibe mobile design system (mobile/react-native/src/theme/tokens.ts).
 * Single source of truth for all color values in the Kiaanverse app.
 */

export const colors = {
  /** MindVibe brand palette */
  mv: {
    sunrise: '#d4a44c',
    sunriseHighlight: '#f0c96d',
    ocean: '#17b1a7',
    oceanSky: '#6dd7f2',
    aurora: '#ff8fb4',
    auroraLilac: '#c2a5ff',
  },

  /** KIAAN brand colors */
  kiaan: {
    deep: '#0a0a12',
    glow: '#e8b54a',
  },

  /** Spiritual mode accents */
  modes: {
    innerPeace: '#1fb8c0',
    mindControl: '#1e3a8a',
    selfKindness: '#e57ac5',
  },

  /** Gold scale (primary accent) */
  gold: {
    50: '#fdf8ef',
    100: '#f5e6c8',
    200: '#f0d9a8',
    300: '#e8c380',
    400: '#e8b54a',
    500: '#d4a44c',
    600: '#c8943a',
    700: '#a67a2e',
    800: '#7a5a22',
    900: '#4e3a16',
  },

  /** Divine palette (dark theme foundation) */
  divine: {
    black: '#050507',
    void: '#0a0a12',
    surface: '#0f0f18',
    cream: '#f5f0e8',
    muted: '#a89e8e',
  },

  /** Semantic colors */
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  /** Transparency utilities */
  alpha: {
    goldLight: 'rgba(212, 164, 76, 0.12)',
    goldMedium: 'rgba(212, 164, 76, 0.25)',
    goldStrong: 'rgba(212, 164, 76, 0.4)',
    blackLight: 'rgba(0, 0, 0, 0.2)',
    blackMedium: 'rgba(0, 0, 0, 0.35)',
    blackHeavy: 'rgba(0, 0, 0, 0.6)',
    whiteLight: 'rgba(255, 255, 255, 0.05)',
    whiteMedium: 'rgba(255, 255, 255, 0.12)',
  },
} as const;
