/**
 * Kiaanverse Typography Tokens
 *
 * Font families, sizes, line heights, and letter spacing as discrete
 * scales. Components compose these via the theme's text style presets.
 *
 * Display: Cinzel — cinematic serif for headers and sacred text.
 * Body: Lato — clean sans-serif for readability.
 * Mono: SpaceMono — code and data display.
 */

export const fontFamily = {
  display: 'Cinzel-Regular',
  body: 'Lato-Regular',
  bold: 'Lato-Bold',
  mono: 'SpaceMono',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 32,
  hero: 40,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  sacred: 2,
} as const;

/** Precomposed text styles for direct use in components */
export const textPresets = {
  hero: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.hero,
    lineHeight: fontSize.hero * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  display: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.display,
    lineHeight: fontSize.display * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h1: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },
  h3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  sacred: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.relaxed,
    letterSpacing: letterSpacing.sacred,
  },
  sacredSmall: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.relaxed,
    letterSpacing: letterSpacing.sacred,
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
} as const;

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type LineHeight = typeof lineHeight;
export type LetterSpacing = typeof letterSpacing;
export type TextPreset = keyof typeof textPresets;
