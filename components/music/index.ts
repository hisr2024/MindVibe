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
