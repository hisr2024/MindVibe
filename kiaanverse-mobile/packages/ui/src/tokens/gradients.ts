/**
 * Kiaanverse Gradient Tokens — Canonical KIAANVERSE Spec
 *
 * Reusable gradient presets for the divine visual experience. Each preset
 * defines color stops suitable for expo-linear-gradient's `colors` prop.
 *
 * Dark mode: Cosmic void → yamuna deep transitions, gold shimmers, Krishna aura.
 * Light mode: Warm cream → sunlit white transitions.
 */

import {
  COSMIC_VOID,
  DIVINE_GOLD,
  GOLD_BRIGHT,
  KRISHNA_BLUE,
  PEACOCK_TEAL,
  YAMUNA_DEEP,
  colors,
} from './colors';

/** Gradient color stop arrays (suitable for LinearGradient `colors` prop). */
export const gradients = {
  /**
   * Vertical cosmic background — primary screen backdrop (BG_VERTICAL).
   * Symmetric void → yamuna → void so the eye finds stillness at the edges.
   */
  cosmicBackground: {
    dark: [COSMIC_VOID, YAMUNA_DEEP, COSMIC_VOID] as const,
    light: ['#FAF7F2', '#F5F0E8', '#EDE8DC'] as const,
  },

  /**
   * Warm golden shimmer — five-stop shimmer for headers and featured
   * elements (GOLD_SHIMMER). Peak at GOLD_BRIGHT between two DIVINE_GOLD
   * shoulders, fading to transparent at both ends.
   */
  goldenShimmer: {
    dark: [
      'transparent',
      'rgba(212, 160, 23, 0.4)',
      'rgba(240, 192, 64, 0.8)',
      'rgba(212, 160, 23, 0.4)',
      'transparent',
    ] as const,
    light: [
      'transparent',
      'rgba(212, 160, 23, 0.3)',
      'rgba(240, 192, 64, 0.6)',
      'rgba(212, 160, 23, 0.3)',
      'transparent',
    ] as const,
  },

  /** Subtle card surface elevation — adds sacred depth to cards (SACRED_CARD). */
  sacredCard: {
    dark: ['rgba(22, 26, 66, 0.95)', 'rgba(17, 20, 53, 0.98)'] as const,
    light: ['rgba(255, 255, 255, 0.98)', 'rgba(255, 248, 220, 0.6)'] as const,
  },

  /** Golden aura glow — radial-style positioned at top center */
  divineAura: {
    dark: ['rgba(212, 160, 23, 0.12)', 'rgba(212, 160, 23, 0.04)', 'transparent'] as const,
    light: ['rgba(212, 160, 23, 0.08)', 'rgba(212, 160, 23, 0.02)', 'transparent'] as const,
  },

  /**
   * Krishna aura — deep Krishna blue → peacock teal.
   * Primary action buttons, link emphasis (KRISHNA_AURA).
   */
  krishnaAura: {
    dark: [KRISHNA_BLUE, PEACOCK_TEAL] as const,
    light: [KRISHNA_BLUE, PEACOCK_TEAL] as const,
  },

  /**
   * Gold button — DIVINE_GOLD → GOLD_BRIGHT → DIVINE_GOLD (GOLD_BUTTON).
   * Reserved for premium/milestone actions.
   */
  goldButton: {
    dark: [DIVINE_GOLD, GOLD_BRIGHT, DIVINE_GOLD] as const,
    light: [DIVINE_GOLD, GOLD_BRIGHT, DIVINE_GOLD] as const,
  },

  /**
   * Hero overlay — transparent → 60% void → 95% void. Darkens hero imagery
   * bottom-up so overlaid text stays legible (HERO_OVERLAY).
   */
  heroOverlay: {
    dark: ['rgba(5, 7, 20, 0)', 'rgba(5, 7, 20, 0.6)', 'rgba(5, 7, 20, 0.95)'] as const,
    light: ['rgba(250, 247, 242, 0)', 'rgba(250, 247, 242, 0.6)', 'rgba(250, 247, 242, 0.95)'] as const,
  },

  /** Peacock iridescent — teal to bright-peacock accent */
  peacockSheen: {
    dark: ['rgba(14, 116, 144, 0.6)', 'rgba(6, 182, 212, 0.3)', 'transparent'] as const,
    light: ['rgba(14, 116, 144, 0.15)', 'rgba(6, 182, 212, 0.08)', 'transparent'] as const,
  },

  /** Lotus glow — soft rose accent */
  lotusGlow: {
    dark: ['rgba(255, 107, 107, 0.2)', 'rgba(255, 107, 107, 0.05)', 'transparent'] as const,
    light: ['rgba(255, 107, 107, 0.1)', 'rgba(255, 107, 107, 0.03)', 'transparent'] as const,
  },

  /** Saffron warmth — warm orange accent */
  saffronWarm: {
    dark: ['rgba(255, 102, 0, 0.2)', 'rgba(255, 102, 0, 0.05)', 'transparent'] as const,
    light: ['rgba(255, 102, 0, 0.1)', 'rgba(255, 102, 0, 0.03)', 'transparent'] as const,
  },

  /** Tab bar fade — transparent → opaque cosmic void */
  tabBarFade: {
    dark: ['transparent', 'rgba(5, 7, 20, 0.8)', 'rgba(5, 7, 20, 0.98)'] as const,
    light: ['transparent', 'rgba(250, 247, 242, 0.8)', 'rgba(250, 247, 242, 0.98)'] as const,
  },

  /** Golden divider — transparent → gold → transparent */
  goldenDivider: {
    dark: ['transparent', colors.alpha.goldMedium, 'transparent'] as const,
    light: ['transparent', colors.alpha.goldLight, 'transparent'] as const,
  },

  /** Progress bar shimmer overlay — moving highlight */
  progressShimmer: {
    dark: ['transparent', 'rgba(240, 192, 64, 0.3)', 'transparent'] as const,
    light: ['transparent', 'rgba(212, 160, 23, 0.2)', 'transparent'] as const,
  },
} as const;

export type Gradients = typeof gradients;
