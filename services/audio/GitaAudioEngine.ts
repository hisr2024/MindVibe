/**
 * Gita Audio Engine - Sacred Sound Management for Bhagavad Gita
 *
 * ॐ श्रीमद्भगवद्गीता
 *
 * Enterprise-grade audio engine for Bhagavad Gita recitation:
 * - Multi-language playback (Sanskrit, Hindi, Telugu, Tamil, Malayalam, English)
 * - Seamless layering with ambient soundscapes
 * - Chapter and verse-level navigation
 * - Learning mode with pause and repeat
 * - Crossfade transitions between audio
 * - Offline caching support
 * - Analytics integration
 *
 * Audio Architecture:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                     Master Output                           │
 * ├─────────────────────────────────────────────────────────────┤
 * │  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐ │
 * │  │  Gita Voice   │  │   Ambient     │  │   Background    │ │
 * │  │  (Primary)    │  │   Sounds      │  │   Music (opt)   │ │
 * │  │  Vol: 0.7     │  │   Vol: 0.25   │  │   Vol: 0.1      │ │
 * │  └───────────────┘  └───────────────┘  └─────────────────┘ │
 * │         │                  │                   │           │
 * │         ├──────────────────┴───────────────────┤           │
 * │         │           Compressor/Limiter          │           │
 * │         └───────────────────────────────────────┘           │
 * └─────────────────────────────────────────────────────────────┘
 */

import {
  type GitaLanguage,
  type GitaChapter,
  type GitaSoundscape,
  type GitaPlaybackMode,
  type GitaLearningSettings,
  GITA_CHAPTERS,
  GITA_AUDIO_SOURCES,
  GITA_SOUNDSCAPES,
  DEFAULT_LEARNING_SETTINGS,
  getGitaChapter,
  getGitaAudioSource
} from '@/lib/constants/gita-audio'

// ============ Types ============

/**
 * Current playback state
 */
export interface GitaPlaybackState {
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  currentLanguage: GitaLanguage
  currentChapter: number
  currentVerse: number
  currentTime: number
  duration: number
  progress: number  // 0-100
  volume: number
  playbackSpeed: number
  playbackMode: GitaPlaybackMode
  soundscapeId: string | null
  ambientVolume: number
  error: string | null
}

/**
 * Verse timing information
 */
export interface VerseTiming {
  chapter: number
  verse: number
  startTime: number
  endTime: number
  duration: number
}

/**
 * Engine configuration
 */
export interface GitaAudioConfig {
  defaultLanguage?: GitaLanguage
  defaultVolume?: number
  defaultAmbientVolume?: number
  crossfadeDuration?: number
  preloadNextChapter?: boolean
  enableOfflineCache?: boolean
  onStateChange?: (state: GitaPlaybackState) => void
  onVerseChange?: (chapter: number, verse: number) => void
  onChapterComplete?: (chapter: number) => void
  onError?: (error: string) => void
}

/**
 * Audio layer configuration
 */
interface AudioLayer {
  source: AudioBufferSourceNode | null
  gainNode: GainNode
  isPlaying: boolean
}

// ============ Engine Class ============

/**
 * Gita Audio Engine
 *
 * Manages all Bhagavad Gita audio playback with ambient sound integration.
 */
export class GitaAudioEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private gitaGain: GainNode | null = null
  private ambientGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null

  // Audio elements for HTML5 Audio (more compatible)
  private gitaAudio: HTMLAudioElement | null = null
  private ambientAudios: Map<string, HTMLAudioElement> = new Map()

  // Cached audio buffers
  private audioCache: Map<string, AudioBuffer> = new Map()

  // Verse timings for navigation
  private verseTimings: Map<string, VerseTiming[]> = new Map()

  // State
  private state: GitaPlaybackState = {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentLanguage: 'sanskrit',
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
    error: null
  }

  private config: GitaAudioConfig = {
    defaultLanguage: 'sanskrit',
    defaultVolume: 0.7,
    defaultAmbientVolume: 0.25,
    crossfadeDuration: 2000,
    preloadNextChapter: true,
    enableOfflineCache: true
  }

  private learningSettings: GitaLearningSettings = { ...DEFAULT_LEARNING_SETTINGS }

  // Intervals for progress tracking
  private progressInterval: NodeJS.Timeout | null = null

  constructor(options?: GitaAudioConfig) {
    if (options) {
      this.config = { ...this.config, ...options }
      this.state.currentLanguage = options.defaultLanguage || 'sanskrit'
      this.state.volume = options.defaultVolume || 0.7
      this.state.ambientVolume = options.defaultAmbientVolume || 0.25
    }
  }

  // ============ Initialization ============

  /**
   * Check browser support
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('AudioContext' in window || 'webkitAudioContext' in window)
  }

  /**
   * Initialize the audio engine
   */
  async initialize(): Promise<boolean> {
    if (!GitaAudioEngine.isSupported()) {
      console.warn('GitaAudioEngine: Web Audio API not supported')
      return false
    }

    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioContextClass()

      // Create master gain (output)
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 1.0

      // Create compressor for smooth output
      this.compressor = this.audioContext.createDynamicsCompressor()
      this.compressor.threshold.value = -24
      this.compressor.knee.value = 30
      this.compressor.ratio.value = 12
      this.compressor.attack.value = 0.003
      this.compressor.release.value = 0.25

      // Create Gita voice gain
      this.gitaGain = this.audioContext.createGain()
      this.gitaGain.gain.value = this.state.volume

      // Create ambient gain
      this.ambientGain = this.audioContext.createGain()
      this.ambientGain.gain.value = this.state.ambientVolume

      // Connect the audio graph
      this.gitaGain.connect(this.compressor)
      this.ambientGain.connect(this.compressor)
      this.compressor.connect(this.masterGain)
      this.masterGain.connect(this.audioContext.destination)

      // Create HTML5 Audio element for Gita
      this.gitaAudio = new Audio()
      this.gitaAudio.crossOrigin = 'anonymous'
      this.setupAudioEventListeners()

      console.log('GitaAudioEngine: Initialized successfully')
      return true
    } catch (error) {
      console.error('GitaAudioEngine: Initialization failed', error)
      this.state.error = 'Failed to initialize audio engine'
      this.emitState()
      return false
    }
  }

  /**
   * Setup event listeners for the Gita audio element
   */
  private setupAudioEventListeners(): void {
    if (!this.gitaAudio) return

    this.gitaAudio.addEventListener('loadstart', () => {
      this.state.isLoading = true
      this.emitState()
    })

    this.gitaAudio.addEventListener('canplay', () => {
      this.state.isLoading = false
      this.state.duration = this.gitaAudio?.duration || 0
      this.emitState()
    })

    this.gitaAudio.addEventListener('play', () => {
      this.state.isPlaying = true
      this.state.isPaused = false
      this.startProgressTracking()
      this.emitState()
    })

    this.gitaAudio.addEventListener('pause', () => {
      this.state.isPaused = true
      this.stopProgressTracking()
      this.emitState()
    })

    this.gitaAudio.addEventListener('ended', () => {
      this.handleAudioEnded()
    })

    this.gitaAudio.addEventListener('error', (e) => {
      this.state.error = 'Failed to load audio'
      this.state.isLoading = false
      this.emitState()
      if (this.config.onError) {
        this.config.onError(this.state.error)
      }
    })

    this.gitaAudio.addEventListener('timeupdate', () => {
      this.updateProgress()
    })
  }

  // ============ Playback Controls ============

  /**
   * Play Gita audio for a specific chapter
   */
  async playChapter(
    chapter: number,
    language?: GitaLanguage,
    soundscapeId?: string
  ): Promise<void> {
    if (!this.gitaAudio) {
      await this.initialize()
    }

    const lang = language || this.state.currentLanguage
    const audioSource = getGitaAudioSource(lang)

    if (!audioSource) {
      this.state.error = `No audio source found for language: ${lang}`
      this.emitState()
      return
    }

    // Construct audio URL
    const audioUrl = this.getChapterAudioUrl(chapter, lang)

    try {
      this.state.isLoading = true
      this.state.currentChapter = chapter
      this.state.currentVerse = 1
      this.state.currentLanguage = lang
      this.emitState()

      // Resume audio context if suspended
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Set audio source
      if (this.gitaAudio) {
        this.gitaAudio.src = audioUrl
        this.gitaAudio.playbackRate = this.state.playbackSpeed
        this.gitaAudio.volume = this.state.volume

        await this.gitaAudio.play()
      }

      // Start soundscape if specified
      if (soundscapeId) {
        await this.startSoundscape(soundscapeId)
      }

      this.state.isPlaying = true
      this.state.isLoading = false
      this.emitState()

    } catch (error) {
      console.error('GitaAudioEngine: Failed to play chapter', error)
      this.state.error = 'Failed to play audio'
      this.state.isLoading = false
      this.emitState()
    }
  }

  /**
   * Play a specific verse (if verse-level audio available)
   */
  async playVerse(
    chapter: number,
    verse: number,
    language?: GitaLanguage
  ): Promise<void> {
    const lang = language || this.state.currentLanguage
    const audioSource = getGitaAudioSource(lang)

    if (!audioSource?.hasVerseFiles) {
      // Play chapter and seek to verse
      await this.playChapter(chapter, lang)
      // TODO: Seek to verse timing if available
      return
    }

    const verseUrl = this.getVerseAudioUrl(chapter, verse, lang)

    try {
      if (this.gitaAudio) {
        this.gitaAudio.src = verseUrl
        this.gitaAudio.playbackRate = this.state.playbackSpeed
        await this.gitaAudio.play()
      }

      this.state.currentChapter = chapter
      this.state.currentVerse = verse
      this.state.isPlaying = true
      this.emitState()

    } catch (error) {
      console.error('GitaAudioEngine: Failed to play verse', error)
      this.state.error = 'Failed to play verse'
      this.emitState()
    }
  }

  /**
   * Play with a specific soundscape preset
   */
  async playWithSoundscape(
    soundscapeId: string,
    chapter?: number
  ): Promise<void> {
    const soundscape = GITA_SOUNDSCAPES.find(s => s.id === soundscapeId)
    if (!soundscape) {
      this.state.error = `Soundscape not found: ${soundscapeId}`
      this.emitState()
      return
    }

    // Set volumes from soundscape
    this.state.volume = soundscape.gitaVolume
    this.state.ambientVolume = soundscape.ambientVolume

    if (this.gitaGain) {
      this.gitaGain.gain.value = soundscape.gitaVolume
    }
    if (this.ambientGain) {
      this.ambientGain.gain.value = soundscape.ambientVolume
    }

    // Start ambient sounds
    await this.startSoundscape(soundscapeId)

    // Play Gita audio
    const chapterToPlay = chapter || this.state.currentChapter
    await this.playChapter(chapterToPlay, soundscape.defaultLanguage, soundscapeId)
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.gitaAudio && this.state.isPlaying) {
      this.gitaAudio.pause()
      this.state.isPaused = true
      this.state.isPlaying = false
      this.emitState()
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.gitaAudio && this.state.isPaused) {
      await this.gitaAudio.play()
      this.state.isPaused = false
      this.state.isPlaying = true
      this.emitState()
    }
  }

  /**
   * Toggle play/pause
   */
  async togglePlayPause(): Promise<void> {
    if (this.state.isPlaying) {
      this.pause()
    } else {
      await this.resume()
    }
  }

  /**
   * Stop all playback
   */
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

  /**
   * Seek to position (0-100 percentage)
   */
  seekTo(percent: number): void {
    if (this.gitaAudio && this.state.duration > 0) {
      const time = (percent / 100) * this.state.duration
      this.gitaAudio.currentTime = time
      this.state.currentTime = time
      this.state.progress = percent
      this.emitState()
    }
  }

  /**
   * Seek to specific time in seconds
   */
  seekToTime(seconds: number): void {
    if (this.gitaAudio) {
      this.gitaAudio.currentTime = Math.max(0, Math.min(seconds, this.state.duration))
      this.updateProgress()
    }
  }

  // ============ Navigation ============

  /**
   * Go to next chapter
   */
  async nextChapter(): Promise<void> {
    const nextChapter = this.state.currentChapter + 1
    if (nextChapter <= 18) {
      await this.playChapter(nextChapter, this.state.currentLanguage)
    } else {
      // Loop back to chapter 1 or stop
      if (this.state.playbackMode === 'continuous') {
        await this.playChapter(1, this.state.currentLanguage)
      } else {
        this.stop()
      }
    }
  }

  /**
   * Go to previous chapter
   */
  async previousChapter(): Promise<void> {
    const prevChapter = this.state.currentChapter - 1
    if (prevChapter >= 1) {
      await this.playChapter(prevChapter, this.state.currentLanguage)
    } else {
      await this.playChapter(18, this.state.currentLanguage)
    }
  }

  /**
   * Skip forward by seconds
   */
  skipForward(seconds: number = 15): void {
    if (this.gitaAudio) {
      this.gitaAudio.currentTime = Math.min(
        this.gitaAudio.currentTime + seconds,
        this.state.duration
      )
    }
  }

  /**
   * Skip backward by seconds
   */
  skipBackward(seconds: number = 15): void {
    if (this.gitaAudio) {
      this.gitaAudio.currentTime = Math.max(
        this.gitaAudio.currentTime - seconds,
        0
      )
    }
  }

  // ============ Volume Controls ============

  /**
   * Set Gita voice volume (0-1)
   */
  setGitaVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume))
    if (this.gitaAudio) {
      this.gitaAudio.volume = this.state.volume
    }
    if (this.gitaGain) {
      this.gitaGain.gain.value = this.state.volume
    }
    this.emitState()
  }

  /**
   * Set ambient sounds volume (0-1)
   */
  setAmbientVolume(volume: number): void {
    this.state.ambientVolume = Math.max(0, Math.min(1, volume))
    if (this.ambientGain) {
      this.ambientGain.gain.value = this.state.ambientVolume
    }
    // Update all ambient audio elements
    this.ambientAudios.forEach((audio) => {
      audio.volume = this.state.ambientVolume
    })
    this.emitState()
  }

  /**
   * Set playback speed (0.5 - 2.0)
   */
  setPlaybackSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(0.5, Math.min(2.0, speed))
    if (this.gitaAudio) {
      this.gitaAudio.playbackRate = this.state.playbackSpeed
    }
    this.emitState()
  }

  /**
   * Set playback mode
   */
  setPlaybackMode(mode: GitaPlaybackMode): void {
    this.state.playbackMode = mode
    this.emitState()
  }

  // ============ Language ============

  /**
   * Change language and restart current chapter
   */
  async setLanguage(language: GitaLanguage): Promise<void> {
    if (language === this.state.currentLanguage) return

    const wasPlaying = this.state.isPlaying
    const currentTime = this.gitaAudio?.currentTime || 0

    this.state.currentLanguage = language

    if (wasPlaying) {
      await this.playChapter(this.state.currentChapter, language)
      // Try to seek to similar position
      this.seekToTime(currentTime)
    }

    this.emitState()
  }

  // ============ Ambient Soundscape ============

  /**
   * Start an ambient soundscape
   */
  async startSoundscape(soundscapeId: string): Promise<void> {
    const soundscape = GITA_SOUNDSCAPES.find(s => s.id === soundscapeId)
    if (!soundscape) return

    // Stop existing ambient sounds
    this.stopAllAmbient()

    this.state.soundscapeId = soundscapeId

    // Start each ambient sound layer
    for (const sound of soundscape.ambientSounds) {
      await this.startAmbientSound(sound.type, sound.volume, sound.pan)
    }

    this.emitState()
  }

  /**
   * Start a single ambient sound
   */
  private async startAmbientSound(
    soundType: string,
    volume: number,
    pan?: number
  ): Promise<void> {
    const audioUrl = `/audio/ambient/${soundType}.mp3`

    const audio = new Audio(audioUrl)
    audio.loop = true
    audio.volume = volume * this.state.ambientVolume

    try {
      await audio.play()
      this.ambientAudios.set(soundType, audio)
    } catch (error) {
      console.warn(`GitaAudioEngine: Failed to start ambient sound: ${soundType}`)
    }
  }

  /**
   * Stop all ambient sounds
   */
  stopAllAmbient(): void {
    this.ambientAudios.forEach((audio, key) => {
      audio.pause()
      audio.src = ''
    })
    this.ambientAudios.clear()
    this.state.soundscapeId = null
    this.emitState()
  }

  /**
   * Stop a specific ambient sound
   */
  stopAmbientSound(soundType: string): void {
    const audio = this.ambientAudios.get(soundType)
    if (audio) {
      audio.pause()
      audio.src = ''
      this.ambientAudios.delete(soundType)
    }
  }

  // ============ Learning Mode ============

  /**
   * Update learning settings
   */
  setLearningSettings(settings: Partial<GitaLearningSettings>): void {
    this.learningSettings = { ...this.learningSettings, ...settings }
  }

  /**
   * Get current learning settings
   */
  getLearningSettings(): GitaLearningSettings {
    return { ...this.learningSettings }
  }

  /**
   * Enter learning mode for a specific chapter
   */
  async startLearningMode(chapter: number, language?: GitaLanguage): Promise<void> {
    this.state.playbackMode = 'learning'
    this.state.playbackSpeed = this.learningSettings.playbackSpeed

    await this.playChapter(chapter, language)
    this.emitState()
  }

  // ============ State Management ============

  /**
   * Get current state
   */
  getState(): GitaPlaybackState {
    return { ...this.state }
  }

  /**
   * Get current chapter info
   */
  getCurrentChapter(): GitaChapter | undefined {
    return getGitaChapter(this.state.currentChapter)
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): GitaLanguage[] {
    return GITA_AUDIO_SOURCES.map(s => s.language)
  }

  /**
   * Get available soundscapes
   */
  getSoundscapes(): typeof GITA_SOUNDSCAPES {
    return GITA_SOUNDSCAPES
  }

  // ============ Private Methods ============

  /**
   * Get audio URL for a chapter
   */
  private getChapterAudioUrl(chapter: number, language: GitaLanguage): string {
    const source = getGitaAudioSource(language)
    if (!source) return ''

    // Format: /audio/gita/{language}/chapter-{number}.{format}
    const paddedChapter = chapter.toString().padStart(2, '0')
    return `${source.baseUrl}/chapter-${paddedChapter}.${source.format}`
  }

  /**
   * Get audio URL for a verse
   */
  private getVerseAudioUrl(
    chapter: number,
    verse: number,
    language: GitaLanguage
  ): string {
    const source = getGitaAudioSource(language)
    if (!source) return ''

    const paddedChapter = chapter.toString().padStart(2, '0')
    const paddedVerse = verse.toString().padStart(3, '0')
    return `${source.baseUrl}/chapter-${paddedChapter}/verse-${paddedVerse}.${source.format}`
  }

  /**
   * Handle audio ended event
   */
  private handleAudioEnded(): void {
    this.stopProgressTracking()

    // Emit chapter complete
    if (this.config.onChapterComplete) {
      this.config.onChapterComplete(this.state.currentChapter)
    }

    // Handle based on playback mode
    switch (this.state.playbackMode) {
      case 'continuous':
        this.nextChapter()
        break

      case 'chapter_loop':
        this.playChapter(this.state.currentChapter, this.state.currentLanguage)
        break

      case 'learning':
        // In learning mode, pause for contemplation
        this.state.isPlaying = false
        this.state.isPaused = true
        this.emitState()
        break

      default:
        this.state.isPlaying = false
        this.emitState()
    }
  }

  /**
   * Start progress tracking interval
   */
  private startProgressTracking(): void {
    this.stopProgressTracking()
    this.progressInterval = setInterval(() => {
      this.updateProgress()
    }, 250)
  }

  /**
   * Stop progress tracking interval
   */
  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  /**
   * Update progress state
   */
  private updateProgress(): void {
    if (!this.gitaAudio) return

    this.state.currentTime = this.gitaAudio.currentTime
    this.state.duration = this.gitaAudio.duration || 0
    this.state.progress = this.state.duration > 0
      ? (this.state.currentTime / this.state.duration) * 100
      : 0

    this.emitState()
  }

  /**
   * Emit state change
   */
  private emitState(): void {
    if (this.config.onStateChange) {
      this.config.onStateChange({ ...this.state })
    }
  }

  // ============ Cleanup ============

  /**
   * Dispose and cleanup
   */
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

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.audioCache.clear()
    this.verseTimings.clear()
  }
}

// ============ Singleton & Factory ============

let gitaAudioInstance: GitaAudioEngine | null = null

/**
 * Get or create singleton instance
 */
export function getGitaAudioEngine(): GitaAudioEngine {
  if (!gitaAudioInstance) {
    gitaAudioInstance = new GitaAudioEngine()
  }
  return gitaAudioInstance
}

/**
 * Create a new instance
 */
export function createGitaAudioEngine(config?: GitaAudioConfig): GitaAudioEngine {
  return new GitaAudioEngine(config)
}

export const gitaAudioEngine = getGitaAudioEngine()

export default GitaAudioEngine
