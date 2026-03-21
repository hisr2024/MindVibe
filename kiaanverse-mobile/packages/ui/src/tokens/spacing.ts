/**
 * Kiaanverse Spacing Scale
 *
 * Base unit: 4px. All spacing values are multiples of 4
 * for consistent visual rhythm.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  /** Height of the bottom tab bar */
  navHeight: 88,
  /** Height of the mini vibe player */
  miniPlayerHeight: 64,
  /** Combined height of nav + mini player */
  bottomInset: 152,
  /** Header height */
  headerHeight: 56,
} as const;
