/**
 * Voice components index
 * Exports all active voice-related components for KIAAN ecosystem
 *
 * Core Voice Companion v4 components (KiaanVoiceOrb, VoiceWaveform, ConversationInsights)
 * are imported directly by the voice-companion page.
 */

export { VoiceInputButton, type VoiceInputButtonProps } from './VoiceInputButton'
export { VoiceResponseButton, type VoiceResponseButtonProps } from './VoiceResponseButton'
export { VoiceOutputButton, type VoiceOutputButtonProps } from './VoiceOutputButton'

// Voice Enhancements UI (used by Quantum Dive and other KIAAN tools)
export {
  // Individual Controls
  BinauraBeatsControl,
  SpatialAudioControl,
  BreathingSyncControl,
  AmbientSoundscapeControl,
  SleepModeControl,
  // Widgets
  DailyCheckInWidget,
  AffirmationsWidget,
  // Main Panels
  VoiceEnhancementsPanel,
  VoiceEnhancementsMobile,
  // Types
  type BinauraBeatsControlProps,
  type SpatialAudioControlProps,
  type BreathingSyncControlProps,
  type AmbientSoundscapeControlProps,
  type SleepModeControlProps,
  type DailyCheckInWidgetProps,
  type AffirmationsWidgetProps,
  type VoiceEnhancementsPanelProps,
  type VoiceEnhancementsMobileProps,
  type EnhancementType,
  type CheckInData
} from './enhancements'
