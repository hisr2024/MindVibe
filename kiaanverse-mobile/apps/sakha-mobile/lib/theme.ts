/**
 * Sakha brand tokens.
 *
 * Single source of truth for color, type, motion. Every screen pulls
 * from here so the brand stays canonical (per spec: "Aesthetic standard:
 * cinematic, realistic, divine, heart-touching").
 */

export const Color = {
  // COSMIC_VOID — canonical Kiaanverse cosmic backdrop
  cosmicVoid: '#050714',
  cosmicVoidSoft: '#0A0E22',
  // DIVINE_GOLD — primary accent (Sanskrit text, accents, soft glows)
  divineGold: '#D4A017',
  divineGoldBright: '#F0C040',
  divineGoldDim: '#7A5C0D',
  // Conch (Shankha) — cream/ivory body, warm copper rim
  shankhaCream: '#F5EBD8',
  shankhaIvory: '#E8D8B5',
  shankhaCopper: '#B0784A',
  // Mood washes
  anxiousWash: '#1B2A4A',
  griefWash: '#3D2A4A',
  hopefulWash: '#1F3D32',
  crisisWash: '#5C1F1F',
  // Functional
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textCrisis: '#FCA5A5',
  divider: '#1F2937',
  // States
  errorRed: '#DC2626',
  cautionAmber: '#F59E0B',
} as const;

export const Type = {
  // Cormorant Garamond — display + Sanskrit + soft headings
  display: { fontFamily: 'CormorantGaramond-SemiBold', fontSize: 28, lineHeight: 34 },
  hero: { fontFamily: 'CormorantGaramond-Light', fontSize: 22, lineHeight: 28 },
  // Devanagari — Noto Sans Devanagari for Sanskrit
  sanskrit: { fontFamily: 'NotoSansDevanagari-Medium', fontSize: 24, lineHeight: 36 },
  // Body
  body: { fontFamily: 'System', fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: 'System', fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: 'System', fontSize: 11, lineHeight: 14 },
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const Radius = {
  sm: 6, md: 12, lg: 18, pill: 999,
} as const;

export const Motion = {
  // Reanimated timing presets
  durationFast: 180,
  durationStd: 280,
  durationSlow: 480,
  durationBreath: 1400,
} as const;

export const Theme = { Color, Type, Spacing, Radius, Motion } as const;
export default Theme;
