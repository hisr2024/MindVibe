/**
 * Divine Theme — Spacing, Radii, Shadows
 *
 * Every spatial value is a multiple of 4 (the base grid). Components
 * MUST compose from these tokens, never literal numbers. This keeps
 * rhythm consistent across hundreds of screens.
 */

export const spacing = {
  /** 0px — collapse */
  none: 0,
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
  /** 64px — page-level breathing room */
  xxxl: 64,
  /** 96px — hero-level ceremonial whitespace */
  colossal: 96,

  /** Layout constants — anchored to device chrome */
  navHeight: 88,
  miniPlayerHeight: 64,
  bottomInset: 152,
  headerHeight: 56,
  tabBarHeight: 64,
} as const;

export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

/**
 * Cross-platform shadow presets. iOS uses shadow* props, Android uses
 * `elevation`. Glow variants tint the shadow with divine gold so cards
 * feel illuminated from within rather than drop-shadowed from above.
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  glowStrong: {
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  glowPeacock: {
    shadowColor: '#0E7490',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof typeof spacing;
export type Radii = typeof radii;
export type RadiiKey = keyof typeof radii;
export type Shadows = typeof shadows;
export type ShadowKey = keyof typeof shadows;
