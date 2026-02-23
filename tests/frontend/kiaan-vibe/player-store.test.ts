/**
 * KIAAN Vibe Music Player - Store Tests
 *
 * Tests for the Zustand player store.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock persistence module to prevent IndexedDB errors in test environment.
// vi.mock is hoisted, so this runs before the store module loads.
vi.mock('@/lib/kiaan-vibe/persistence', () => ({
  getPersistedState: vi.fn().mockResolvedValue(null),
  persistState: vi.fn().mockResolvedValue(undefined),
  getAllUploadedTracks: vi.fn().mockResolvedValue([]),
  getTrackMeta: vi.fn().mockResolvedValue(null),
  saveTrackMeta: vi.fn().mockResolvedValue(undefined),
  deleteTrackMeta: vi.fn().mockResolvedValue(undefined),
  saveAudioBlob: vi.fn().mockResolvedValue(undefined),
  getAudioBlob: vi.fn().mockResolvedValue(null),
  getAudioBlobUrl: vi.fn().mockResolvedValue(null),
  deleteAudioBlob: vi.fn().mockResolvedValue(undefined),
  getAllPlaylists: vi.fn().mockResolvedValue([]),
  getPlaylist: vi.fn().mockResolvedValue(null),
  savePlaylist: vi.fn().mockResolvedValue(undefined),
  deletePlaylist: vi.fn().mockResolvedValue(undefined),
  uploadTrack: vi.fn().mockResolvedValue(null),
  deleteUploadedTrack: vi.fn().mockResolvedValue(undefined),
  default: {
    getPersistedState: vi.fn().mockResolvedValue(null),
    persistState: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock navigator.mediaSession
vi.stubGlobal('navigator', {
  mediaSession: {
    metadata: null,
    playbackState: 'none',
    setActionHandler: vi.fn(),
  },
})

// Import after mocks
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import type { Track } from '@/lib/kiaan-vibe/types'

describe('KIAAN Vibe Player Store', () => {
  const mockTrack: Track = {
    id: 'test-track-1',
    title: 'Test Track',
    artist: 'Test Artist',
    sourceType: 'builtIn',
    src: '/audio/test.mp3',
    duration: 180,
    createdAt: Date.now(),
  }

  const mockTrack2: Track = {
    id: 'test-track-2',
    title: 'Test Track 2',
    artist: 'Test Artist 2',
    sourceType: 'builtIn',
    src: '/audio/test2.mp3',
    duration: 240,
    createdAt: Date.now(),
  }

  beforeEach(() => {
    // Reset store state
    usePlayerStore.setState({
      currentTrack: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      volume: 0.7,
      playbackRate: 1.0,
      repeatMode: 'off',
      shuffle: false,
      muted: false,
      playHistory: [],
      audioError: null,
      hasAudioIssues: false,
    })

    vi.clearAllMocks()
  })

  describe('Queue Management', () => {
    it('should set queue correctly', () => {
      const { setQueue } = usePlayerStore.getState()
      setQueue([mockTrack, mockTrack2], 0)

      const state = usePlayerStore.getState()
      expect(state.queue).toHaveLength(2)
      expect(state.queueIndex).toBe(0)
      expect(state.currentTrack).toEqual(mockTrack)
    })

    it('should set queue with start index', () => {
      const { setQueue } = usePlayerStore.getState()
      setQueue([mockTrack, mockTrack2], 1)

      const state = usePlayerStore.getState()
      expect(state.queueIndex).toBe(1)
      expect(state.currentTrack).toEqual(mockTrack2)
    })

    it('should add track to queue', () => {
      const { setQueue, addToQueue } = usePlayerStore.getState()
      setQueue([mockTrack], 0)
      addToQueue(mockTrack2)

      const state = usePlayerStore.getState()
      expect(state.queue).toHaveLength(2)
      expect(state.queue[1]).toEqual(mockTrack2)
    })

    it('should remove track from queue', () => {
      const { setQueue, removeFromQueue } = usePlayerStore.getState()
      setQueue([mockTrack, mockTrack2], 0)
      removeFromQueue(1)

      const state = usePlayerStore.getState()
      expect(state.queue).toHaveLength(1)
      expect(state.queue[0]).toEqual(mockTrack)
    })

    it('should clear queue', () => {
      const { setQueue, clearQueue } = usePlayerStore.getState()
      setQueue([mockTrack, mockTrack2], 0)
      clearQueue()

      const state = usePlayerStore.getState()
      expect(state.queue).toHaveLength(0)
      expect(state.currentTrack).toBeNull()
    })
  })

  describe('Settings', () => {
    it('should set volume', () => {
      const { setVolume } = usePlayerStore.getState()
      setVolume(0.5)

      const state = usePlayerStore.getState()
      expect(state.volume).toBe(0.5)
      expect(state.muted).toBe(false)
    })

    it('should clamp volume between 0 and 1', () => {
      const { setVolume } = usePlayerStore.getState()

      setVolume(1.5)
      expect(usePlayerStore.getState().volume).toBe(1)

      setVolume(-0.5)
      expect(usePlayerStore.getState().volume).toBe(0)
    })

    it('should set playback rate', () => {
      const { setPlaybackRate } = usePlayerStore.getState()
      setPlaybackRate(1.5)

      const state = usePlayerStore.getState()
      expect(state.playbackRate).toBe(1.5)
    })

    it('should clamp playback rate', () => {
      const { setPlaybackRate } = usePlayerStore.getState()

      setPlaybackRate(3)
      expect(usePlayerStore.getState().playbackRate).toBe(2)

      setPlaybackRate(0.1)
      expect(usePlayerStore.getState().playbackRate).toBe(0.5)
    })

    it('should set repeat mode', () => {
      const { setRepeatMode } = usePlayerStore.getState()

      setRepeatMode('one')
      expect(usePlayerStore.getState().repeatMode).toBe('one')

      setRepeatMode('all')
      expect(usePlayerStore.getState().repeatMode).toBe('all')

      setRepeatMode('off')
      expect(usePlayerStore.getState().repeatMode).toBe('off')
    })

    it('should toggle shuffle', () => {
      const { toggleShuffle } = usePlayerStore.getState()

      expect(usePlayerStore.getState().shuffle).toBe(false)

      toggleShuffle()
      expect(usePlayerStore.getState().shuffle).toBe(true)

      toggleShuffle()
      expect(usePlayerStore.getState().shuffle).toBe(false)
    })

    it('should toggle mute', () => {
      const { toggleMute } = usePlayerStore.getState()

      expect(usePlayerStore.getState().muted).toBe(false)

      toggleMute()
      expect(usePlayerStore.getState().muted).toBe(true)

      toggleMute()
      expect(usePlayerStore.getState().muted).toBe(false)
    })
  })

  describe('Seek', () => {
    it('should seek to position', () => {
      const { seek } = usePlayerStore.getState()
      seek(30)

      const state = usePlayerStore.getState()
      expect(state.position).toBe(30)
    })
  })
})
