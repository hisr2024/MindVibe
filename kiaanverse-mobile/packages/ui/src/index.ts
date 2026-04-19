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
export {
  GOLDEN_RATIO,
  mandala,
  lotus,
  breathingPatterns,
  sacredGradients,
  particles,
  chakraColors,
  type BreathingPattern,
  type ChakraColor,
} from './tokens/sacred';
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
export { MandalaSpin, type MandalaSpinProps } from './components/MandalaSpin';
export { ConfettiCannon, type ConfettiCannonProps } from './components/ConfettiCannon';
export { EmotionOrb, type EmotionOrbProps, type EmotionOrbMood } from './components/EmotionOrb';
export { LotusProgress, type LotusProgressProps } from './components/LotusProgress';
export { DivineGradient, type DivineGradientProps, type DivineGradientVariant } from './components/DivineGradient';
export { SacredTransition, type SacredTransitionProps } from './components/SacredTransition';
export { WaveformVisualizer, type WaveformVisualizerProps } from './components/WaveformVisualizer';

// Divine visual components
export { DivineBackground, type DivineBackgroundProps, type DivineBackgroundVariant } from './components/DivineBackground';
export { GlowCard, type GlowCardProps, type GlowCardVariant } from './components/GlowCard';
export { SacredDivider, type SacredDividerProps } from './components/SacredDivider';
export { BreathingOrb, type BreathingOrbProps } from './components/BreathingOrb';
export { SacredBottomSheet, type SacredBottomSheetProps } from './components/SacredBottomSheet';
export { SacredStepIndicator, type SacredStepIndicatorProps } from './components/SacredStepIndicator';

// ---------------------------------------------------------------------------
// Sacred web-parity component library
// (1:1 twins of the Kiaanverse web design system)
// ---------------------------------------------------------------------------
export { SacredCard, type SacredCardProps } from './components/SacredCard';
export {
  DivineButton,
  type DivineButtonProps,
  type DivineButtonVariant,
} from './components/DivineButton';
export { SacredInput, type SacredInputProps } from './components/SacredInput';
export { GoldenDivider, type GoldenDividerProps } from './components/GoldenDivider';
export { VerseRevelation, type VerseRevelationProps } from './components/VerseRevelation';
export { OmLoader, type OmLoaderProps } from './components/OmLoader';
export { SakhaMandala, type SakhaMandalaProps } from './components/SakhaMandala';
export {
  DivinePresenceIndicator,
  type DivinePresenceIndicatorProps,
} from './components/DivinePresenceIndicator';
export {
  SacredProgressRing,
  type SacredProgressRingProps,
} from './components/SacredProgressRing';
export { ShlokaCard, type ShlokaCardProps } from './components/ShlokaCard';
export {
  SacredBadge,
  type SacredBadgeProps,
  type SacredBadgeTone,
} from './components/SacredBadge';
export { SacredChip, type SacredChipProps } from './components/SacredChip';

// ---------------------------------------------------------------------------
// Hooks (audio / voice)
// ---------------------------------------------------------------------------
export { useAudioPlayer } from './hooks/useAudioPlayer';
export { useSpeechOutput } from './hooks/useSpeechOutput';
export { useVoiceRecorder, type TranscribeFn, type TranscriptionResult } from './hooks/useVoiceRecorder';
