/**
 * Streaming TTS Engine
 *
 * World-class streaming text-to-speech implementation:
 * - Progressive audio playback (first byte in < 200ms)
 * - Chunk-based synthesis for low latency
 * - Intelligent sentence boundary detection
 * - Seamless audio concatenation
 * - Adaptive quality based on network conditions
 * - Pre-buffering for smooth playback
 *
 * Performance targets:
 * - Time to first audio: < 200ms
 * - Buffer underrun rate: < 0.1%
 * - CPU usage during playback: < 5%
 */

import { apiFetch } from '@/lib/api'

// Chunk types
export interface AudioChunk {
  id: string
  text: string
  audioData: ArrayBuffer | null
  status: 'pending' | 'loading' | 'ready' | 'playing' | 'complete' | 'error'
  duration: number
  startTime: number
}

// Streaming configuration
export interface StreamingTTSConfig {
  // Chunking
  maxChunkLength?: number          // Max characters per chunk
  minChunkLength?: number          // Min characters per chunk
  chunkOnSentences?: boolean       // Prefer sentence boundaries

  // Buffering
  preBufferChunks?: number         // Chunks to buffer ahead
  minBufferDuration?: number       // Min buffer in seconds
  maxBufferDuration?: number       // Max buffer in seconds

  // Quality
  defaultQuality?: 'low' | 'medium' | 'high'
  adaptiveQuality?: boolean        // Adjust quality based on network

  // Voice settings
  language?: string
  voiceType?: 'calm' | 'wisdom' | 'friendly'
  speechRate?: number
  pitch?: number

  // Callbacks
  onStart?: () => void
  onProgress?: (progress: number, currentText: string) => void
  onChunkReady?: (chunk: AudioChunk) => void
  onEnd?: () => void
  onError?: (error: string) => void
}

// Playback state
export interface StreamingState {
  isPlaying: boolean
  isPaused: boolean
  isBuffering: boolean
  progress: number
  currentChunkIndex: number
  totalChunks: number
  bufferedDuration: number
  playedDuration: number
  totalDuration: number
}

/**
 * Streaming TTS Engine Class
 */
export class StreamingTTSEngine {
  private config: Required<StreamingTTSConfig>
  private state: StreamingState

  // Audio management
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private chunks: AudioChunk[] = []
  private audioBuffers: Map<string, AudioBuffer> = new Map()
  private currentSource: AudioBufferSourceNode | null = null

  // Playback control
  private playbackStartTime = 0
  private pausedAt = 0
  private nextChunkTimeout: ReturnType<typeof setTimeout> | null = null

  // Quality adaptation
  private networkQuality: 'good' | 'moderate' | 'poor' = 'good'
  private loadTimes: number[] = []

  // Sentence boundary patterns
  private readonly sentenceEnders = /[.!?।॥]/
  private readonly clauseEnders = /[,;:–—]/

  constructor(config: StreamingTTSConfig = {}) {
    // ULTRA-NATURAL streaming voice settings
    this.config = {
      maxChunkLength: config.maxChunkLength ?? 200,
      minChunkLength: config.minChunkLength ?? 50,
      chunkOnSentences: config.chunkOnSentences ?? true,
      preBufferChunks: config.preBufferChunks ?? 2,
      minBufferDuration: config.minBufferDuration ?? 1.0,
      maxBufferDuration: config.maxBufferDuration ?? 10.0,
      defaultQuality: config.defaultQuality ?? 'high',
      adaptiveQuality: config.adaptiveQuality ?? true,
      language: config.language ?? 'en',
      voiceType: config.voiceType ?? 'friendly',
      speechRate: config.speechRate ?? 0.96,  // Natural conversational pace
      pitch: config.pitch ?? 1.0,
      onStart: config.onStart ?? (() => {}),
      onProgress: config.onProgress ?? (() => {}),
      onChunkReady: config.onChunkReady ?? (() => {}),
      onEnd: config.onEnd ?? (() => {}),
      onError: config.onError ?? (() => {})
    }

    this.state = {
      isPlaying: false,
      isPaused: false,
      isBuffering: false,
      progress: 0,
      currentChunkIndex: 0,
      totalChunks: 0,
      bufferedDuration: 0,
      playedDuration: 0,
      totalDuration: 0
    }
  }

  /**
   * Initialize audio context
   */
  private async initAudioContext(): Promise<void> {
    if (this.audioContext) return

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    this.audioContext = new AudioContextClass()

    this.gainNode = this.audioContext.createGain()
    this.gainNode.connect(this.audioContext.destination)
    this.gainNode.gain.value = 1.0

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  /**
   * Speak text with streaming
   */
  async speak(text: string): Promise<void> {
    if (!text.trim()) return

    try {
      await this.initAudioContext()

      // Reset state
      this.stop()
      this.chunks = []
      this.audioBuffers.clear()

      // Split text into chunks
      this.chunks = this.splitIntoChunks(text)
      this.state.totalChunks = this.chunks.length
      this.state.totalDuration = this.estimateDuration(text)

      console.log(`[StreamingTTS] Split into ${this.chunks.length} chunks`)

      // Start buffering first chunks
      this.state.isBuffering = true
      await this.bufferChunks(0, this.config.preBufferChunks)

      // Start playback
      this.state.isPlaying = true
      this.state.isBuffering = false
      this.playbackStartTime = this.audioContext!.currentTime
      this.config.onStart()

      // Play first chunk
      await this.playChunk(0)

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Streaming TTS failed'
      this.config.onError(errorMsg)
      throw error
    }
  }

  /**
   * Split text into optimal chunks
   */
  private splitIntoChunks(text: string): AudioChunk[] {
    const chunks: AudioChunk[] = []
    let remaining = text.trim()
    let chunkIndex = 0

    while (remaining.length > 0) {
      let chunkText: string
      let splitIndex: number

      if (remaining.length <= this.config.maxChunkLength) {
        // Last chunk
        chunkText = remaining
        remaining = ''
      } else if (this.config.chunkOnSentences) {
        // Try to split on sentence boundary
        splitIndex = this.findBestSplitPoint(remaining)
        chunkText = remaining.substring(0, splitIndex).trim()
        remaining = remaining.substring(splitIndex).trim()
      } else {
        // Split at max length
        chunkText = remaining.substring(0, this.config.maxChunkLength).trim()
        remaining = remaining.substring(this.config.maxChunkLength).trim()
      }

      if (chunkText) {
        chunks.push({
          id: `chunk-${chunkIndex}`,
          text: chunkText,
          audioData: null,
          status: 'pending',
          duration: this.estimateChunkDuration(chunkText),
          startTime: 0
        })
        chunkIndex++
      }
    }

    // Calculate start times
    let currentTime = 0
    for (const chunk of chunks) {
      chunk.startTime = currentTime
      currentTime += chunk.duration
    }

    return chunks
  }

  /**
   * Find best split point for natural speech
   */
  private findBestSplitPoint(text: string): number {
    const maxLen = this.config.maxChunkLength
    const minLen = this.config.minChunkLength

    // Look for sentence enders first
    for (let i = maxLen; i >= minLen; i--) {
      if (this.sentenceEnders.test(text[i - 1])) {
        return i
      }
    }

    // Look for clause enders
    for (let i = maxLen; i >= minLen; i--) {
      if (this.clauseEnders.test(text[i - 1])) {
        return i
      }
    }

    // Look for word boundary
    for (let i = maxLen; i >= minLen; i--) {
      if (text[i] === ' ') {
        return i + 1
      }
    }

    // Default to max length
    return maxLen
  }

  /**
   * Buffer multiple chunks
   */
  private async bufferChunks(startIndex: number, count: number): Promise<void> {
    const endIndex = Math.min(startIndex + count, this.chunks.length)
    const loadPromises: Promise<void>[] = []

    for (let i = startIndex; i < endIndex; i++) {
      if (this.chunks[i].status === 'pending') {
        loadPromises.push(this.loadChunk(i))
      }
    }

    await Promise.all(loadPromises)
    this.updateBufferedDuration()
  }

  /**
   * Load a single chunk's audio
   */
  private async loadChunk(index: number): Promise<void> {
    const chunk = this.chunks[index]
    if (!chunk || chunk.status !== 'pending') return

    chunk.status = 'loading'
    const loadStart = performance.now()

    try {
      // Synthesize audio for chunk
      const audioData = await this.synthesizeChunk(chunk.text)
      const loadTime = performance.now() - loadStart

      // Track load time for adaptive quality
      this.loadTimes.push(loadTime)
      if (this.loadTimes.length > 10) this.loadTimes.shift()
      this.updateNetworkQuality()

      // Decode audio
      if (this.audioContext) {
        const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0))
        this.audioBuffers.set(chunk.id, audioBuffer)
        chunk.duration = audioBuffer.duration
        chunk.audioData = audioData
        chunk.status = 'ready'
        this.config.onChunkReady(chunk)
      }

    } catch (error) {
      console.error(`[StreamingTTS] Failed to load chunk ${index}:`, error)
      chunk.status = 'error'

      // Use browser TTS as fallback
      await this.fallbackSynthesize(chunk)
    }
  }

  /**
   * Synthesize audio for a chunk using backend TTS
   */
  private async synthesizeChunk(text: string): Promise<ArrayBuffer> {
    const quality = this.config.adaptiveQuality
      ? this.getAdaptiveQuality()
      : this.config.defaultQuality

    const response = await apiFetch('/api/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: this.config.language,
        voice_type: this.config.voiceType,
        speed: this.config.speechRate,
        pitch: this.config.pitch,
        quality,
        streaming: true
      })
    })

    if (!response.ok) {
      throw new Error(`TTS synthesis failed: ${response.status}`)
    }

    return response.arrayBuffer()
  }

  /**
   * Fallback to browser TTS
   */
  private async fallbackSynthesize(chunk: AudioChunk): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(chunk.text)
      utterance.rate = this.config.speechRate
      utterance.pitch = this.config.pitch
      utterance.lang = this.config.language

      utterance.onend = () => {
        chunk.status = 'ready'
        resolve()
      }

      utterance.onerror = () => {
        chunk.status = 'error'
        resolve()
      }

      // Store for later playback
      chunk.audioData = null // Will use browser TTS directly
      chunk.status = 'ready'
      resolve()
    })
  }

  /**
   * Play a specific chunk
   */
  private async playChunk(index: number): Promise<void> {
    if (!this.state.isPlaying || index >= this.chunks.length) {
      this.state.isPlaying = false
      this.config.onEnd()
      return
    }

    const chunk = this.chunks[index]
    this.state.currentChunkIndex = index

    // Wait for chunk to be ready
    if (chunk.status !== 'ready') {
      this.state.isBuffering = true
      await this.waitForChunk(index)
      this.state.isBuffering = false
    }

    if (!this.state.isPlaying) return

    // Pre-buffer next chunks
    this.bufferChunks(index + 1, this.config.preBufferChunks)

    // Play chunk
    const audioBuffer = this.audioBuffers.get(chunk.id)

    if (audioBuffer && this.audioContext && this.gainNode) {
      // Create source node
      this.currentSource = this.audioContext.createBufferSource()
      this.currentSource.buffer = audioBuffer
      this.currentSource.connect(this.gainNode)

      // Set playback rate
      this.currentSource.playbackRate.value = 1.0

      // Handle chunk end
      this.currentSource.onended = () => {
        if (this.state.isPlaying && !this.state.isPaused) {
          chunk.status = 'complete'
          this.updateProgress(index)
          this.playChunk(index + 1)
        }
      }

      // Start playback
      chunk.status = 'playing'
      this.currentSource.start(0)

      // Update progress
      this.updateProgress(index)

    } else if (chunk.audioData === null && chunk.status === 'ready') {
      // Use browser TTS fallback
      await this.playBrowserTTS(chunk, index)
    }
  }

  /**
   * Wait for a chunk to be ready
   */
  private waitForChunk(index: number): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const chunk = this.chunks[index]
        if (chunk.status === 'ready' || chunk.status === 'error') {
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)
    })
  }

  /**
   * Play using browser TTS (fallback)
   */
  private playBrowserTTS(chunk: AudioChunk, index: number): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(chunk.text)
      utterance.rate = this.config.speechRate
      utterance.pitch = this.config.pitch
      utterance.lang = this.config.language

      utterance.onend = () => {
        chunk.status = 'complete'
        this.updateProgress(index)
        if (this.state.isPlaying && !this.state.isPaused) {
          this.playChunk(index + 1)
        }
        resolve()
      }

      chunk.status = 'playing'
      window.speechSynthesis.speak(utterance)
    })
  }

  /**
   * Update playback progress
   */
  private updateProgress(currentIndex: number): void {
    const completedDuration = this.chunks
      .slice(0, currentIndex)
      .reduce((sum, c) => sum + c.duration, 0)

    this.state.playedDuration = completedDuration
    this.state.progress = this.state.totalDuration > 0
      ? (completedDuration / this.state.totalDuration) * 100
      : 0

    const currentChunk = this.chunks[currentIndex]
    this.config.onProgress(this.state.progress, currentChunk?.text ?? '')
  }

  /**
   * Update buffered duration
   */
  private updateBufferedDuration(): void {
    this.state.bufferedDuration = this.chunks
      .filter(c => c.status === 'ready' || c.status === 'playing' || c.status === 'complete')
      .reduce((sum, c) => sum + c.duration, 0)
  }

  /**
   * Update network quality based on load times
   */
  private updateNetworkQuality(): void {
    if (this.loadTimes.length < 3) return

    const avgLoadTime = this.loadTimes.reduce((a, b) => a + b, 0) / this.loadTimes.length

    if (avgLoadTime < 300) {
      this.networkQuality = 'good'
    } else if (avgLoadTime < 800) {
      this.networkQuality = 'moderate'
    } else {
      this.networkQuality = 'poor'
    }
  }

  /**
   * Get adaptive quality based on network
   */
  private getAdaptiveQuality(): 'low' | 'medium' | 'high' {
    switch (this.networkQuality) {
      case 'good': return 'high'
      case 'moderate': return 'medium'
      case 'poor': return 'low'
      default: return this.config.defaultQuality
    }
  }

  /**
   * Estimate total duration
   */
  private estimateDuration(text: string): number {
    const wordsPerMinute = 150 * this.config.speechRate
    const wordCount = text.split(/\s+/).length
    return (wordCount / wordsPerMinute) * 60
  }

  /**
   * Estimate chunk duration
   */
  private estimateChunkDuration(text: string): number {
    const wordsPerMinute = 150 * this.config.speechRate
    const wordCount = text.split(/\s+/).length
    return (wordCount / wordsPerMinute) * 60
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.state.isPlaying || this.state.isPaused) return

    this.state.isPaused = true

    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch (e) {
        // Already stopped
      }
    }

    // Also pause browser TTS if active
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
    }

    this.pausedAt = this.audioContext?.currentTime ?? 0
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (!this.state.isPaused) return

    this.state.isPaused = false

    // Resume browser TTS if it was paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    } else {
      // Resume from current chunk
      await this.playChunk(this.state.currentChunkIndex)
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.state.isPlaying = false
    this.state.isPaused = false
    this.state.isBuffering = false
    this.state.currentChunkIndex = 0
    this.state.progress = 0
    this.state.playedDuration = 0

    // Stop current audio
    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch (e) {
        // Already stopped
      }
      this.currentSource = null
    }

    // Stop browser TTS
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }

    // Clear timeout
    if (this.nextChunkTimeout) {
      clearTimeout(this.nextChunkTimeout)
      this.nextChunkTimeout = null
    }
  }

  /**
   * Skip to next chunk
   */
  async skipForward(): Promise<void> {
    if (!this.state.isPlaying) return

    const nextIndex = Math.min(this.state.currentChunkIndex + 1, this.chunks.length - 1)

    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch (e) {}
    }

    await this.playChunk(nextIndex)
  }

  /**
   * Skip to previous chunk
   */
  async skipBackward(): Promise<void> {
    if (!this.state.isPlaying) return

    const prevIndex = Math.max(this.state.currentChunkIndex - 1, 0)

    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch (e) {}
    }

    await this.playChunk(prevIndex)
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Get current state
   */
  getState(): StreamingState {
    return { ...this.state }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StreamingTTSConfig>): void {
    this.config = { ...this.config, ...config } as Required<StreamingTTSConfig>
  }

  /**
   * Check if streaming TTS is supported
   */
  static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      (window.AudioContext || (window as any).webkitAudioContext)
    )
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop()

    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }

    this.gainNode = null
    this.chunks = []
    this.audioBuffers.clear()
    this.loadTimes = []
  }
}

// Export factory function
export function createStreamingTTSEngine(config?: StreamingTTSConfig): StreamingTTSEngine {
  return new StreamingTTSEngine(config)
}
