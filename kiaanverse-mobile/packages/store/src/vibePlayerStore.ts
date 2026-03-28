/**
 * Vibe Player Store — manages KIAAN Vibe Player state.
 *
 * Handles:
 * - Current track and queue management
 * - Playback state (play/pause/seek/volume)
 * - Repeat and shuffle modes
 * - Mini player visibility
 *
 * Persists: volume, repeatMode, isShuffled, queue.
 * Transient: playback progress, isPlaying, mini player visibility.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RepeatMode = 'off' | 'one' | 'all';

export interface VibeTrack {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  audioUrl: string;
  duration: number;
}

interface VibePlayerState {
  /** Currently playing track (null if nothing loaded) */
  currentTrack: VibeTrack | null;
  /** Whether audio is actively playing */
  isPlaying: boolean;
  /** Playback progress (0-1) */
  progress: number;
  /** Volume level (0-1) */
  volume: number;
  /** Upcoming tracks queue */
  queue: VibeTrack[];
  /** Repeat mode: off, repeat one, repeat all */
  repeatMode: RepeatMode;
  /** Whether shuffle is enabled */
  isShuffled: boolean;
  /** Whether the mini player overlay is visible */
  isMiniPlayerVisible: boolean;
}

interface VibePlayerActions {
  /** Set the current track (resets progress) */
  setTrack: (track: VibeTrack | null) => void;
  /** Start playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Toggle play/pause */
  togglePlay: () => void;
  /** Set playback progress (0-1) */
  setProgress: (progress: number) => void;
  /** Set volume level (0-1) */
  setVolume: (volume: number) => void;
  /** Add a track to the end of the queue */
  addToQueue: (track: VibeTrack) => void;
  /** Remove a track from the queue by ID */
  removeFromQueue: (trackId: string) => void;
  /** Clear the entire queue */
  clearQueue: () => void;
  /** Set the repeat mode directly */
  setRepeatMode: (mode: RepeatMode) => void;
  /** Toggle shuffle on/off */
  toggleShuffle: () => void;
  /** Show the mini player overlay */
  showMiniPlayer: () => void;
  /** Hide the mini player overlay */
  hideMiniPlayer: () => void;
  /** Skip to the next track in the queue */
  nextTrack: () => void;
  /** Go back to the previous track or restart current */
  prevTrack: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: VibePlayerState = {
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  volume: 1,
  queue: [],
  repeatMode: 'off',
  isShuffled: false,
  isMiniPlayerVisible: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useVibePlayerStore = create<VibePlayerState & VibePlayerActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setTrack: (track: VibeTrack | null) => {
          set((state) => {
            state.currentTrack = track;
            state.progress = 0;
            state.isMiniPlayerVisible = track !== null;
          });
        },

        play: () => {
          set((state) => {
            state.isPlaying = true;
          });
        },

        pause: () => {
          set((state) => {
            state.isPlaying = false;
          });
        },

        togglePlay: () => {
          set((state) => {
            state.isPlaying = !state.isPlaying;
          });
        },

        setProgress: (progress: number) => {
          set((state) => {
            state.progress = Math.max(0, Math.min(1, progress));
          });
        },

        setVolume: (volume: number) => {
          set((state) => {
            state.volume = Math.max(0, Math.min(1, volume));
          });
        },

        addToQueue: (track: VibeTrack) => {
          set((state) => {
            state.queue.push(track);
          });
        },

        removeFromQueue: (trackId: string) => {
          set((state) => {
            state.queue = state.queue.filter((t) => t.id !== trackId);
          });
        },

        clearQueue: () => {
          set((state) => {
            state.queue = [];
          });
        },

        setRepeatMode: (mode: RepeatMode) => {
          set((state) => {
            state.repeatMode = mode;
          });
        },

        toggleShuffle: () => {
          set((state) => {
            state.isShuffled = !state.isShuffled;
          });
        },

        showMiniPlayer: () => {
          set((state) => {
            state.isMiniPlayerVisible = true;
          });
        },

        hideMiniPlayer: () => {
          set((state) => {
            state.isMiniPlayerVisible = false;
          });
        },

        nextTrack: () => {
          const { queue, currentTrack, repeatMode, isShuffled } = get();
          if (queue.length === 0) return;

          const currentIndex = currentTrack
            ? queue.findIndex((t) => t.id === currentTrack.id)
            : -1;

          // Repeat one: restart the current track
          if (repeatMode === 'one') {
            set((state) => {
              state.progress = 0;
            });
            return;
          }

          let nextIndex: number;
          if (isShuffled) {
            nextIndex = Math.floor(Math.random() * queue.length);
          } else {
            nextIndex = currentIndex + 1;
            if (nextIndex >= queue.length) {
              // Wrap around if repeat all, otherwise stay on last
              nextIndex = repeatMode === 'all' ? 0 : queue.length - 1;
            }
          }

          set((state) => {
            state.currentTrack = queue[nextIndex] ?? null;
            state.progress = 0;
          });
        },

        prevTrack: () => {
          const { queue, currentTrack, progress } = get();
          if (queue.length === 0) return;

          // If more than 3 seconds in, restart current track
          if (progress > 0.05) {
            set((state) => {
              state.progress = 0;
            });
            return;
          }

          const currentIndex = currentTrack
            ? queue.findIndex((t) => t.id === currentTrack.id)
            : 0;
          const prevIndex = Math.max(0, currentIndex - 1);

          set((state) => {
            state.currentTrack = queue[prevIndex] ?? null;
            state.progress = 0;
          });
        },
      })),
      {
        name: 'kiaanverse-vibe-player',
        storage: createJSONStorage(() => AsyncStorage),
        // Persist user preferences and queue — not playback state
        partialize: (state) => ({
          volume: state.volume,
          repeatMode: state.repeatMode,
          isShuffled: state.isShuffled,
          queue: state.queue,
        }),
      },
    ),
    {
      name: 'VibePlayerStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
