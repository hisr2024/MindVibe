/**
 * Kiaanverse Unified Typography System — Single Source of Truth
 *
 * Four sacred fonts unified across web, React Native, and mobile:
 *   divine:     Cormorant Garamond — sacred display, Sanskrit headers, OM
 *   scripture:  Crimson Text — Gita verse body, reflective text
 *   display:    Playfair Display — hero moments, affirmations
 *   ui:         Outfit — all UI text, buttons, navigation, labels
 *
 * Replaces the three conflicting systems that previously existed.
 * All platforms import from here or mirror these values.
 */

// ── Font Families ──────────────────────────────────────────────────────

export const FONT_FAMILIES = {

  /** Sacred display (32–54px). Thin serifs echo Sanskrit manuscript calligraphy. */
  divine: {
    family: '"Cormorant Garamond", "Georgia", serif',
    cssVar: '--font-divine',
    weights: [300, 400, 500, 600] as const,
    italicWeights: [300, 400, 500] as const,
    googleFontsQuery: 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500',
    minimumReadableSize: 18,
    bestAt: '26px–54px',
  },

  /** Scripture body (15–22px). Old-style serif with warm humanist proportions. */
  scripture: {
    family: '"Crimson Text", "Georgia", "Times New Roman", serif',
    cssVar: '--font-scripture',
    weights: [400, 600] as const,
    italicWeights: [400] as const,
    googleFontsQuery: 'Crimson+Text:ital,wght@0,400;0,600;1,400',
    minimumReadableSize: 15,
    bestAt: '15px–22px',
  },

  /** Hero display (20–42px). High-contrast serifs for emotional impact. */
  display: {
    family: '"Playfair Display", "Georgia", serif',
    cssVar: '--font-display',
    weights: [400, 700] as const,
    italicWeights: [400, 700] as const,
    googleFontsQuery: 'Playfair+Display:ital,wght@0,400;0,700;1,400;1,700',
    minimumReadableSize: 20,
    bestAt: '20px–42px',
  },

  /** UI sans-serif (11–18px). Geometric with large x-height, clear I/l/1. */
  ui: {
    family: '"Outfit", "system-ui", "-apple-system", sans-serif',
    cssVar: '--font-ui',
    weights: [300, 400, 500, 600] as const,
    googleFontsQuery: 'Outfit:wght@300;400;500;600',
    minimumReadableSize: 11,
    bestAt: '11px–18px',
  },

} as const

// ── International Font Stacks ──────────────────────────────────────────

export const INTERNATIONAL_FONTS = {

  /** Devanagari (Hindi, Sanskrit, Marathi, Nepali) */
  devanagari: {
    primary: '"Noto Sans Devanagari", "Mangal", "Arial Unicode MS", sans-serif',
    googleFontsQuery: 'Noto+Sans+Devanagari:wght@400;500;600',
    minimumReadableSize: 16,
    lineHeightMultiplier: 1.4,
  },

  /** Arabic / Urdu / Farsi */
  arabic: {
    primary: '"Cairo", "Noto Sans Arabic", "Arial", sans-serif',
    googleFontsQuery: 'Cairo:wght@400;500;600',
    direction: 'rtl' as const,
  },

  /**
   * Sanskrit Unicode rendering.
   * CRITICAL: Cormorant Garamond cannot render Devanagari.
   * Always use Noto Sans Devanagari for actual Sanskrit Unicode characters.
   * Cormorant Garamond is fine for romanized/transliterated Sanskrit (Latin script).
   */
  sanskrit: {
    primary: '"Noto Sans Devanagari", "Mangal", "Arial Unicode MS", serif',
    weight: 400,
    lineHeight: 2.0,
    letterSpacing: '0.06em',
    fontSize: { display: 28, verse: 18, label: 14 },
  },

} as const

// ── Unified Type Scale ─────────────────────────────────────────────────

export const TYPE_SCALE = {

  // Display sizes (Cormorant Garamond / Playfair Display)
  '5xl': { size: 54, mobileSize: 40, lineHeight: 1.1, letterSpacing: '-0.02em', weight: 300, font: 'divine' as const },
  '4xl': { size: 42, mobileSize: 36, lineHeight: 1.15, letterSpacing: '-0.01em', weight: 300, font: 'divine' as const },
  '3xl': { size: 32, mobileSize: 28, lineHeight: 1.2, letterSpacing: '-0.01em', weight: 300, font: 'divine' as const },
  '2xl': { size: 26, mobileSize: 24, lineHeight: 1.3, letterSpacing: '0', weight: 400, font: 'divine' as const },
  'xl':  { size: 21, mobileSize: 20, lineHeight: 1.4, letterSpacing: '0', weight: 400, font: 'divine' as const },

  // Body sizes (Crimson Text / Outfit)
  'lg':   { size: 18, mobileSize: 17, lineHeight: 1.65, letterSpacing: '0', weight: 400, font: 'scripture' as const },
  'base': { size: 16, mobileSize: 16, lineHeight: 1.6, letterSpacing: '0', weight: 400, font: 'ui' as const },
  'sm':   { size: 14, mobileSize: 14, lineHeight: 1.5, letterSpacing: '0.01em', weight: 400, font: 'ui' as const },

  // Label / Caption / Micro (Outfit only)
  'label':   { size: 13, mobileSize: 13, lineHeight: 1.4, letterSpacing: '0.02em', weight: 500, font: 'ui' as const },
  'caption': { size: 12, mobileSize: 12, lineHeight: 1.4, letterSpacing: '0.02em', weight: 400, font: 'ui' as const },
  'micro':   { size: 11, mobileSize: 10, lineHeight: 1.3, letterSpacing: '0.12em', weight: 500, font: 'ui' as const },

  // Sacred special sizes (Crimson Text — optimized for devotional readability)
  'sacred':    { size: 20, mobileSize: 18, lineHeight: 1.85, letterSpacing: '0.04em', weight: 400, font: 'scripture' as const },
  'sacred-sm': { size: 16, mobileSize: 15, lineHeight: 1.75, letterSpacing: '0.03em', weight: 400, font: 'scripture' as const },

} as const

// ── Backward-compatible exports ────────────────────────────────────────
// These match the old export shape so existing imports don't break.

export const typography = {
  fonts: {
    sans: FONT_FAMILIES.ui.family,
    display: FONT_FAMILIES.divine.family,
    divine: FONT_FAMILIES.divine.family,
    scripture: FONT_FAMILIES.scripture.family,
    ui: FONT_FAMILIES.ui.family,
  },

  pageHeadings: {
    fontSize: `${TYPE_SCALE['3xl'].mobileSize}px`,
    fontWeight: 600,
    lineHeight: TYPE_SCALE['3xl'].lineHeight,
    letterSpacing: TYPE_SCALE['3xl'].letterSpacing,
  },

  sectionHeadings: {
    fontSize: `${TYPE_SCALE.xl.mobileSize}px`,
    fontWeight: 600,
    lineHeight: TYPE_SCALE.xl.lineHeight,
  },

  cardTitles: {
    fontSize: `${TYPE_SCALE.base.size}px`,
    fontWeight: 600,
    lineHeight: TYPE_SCALE.base.lineHeight,
  },

  body: {
    fontSize: `${TYPE_SCALE.base.size}px`,
    fontWeight: 400,
    lineHeight: TYPE_SCALE.base.lineHeight,
  },

  small: {
    fontSize: `${TYPE_SCALE.label.size}px`,
    fontWeight: 400,
    lineHeight: TYPE_SCALE.label.lineHeight,
  },

  caption: {
    fontSize: `${TYPE_SCALE.caption.size}px`,
    fontWeight: 400,
    lineHeight: TYPE_SCALE.caption.lineHeight,
  },
} as const

export type TypographyFonts = typeof typography.fonts
export type TypographyStyle = typeof typography.pageHeadings
export type TypeScaleKey = keyof typeof TYPE_SCALE

export default typography
