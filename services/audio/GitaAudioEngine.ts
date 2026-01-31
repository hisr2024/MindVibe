/**
 * Gita Audio Engine - Sacred Sound Management for Bhagavad Gita
 *
 * ॐ श्रीमद्भगवद्गीता
 *
 * Production-ready audio engine with:
 * - Real audio URLs from Internet Archive & LibriVox
 * - Robust error handling and fallbacks
 * - Ambient sound layering
 * - Comprehensive state management
 */

import {
  type GitaLanguage,
  type GitaPlaybackMode,
  type GitaLearningSettings,
  GITA_CHAPTERS,
  DEFAULT_LEARNING_SETTINGS
} from '@/lib/constants/gita-audio'

import {
  LIBRIVOX_ENGLISH,
  ARCHIVE_SANSKRIT,
  AMBIENT_SOUNDS,
  getAudioSourceByLanguage,
  getChapterAudioUrl,
  getAmbientSound,
  getAmbientSoundUrl,
  getPrimaryLanguage,
  toProxyUrl,
  type RealAudioSource,
  type AmbientSound
} from '@/lib/constants/gita-audio-sources'

// ============ Types ============

export interface GitaPlaybackState {
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  currentLanguage: GitaLanguage
  currentChapter: number
  currentVerse: number
  currentTime: number
  duration: number
  progress: number
  volume: number
  playbackSpeed: number
  playbackMode: GitaPlaybackMode
  soundscapeId: string | null
  ambientVolume: number
  error: string | null
  audioAvailable: boolean
  currentSource: string | null
}

export interface GitaAudioConfig {
  defaultLanguage?: GitaLanguage
  defaultVolume?: number
  defaultAmbientVolume?: number
  crossfadeDuration?: number
  onStateChange?: (state: GitaPlaybackState) => void
  onVerseChange?: (chapter: number, verse: number) => void
  onChapterComplete?: (chapter: number) => void
  onError?: (error: string) => void
  onAudioLoad?: (url: string) => void
}

// ============ Engine Class ============

export class GitaAudioEngine {
  // Audio elements
  private gitaAudio: HTMLAudioElement | null = null
  private ambientAudios: Map<string, HTMLAudioElement> = new Map()

  // State
  private state: GitaPlaybackState = {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentLanguage: 'english', // Default to LibriVox (most reliable)
    currentChapter: 1,
    currentVerse: 1,
    currentTime: 0,
    duration: 0,
    progress: 0,
    volume: 0.7,
    playbackSpeed: 1.0,
    playbackMode: 'continuous',
    soundscapeId: null,
    ambientVolume: 0.25,
    error: null,
    audioAvailable: false,
    currentSource: null
  }

  private config: GitaAudioConfig = {
    defaultLanguage: 'english',
    defaultVolume: 0.7,
    defaultAmbientVolume: 0.25,
    crossfadeDuration: 2000
  }

  private learningSettings: GitaLearningSettings = { ...DEFAULT_LEARNING_SETTINGS }
  private progressInterval: NodeJS.Timeout | null = null
  private initialized: boolean = false

  constructor(options?: GitaAudioConfig) {
    if (options) {
      this.config = { ...this.config, ...options }
      this.state.currentLanguage = options.defaultLanguage || 'english'
      this.state.volume = options.defaultVolume ?? 0.7
      this.state.ambientVolume = options.defaultAmbientVolume ?? 0.25
    }
  }

  // ============ Initialization ============

  static isSupported(): boolean {
    return typeof window !== 'undefined' && typeof Audio !== 'undefined'
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true
    if (!GitaAudioEngine.isSupported()) {
      console.warn('GitaAudioEngine: Audio not supported in this environment')
      return false
    }

    try {
      // Create main audio element
      this.gitaAudio = new Audio()
      this.gitaAudio.crossOrigin = 'anonymous'
      this.gitaAudio.preload = 'metadata'

      // Setup event listeners
      this.setupEventListeners()

      this.initialized = true
      console.log('GitaAudioEngine: Initialized successfully')
      return true
    } catch (error) {
      console.error('GitaAudioEngine: Initialization failed', error)
      this.state.error = 'Failed to initialize audio engine'
      this.emitState()
      return false
    }
  }

  private setupEventListeners(): void {
    if (!this.gitaAudio) return

    this.gitaAudio.addEventListener('loadstart', () => {
      this.state.isLoading = true
      this.state.error = null
      this.emitState()
    })

    this.gitaAudio.addEventListener('loadedmetadata', () => {
      this.state.duration = this.gitaAudio?.duration || 0
      this.state.audioAvailable = true
      this.emitState()
    })

    this.gitaAudio.addEventListener('canplay', () => {
      this.state.isLoading = false
      this.state.audioAvailable = true
      this.emitState()
    })

    this.gitaAudio.addEventListener('canplaythrough', () => {
      this.state.isLoading = false
      this.emitState()
    })

    this.gitaAudio.addEventListener('play', () => {
      this.state.isPlaying = true
      this.state.isPaused = false
      this.state.error = null
      this.startProgressTracking()
      this.emitState()
    })

    this.gitaAudio.addEventListener('pause', () => {
      this.state.isPaused = true
      this.state.isPlaying = false
      this.stopProgressTracking()
      this.emitState()
    })

    this.gitaAudio.addEventListener('ended', () => {
      this.handleAudioEnded()
    })

    this.gitaAudio.addEventListener('error', (e) => {
      const error = this.gitaAudio?.error
      let errorMessage = 'Audio playback error'

      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio loading was aborted'
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio'
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio decode error'
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported'
            break
        }
      }

      console.error('GitaAudioEngine: Audio error', errorMessage, error)
      this.state.error = errorMessage
      this.state.isLoading = false
      this.state.audioAvailable = false
      this.emitState()

      if (this.config.onError) {
        this.config.onError(errorMessage)
      }
    })

    this.gitaAudio.addEventListener('timeupdate', () => {
      this.updateProgress()
    })

    this.gitaAudio.addEventListener('waiting', () => {
      this.state.isLoading = true
      this.emitState()
    })

    this.gitaAudio.addEventListener('playing', () => {
      this.state.isLoading = false
      this.emitState()
    })
  }

  // ============ Playback Controls ============

  async playChapter(
    chapter: number,
    language?: GitaLanguage
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    const lang = language || this.state.currentLanguage
    const audioUrl = getChapterAudioUrl(lang, chapter)

    if (!audioUrl) {
      // Fallback to English (LibriVox - most reliable)
      const fallbackUrl = getChapterAudioUrl('english', chapter)
      if (fallbackUrl) {
        console.warn(`GitaAudioEngine: No audio for ${lang}, falling back to English`)
        return this.playFromUrl(fallbackUrl, chapter, 'english')
      }

      this.state.error = `No audio available for Chapter ${chapter} in ${lang}`
      this.state.audioAvailable = false
      this.emitState()
      return
    }

    return this.playFromUrl(audioUrl, chapter, lang)
  }

  private async playFromUrl(
    url: string,
    chapter: number,
    language: GitaLanguage
  ): Promise<void> {
    if (!this.gitaAudio) {
      await this.initialize()
    }

    try {
      this.state.isLoading = true
      this.state.currentChapter = chapter
      this.state.currentLanguage = language
      this.state.currentSource = url
      this.state.error = null
      this.emitState()

      // Stop current playback
      this.gitaAudio!.pause()
      this.gitaAudio!.currentTime = 0

      // Set new source
      this.gitaAudio!.src = url
      this.gitaAudio!.volume = this.state.volume
      this.gitaAudio!.playbackRate = this.state.playbackSpeed

      // Load and play
      await this.gitaAudio!.load()

      // Play with user interaction handling
      const playPromise = this.gitaAudio!.play()

      if (playPromise !== undefined) {
        await playPromise
      }

      this.state.isPlaying = true
      this.state.isLoading = false
      this.state.audioAvailable = true

      if (this.config.onAudioLoad) {
        this.config.onAudioLoad(url)
      }

      this.emitState()

    } catch (error: any) {
      console.error('GitaAudioEngine: Failed to play', error)

      // Handle autoplay restriction
      if (error.name === 'NotAllowedError') {
        this.state.error = 'Please tap to enable audio playback'
        this.state.isPaused = true
      } else {
        this.state.error = `Failed to play: ${error.message || 'Unknown error'}`
      }

      this.state.isLoading = false
      this.emitState()
    }
  }

  pause(): void {
    if (this.gitaAudio && this.state.isPlaying) {
      this.gitaAudio.pause()
      this.state.isPaused = true
      this.state.isPlaying = false
      this.emitState()
    }
  }

  async resume(): Promise<void> {
    if (this.gitaAudio && this.state.isPaused) {
      try {
        await this.gitaAudio.play()
        this.state.isPaused = false
        this.state.isPlaying = true
        this.state.error = null
        this.emitState()
      } catch (error: any) {
        console.error('GitaAudioEngine: Failed to resume', error)
        this.state.error = 'Failed to resume playback'
        this.emitState()
      }
    }
  }

  async togglePlayPause(): Promise<void> {
    if (this.state.isPlaying) {
      this.pause()
    } else if (this.state.isPaused && this.gitaAudio?.src) {
      await this.resume()
    } else {
      await this.playChapter(this.state.currentChapter, this.state.currentLanguage)
    }
  }

  stop(): void {
    if (this.gitaAudio) {
      this.gitaAudio.pause()
      this.gitaAudio.currentTime = 0
    }

    this.stopAllAmbient()
    this.stopProgressTracking()

    this.state.isPlaying = false
    this.state.isPaused = false
    this.state.currentTime = 0
    this.state.progress = 0
    this.emitState()
  }

  seekTo(percent: number): void {
    if (this.gitaAudio && this.state.duration > 0) {
      const time = (percent / 100) * this.state.duration
      this.gitaAudio.currentTime = time
      this.state.currentTime = time
      this.state.progress = percent
      this.emitState()
    }
  }

  seekToTime(seconds: number): void {
    if (this.gitaAudio) {
      this.gitaAudio.currentTime = Math.max(0, Math.min(seconds, this.state.duration))
      this.updateProgress()
    }
  }

  // ============ Navigation ============

  async nextChapter(): Promise<void> {
    const nextChapter = this.state.currentChapter + 1
    if (nextChapter <= 18) {
      await this.playChapter(nextChapter, this.state.currentLanguage)
    } else if (this.state.playbackMode === 'continuous') {
      await this.playChapter(1, this.state.currentLanguage)
    } else {
      this.stop()
    }
  }

  async previousChapter(): Promise<void> {
    // If more than 3 seconds in, restart current chapter
    if (this.state.currentTime > 3) {
      this.seekTo(0)
      return
    }

    const prevChapter = this.state.currentChapter - 1
    if (prevChapter >= 1) {
      await this.playChapter(prevChapter, this.state.currentLanguage)
    } else {
      await this.playChapter(18, this.state.currentLanguage)
    }
  }

  skipForward(seconds: number = 15): void {
    if (this.gitaAudio) {
      this.gitaAudio.currentTime = Math.min(
        this.gitaAudio.currentTime + seconds,
        this.state.duration
      )
    }
  }

  skipBackward(seconds: number = 15): void {
    if (this.gitaAudio) {
      this.gitaAudio.currentTime = Math.max(
        this.gitaAudio.currentTime - seconds,
        0
      )
    }
  }

  // ============ Volume Controls ============

  setGitaVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume))
    if (this.gitaAudio) {
      this.gitaAudio.volume = this.state.volume
    }
    this.emitState()
  }

  setAmbientVolume(volume: number): void {
    this.state.ambientVolume = Math.max(0, Math.min(1, volume))
    this.ambientAudios.forEach((audio) => {
      audio.volume = this.state.ambientVolume * 0.5 // Keep ambient lower
    })
    this.emitState()
  }

  setPlaybackSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(0.5, Math.min(2.0, speed))
    if (this.gitaAudio) {
      this.gitaAudio.playbackRate = this.state.playbackSpeed
    }
    this.emitState()
  }

  setPlaybackMode(mode: GitaPlaybackMode): void {
    this.state.playbackMode = mode
    this.emitState()
  }

  // ============ Language ============

  async setLanguage(language: GitaLanguage): Promise<void> {
    if (language === this.state.currentLanguage) return

    const wasPlaying = this.state.isPlaying
    const currentTime = this.gitaAudio?.currentTime || 0

    this.state.currentLanguage = language

    if (wasPlaying || this.state.isPaused) {
      await this.playChapter(this.state.currentChapter, language)
      // Try to seek to similar position (may not be exact)
      if (currentTime > 0 && currentTime < this.state.duration * 0.9) {
        setTimeout(() => this.seekToTime(currentTime), 500)
      }
    }

    this.emitState()
  }

  // ============ Ambient Sounds ============

  async startAmbientSound(soundId: string): Promise<void> {
    const sound = getAmbientSound(soundId)
    if (!sound) {
      console.warn(`GitaAudioEngine: Ambient sound '${soundId}' not found`)
      return
    }

    // Stop existing instance of this sound
    this.stopAmbientSound(soundId)

    try {
      const audio = new Audio()
      // Use proxied URL to bypass CORS restrictions
      const proxyUrl = getAmbientSoundUrl(soundId) || toProxyUrl(sound.url)
      audio.src = proxyUrl
      audio.loop = sound.loopable
      audio.volume = this.state.ambientVolume * 0.5

      await audio.play()
      this.ambientAudios.set(soundId, audio)

      console.log(`GitaAudioEngine: Started ambient sound '${soundId}'`)
    } catch (error) {
      console.warn(`GitaAudioEngine: Failed to start ambient sound '${soundId}'`, error)
    }
  }

  stopAmbientSound(soundId: string): void {
    const audio = this.ambientAudios.get(soundId)
    if (audio) {
      audio.pause()
      audio.src = ''
      this.ambientAudios.delete(soundId)
    }
  }

  stopAllAmbient(): void {
    this.ambientAudios.forEach((audio, key) => {
      audio.pause()
      audio.src = ''
    })
    this.ambientAudios.clear()
    this.state.soundscapeId = null
    this.emitState()
  }

  async startSoundscape(soundscapeId: string): Promise<void> {
    // Import soundscapes from constants
    const { GITA_SOUNDSCAPES } = await import('@/lib/constants/gita-audio')
    const soundscape = GITA_SOUNDSCAPES.find(s => s.id === soundscapeId)

    if (!soundscape) {
      console.warn(`GitaAudioEngine: Soundscape '${soundscapeId}' not found`)
      return
    }

    this.stopAllAmbient()
    this.state.soundscapeId = soundscapeId

    // Start each ambient sound
    for (const sound of soundscape.ambientSounds) {
      await this.startAmbientSound(sound.type)
    }

    this.emitState()
  }

  async playWithSoundscape(soundscapeId: string, chapter?: number): Promise<void> {
    await this.startSoundscape(soundscapeId)
    await this.playChapter(chapter || this.state.currentChapter)
  }

  // ============ State ============

  getState(): GitaPlaybackState {
    return { ...this.state }
  }

  getCurrentChapter() {
    return GITA_CHAPTERS.find(c => c.number === this.state.currentChapter)
  }

  getAvailableLanguages(): GitaLanguage[] {
    // Currently available languages with working audio
    return ['english', 'sanskrit']
  }

  getLearningSettings(): GitaLearningSettings {
    return { ...this.learningSettings }
  }

  setLearningSettings(settings: Partial<GitaLearningSettings>): void {
    this.learningSettings = { ...this.learningSettings, ...settings }
  }

  // ============ Private Methods ============

  private handleAudioEnded(): void {
    this.stopProgressTracking()

    if (this.config.onChapterComplete) {
      this.config.onChapterComplete(this.state.currentChapter)
    }

    switch (this.state.playbackMode) {
      case 'continuous':
        this.nextChapter()
        break
      case 'chapter_loop':
        this.playChapter(this.state.currentChapter, this.state.currentLanguage)
        break
      default:
        this.state.isPlaying = false
        this.emitState()
    }
  }

  private startProgressTracking(): void {
    this.stopProgressTracking()
    this.progressInterval = setInterval(() => {
      this.updateProgress()
    }, 250)
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  private updateProgress(): void {
    if (!this.gitaAudio) return

    this.state.currentTime = this.gitaAudio.currentTime
    this.state.duration = this.gitaAudio.duration || 0
    this.state.progress = this.state.duration > 0
      ? (this.state.currentTime / this.state.duration) * 100
      : 0

    this.emitState()
  }

  private emitState(): void {
    if (this.config.onStateChange) {
      this.config.onStateChange({ ...this.state })
    }
  }

  // ============ Cleanup ============

  dispose(): void {
    this.stop()

    if (this.gitaAudio) {
      this.gitaAudio.src = ''
      this.gitaAudio = null
    }

    this.ambientAudios.forEach((audio) => {
      audio.pause()
      audio.src = ''
    })
    this.ambientAudios.clear()
    this.initialized = false
  }
}

// ============ Singleton ============

let gitaAudioInstance: GitaAudioEngine | null = null

export function getGitaAudioEngine(): GitaAudioEngine {
  if (!gitaAudioInstance) {
    gitaAudioInstance = new GitaAudioEngine()
  }
  return gitaAudioInstance
}

export function createGitaAudioEngine(config?: GitaAudioConfig): GitaAudioEngine {
  return new GitaAudioEngine(config)
}

export const gitaAudioEngine = getGitaAudioEngine()

export default GitaAudioEngine
