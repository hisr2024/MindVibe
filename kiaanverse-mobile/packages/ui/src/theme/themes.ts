/**
 * Kiaanverse Theme Definitions
 *
 * Dark (Golden Black) is the default spiritual theme.
 * Light (Warm Cream) is the alternative daytime theme.
 */

import { colors } from '../tokens/colors';

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

export const darkTheme: ThemeColors = {
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
  statusBarStyle: 'light-content',
};

export const lightTheme: ThemeColors = {
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
  statusBarStyle: 'dark-content',
};
