/**
 * Voice components index
 * Exports all voice-related components
 */

export { VoiceInputButton, type VoiceInputButtonProps } from './VoiceInputButton'
export { VoiceOutputButton, type VoiceOutputButtonProps } from './VoiceOutputButton'
export { WakeWordDetector, type WakeWordDetectorProps } from './WakeWordDetector'
export { HandsFreeSession, type HandsFreeSessionProps } from './HandsFreeSession'
export { VoiceSettingsPanel, type VoiceSettingsPanelProps, type VoiceSettings } from './VoiceSettingsPanel'

// Voice Enhancements UI
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
