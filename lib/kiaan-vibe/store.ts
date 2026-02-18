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
import {
  markTrackUnavailable,
  markTrackAvailable,
  hasSystemicAudioIssues,
  resetFailureCounter,
} from './meditation-library'

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
  // Error state for user-friendly error handling
  audioError: null as string | null,
  hasAudioIssues: false,
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

// Track active blob URLs for cleanup to prevent memory leaks
let activeBlobUrl: string | null = null

function cleanupBlobUrl(): void {
  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl)
    activeBlobUrl = null
  }
}

// Browser Speech Synthesis instance for TTS fallback
let activeSpeechUtterance: SpeechSynthesisUtterance | null = null

function cancelBrowserTTS(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  activeSpeechUtterance = null
}

/**
 * Check if a track source is an API endpoint that needs pre-fetching.
 * Gita voice tracks use API URLs like /api/voice/gita?...
 * These can return JSON fallback instead of audio, which the <audio> element can't play.
 */
function isApiSourceTrack(track: Track): boolean {
  return track.src.startsWith('/api/voice/')
}

/**
 * Pre-fetch audio from an API source track.
 * Returns a blob URL if audio is received, or null if a fallback response is returned.
 */
async function prefetchTrackAudio(track: Track): Promise<string | null> {
  try {
    const response = await fetch(track.src, {
      credentials: 'include',
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('audio/')) {
      // Received audio data - create a blob URL for the audio element
      const blob = await response.blob()
      if (blob.size > 0) {
        return URL.createObjectURL(blob)
      }
    }

    // Response is JSON (fallback indicator) or empty - not playable audio
    return null
  } catch {
    return null
  }
}

/**
 * Play a track's text content using browser Speech Synthesis API.
 * Used as fallback when backend TTS is unavailable.
 * Returns a Promise that resolves when speech completes.
 */
function playViaBrowserTTS(
  track: Track,
  onEnd: () => void,
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false
  }

  const meta = track.ttsMetadata
  if (!meta?.text) {
    return false
  }

  cancelBrowserTTS()

  const utterance = new SpeechSynthesisUtterance(meta.text)
  utterance.lang = meta.language || 'en-US'
  utterance.rate = meta.rate ?? 0.9
  utterance.pitch = meta.pitch ?? 1.0

  // Try to select the best available voice for the language
  const voices = window.speechSynthesis.getVoices()
  const langPrefix = utterance.lang.split('-')[0]
  const matchingVoices = voices.filter(v => v.lang.startsWith(langPrefix))
  if (matchingVoices.length > 0) {
    // Prefer non-local (cloud/neural) voices for better quality
    const cloudVoice = matchingVoices.find(v => !v.localService)
    utterance.voice = cloudVoice || matchingVoices[0]
  }

  utterance.onend = () => {
    activeSpeechUtterance = null
    onEnd()
  }

  utterance.onerror = () => {
    activeSpeechUtterance = null
    onEnd()
  }

  activeSpeechUtterance = utterance
  window.speechSynthesis.speak(utterance)
  return true
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

/** Update Media Session metadata for lock screen / OS controls */
function updateMediaSession(track: Track): void {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || 'KIAAN Vibe',
      album: 'Meditation Music',
      artwork: track.albumArt
        ? [{ src: track.albumArt, sizes: '512x512', type: 'image/png' }]
        : [],
    })
    navigator.mediaSession.playbackState = 'playing'
  }
}

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ============ Playback Control ============

    play: async (track?: Track) => {
      const state = get()
      const audio = getAudioElement()

      // Cancel any active browser TTS before starting new playback
      cancelBrowserTTS()

      // Determine which track to play
      let targetTrack: Track | null = null
      const isNewTrack = !!track
      if (track) {
        targetTrack = track
      } else if (!state.currentTrack && state.queue.length > 0) {
        targetTrack = state.queue[state.queueIndex]
      } else if (state.currentTrack) {
        // Resuming current track
        targetTrack = state.currentTrack
      }

      if (!targetTrack) return

      // If resuming the same track (no new track provided), try to play directly
      const isResuming = !isNewTrack && state.currentTrack?.id === targetTrack.id
      if (isResuming) {
        try {
          await audio.play()
          set({ isPlaying: true, isLoading: false })
          updateMediaSession(targetTrack)
        } catch {
          // Resume failed - will fall through to full play logic below
        }
        return
      }

      set({ currentTrack: targetTrack, isLoading: true, audioError: null })

      // Cleanup previous blob URL before creating a new one
      cleanupBlobUrl()

      // For Gita voice / API-sourced tracks: pre-fetch to handle JSON fallback
      if (isApiSourceTrack(targetTrack)) {
        const blobUrl = await prefetchTrackAudio(targetTrack)

        if (blobUrl) {
          // Audio received from API - play via <audio> element with blob URL
          activeBlobUrl = blobUrl
          audio.src = blobUrl

          try {
            await audio.play()
            set({ isPlaying: true, isLoading: false })
            markTrackAvailable(targetTrack.id)
            updateMediaSession(targetTrack)
          } catch (error) {
            console.error('[PlayerStore] Play error:', error)
            // If audio blob play fails, try browser TTS
            cleanupBlobUrl()
            const ttsStarted = playViaBrowserTTS(targetTrack, () => {
              usePlayerStore.getState().next()
            })
            if (ttsStarted) {
              set({ isPlaying: true, isLoading: false })
              markTrackAvailable(targetTrack.id)
              updateMediaSession(targetTrack)
            } else {
              set({ isPlaying: false, isLoading: false })
              markTrackUnavailable(targetTrack.id)
            }
          }
        } else {
          // API returned JSON fallback or failed - use browser Speech Synthesis
          const ttsStarted = playViaBrowserTTS(targetTrack, () => {
            usePlayerStore.getState().next()
          })

          if (ttsStarted) {
            set({ isPlaying: true, isLoading: false })
            markTrackAvailable(targetTrack.id)
            resetFailureCounter()
            updateMediaSession(targetTrack)
          } else {
            markTrackUnavailable(targetTrack.id)
            set({
              isPlaying: false,
              isLoading: false,
              audioError: 'Voice reading requires a browser that supports speech synthesis. Please try a different browser.',
            })

            // Try next track in queue if available
            if (state.queue.length > 1) {
              setTimeout(() => {
                usePlayerStore.getState().next()
              }, 500)
            }
          }
        }
        return
      }

      // Standard tracks (meditation music, etc.) - direct audio element playback
      audio.src = targetTrack.src

      try {
        await audio.play()
        set({ isPlaying: true, isLoading: false })
        updateMediaSession(targetTrack)
      } catch (error) {
        console.error('[PlayerStore] Play error:', error)
        set({ isPlaying: false, isLoading: false })
      }
    },

    pause: () => {
      const audio = getAudioElement()
      audio.pause()
      cancelBrowserTTS()
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
      cancelBrowserTTS()
      cleanupBlobUrl()
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
      cleanupBlobUrl()
      cancelBrowserTTS()
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

    // ============ Error Handling ============

    clearAudioError: () => {
      set({ audioError: null, hasAudioIssues: false })
    },

    retryPlayback: async () => {
      // Reset the failure counter and clear errors
      resetFailureCounter()
      cleanupBlobUrl()
      cancelBrowserTTS()
      set({ audioError: null, hasAudioIssues: false })

      // Try to play the current track again
      const state = get()
      if (state.currentTrack) {
        await get().play(state.currentTrack)
      } else if (state.queue.length > 0) {
        await get().play(state.queue[0])
      }
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

    audio.addEventListener('error', () => {
      const currentTrack = usePlayerStore.getState().currentTrack

      // For API-sourced tracks (Gita voice), errors are already handled in play()
      // via pre-fetch + browser TTS fallback. Ignore audio element errors for these.
      if (currentTrack && isApiSourceTrack(currentTrack)) {
        return
      }

      // For standard tracks (meditation music, etc.), handle normally
      if (currentTrack?.id) {
        markTrackUnavailable(currentTrack.id)
      }

      // Check if we're having systemic issues (many consecutive failures)
      if (hasSystemicAudioIssues()) {
        usePlayerStore.setState({
          isPlaying: false,
          isLoading: false,
          audioError: 'Unable to load audio tracks. This may be due to network issues or audio source availability. Please try again later.',
          hasAudioIssues: true,
        })
        return
      }

      usePlayerStore.setState({ isPlaying: false, isLoading: false })

      // If track failed to load, try next track in queue
      const state = usePlayerStore.getState()
      if (state.queue.length > 1 && state.queueIndex < state.queue.length - 1) {
        setTimeout(() => {
          usePlayerStore.getState().next()
        }, 500)
      } else {
        usePlayerStore.setState({
          audioError: 'Unable to load this track. The audio source may be temporarily unavailable.',
        })
      }
    })

    audio.addEventListener('waiting', () => {
      usePlayerStore.setState({ isLoading: true })
    })

    audio.addEventListener('canplay', () => {
      const currentTrack = usePlayerStore.getState().currentTrack
      // Mark track as available on successful load
      if (currentTrack?.id) {
        markTrackAvailable(currentTrack.id)
      }
      // Clear any previous errors
      usePlayerStore.setState({
        isLoading: false,
        audioError: null,
        hasAudioIssues: false,
      })
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
