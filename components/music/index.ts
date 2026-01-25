/**
 * Music Components Index
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Professional music system components for MindVibe
 */

// Main Players
export { GlobalMusicPlayer } from './GlobalMusicPlayer'
export { MeditationMusicPlayer } from './MeditationMusicPlayer'
export { FloatingMusicPlayer } from './FloatingMusicPlayer'
export { DashboardMusicWidget } from './DashboardMusicWidget'

// Spiritual Music Player - Simple & Clean
export { SpiritualMusicPlayer } from './SpiritualMusicPlayer'

// Meditation Player - Natural Ultra HD Music
export { MeditationPlayer } from './MeditationPlayer'

// Simple Music Player - Clean & Minimal with User Uploads
export { SimpleMusicPlayer } from './SimpleMusicPlayer'

// Visualizations
export { AdvancedVisualizer } from './AdvancedVisualizer'

// Therapeutic Programs
export { ProgramTracker } from './ProgramTracker'

// Re-export context for convenience
export {
  useMusic,
  useMeditationMusic,
  useAmbientMusic,
  useSpiritualMusic,
  useTimeMusic,
  MusicProvider,
  AMBIENT_MODES,
  MEDITATION_TYPES,
  SPIRITUAL_MODES,
  TIME_MUSIC_INFO,
  SACRED_FREQUENCIES
} from '@/contexts/MusicContext'

export type {
  MusicSystemState,
  AmbientMusicMode,
  MeditationType,
  SpiritualMode,
  TimeOfDay,
  RagaTime,
  BrainwaveState
} from '@/contexts/MusicContext'

// Re-export therapeutic programs
export {
  therapeuticProgramsEngine,
  THERAPEUTIC_PROGRAMS
} from '@/utils/audio/TherapeuticProgramsEngine'

export type {
  TherapeuticProgram,
  ProgramSession,
  ProgramEnrollment,
  ProgramType
} from '@/utils/audio/TherapeuticProgramsEngine'
