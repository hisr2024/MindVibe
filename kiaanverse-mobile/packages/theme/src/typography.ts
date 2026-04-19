/**
 * Divine Theme — Typography Tokens
 *
 * Font family names MUST match expo-font's loaded assets exactly.
 * TypeScript consumers import `fontFamily` — never string literals —
 * so renaming a font is a single-file refactor.
 *
 * Font roles:
 *   Divine     — Cormorant Garamond (Sanskrit headers, OM glyphs, hero)
 *   Scripture  — Crimson Text (Gita verse body, devotional prose)
 *   Display    — Playfair Display (affirmations, Sakha voice)
 *   UI         — Outfit (buttons, labels, nav, numerics)
 *   Devanagari — Noto Sans Devanagari (Sanskrit Unicode)
 */

/**
 * Branded string to prevent accidental use of unloaded font names.
 * Cast only within this file — consumers import typed constants.
 */
export type FontFamilyName = string & { readonly __fontFamily: unique symbol };

const asFont = (name: string): FontFamilyName => name as FontFamilyName;

export const fontFamily = {
  divine: asFont('CormorantGaramond-Light'),
  divineRegular: asFont('CormorantGaramond-Regular'),
  divineItalic: asFont('CormorantGaramond-LightItalic'),
  scripture: asFont('CrimsonText-Regular'),
  scriptureItalic: asFont('CrimsonText-Italic'),
  scriptureBold: asFont('CrimsonText-SemiBold'),
  display: asFont('PlayfairDisplay-Regular'),
  displayItalic: asFont('PlayfairDisplay-Italic'),
  body: asFont('Outfit-Regular'),
  bodyMedium: asFont('Outfit-Medium'),
  bodyBold: asFont('Outfit-SemiBold'),
  devanagari: asFont('NotoSansDevanagari-Regular'),
  devanagariMedium: asFont('NotoSansDevanagari-Medium'),
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
  colossal: 56,
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

/**
 * Fully composed text styles. Components call
 * `style={textPresets.hero}` rather than assembling by hand,
 * which keeps scripture + devanagari renderings consistent
 * across every screen.
 */
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
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.ui,
    letterSpacing: letterSpacing.caps,
  },
  button: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.ui,
    letterSpacing: letterSpacing.wide,
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
