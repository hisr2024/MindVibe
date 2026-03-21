/**
 * Kiaanverse Spacing Scale
 *
 * 4px base grid. Every spatial value in the UI is a multiple of 4
 * for consistent visual rhythm and alignment.
 */

export const spacing = {
  /** 4px — hairline gaps, icon padding */
  xxs: 4,
  /** 8px — tight element spacing */
  xs: 8,
  /** 12px — compact group padding */
  sm: 12,
  /** 16px — standard content padding */
  md: 16,
  /** 24px — section spacing */
  lg: 24,
  /** 32px — card padding, large gaps */
  xl: 32,
  /** 48px — section dividers */
  xxl: 48,
  /** 64px — page-level spacing */
  xxxl: 64,

  /** Layout constants */
  navHeight: 88,
  miniPlayerHeight: 64,
  bottomInset: 152,
  headerHeight: 56,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof typeof spacing;
