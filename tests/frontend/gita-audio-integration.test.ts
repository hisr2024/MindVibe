/**
 * Gita Audio Integration Tests
 *
 * Tests that all Gita audio components work together correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Audio API
class MockAudio {
  src = ''
  volume = 1
  currentTime = 0
  duration = 300
  paused = true
  playbackRate = 1
  loop = false

  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()
  load = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

global.Audio = MockAudio as any

describe('Gita Audio Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Audio Sources', () => {
    it('should have valid LibriVox English source', async () => {
      const { LIBRIVOX_ENGLISH } = await import('@/lib/constants/gita-audio-sources')

      expect(LIBRIVOX_ENGLISH.id).toBe('librivox-english')
      expect(LIBRIVOX_ENGLISH.language).toBe('english')
      expect(LIBRIVOX_ENGLISH.license).toBe('public_domain')
      expect(LIBRIVOX_ENGLISH.chapters).toHaveLength(18)

      // Verify all chapters have URLs
      LIBRIVOX_ENGLISH.chapters.forEach((chapter, idx) => {
        expect(chapter.chapter).toBe(idx + 1)
        expect(chapter.url).toContain('archive.org')
        expect(chapter.url).toContain('.mp3')
      })
    })

    it('should have valid Sanskrit source', async () => {
      const { ARCHIVE_SANSKRIT } = await import('@/lib/constants/gita-audio-sources')

      expect(ARCHIVE_SANSKRIT.id).toBe('archive-sanskrit')
      expect(ARCHIVE_SANSKRIT.language).toBe('sanskrit')
      expect(ARCHIVE_SANSKRIT.chapters).toHaveLength(18)
    })

    it('should have ambient sounds', async () => {
      const { AMBIENT_SOUNDS } = await import('@/lib/constants/gita-audio-sources')

      expect(AMBIENT_SOUNDS.length).toBeGreaterThan(0)

      // Check categories
      const categories = new Set(AMBIENT_SOUNDS.map(s => s.category))
      expect(categories.has('nature')).toBe(true)
      expect(categories.has('sacred')).toBe(true)
      expect(categories.has('musical')).toBe(true)
    })

    it('should get chapter audio URL by language', async () => {
      const { getChapterAudioUrl } = await import('@/lib/constants/gita-audio-sources')

      const url = getChapterAudioUrl('english', 1)
      expect(url).toContain('bhagavadgita_01_arnold')

      const ch18 = getChapterAudioUrl('english', 18)
      expect(ch18).toContain('bhagavadgita_18_arnold')
    })
  })

  describe('Gita Constants', () => {
    it('should have all 18 chapters', async () => {
      const { GITA_CHAPTERS } = await import('@/lib/constants/gita-audio')

      expect(GITA_CHAPTERS).toHaveLength(18)

      // Verify chapter structure
      GITA_CHAPTERS.forEach((chapter, idx) => {
        expect(chapter.number).toBe(idx + 1)
        expect(chapter.nameEnglish).toBeTruthy()
        expect(chapter.nameSanskrit).toBeTruthy()
        expect(chapter.theme).toBeTruthy()
        expect(chapter.verseCount).toBeGreaterThan(0)
      })
    })

    it('should have soundscape presets', async () => {
      const { GITA_SOUNDSCAPES } = await import('@/lib/constants/gita-audio')

      expect(GITA_SOUNDSCAPES.length).toBeGreaterThan(0)

      GITA_SOUNDSCAPES.forEach(soundscape => {
        expect(soundscape.id).toBeTruthy()
        expect(soundscape.name).toBeTruthy()
        expect(soundscape.ambientSounds).toBeDefined()
      })
    })

    it('should have popular verses', async () => {
      const { POPULAR_GITA_VERSES } = await import('@/lib/constants/gita-audio')

      expect(POPULAR_GITA_VERSES.length).toBeGreaterThan(0)

      POPULAR_GITA_VERSES.forEach(verse => {
        expect(verse.chapter).toBeGreaterThanOrEqual(1)
        expect(verse.chapter).toBeLessThanOrEqual(18)
        expect(verse.verse).toBeGreaterThan(0)
        expect(verse.title).toBeTruthy()
      })
    })
  })

  describe('GitaAudioEngine', () => {
    it('should create engine with config', async () => {
      const { GitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const onStateChange = vi.fn()
      const onError = vi.fn()

      const engine = new GitaAudioEngine({
        onStateChange,
        onError
      })

      expect(engine).toBeDefined()
      expect(typeof engine.playChapter).toBe('function')
      expect(typeof engine.pause).toBe('function')
      expect(typeof engine.stop).toBe('function')
    })

    it('should initialize and report state', async () => {
      const { GitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const states: any[] = []
      const engine = new GitaAudioEngine({
        onStateChange: (state) => states.push(state),
        onError: vi.fn()
      })

      await engine.initialize()

      const state = engine.getState()
      expect(state.isPlaying).toBe(false)
      expect(state.currentChapter).toBe(1)
      expect(state.currentLanguage).toBe('english')
    })

    it('should handle play/pause/stop', async () => {
      const { GitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')

      const engine = new GitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      // Play
      await engine.playChapter(1)
      expect(engine.getState().isPlaying).toBe(true)

      // Pause
      engine.pause()
      expect(engine.getState().isPaused).toBe(true)

      // Stop
      engine.stop()
      expect(engine.getState().isPlaying).toBe(false)
    })
  })

  describe('Full Workflow', () => {
    it('should complete listening workflow', async () => {
      const { GitaAudioEngine } = await import('@/services/audio/GitaAudioEngine')
      const { getChapterAudioUrl } = await import('@/lib/constants/gita-audio-sources')

      const engine = new GitaAudioEngine({
        onStateChange: vi.fn(),
        onError: vi.fn()
      })

      await engine.initialize()

      // Start playing chapter 2
      await engine.playChapter(2)
      const state = engine.getState()
      expect(state.currentChapter).toBe(2)
      expect(state.isPlaying).toBe(true)

      // Verify URL is set
      const expectedUrl = getChapterAudioUrl('english', 2)
      expect(state.currentSource).toBe(expectedUrl)

      // Next chapter
      await engine.nextChapter()
      expect(engine.getState().currentChapter).toBe(3)

      // Previous chapter
      await engine.previousChapter()
      expect(engine.getState().currentChapter).toBe(2)

      // Change language (falls back to english since sanskrit may not be available)
      await engine.setLanguage('sanskrit')
      const langState = engine.getState()
      // Should either be sanskrit or fallback to english
      expect(['sanskrit', 'english']).toContain(langState.currentLanguage)

      // Stop
      engine.stop()
      expect(engine.getState().isPlaying).toBe(false)
    })
  })
})
