/**
 * Vibe Player State Store (Zustand)
 *
 * Manages the UI state for the KIAAN Vibe Player. The actual audio playback
 * is handled by react-native-track-player (native). This store tracks:
 * - Current track metadata (for display)
 * - Expanded/collapsed state
 * - Repeat mode, playback speed, sleep timer
 * - Queue visibility
 *
 * Does NOT manage audio buffers or playback position — that comes from
 * the useProgress() and usePlaybackState() hooks from react-native-track-player.
 */

import { create } from 'zustand';
import type { VibeTrack } from '@components/vibe-player/VibePlayer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RepeatMode = 'off' | 'one' | 'all';
export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 2.0;

export interface SleepTimerConfig {
  /** Timer duration in minutes (0 = off) */
  minutes: number;
  /** Timestamp when timer was started */
  startedAt: number | null;
}

interface VibePlayerState {
  /** The currently playing/selected track (for UI display) */
  currentTrack: VibeTrack | null;
  /** Whether the full player is expanded */
  isExpanded: boolean;
  /** Whether a track is currently loaded (player visible) */
  isPlayerVisible: boolean;
  /** Repeat mode */
  repeatMode: RepeatMode;
  /** Playback speed multiplier */
  speed: PlaybackSpeed;
  /** Sleep timer configuration */
  sleepTimer: SleepTimerConfig;
  /** Whether the queue view is visible */
  isQueueVisible: boolean;
  /** Playlist of tracks */
  playlist: VibeTrack[];
}

interface VibePlayerActions {
  /** Set the current track (called when track changes) */
  setCurrentTrack: (track: VibeTrack | null) => void;
  /** Toggle expanded/collapsed player state */
  toggleExpanded: (expanded?: boolean) => void;
  /** Show or hide the player bar */
  setPlayerVisible: (visible: boolean) => void;
  /** Cycle through repeat modes: off → all → one → off */
  cycleRepeatMode: () => void;
  /** Set a specific playback speed */
  setSpeed: (speed: PlaybackSpeed) => void;
  /** Set sleep timer (0 to disable) */
  setSleepTimer: (minutes: number) => void;
  /** Clear the sleep timer */
  clearSleepTimer: () => void;
  /** Toggle queue visibility */
  toggleQueue: () => void;
  /** Set the playlist */
  setPlaylist: (tracks: VibeTrack[]) => void;
  /** Add a track to the end of the playlist */
  addToPlaylist: (track: VibeTrack) => void;
  /** Remove a track from the playlist by ID */
  removeFromPlaylist: (trackId: string) => void;
  /** Reset the entire player state */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: VibePlayerState = {
  currentTrack: null,
  isExpanded: false,
  isPlayerVisible: false,
  repeatMode: 'off',
  speed: 1.0,
  sleepTimer: { minutes: 0, startedAt: null },
  isQueueVisible: false,
  playlist: [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const REPEAT_CYCLE: RepeatMode[] = ['off', 'all', 'one'];

export const useVibePlayerStore = create<VibePlayerState & VibePlayerActions>(
  (set) => ({
    ...initialState,

    setCurrentTrack: (track) =>
      set({
        currentTrack: track,
        isPlayerVisible: track !== null,
      }),

    toggleExpanded: (expanded) =>
      set((state) => ({
        isExpanded: expanded ?? !state.isExpanded,
      })),

    setPlayerVisible: (visible) =>
      set({ isPlayerVisible: visible }),

    cycleRepeatMode: () =>
      set((state) => {
        const currentIndex = REPEAT_CYCLE.indexOf(state.repeatMode);
        const nextIndex = (currentIndex + 1) % REPEAT_CYCLE.length;
        return { repeatMode: REPEAT_CYCLE[nextIndex] };
      }),

    setSpeed: (speed) => set({ speed }),

    setSleepTimer: (minutes) =>
      set({
        sleepTimer: {
          minutes,
          startedAt: minutes > 0 ? Date.now() : null,
        },
      }),

    clearSleepTimer: () =>
      set({
        sleepTimer: { minutes: 0, startedAt: null },
      }),

    toggleQueue: () =>
      set((state) => ({ isQueueVisible: !state.isQueueVisible })),

    setPlaylist: (tracks) => set({ playlist: tracks }),

    addToPlaylist: (track) =>
      set((state) => {
        // Prevent duplicates
        if (state.playlist.some((t) => t.id === track.id)) {
          return state;
        }
        return { playlist: [...state.playlist, track] };
      }),

    removeFromPlaylist: (trackId) =>
      set((state) => ({
        playlist: state.playlist.filter((t) => t.id !== trackId),
      })),

    reset: () => set(initialState),
  }),
);
