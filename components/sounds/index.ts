/**
 * Ambient Sounds Components
 *
 * Premium UI/UX components for immersive audio experiences:
 * - AmbientSoundsPlayer: Full-featured ambient sound player
 * - SoundVisualizer: Audio-reactive visualizations
 * - SoundSceneCard: Beautiful scene preset cards
 * - SoundMixer: Professional sound mixing interface
 * - SoundTimer: Timer with fade-out functionality
 * - FloatingSoundPlayer: Compact mini player
 */

// Main Player
export { AmbientSoundsPlayer, type AmbientSoundsPlayerProps } from './AmbientSoundsPlayer'

// Visualizer
export { SoundVisualizer, type SoundVisualizerProps, type VisualizerMode } from './SoundVisualizer'

// Scene Cards
export {
  SoundSceneCard,
  SOUND_SCENES,
  type SoundScene,
  type SoundSceneCardProps
} from './SoundSceneCard'

// Mixer
export {
  SoundMixer,
  type SoundMixerProps,
  type MixerChannel,
  type SoundDefinition
} from './SoundMixer'

// Timer
export { SoundTimer, type SoundTimerProps } from './SoundTimer'

// Floating Player
export { FloatingSoundPlayer, type FloatingSoundPlayerProps } from './FloatingSoundPlayer'

// Global Player (for app layout)
export { GlobalSoundPlayer } from './GlobalSoundPlayer'
