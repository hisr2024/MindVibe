/**
 * KIAAN Vibe Music Player - Zustand Store
 *
 * Global state management for the music player.
 * Handles playback state, queue, and settings.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Track, RepeatMode, PlayerStore, PersistedPlayerState } from './types'
import { getPersistedState, persistState } from './persistence'

// Initial state
const initialState = {
  currentTrack: null as Track | null,
  queue: [] as Track[],
  queueIndex: 0,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  volume: 0.7,
  playbackRate: 1.0,
  repeatMode: 'off' as RepeatMode,
  shuffle: false,
  muted: false,
  playHistory: [] as string[],
}

// Audio element (singleton)
let audioElement: HTMLAudioElement | null = null

function getAudioElement(): HTMLAudioElement {
  if (typeof window === 'undefined') {
    throw new Error('Audio not available on server')
  }
  if (!audioElement) {
    audioElement = new Audio()
    audioElement.preload = 'metadata'
  }
  return audioElement
}

// Shuffle utility
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ============ Playback Control ============

    play: async (track?: Track) => {
      const state = get()
      const audio = getAudioElement()

      // If track provided, set it as current
      if (track) {
        set({ currentTrack: track, isLoading: true })
        audio.src = track.src
      } else if (!state.currentTrack && state.queue.length > 0) {
        // No current track, play first from queue
        const firstTrack = state.queue[state.queueIndex]
        set({ currentTrack: firstTrack, isLoading: true })
        audio.src = firstTrack.src
      } else if (!state.currentTrack) {
        // Nothing to play
        return
      }

      try {
        await audio.play()
        set({ isPlaying: true, isLoading: false })

        // Update Media Session
        const current = get().currentTrack
        if (current && 'mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: current.title,
            artist: current.artist || 'KIAAN Vibe',
            album: 'Meditation Music',
            artwork: current.albumArt
              ? [{ src: current.albumArt, sizes: '512x512', type: 'image/png' }]
              : [],
          })
          navigator.mediaSession.playbackState = 'playing'
        }
      } catch (error) {
        console.error('[PlayerStore] Play error:', error)
        set({ isPlaying: false, isLoading: false })
      }
    },

    pause: () => {
      const audio = getAudioElement()
      audio.pause()
      set({ isPlaying: false })

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
      }
    },

    toggle: () => {
      const state = get()
      if (state.isPlaying) {
        state.pause()
      } else {
        state.play()
      }
    },

    stop: () => {
      const audio = getAudioElement()
      audio.pause()
      audio.currentTime = 0
      set({ isPlaying: false, position: 0 })

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none'
      }
    },

    // ============ Navigation ============

    next: async () => {
      const state = get()
      const { queue, queueIndex, repeatMode, shuffle } = state

      if (queue.length === 0) return

      let nextIndex: number

      if (repeatMode === 'one') {
        // Replay current track
        nextIndex = queueIndex
      } else if (shuffle) {
        // Random next
        nextIndex = Math.floor(Math.random() * queue.length)
      } else {
        // Sequential next
        nextIndex = queueIndex + 1
        if (nextIndex >= queue.length) {
          if (repeatMode === 'all') {
            nextIndex = 0
          } else {
            // End of queue
            set({ isPlaying: false })
            return
          }
        }
      }

      const nextTrack = queue[nextIndex]
      if (nextTrack) {
        set({ queueIndex: nextIndex, currentTrack: nextTrack, position: 0 })
        await get().play(nextTrack)
      }
    },

    previous: async () => {
      const state = get()
      const { queue, queueIndex, position } = state

      // If more than 3 seconds in, restart current track
      if (position > 3) {
        const audio = getAudioElement()
        audio.currentTime = 0
        set({ position: 0 })
        return
      }

      if (queue.length === 0) return

      let prevIndex = queueIndex - 1
      if (prevIndex < 0) {
        prevIndex = queue.length - 1
      }

      const prevTrack = queue[prevIndex]
      if (prevTrack) {
        set({ queueIndex: prevIndex, currentTrack: prevTrack, position: 0 })
        await get().play(prevTrack)
      }
    },

    seek: (position: number) => {
      const audio = getAudioElement()
      audio.currentTime = position
      set({ position })
    },

    // ============ Queue Management ============

    setQueue: (tracks: Track[], startIndex = 0) => {
      set({
        queue: tracks,
        queueIndex: startIndex,
        currentTrack: tracks[startIndex] || null,
      })
    },

    addToQueue: (track: Track) => {
      set((state) => ({
        queue: [...state.queue, track],
      }))
    },

    removeFromQueue: (index: number) => {
      set((state) => {
        const newQueue = state.queue.filter((_, i) => i !== index)
        let newIndex = state.queueIndex

        // Adjust index if needed
        if (index < state.queueIndex) {
          newIndex = Math.max(0, newIndex - 1)
        } else if (index === state.queueIndex && newIndex >= newQueue.length) {
          newIndex = Math.max(0, newQueue.length - 1)
        }

        return {
          queue: newQueue,
          queueIndex: newIndex,
          currentTrack: newQueue[newIndex] || null,
        }
      })
    },

    clearQueue: () => {
      get().stop()
      set({
        queue: [],
        queueIndex: 0,
        currentTrack: null,
      })
    },

    shuffleQueue: () => {
      set((state) => {
        const currentTrack = state.currentTrack
        const otherTracks = state.queue.filter((t) => t.id !== currentTrack?.id)
        const shuffled = shuffleArray(otherTracks)

        // Put current track first if it exists
        const newQueue = currentTrack ? [currentTrack, ...shuffled] : shuffled

        return {
          queue: newQueue,
          queueIndex: 0,
        }
      })
    },

    // ============ Settings ============

    setVolume: (volume: number) => {
      const audio = getAudioElement()
      const clamped = Math.max(0, Math.min(1, volume))
      audio.volume = clamped
      set({ volume: clamped, muted: false })
    },

    setPlaybackRate: (rate: number) => {
      const audio = getAudioElement()
      const clamped = Math.max(0.5, Math.min(2, rate))
      audio.playbackRate = clamped
      set({ playbackRate: clamped })
    },

    setRepeatMode: (mode: RepeatMode) => {
      set({ repeatMode: mode })
    },

    toggleShuffle: () => {
      set((state) => ({ shuffle: !state.shuffle }))
    },

    toggleMute: () => {
      const audio = getAudioElement()
      const state = get()
      audio.muted = !state.muted
      set({ muted: !state.muted })
    },

    // ============ Persistence ============

    loadPersistedState: async () => {
      try {
        const persisted = await getPersistedState()
        if (persisted) {
          set({
            volume: persisted.volume,
            playbackRate: persisted.playbackRate,
            repeatMode: persisted.repeatMode,
            shuffle: persisted.shuffle,
          })

          const audio = getAudioElement()
          audio.volume = persisted.volume
          audio.playbackRate = persisted.playbackRate
        }
      } catch (error) {
        console.error('[PlayerStore] Failed to load persisted state:', error)
      }
    },
  }))
)

// ============ Audio Event Listeners ============

if (typeof window !== 'undefined') {
  // Set up audio element event listeners
  const setupAudioListeners = () => {
    const audio = getAudioElement()

    audio.addEventListener('timeupdate', () => {
      usePlayerStore.setState({ position: audio.currentTime })
    })

    audio.addEventListener('loadedmetadata', () => {
      usePlayerStore.setState({ duration: audio.duration, isLoading: false })
    })

    audio.addEventListener('ended', () => {
      usePlayerStore.getState().next()
    })

    audio.addEventListener('error', (e) => {
      console.error('[Audio] Error:', e)
      usePlayerStore.setState({ isPlaying: false, isLoading: false })
    })

    audio.addEventListener('waiting', () => {
      usePlayerStore.setState({ isLoading: true })
    })

    audio.addEventListener('canplay', () => {
      usePlayerStore.setState({ isLoading: false })
    })

    // Media Session API handlers
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        usePlayerStore.getState().play()
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        usePlayerStore.getState().pause()
      })
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        usePlayerStore.getState().previous()
      })
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        usePlayerStore.getState().next()
      })
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          usePlayerStore.getState().seek(details.seekTime)
        }
      })
    }
  }

  // Initialize on first access
  setupAudioListeners()

  // Persist state on changes
  usePlayerStore.subscribe(
    (state) => ({
      volume: state.volume,
      playbackRate: state.playbackRate,
      repeatMode: state.repeatMode,
      shuffle: state.shuffle,
      currentTrackId: state.currentTrack?.id || null,
      position: state.position,
    }),
    (state) => {
      persistState({
        currentTrackId: state.currentTrackId,
        position: state.position,
        volume: state.volume,
        playbackRate: state.playbackRate,
        repeatMode: state.repeatMode,
        shuffle: state.shuffle,
        queueTrackIds: [],
        queueIndex: 0,
      })
    },
    { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
  )
}

export default usePlayerStore
