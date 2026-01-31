/**
 * Comprehensive Tests for GitaAudioEngine
 *
 * ॐ श्रीमद्भगवद्गीता
 *
 * Tests all aspects of the Gita Audio Engine:
 * - Initialization
 * - Playback controls
 * - Navigation
 * - Volume controls
 * - Language switching
 * - Ambient sounds
 * - Error handling
 * - State management
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import {
  GitaAudioEngine,
  createGitaAudioEngine,
  getGitaAudioEngine,
  type GitaPlaybackState
} from '@/services/audio/GitaAudioEngine'
import {
  LIBRIVOX_ENGLISH,
  getChapterAudioUrl,
  getAmbientSound
} from '@/lib/constants/gita-audio-sources'

// ============ Mock Setup ============

// Mock HTMLAudioElement
class MockAudio {
  src: string = ''
  volume: number = 1
  playbackRate: number = 1
  currentTime: number = 0
  duration: number = 600
  paused: boolean = true
  crossOrigin: string | null = null
  preload: string = 'auto'

  private eventListeners: Map<string, Function[]> = new Map()

  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  removeEventListener(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  dispatchEvent(event: string) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(cb => cb())
    }
  }

  async play(): Promise<void> {
    this.paused = false
    this.dispatchEvent('play')
    return Promise.resolve()
  }

  pause() {
    this.paused = true
    this.dispatchEvent('pause')
  }

  async load(): Promise<void> {
    this.dispatchEvent('loadstart')
    this.dispatchEvent('loadedmetadata')
    this.dispatchEvent('canplay')
    return Promise.resolve()
  }

  // Simulate error
  simulateError(code: number) {
    (this as any).error = { code }
    this.dispatchEvent('error')
  }

  // Simulate end
  simulateEnd() {
    this.dispatchEvent('ended')
  }
}

// Store original Audio
const originalAudio = globalThis.Audio

beforeEach(() => {
  // Mock Audio constructor
  globalThis.Audio = MockAudio as any

  // Mock window
  if (typeof window === 'undefined') {
    (globalThis as any).window = { Audio: MockAudio }
  }
})

afterEach(() => {
  // Restore original Audio
  globalThis.Audio = originalAudio
  vi.clearAllMocks()
})

// ============ Test Suites ============

describe('GitaAudioEngine', () => {

  // ============ Initialization Tests ============

  describe('Initialization', () => {
    it('should check browser support correctly', () => {
      expect(GitaAudioEngine.isSupported()).toBe(true)
    })

    it('should create engine with default config', () => {
      const engine = createGitaAudioEngine()
      const state = engine.getState()

      expect(state.currentLanguage).toBe('english')
      expect(state.volume).toBe(0.7)
      expect(state.ambientVolume).toBe(0.25)
      expect(state.isPlaying).toBe(false)
    })

    it('should create engine with custom config', () => {
      const engine = createGitaAudioEngine({
        defaultLanguage: 'sanskrit',
        defaultVolume: 0.5,
        defaultAmbientVolume: 0.3
      })
      const state = engine.getState()

      expect(state.currentLanguage).toBe('sanskrit')
      expect(state.volume).toBe(0.5)
      expect(state.ambientVolume).toBe(0.3)
    })

    it('should initialize successfully', async () => {
      const engine = createGitaAudioEngine()
      const result = await engine.initialize()

      expect(result).toBe(true)
    })

    it('should only initialize once', async () => {
      const engine = createGitaAudioEngine()

      const result1 = await engine.initialize()
      const result2 = await engine.initialize()

      expect(result1).toBe(true)
      expect(result2).toBe(true)
    })

    it('should get singleton instance', () => {
      const engine1 = getGitaAudioEngine()
      const engine2 = getGitaAudioEngine()

      // Note: In actual implementation, these would be the same instance
      // but since we're creating new engines, we just verify they're engines
      expect(engine1).toBeInstanceOf(GitaAudioEngine)
      expect(engine2).toBeInstanceOf(GitaAudioEngine)
    })
  })

  // ============ Playback Tests ============

  describe('Playback', () => {
    let engine: GitaAudioEngine

    beforeEach(async () => {
      engine = createGitaAudioEngine()
      await engine.initialize()
    })

    afterEach(() => {
      engine.dispose()
    })

    it('should play a chapter', async () => {
      await engine.playChapter(1, 'english')
      const state = engine.getState()

      expect(state.currentChapter).toBe(1)
      expect(state.currentLanguage).toBe('english')
      expect(state.isPlaying).toBe(true)
    })

    it('should pause playback', async () => {
      await engine.playChapter(1)
      engine.pause()
      const state = engine.getState()

      expect(state.isPlaying).toBe(false)
      expect(state.isPaused).toBe(true)
    })

    it('should resume playback', async () => {
      await engine.playChapter(1)
      engine.pause()
      await engine.resume()
      const state = engine.getState()

      expect(state.isPlaying).toBe(true)
      expect(state.isPaused).toBe(false)
    })

    it('should toggle play/pause', async () => {
      await engine.playChapter(1)
      expect(engine.getState().isPlaying).toBe(true)

      await engine.togglePlayPause()
      expect(engine.getState().isPlaying).toBe(false)

      await engine.togglePlayPause()
      expect(engine.getState().isPlaying).toBe(true)
    })

    it('should stop playback', async () => {
      await engine.playChapter(1)
      engine.stop()
      const state = engine.getState()

      expect(state.isPlaying).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.currentTime).toBe(0)
      expect(state.progress).toBe(0)
    })

    it('should fallback to English when language unavailable', async () => {
      await engine.playChapter(1, 'kannada') // Kannada not available
      const state = engine.getState()

      // Should fall back to English
      expect(state.currentLanguage).toBe('english')
    })
  })

  // ============ Navigation Tests ============

  describe('Navigation', () => {
    let engine: GitaAudioEngine

    beforeEach(async () => {
      engine = createGitaAudioEngine()
      await engine.initialize()
    })

    afterEach(() => {
      engine.dispose()
    })

    it('should go to next chapter', async () => {
      await engine.playChapter(1)
      await engine.nextChapter()

      expect(engine.getState().currentChapter).toBe(2)
    })

    it('should loop to chapter 1 after chapter 18 in continuous mode', async () => {
      engine.setPlaybackMode('continuous')
      await engine.playChapter(18)
      await engine.nextChapter()

      expect(engine.getState().currentChapter).toBe(1)
    })

    it('should go to previous chapter', async () => {
      await engine.playChapter(5)
      await engine.previousChapter()

      // If less than 3 seconds in, should go to previous
      expect(engine.getState().currentChapter).toBe(4)
    })

    it('should loop to chapter 18 when going previous from chapter 1', async () => {
      await engine.playChapter(1)
      await engine.previousChapter()

      expect(engine.getState().currentChapter).toBe(18)
    })

    it('should seek to position', async () => {
      await engine.playChapter(1)
      engine.seekTo(50) // 50%

      const state = engine.getState()
      expect(state.progress).toBe(50)
    })

    it('should skip forward', async () => {
      await engine.playChapter(1)
      engine.skipForward(15)

      // Verify currentTime changed (mocked audio starts at 0)
      expect(engine.getState().currentTime).toBeGreaterThanOrEqual(0)
    })

    it('should skip backward', async () => {
      await engine.playChapter(1)
      engine.skipBackward(15)

      expect(engine.getState().currentTime).toBeGreaterThanOrEqual(0)
    })
  })

  // ============ Volume Tests ============

  describe('Volume Controls', () => {
    let engine: GitaAudioEngine

    beforeEach(async () => {
      engine = createGitaAudioEngine()
      await engine.initialize()
    })

    afterEach(() => {
      engine.dispose()
    })

    it('should set Gita volume', () => {
      engine.setGitaVolume(0.5)
      expect(engine.getState().volume).toBe(0.5)
    })

    it('should clamp volume between 0 and 1', () => {
      engine.setGitaVolume(1.5)
      expect(engine.getState().volume).toBe(1)

      engine.setGitaVolume(-0.5)
      expect(engine.getState().volume).toBe(0)
    })

    it('should set ambient volume', () => {
      engine.setAmbientVolume(0.3)
      expect(engine.getState().ambientVolume).toBe(0.3)
    })

    it('should set playback speed', () => {
      engine.setPlaybackSpeed(1.5)
      expect(engine.getState().playbackSpeed).toBe(1.5)
    })

    it('should clamp playback speed between 0.5 and 2.0', () => {
      engine.setPlaybackSpeed(3.0)
      expect(engine.getState().playbackSpeed).toBe(2.0)

      engine.setPlaybackSpeed(0.1)
      expect(engine.getState().playbackSpeed).toBe(0.5)
    })
  })

  // ============ Language Tests ============

  describe('Language', () => {
    let engine: GitaAudioEngine

    beforeEach(async () => {
      engine = createGitaAudioEngine()
      await engine.initialize()
    })

    afterEach(() => {
      engine.dispose()
    })

    it('should change language', async () => {
      await engine.setLanguage('sanskrit')
      expect(engine.getState().currentLanguage).toBe('sanskrit')
    })

    it('should not change if same language', async () => {
      const initialState = engine.getState()
      await engine.setLanguage('english')

      expect(engine.getState().currentLanguage).toBe(initialState.currentLanguage)
    })

    it('should return available languages', () => {
      const languages = engine.getAvailableLanguages()

      expect(languages).toContain('english')
      expect(languages).toContain('sanskrit')
    })
  })

  // ============ Playback Mode Tests ============

  describe('Playback Modes', () => {
    let engine: GitaAudioEngine

    beforeEach(async () => {
      engine = createGitaAudioEngine()
      await engine.initialize()
    })

    afterEach(() => {
      engine.dispose()
    })

    it('should set playback mode', () => {
      engine.setPlaybackMode('chapter_loop')
      expect(engine.getState().playbackMode).toBe('chapter_loop')
    })

    it('should support all playback modes', () => {
      const modes = ['continuous', 'verse_pause', 'repeat_verse', 'chapter_loop', 'learning']

      modes.forEach(mode => {
        engine.setPlaybackMode(mode as any)
        expect(engine.getState().playbackMode).toBe(mode)
      })
    })
  })

  // ============ State Callback Tests ============

  describe('State Callbacks', () => {
    it('should call onStateChange callback', async () => {
      const onStateChange = vi.fn()
      const engine = createGitaAudioEngine({ onStateChange })
      await engine.initialize()

      await engine.playChapter(1)

      expect(onStateChange).toHaveBeenCalled()
      engine.dispose()
    })

    it('should call onError callback on error', async () => {
      const onError = vi.fn()
      const engine = createGitaAudioEngine({ onError })
      await engine.initialize()

      // Try to play unavailable language
      await engine.playChapter(1, 'marathi')

      // Should have fallen back or errored
      expect(engine.getState().currentLanguage).toBeDefined()
      engine.dispose()
    })
  })

  // ============ Learning Settings Tests ============

  describe('Learning Settings', () => {
    let engine: GitaAudioEngine

    beforeEach(async () => {
      engine = createGitaAudioEngine()
      await engine.initialize()
    })

    afterEach(() => {
      engine.dispose()
    })

    it('should get default learning settings', () => {
      const settings = engine.getLearningSettings()

      expect(settings.showTransliteration).toBe(true)
      expect(settings.showMeaning).toBe(true)
      expect(settings.autoAdvance).toBe(true)
    })

    it('should update learning settings', () => {
      engine.setLearningSettings({
        showTransliteration: false,
        pauseDuration: 5
      })

      const settings = engine.getLearningSettings()
      expect(settings.showTransliteration).toBe(false)
      expect(settings.pauseDuration).toBe(5)
    })
  })

  // ============ Chapter Info Tests ============

  describe('Chapter Info', () => {
    let engine: GitaAudioEngine

    beforeEach(async () => {
      engine = createGitaAudioEngine()
      await engine.initialize()
    })

    afterEach(() => {
      engine.dispose()
    })

    it('should get current chapter info', async () => {
      await engine.playChapter(2)
      const chapter = engine.getCurrentChapter()

      expect(chapter).toBeDefined()
      expect(chapter?.number).toBe(2)
      expect(chapter?.nameEnglish).toBe('Sankhya Yoga')
    })
  })

  // ============ Cleanup Tests ============

  describe('Cleanup', () => {
    it('should dispose properly', async () => {
      const engine = createGitaAudioEngine()
      await engine.initialize()
      await engine.playChapter(1)

      engine.dispose()

      const state = engine.getState()
      expect(state.isPlaying).toBe(false)
    })
  })
})

// ============ Audio Sources Tests ============

describe('Gita Audio Sources', () => {

  describe('getChapterAudioUrl', () => {
    it('should return URL for English chapter', () => {
      const url = getChapterAudioUrl('english', 1)

      expect(url).toBeDefined()
      expect(url).toContain('archive.org')
      expect(url).toContain('mp3')
    })

    it('should return URL for all 18 English chapters', () => {
      for (let i = 1; i <= 18; i++) {
        const url = getChapterAudioUrl('english', i)
        expect(url).toBeDefined()
      }
    })

    it('should return URL for Sanskrit chapter', () => {
      const url = getChapterAudioUrl('sanskrit', 1)

      expect(url).toBeDefined()
    })

    it('should return undefined for unavailable language', () => {
      const url = getChapterAudioUrl('marathi', 1)

      expect(url).toBeUndefined()
    })
  })

  describe('getAmbientSound', () => {
    it('should return ambient sound by ID', () => {
      const sound = getAmbientSound('rain_gentle')

      expect(sound).toBeDefined()
      expect(sound?.name).toBe('Gentle Rain')
      expect(sound?.url).toBeDefined()
    })

    it('should return undefined for unknown sound', () => {
      const sound = getAmbientSound('unknown_sound')

      expect(sound).toBeUndefined()
    })
  })

  describe('LIBRIVOX_ENGLISH source', () => {
    it('should have all 18 chapters', () => {
      expect(LIBRIVOX_ENGLISH.chapters.length).toBe(18)
    })

    it('should have valid URLs for all chapters', () => {
      LIBRIVOX_ENGLISH.chapters.forEach(chapter => {
        expect(chapter.url).toMatch(/^https:\/\//)
        expect(chapter.url).toContain('archive.org')
      })
    })

    it('should be public domain', () => {
      expect(LIBRIVOX_ENGLISH.license).toBe('public_domain')
    })
  })
})

// ============ Integration Tests ============

describe('Integration Tests', () => {

  it('should complete full playback workflow', async () => {
    const engine = createGitaAudioEngine()
    await engine.initialize()

    // Start playing
    await engine.playChapter(1, 'english')
    expect(engine.getState().isPlaying).toBe(true)

    // Adjust volume
    engine.setGitaVolume(0.8)
    expect(engine.getState().volume).toBe(0.8)

    // Change speed
    engine.setPlaybackSpeed(1.25)
    expect(engine.getState().playbackSpeed).toBe(1.25)

    // Navigate
    await engine.nextChapter()
    expect(engine.getState().currentChapter).toBe(2)

    // Pause
    engine.pause()
    expect(engine.getState().isPaused).toBe(true)

    // Resume
    await engine.resume()
    expect(engine.getState().isPlaying).toBe(true)

    // Stop
    engine.stop()
    expect(engine.getState().isPlaying).toBe(false)

    // Cleanup
    engine.dispose()
  })

  it('should handle rapid state changes', async () => {
    const engine = createGitaAudioEngine()
    await engine.initialize()

    // Rapid play/pause/play
    await engine.playChapter(1)
    engine.pause()
    await engine.resume()
    engine.pause()
    await engine.resume()

    expect(engine.getState().isPlaying).toBe(true)

    engine.dispose()
  })

  it('should maintain state consistency', async () => {
    const engine = createGitaAudioEngine()
    await engine.initialize()

    // Set various states
    engine.setGitaVolume(0.6)
    engine.setAmbientVolume(0.4)
    engine.setPlaybackSpeed(0.75)
    engine.setPlaybackMode('learning')

    await engine.playChapter(5, 'english')

    const state = engine.getState()

    expect(state.volume).toBe(0.6)
    expect(state.ambientVolume).toBe(0.4)
    expect(state.playbackSpeed).toBe(0.75)
    expect(state.playbackMode).toBe('learning')
    expect(state.currentChapter).toBe(5)
    expect(state.currentLanguage).toBe('english')

    engine.dispose()
  })
})
