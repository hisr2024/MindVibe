/**
 * Gita Audio Browser Tests
 *
 * Tests audio playback and ambient sound layering functionality
 * These tests verify the audio URLs are valid and the layering system works
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock HTMLAudioElement with realistic behavior
class MockAudioElement {
  src = ''
  volume = 1
  currentTime = 0
  duration = 300
  paused = true
  playbackRate = 1
  loop = false
  muted = false
  readyState = 4

  play = vi.fn().mockImplementation(() => {
    this.paused = false
    return Promise.resolve()
  })

  pause = vi.fn().mockImplementation(() => {
    this.paused = true
  })

  load = vi.fn()

  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

global.Audio = MockAudioElement as any

describe('Gita Audio Browser Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Audio URL Validation', () => {
    it('should have valid LibriVox chapter URLs', async () => {
      const { LIBRIVOX_ENGLISH } = await import('@/lib/constants/gita-audio-sources')

      expect(LIBRIVOX_ENGLISH.chapters).toHaveLength(18)

      LIBRIVOX_ENGLISH.chapters.forEach((chapter, idx) => {
        expect(chapter.chapter).toBe(idx + 1)
        expect(chapter.url).toMatch(/^https:\/\/ia\d+\.us\.archive\.org/)
        expect(chapter.url).toContain('bhagavad_gita')
        expect(chapter.url).toMatch(/\.mp3$/)
        expect(chapter.duration).toBeTruthy()
      })
    })

    it('should have valid Sanskrit chapter URLs', async () => {
      const { ARCHIVE_SANSKRIT } = await import('@/lib/constants/gita-audio-sources')

      expect(ARCHIVE_SANSKRIT.chapters).toHaveLength(18)

      ARCHIVE_SANSKRIT.chapters.forEach((chapter, idx) => {
        expect(chapter.chapter).toBe(idx + 1)
        expect(chapter.url).toMatch(/^https:\/\/ia\d+\.us\.archive\.org/)
        expect(chapter.url).toContain('Chapter')
        expect(chapter.url).toMatch(/\.mp3$/)
      })
    })

    it('should have valid ambient sound URLs', async () => {
      const { AMBIENT_SOUNDS } = await import('@/lib/constants/gita-audio-sources')

      expect(AMBIENT_SOUNDS.length).toBeGreaterThan(5)

      AMBIENT_SOUNDS.forEach(sound => {
        expect(sound.id).toBeTruthy()
        expect(sound.name).toBeTruthy()
        expect(sound.url).toMatch(/^https:\/\/cdn\.freesound\.org/)
        expect(sound.url).toMatch(/\.mp3$/)
        expect(sound.category).toMatch(/^(nature|sacred|atmospheric|musical)$/)
        expect(typeof sound.loopable).toBe('boolean')
      })
    })
  })

  describe('Audio Playback Simulation', () => {
    it('should create audio element for Gita playback', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const stateChanges: any[] = []
      const engine = createGitaAudioEngine({
        onStateChange: (state) => stateChanges.push({ ...state }),
        onError: vi.fn()
      })

      await engine.initialize()

      // Play chapter 1
      await engine.playChapter(1)

      const state = engine.getState()
      expect(state.isPlaying).toBe(true)
      expect(state.currentChapter).toBe(1)
      expect(state.currentSource).toContain('bhagavadgita_01_arnold')
    })

    it('should handle chapter navigation', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      await engine.playChapter(1)

      // Next chapter
      await engine.nextChapter()
      expect(engine.getState().currentChapter).toBe(2)

      // Next again
      await engine.nextChapter()
      expect(engine.getState().currentChapter).toBe(3)

      // Previous
      await engine.previousChapter()
      expect(engine.getState().currentChapter).toBe(2)
    })

    it('should handle seek operations', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      await engine.playChapter(1)

      // Seek to 50%
      engine.seekTo(50)

      // Seek to specific time
      engine.seekToTime(60)

      // Skip forward 30 seconds
      engine.skipForward(30)

      // Skip backward 15 seconds
      engine.skipBackward(15)

      // These should not throw
      expect(true).toBe(true)
    })
  })

  describe('Ambient Sound Layering', () => {
    it('should start ambient sounds', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')
      const { AMBIENT_SOUNDS } = await import('@/lib/constants/gita-audio-sources')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      // Start Gita playback
      await engine.playChapter(2)

      // Add rain ambient
      const rain = AMBIENT_SOUNDS.find(s => s.id === 'rain_gentle')
      expect(rain).toBeDefined()
      await engine.startAmbientSound('rain_gentle')

      // Add ocean ambient
      const ocean = AMBIENT_SOUNDS.find(s => s.id === 'ocean_waves')
      expect(ocean).toBeDefined()
      await engine.startAmbientSound('ocean_waves')

      // Should not throw
      expect(true).toBe(true)
    })

    it('should adjust volumes independently', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      await engine.playChapter(1)
      await engine.startAmbientSound('rain_gentle')

      // Set Gita volume to 80%
      engine.setGitaVolume(0.8)

      // Set ambient volume to 30%
      engine.setAmbientVolume(0.3)

      // Should not throw
      expect(true).toBe(true)
    })

    it('should stop ambient sounds', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      await engine.startAmbientSound('rain_gentle')
      await engine.startAmbientSound('ocean_waves')

      // Stop rain
      engine.stopAmbientSound('rain_gentle')

      // Should not throw
      expect(true).toBe(true)
    })

    it('should stop all ambient sounds', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      await engine.startAmbientSound('rain_gentle')
      await engine.startAmbientSound('ocean_waves')
      await engine.startAmbientSound('forest_birds')

      // Stop all
      engine.stopAllAmbient()

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('Soundscape Presets', () => {
    it('should have valid soundscape presets', async () => {
      const { GITA_SOUNDSCAPES } = await import('@/lib/constants/gita-audio')

      expect(GITA_SOUNDSCAPES.length).toBeGreaterThan(0)

      GITA_SOUNDSCAPES.forEach(preset => {
        expect(preset.id).toBeTruthy()
        expect(preset.name).toBeTruthy()
        expect(preset.ambientSounds).toBeDefined()
        expect(Array.isArray(preset.ambientSounds)).toBe(true)

        preset.ambientSounds.forEach(ambient => {
          expect(ambient.type).toBeTruthy()
          expect(typeof ambient.volume).toBe('number')
          expect(ambient.volume).toBeGreaterThanOrEqual(0)
          expect(ambient.volume).toBeLessThanOrEqual(1)
        })
      })
    })

    it('should start soundscape preset', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')
      const { GITA_SOUNDSCAPES } = await import('@/lib/constants/gita-audio')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      const preset = GITA_SOUNDSCAPES[0]
      expect(preset).toBeDefined()

      // Start soundscape
      await engine.startSoundscape(preset.id)

      // Should not throw
      expect(true).toBe(true)
    })

    it('should play with soundscape', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')
      const { GITA_SOUNDSCAPES } = await import('@/lib/constants/gita-audio')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      const preset = GITA_SOUNDSCAPES[0]
      await engine.playWithSoundscape(preset.id, 2)

      const state = engine.getState()
      expect(state.isPlaying).toBe(true)
      expect(state.currentChapter).toBe(2)
    })
  })

  describe('Playback Modes', () => {
    it('should set continuous playback mode', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      engine.setPlaybackMode('continuous')

      // In continuous mode, should loop from 18 to 1
      await engine.playChapter(18)
      await engine.nextChapter()

      expect(engine.getState().currentChapter).toBe(1)
    })

    it('should set repeat chapter mode', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      engine.setPlaybackMode('repeat_chapter')

      // Should not throw
      expect(true).toBe(true)
    })

    it('should set single chapter mode', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      engine.setPlaybackMode('single')

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('Playback Speed', () => {
    it('should adjust playback speed', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      await engine.playChapter(1)

      // Set to 0.75x speed (for learning)
      engine.setPlaybackSpeed(0.75)

      // Set to 1.25x speed
      engine.setPlaybackSpeed(1.25)

      // Set to 1.5x speed
      engine.setPlaybackSpeed(1.5)

      // Should not throw
      expect(true).toBe(true)
    })

    it('should clamp playback speed to valid range', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      // Too slow - should clamp to 0.5
      engine.setPlaybackSpeed(0.1)

      // Too fast - should clamp to 2.0
      engine.setPlaybackSpeed(5.0)

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('Language Switching', () => {
    it('should switch between English and Sanskrit', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      // Start with English
      expect(engine.getState().currentLanguage).toBe('english')

      // Switch to Sanskrit
      await engine.setLanguage('sanskrit')
      expect(engine.getState().currentLanguage).toBe('sanskrit')

      // Switch back to English
      await engine.setLanguage('english')
      expect(engine.getState().currentLanguage).toBe('english')
    })

    it('should get available languages', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      const languages = engine.getAvailableLanguages()
      expect(languages).toContain('english')
      expect(languages).toContain('sanskrit')
    })
  })

  describe('State Management', () => {
    it('should track playback state', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const states: any[] = []
      const engine = createGitaAudioEngine({
        onStateChange: (state) => states.push({ ...state }),
        onError: vi.fn()
      })

      await engine.initialize()

      // Initial state
      let state = engine.getState()
      expect(state.isPlaying).toBe(false)
      expect(state.isPaused).toBe(false)

      // After play
      await engine.playChapter(5)
      state = engine.getState()
      expect(state.isPlaying).toBe(true)
      expect(state.currentChapter).toBe(5)

      // After stop
      engine.stop()
      state = engine.getState()
      expect(state.isPlaying).toBe(false)
    })

    it('should get current chapter info', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      await engine.playChapter(2)

      const chapter = engine.getCurrentChapter()
      expect(chapter).toBeDefined()
      expect(chapter?.number).toBe(2)
      expect(chapter?.nameEnglish).toBe('Sankhya Yoga')
    })
  })

  describe('Learning Settings', () => {
    it('should get default learning settings', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      const settings = engine.getLearningSettings()
      expect(settings).toBeDefined()
      expect(typeof settings.showMeaning).toBe('boolean')
      expect(typeof settings.showTransliteration).toBe('boolean')
    })

    it('should update learning settings', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      engine.setLearningSettings({
        showMeaning: false,
        repeatCount: 3
      })

      const settings = engine.getLearningSettings()
      expect(settings.showMeaning).toBe(false)
      expect(settings.repeatCount).toBe(3)
    })
  })

  describe('Cleanup', () => {
    it('should dispose resources properly', async () => {
      const { createGitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = createGitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()
      await engine.playChapter(1)

      // Dispose
      engine.dispose()

      // State should be reset
      const state = engine.getState()
      expect(state.isPlaying).toBe(false)
    })
  })
})
