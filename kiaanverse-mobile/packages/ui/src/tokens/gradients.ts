/**
 * Kiaanverse Gradient Tokens
 *
 * Reusable gradient presets for the divine visual experience.
 * Each preset defines color stops and optional positioning
 * for use with expo-linear-gradient's LinearGradient component.
 *
 * Dark mode: Deep cosmic navy → midnight surface transitions.
 * Light mode: Warm cream → sunlit white transitions.
 */

import { colors } from './colors';

/** Gradient color stop arrays (suitable for LinearGradient `colors` prop). */
export const gradients = {
  /** Vertical cosmic background — primary screen backdrop */
  cosmicBackground: {
    dark: [colors.background.dark, colors.background.card, colors.background.surface] as const,
    light: ['#FAF7F2', '#F5F0E8', '#EDE8DC'] as const,
  },

  /** Warm golden shimmer — headers, featured elements */
  goldenShimmer: {
    dark: [colors.primary[900], colors.primary[500], colors.primary[300]] as const,
    light: [colors.primary[700], colors.primary[500], colors.primary[300]] as const,
  },

  /** Subtle card surface elevation — adds depth to cards */
  sacredCard: {
    dark: ['rgba(13, 18, 41, 0.95)', 'rgba(19, 26, 61, 0.85)'] as const,
    light: ['rgba(255, 255, 255, 0.98)', 'rgba(255, 248, 220, 0.6)'] as const,
  },

  /** Golden aura glow — radial-style positioned at top center */
  divineAura: {
    dark: ['rgba(212, 160, 23, 0.12)', 'rgba(212, 160, 23, 0.04)', 'transparent'] as const,
    light: ['rgba(212, 160, 23, 0.08)', 'rgba(212, 160, 23, 0.02)', 'transparent'] as const,
  },

  /** Peacock iridescent — teal to blue accent */
  peacockSheen: {
    dark: ['rgba(15, 94, 140, 0.6)', 'rgba(6, 182, 212, 0.3)', 'transparent'] as const,
    light: ['rgba(15, 94, 140, 0.15)', 'rgba(6, 182, 212, 0.08)', 'transparent'] as const,
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

  /** Tab bar fade — transparent to opaque background */
  tabBarFade: {
    dark: ['transparent', 'rgba(8, 11, 26, 0.8)', 'rgba(8, 11, 26, 0.98)'] as const,
    light: ['transparent', 'rgba(250, 247, 242, 0.8)', 'rgba(250, 247, 242, 0.98)'] as const,
  },

  /** Golden divider — transparent → gold → transparent */
  goldenDivider: {
    dark: ['transparent', colors.alpha.goldMedium, 'transparent'] as const,
    light: ['transparent', colors.alpha.goldLight, 'transparent'] as const,
  },

  /** Progress bar shimmer overlay — moving highlight */
  progressShimmer: {
    dark: [
      'transparent',
      'rgba(240, 192, 64, 0.3)',
      'transparent',
    ] as const,
    light: [
      'transparent',
      'rgba(212, 160, 23, 0.2)',
      'transparent',
    ] as const,
  },
} as const;

export type Gradients = typeof gradients;
