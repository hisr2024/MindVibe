/**
 * MindVibe Mobile Design System Tokens
 *
 * Mirrors the Kiaanverse Unified Typography System adapted for React Native.
 * These tokens are the single source of truth for all visual properties
 * in the mobile app.
 *
 * Fonts: Cormorant Garamond (divine), Crimson Text (scripture),
 *        Playfair Display (display), Outfit (ui), Noto Sans Devanagari
 */

import { Platform } from 'react-native';

export const colors = {
  /** MindVibe brand palette */
  mv: {
    sunrise: '#d4a44c',
    sunriseHighlight: '#f0c96d',
    ocean: '#17b1a7',
    oceanSky: '#6dd7f2',
    aurora: '#ff8fb4',
    auroraLilac: '#c2a5ff',
  },

  /** KIAAN brand colors */
  kiaan: {
    deep: '#0a0a12',
    glow: '#e8b54a',
  },

  /** Spiritual mode accents */
  modes: {
    innerPeace: '#1fb8c0',
    mindControl: '#1e3a8a',
    selfKindness: '#e57ac5',
  },

  /** Gold scale (primary accent) */
  gold: {
    50: '#fdf8ef',
    100: '#f5e6c8',
    200: '#f0d9a8',
    300: '#e8c380',
    400: '#e8b54a',
    500: '#d4a44c',
    600: '#c8943a',
    700: '#a67a2e',
    800: '#7a5a22',
    900: '#4e3a16',
  },

  /** Divine palette (dark theme foundation) */
  divine: {
    black: '#050507',
    void: '#0a0a12',
    surface: '#0f0f18',
    cream: '#f5f0e8',
    muted: '#a89e8e',
  },

  /** Semantic colors */
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  /** Transparency utilities */
  alpha: {
    goldLight: 'rgba(212, 164, 76, 0.12)',
    goldMedium: 'rgba(212, 164, 76, 0.25)',
    goldStrong: 'rgba(212, 164, 76, 0.4)',
    blackLight: 'rgba(0, 0, 0, 0.2)',
    blackMedium: 'rgba(0, 0, 0, 0.35)',
    blackHeavy: 'rgba(0, 0, 0, 0.6)',
    whiteLight: 'rgba(255, 255, 255, 0.05)',
    whiteMedium: 'rgba(255, 255, 255, 0.12)',
  },
} as const;

/** Dark theme (Golden Black — default) */
export const darkTheme = {
  background: colors.divine.black,
  surface: colors.divine.void,
  surfaceElevated: colors.divine.surface,
  card: '#12121e',
  cardBorder: 'rgba(212, 164, 76, 0.08)',
  textPrimary: colors.gold[100],
  textSecondary: colors.divine.muted,
  textTertiary: 'rgba(168, 158, 142, 0.6)',
  accent: colors.gold[500],
  accentLight: colors.gold[400],
  tabBarBackground: 'rgba(5, 5, 7, 0.95)',
  tabBarBorder: 'rgba(212, 164, 76, 0.06)',
  miniPlayerBackground: 'rgba(15, 15, 24, 0.98)',
  inputBackground: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  statusBarStyle: 'light-content' as const,
} as const;

/** Light theme (Warm Cream) */
export const lightTheme = {
  background: '#faf7f2',
  surface: colors.divine.cream,
  surfaceElevated: '#ffffff',
  card: '#ffffff',
  cardBorder: 'rgba(212, 164, 76, 0.12)',
  textPrimary: '#1a1714',
  textSecondary: '#6b6358',
  textTertiary: '#9e9589',
  accent: colors.gold[600],
  accentLight: colors.gold[500],
  tabBarBackground: 'rgba(250, 247, 242, 0.95)',
  tabBarBorder: 'rgba(212, 164, 76, 0.1)',
  miniPlayerBackground: 'rgba(255, 255, 255, 0.98)',
  inputBackground: 'rgba(0, 0, 0, 0.03)',
  inputBorder: 'rgba(0, 0, 0, 0.08)',
  divider: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  statusBarStyle: 'dark-content' as const,
} as const;

export interface ThemeColors {
  readonly background: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly card: string;
  readonly cardBorder: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly accent: string;
  readonly accentLight: string;
  readonly tabBarBackground: string;
  readonly tabBarBorder: string;
  readonly miniPlayerBackground: string;
  readonly inputBackground: string;
  readonly inputBorder: string;
  readonly divider: string;
  readonly overlay: string;
  readonly statusBarStyle: 'light-content' | 'dark-content';
}

/** Font family definitions — platform-aware for iOS/Android */
export const fontFamilies = {
  divine: Platform.select({ ios: 'CormorantGaramond-Light', android: 'CormorantGaramond-Light', default: 'serif' }),
  divineItalic: Platform.select({ ios: 'CormorantGaramond-LightItalic', android: 'CormorantGaramond-LightItalic', default: 'serif' }),
  divineRegular: Platform.select({ ios: 'CormorantGaramond-Regular', android: 'CormorantGaramond-Regular', default: 'serif' }),
  scripture: Platform.select({ ios: 'CrimsonText-Regular', android: 'CrimsonText-Regular', default: 'serif' }),
  scriptureItalic: Platform.select({ ios: 'CrimsonText-Italic', android: 'CrimsonText-Italic', default: 'serif' }),
  display: Platform.select({ ios: 'PlayfairDisplay-Regular', android: 'PlayfairDisplay-Regular', default: 'serif' }),
  displayItalic: Platform.select({ ios: 'PlayfairDisplay-Italic', android: 'PlayfairDisplay-Italic', default: 'serif' }),
  ui: Platform.select({ ios: 'Outfit-Regular', android: 'Outfit-Regular', default: 'sans-serif' }),
  uiMedium: Platform.select({ ios: 'Outfit-Medium', android: 'Outfit-Medium', default: 'sans-serif-medium' }),
  uiSemiBold: Platform.select({ ios: 'Outfit-SemiBold', android: 'Outfit-SemiBold', default: 'sans-serif-medium' }),
  devanagari: Platform.select({ ios: 'NotoSansDevanagari', android: 'NotoSansDevanagari-Regular', default: 'sans-serif' }),
} as const;

/** Typography scale (sp units for React Native) — Unified Kiaanverse system */
export const typography = {
  // Display (Cormorant Garamond)
  displayHero: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '300' as const,
    letterSpacing: -0.8,
    fontFamily: fontFamilies.divineItalic,
  },
  displayLarge: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '300' as const,
    letterSpacing: -0.4,
    fontFamily: fontFamilies.divine,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '300' as const,
    letterSpacing: -0.3,
    fontFamily: fontFamilies.divine,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '400' as const,
    letterSpacing: 0,
    fontFamily: fontFamilies.divineRegular,
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '400' as const,
    letterSpacing: 0,
    fontFamily: fontFamilies.divineRegular,
  },

  // Scripture (Crimson Text)
  sacred: {
    fontSize: 18,
    lineHeight: 33,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    fontFamily: fontFamilies.scriptureItalic,
  },
  sacredSmall: {
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
    fontFamily: fontFamilies.scriptureItalic,
  },
  verse: {
    fontSize: 17,
    lineHeight: 30,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    fontFamily: fontFamilies.scripture,
  },

  // Display hero (Playfair Display)
  affirmation: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
    fontFamily: fontFamilies.displayItalic,
  },

  // Body (Outfit)
  bodyLarge: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400' as const,
    letterSpacing: 0,
    fontFamily: fontFamilies.ui,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
    fontFamily: fontFamilies.ui,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    fontFamily: fontFamilies.ui,
  },
  label: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 1.4,
    fontFamily: fontFamilies.uiMedium,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    fontFamily: fontFamilies.ui,
  },
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 1.6,
    fontFamily: fontFamilies.uiMedium,
  },

  // Devanagari (Sanskrit Unicode)
  devanagariDisplay: {
    fontSize: 36,
    lineHeight: 52,
    fontWeight: '400' as const,
    letterSpacing: 0.6,
    fontFamily: fontFamilies.devanagari,
  },
  devanagariVerse: {
    fontSize: 18,
    lineHeight: 36,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    fontFamily: fontFamilies.devanagari,
  },
  devanagariSmall: {
    fontSize: 15,
    lineHeight: 28,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
    fontFamily: fontFamilies.devanagari,
  },
} as const;

/** Spacing scale (multiples of 4) */
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

/** Border radius tokens */
export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  sheet: 28,
  full: 9999,
} as const;

/** Shadow presets for React Native (elevation on Android, shadow* on iOS) */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.gold[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  glowStrong: {
    shadowColor: colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

/** Animation timing presets (for Reanimated) */
export const motion = {
  /** Micro-interactions (button press, toggle) */
  fast: { duration: 150 },
  /** Standard transitions (card expand, tab switch) */
  normal: { duration: 250 },
  /** Deliberate transitions (sheet open, screen change) */
  slow: { duration: 350 },
  /** Spring config for gesture-driven animations */
  spring: { damping: 20, stiffness: 200, mass: 1 },
  /** Gentle spring for sheet transitions */
  sheetSpring: { damping: 25, stiffness: 150, mass: 1 },
  /** Bouncy spring for celebrations */
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
} as const;

/** Touch target constraints (accessibility) */
export const accessibility = {
  /** Minimum touch target (WCAG 2.1 AA) */
  minTouchTarget: 44,
  /** Minimum contrast ratio for normal text */
  minContrastNormal: 4.5,
  /** Minimum contrast ratio for large text */
  minContrastLarge: 3.0,
} as const;
