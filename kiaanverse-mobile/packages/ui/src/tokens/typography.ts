/**
 * Kiaanverse Typography Scale
 *
 * Font sizes in sp units for React Native. Sacred variants use
 * the CrimsonText font family for spiritual content.
 */

export const typography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  sacred: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
    fontFamily: 'CrimsonText-Regular',
  },
  sacredSmall: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    fontFamily: 'CrimsonText-Regular',
  },
} as const;

export type TypographyVariant = keyof typeof typography;
