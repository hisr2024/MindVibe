/**
 * Kiaanverse Theme Definitions
 *
 * Dark (Cosmic Navy + Gold) is the default — temple sanctity at midnight.
 * Light (Warm Cream + Brass) is the daytime alternative — morning puja warmth.
 *
 * Both themes share the same token structure (spacing, typography, radii, motion)
 * and only differ in color resolution.
 */

import { colors } from '../tokens/colors';
import { gradients } from '../tokens/gradients';
import { fontFamily, fontSize, lineHeight, letterSpacing, textPresets } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { duration, spring } from '../tokens/motion';
import type { Theme, ThemeColors } from './types';

// ---------------------------------------------------------------------------
// Dark mode colors — deep navy backgrounds, gold accents
// ---------------------------------------------------------------------------

const darkColors: ThemeColors = {
  background: colors.background.dark,
  surface: colors.background.card,
  surfaceElevated: colors.background.surface,
  card: colors.background.card,
  cardBorder: colors.alpha.goldLight,
  textPrimary: colors.text.primary,
  textSecondary: colors.text.secondary,
  textTertiary: colors.text.muted,
  accent: colors.primary[500],
  accentLight: colors.primary[300],
  accentMuted: colors.primary[700],
  tabBarBackground: 'rgba(5, 7, 20, 0.95)',
  tabBarBorder: colors.alpha.goldLight,
  miniPlayerBackground: 'rgba(11, 14, 42, 0.98)',
  inputBackground: colors.alpha.whiteLight,
  inputBorder: colors.alpha.whiteMedium,
  divider: colors.alpha.whiteLight,
  overlay: colors.alpha.blackHeavy,
  statusBarStyle: 'light-content',
  gradientBackground: gradients.cosmicBackground.dark,
  gradientAura: gradients.divineAura.dark,
  gradientCard: gradients.sacredCard.dark,
  gradientTabBar: gradients.tabBarFade.dark,
};

// ---------------------------------------------------------------------------
// Light mode colors — warm cream backgrounds, brass accents
// ---------------------------------------------------------------------------

const lightColors: ThemeColors = {
  background: '#FAF7F2',
  surface: colors.primary[100],
  surfaceElevated: colors.raw.white,
  card: colors.raw.white,
  cardBorder: colors.alpha.goldMedium,
  textPrimary: '#1A1714',
  textSecondary: '#6B6358',
  textTertiary: '#9E9589',
  accent: colors.primary[700],
  accentLight: colors.primary[500],
  accentMuted: colors.primary[900],
  tabBarBackground: 'rgba(250, 247, 242, 0.95)',
  tabBarBorder: colors.alpha.goldLight,
  miniPlayerBackground: 'rgba(255, 255, 255, 0.98)',
  inputBackground: 'rgba(0, 0, 0, 0.03)',
  inputBorder: 'rgba(0, 0, 0, 0.08)',
  divider: 'rgba(0, 0, 0, 0.06)',
  overlay: colors.alpha.blackMedium,
  statusBarStyle: 'dark-content',
  gradientBackground: gradients.cosmicBackground.light,
  gradientAura: gradients.divineAura.light,
  gradientCard: gradients.sacredCard.light,
  gradientTabBar: gradients.tabBarFade.light,
};

// ---------------------------------------------------------------------------
// Shared static tokens (identical across modes)
// ---------------------------------------------------------------------------

const sharedTokens = {
  palette: colors,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  textPresets,
  spacing,
  radii,
  duration,
  spring,
} as const;

// ---------------------------------------------------------------------------
// Composed theme objects
// ---------------------------------------------------------------------------

export const darkTheme: Theme = {
  colors: darkColors,
  ...sharedTokens,
};

export const lightTheme: Theme = {
  colors: lightColors,
  ...sharedTokens,
};
