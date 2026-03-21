/**
 * @kiaanverse/ui — Shared UI components and design tokens
 */

// ---------------------------------------------------------------------------
// Tokens (raw primitives)
// ---------------------------------------------------------------------------
export { colors, type Colors } from './tokens/colors';
export {
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  textPresets,
  type TextPreset,
} from './tokens/typography';
export { spacing, type SpacingKey } from './tokens/spacing';
export { radii } from './tokens/radii';
export { shadows } from './tokens/shadows';
export { duration, spring, accessibility } from './tokens/motion';

// ---------------------------------------------------------------------------
// Theme (composed token system with dark/light mode)
// ---------------------------------------------------------------------------
export { ThemeProvider, ThemeContext } from './theme/ThemeProvider';
export { useTheme } from './theme/useTheme';
export { darkTheme, lightTheme } from './theme/themes';
export type {
  Theme,
  ThemeColors,
  ThemeContextValue,
  ThemeMode,
} from './theme/types';

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
export { Text } from './components/Text';
export { Button } from './components/Button';
export { Card } from './components/Card';
export { Input } from './components/Input';
export { Screen } from './components/Screen';
export { Divider } from './components/Divider';
export { Avatar } from './components/Avatar';
export { Badge } from './components/Badge';
export { IconButton } from './components/IconButton';
