/**
 * Voice components index
 * Exports active voice-related components for KIAAN ecosystem
 */

export { ShankhaIcon } from '@/components/icons/ShankhaIcon'

// Inline voice UI buttons (used across KIAAN ecosystem tools)
export { VoiceInputButton } from './VoiceInputButton'
export { VoiceResponseButton } from './VoiceResponseButton'
export { VoiceOutputButton } from './VoiceOutputButton'

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
