/**
 * Kiaanverse Theme Type Definitions
 *
 * Full typed interfaces for the design token system. Every theme-aware
 * component consumes these types — no `string` color values leak through.
 */

import type { colors } from '../tokens/colors';
import type { fontFamily, fontSize, lineHeight, letterSpacing, textPresets } from '../tokens/typography';
import type { spacing } from '../tokens/spacing';
import type { radii } from '../tokens/radii';
import type { duration, spring } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Theme mode
// ---------------------------------------------------------------------------

export type ThemeMode = 'dark' | 'light' | 'system';

// ---------------------------------------------------------------------------
// Semantic color slots — resolved per-mode (dark vs light)
// ---------------------------------------------------------------------------

export interface ThemeColors {
  /** App chrome backgrounds */
  readonly background: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly card: string;
  readonly cardBorder: string;

  /** Text hierarchy */
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;

  /** Brand accent */
  readonly accent: string;
  readonly accentLight: string;
  readonly accentMuted: string;

  /** Navigation chrome */
  readonly tabBarBackground: string;
  readonly tabBarBorder: string;
  readonly miniPlayerBackground: string;

  /** Form controls */
  readonly inputBackground: string;
  readonly inputBorder: string;

  /** Structural */
  readonly divider: string;
  readonly overlay: string;

  /** Status bar appearance */
  readonly statusBarStyle: 'light-content' | 'dark-content';
}

// ---------------------------------------------------------------------------
// Full theme object — colors + all static tokens
// ---------------------------------------------------------------------------

export interface Theme {
  /** Mode-resolved color slots */
  readonly colors: ThemeColors;

  /** Raw color palette — for one-off divine/semantic access */
  readonly palette: typeof colors;

  /** Typography primitives */
  readonly fontFamily: typeof fontFamily;
  readonly fontSize: typeof fontSize;
  readonly lineHeight: typeof lineHeight;
  readonly letterSpacing: typeof letterSpacing;
  readonly textPresets: typeof textPresets;

  /** Spatial rhythm */
  readonly spacing: typeof spacing;

  /** Corner radii */
  readonly radii: typeof radii;

  /** Animation timing */
  readonly duration: typeof duration;
  readonly spring: typeof spring;
}

// ---------------------------------------------------------------------------
// Context value — theme + mode controls
// ---------------------------------------------------------------------------

export interface ThemeContextValue {
  readonly theme: Theme;
  readonly isDark: boolean;
  readonly mode: ThemeMode;
  readonly setMode: (mode: ThemeMode) => void;
}
