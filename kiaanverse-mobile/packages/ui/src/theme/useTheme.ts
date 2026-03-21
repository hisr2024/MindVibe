/**
 * Hook to access the Kiaanverse design token system.
 *
 * Returns the full Theme object (colors, typography, spacing, radii, motion)
 * plus dark-mode flag and mode setter.
 *
 * @example
 * ```tsx
 * function VerseCard() {
 *   const { theme, isDark } = useTheme();
 *
 *   return (
 *     <View style={{
 *       backgroundColor: theme.colors.card,
 *       padding: theme.spacing.md,
 *       borderRadius: theme.radii.lg,
 *     }}>
 *       <Text style={{
 *         ...theme.textPresets.sacred,
 *         color: theme.colors.accent,
 *       }}>
 *         कर्मण्येवाधिकारस्ते
 *       </Text>
 *       <Text style={{
 *         ...theme.textPresets.bodySmall,
 *         color: theme.colors.textSecondary,
 *       }}>
 *         You have the right to action alone...
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import type { ThemeContextValue } from './types';

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
