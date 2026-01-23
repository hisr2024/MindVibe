/**
 * Voice Enhancements UI Components
 *
 * Comprehensive UI for KIAAN voice enhancement features:
 * - BinauraBeatsControl: Brainwave entrainment controls
 * - SpatialAudioControl: 3D immersive audio settings
 * - BreathingSyncControl: Voice-synced breathwork guide
 * - AmbientSoundscapeControl: Layered ambient sound mixer
 * - SleepModeControl: Gradual sleep induction settings
 * - DailyCheckInWidget: Morning/evening wellness check-ins
 * - AffirmationsWidget: Personalized positive affirmations
 * - VoiceEnhancementsPanel: Main container panel
 * - VoiceEnhancementsMobile: Mobile-optimized bottom sheet
 */

// Individual Controls
export { BinauraBeatsControl, type BinauraBeatsControlProps } from './BinauraBeatsControl'
export { SpatialAudioControl, type SpatialAudioControlProps } from './SpatialAudioControl'
export { BreathingSyncControl, type BreathingSyncControlProps } from './BreathingSyncControl'
export { AmbientSoundscapeControl, type AmbientSoundscapeControlProps } from './AmbientSoundscapeControl'
export { SleepModeControl, type SleepModeControlProps } from './SleepModeControl'

// Widgets
export { DailyCheckInWidget, type DailyCheckInWidgetProps, type CheckInData } from './DailyCheckInWidget'
export { AffirmationsWidget, type AffirmationsWidgetProps } from './AffirmationsWidget'

// Main Panels
export { VoiceEnhancementsPanel, type VoiceEnhancementsPanelProps, type EnhancementType } from './VoiceEnhancementsPanel'
export { VoiceEnhancementsMobile, type VoiceEnhancementsMobileProps } from './VoiceEnhancementsMobile'

// Re-export types
export type { BrainwavePreset } from './BinauraBeatsControl'
export type { RoomEnvironment, MovementPath } from './SpatialAudioControl'
export type { BreathingPattern, BreathPhase } from './BreathingSyncControl'
export type { SoundCategory, SoundType, ActiveSound } from './AmbientSoundscapeControl'
export type { SleepContentType } from './SleepModeControl'
export type { CheckInTime, MoodLevel, EnergyLevel } from './DailyCheckInWidget'
export type { AffirmationCategory, Affirmation } from './AffirmationsWidget'
