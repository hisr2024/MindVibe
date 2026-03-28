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
export { gradients } from './tokens/gradients';

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

// Animated components
export { GoldenButton, type GoldenButtonProps, type GoldenButtonVariant } from './components/GoldenButton';
export { SakhaAvatar, type SakhaAvatarProps, type SakhaState } from './components/SakhaAvatar';
export { VerseCard, type VerseCardProps, type VerseData } from './components/VerseCard';
export { ChatBubble, type ChatBubbleProps, type ChatRole } from './components/ChatBubble';
export { MoodRing, type MoodRingProps, type Mood } from './components/MoodRing';
export { KarmaTree, type KarmaTreeProps, type KarmaNode } from './components/KarmaTree';
export { GoldenHeader, type GoldenHeaderProps } from './components/GoldenHeader';
export { LoadingMandala, type LoadingMandalaProps } from './components/LoadingMandala';
export { CompletionCelebration, type CompletionCelebrationProps } from './components/CompletionCelebration';
export { GoldenProgressBar, type GoldenProgressBarProps } from './components/GoldenProgressBar';
export { VoiceWaveform, type VoiceWaveformProps } from './components/VoiceWaveform';

// Divine visual components
export { DivineBackground, type DivineBackgroundProps, type DivineBackgroundVariant } from './components/DivineBackground';
export { GlowCard, type GlowCardProps, type GlowCardVariant } from './components/GlowCard';
export { SacredDivider, type SacredDividerProps } from './components/SacredDivider';

// ---------------------------------------------------------------------------
// Hooks (audio / voice)
// ---------------------------------------------------------------------------
export { useAudioPlayer } from './hooks/useAudioPlayer';
export { useSpeechOutput } from './hooks/useSpeechOutput';
export { useVoiceRecorder, type TranscribeFn, type TranscriptionResult } from './hooks/useVoiceRecorder';
