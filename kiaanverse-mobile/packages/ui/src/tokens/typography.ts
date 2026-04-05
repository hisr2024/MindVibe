/**
 * Kiaanverse Mobile Typography Tokens — Unified Divine System
 *
 * Font families, sizes, line heights, and letter spacing as discrete
 * scales. Components compose these via the theme's text style presets.
 *
 * Divine:     Cormorant Garamond — sacred display, Sanskrit headers, OM symbol
 * Scripture:  Crimson Text — Gita verse body, reflective/devotional text
 * Display:    Playfair Display — hero moments, affirmations, Sakha voice
 * UI:         Outfit — all functional UI text (buttons, nav, labels, numbers)
 * Devanagari: Noto Sans Devanagari — Sanskrit Unicode rendering
 *
 * Replaces: Cinzel (cannot render Devanagari), Lato, SpaceMono
 */

export const fontFamily = {
  divine: 'CormorantGaramond-Light',
  divineRegular: 'CormorantGaramond-Regular',
  divineItalic: 'CormorantGaramond-LightItalic',
  scripture: 'CrimsonText-Regular',
  scriptureItalic: 'CrimsonText-Italic',
  scriptureBold: 'CrimsonText-SemiBold',
  display: 'PlayfairDisplay-Regular',
  displayItalic: 'PlayfairDisplay-Italic',
  body: 'Outfit-Regular',
  bold: 'Outfit-SemiBold',
  medium: 'Outfit-Medium',
  devanagari: 'NotoSansDevanagari-Regular',
  devanagariMedium: 'NotoSansDevanagari-Medium',
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
  relaxed: 1.65,
  loose: 1.75,
  scripture: 1.85,
  devanagari: 2.0,
  ui: 1.4,
} as const;

export const letterSpacing = {
  tight: -0.3,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  sacred: 0.4,
  caps: 1.6,
} as const;

/** Precomposed text styles for direct use in components */
export const textPresets = {
  hero: {
    fontFamily: fontFamily.divineItalic,
    fontSize: fontSize.hero,
    lineHeight: fontSize.hero * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  display: {
    fontFamily: fontFamily.divine,
    fontSize: fontSize.display,
    lineHeight: fontSize.display * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h1: {
    fontFamily: fontFamily.divine,
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },
  h2: {
    fontFamily: fontFamily.divineRegular,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },
  h3: {
    fontFamily: fontFamily.divineRegular,
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
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.ui,
    letterSpacing: letterSpacing.caps,
  },
  sacred: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.scripture,
    letterSpacing: letterSpacing.sacred,
  },
  sacredSmall: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.loose,
    letterSpacing: letterSpacing.sacred,
  },
  affirmation: {
    fontFamily: fontFamily.displayItalic,
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  devanagari: {
    fontFamily: fontFamily.devanagari,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.devanagari,
    letterSpacing: letterSpacing.sacred,
  },
  devanagariSmall: {
    fontFamily: fontFamily.devanagari,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.devanagari,
    letterSpacing: letterSpacing.wide,
  },
} as const;

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type LineHeight = typeof lineHeight;
export type LetterSpacing = typeof letterSpacing;
export type TextPreset = keyof typeof textPresets;
