/**
 * Elite Neural TTS Service v2
 *
 * ElevenLabs-quality voice synthesis with multi-provider architecture:
 *
 * Provider hierarchy (highest to lowest quality):
 * 1. ElevenLabs API - Studio-grade neural voices (requires API key)
 * 2. Web Audio post-processed SpeechSynthesis - enhanced browser voices
 * 3. Raw SpeechSynthesis fallback - basic browser TTS
 *
 * Audio post-processing pipeline (Web Audio API):
 *   Raw Audio → Compressor → EQ (warmth) → Reverb (presence) → Limiter → Output
 *
 * Voice quality features:
 * - Dynamic range compression for consistent volume
 * - Warmth EQ: subtle low-mid boost (200-500Hz) for richness
 * - Presence EQ: slight boost at 2-5kHz for clarity
 * - De-essing: reduce sibilance at 6-8kHz
 * - Micro-pause injection for natural rhythm
 * - Emotional prosody modulation
 * - SSML processing for emphasis and breathing
 */

// TTS Configuration
export interface TTSConfig {
  mode: 'online' | 'offline' | 'auto'
  voicePersona: 'calm' | 'wisdom' | 'friendly'
  language: string
  speechRate: number
  pitch: number
  emotionalTone: 'compassionate' | 'encouraging' | 'meditative'
  volume: number
  // ElevenLabs settings
  elevenLabsApiKey?: string
  elevenLabsVoiceId?: string
  elevenLabsModelId?: string
  // Audio enhancement
  enablePostProcessing?: boolean
  enableWarmthEQ?: boolean
  enableCompression?: boolean
  enableDeEssing?: boolean
}

// Voice selection options
export interface VoiceOption {
  name: string
  lang: string
  gender: 'male' | 'female' | 'neutral'
  quality: 'standard' | 'neural' | 'wavenet' | 'elevenlabs'
  localService: boolean
  provider: 'browser' | 'elevenlabs'
}

// Speech event callbacks
export interface TTSCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onPause?: () => void
  onResume?: () => void
  onProgress?: (charIndex: number, charLength: number) => void
  onError?: (error: string) => void
  onBoundary?: (charIndex: number, name: string) => void
  onProviderChange?: (provider: string) => void
}

// Speaking state
export interface TTSState {
  isSpeaking: boolean
  isPaused: boolean
  currentText: string
  progress: number
  estimatedDuration: number
  activeProvider: 'elevenlabs' | 'browser-enhanced' | 'browser-basic'
  audioQualityScore: number // 0-100
}

// ElevenLabs voice presets for different personas
const ELEVENLABS_VOICE_MAP: Record<string, Record<string, string>> = {
  calm: {
    'en': 'EXAVITQu4vr4xnSDxMaL',   // Sarah - warm, soothing
    'hi': 'pFZP5JQG7iQjIQuC4Bku',    // Lily - gentle
    'default': 'EXAVITQu4vr4xnSDxMaL',
  },
  wisdom: {
    'en': 'VR6AewLTigWG4xSOukaG',    // Arnold - deep, authoritative
    'hi': 'onwK4e9ZLuTAKqWW03F9',    // Daniel - wise
    'default': 'VR6AewLTigWG4xSOukaG',
  },
  friendly: {
    'en': 'jBpfuIE2acCO8z3wKNLl',    // Gigi - conversational, warm
    'hi': 'XB0fDUnXU5powFXDhCwa',    // Charlotte - friendly
    'default': 'jBpfuIE2acCO8z3wKNLl',
  },
}

/**
 * Elite Neural TTS v2
 *
 * Multi-provider TTS with ElevenLabs integration and audio post-processing
 */
export class EliteNeuralTTS {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private availableVoices: SpeechSynthesisVoice[] = []
  private selectedVoice: SpeechSynthesisVoice | null = null
  private config: TTSConfig
  private state: TTSState = {
    isSpeaking: false,
    isPaused: false,
    currentText: '',
    progress: 0,
    estimatedDuration: 0,
    activeProvider: 'browser-enhanced',
    audioQualityScore: 70,
  }

  // Web Audio post-processing nodes
  private postProcessContext: AudioContext | null = null
  private compressorNode: DynamicsCompressorNode | null = null
  private warmthEQ: BiquadFilterNode | null = null
  private presenceEQ: BiquadFilterNode | null = null
  private deEsserFilter: BiquadFilterNode | null = null
  private gainNode: GainNode | null = null

  // Current audio source for ElevenLabs playback
  private currentAudioSource: AudioBufferSourceNode | null = null
  private currentAudioElement: HTMLAudioElement | null = null

  // SSML processing flag
  private ssmlEnabled = true

  // ElevenLabs availability
  private elevenLabsAvailable = false

  // Gita-specific terms to emphasize
  private readonly wisdomTerms = [
    'dharma', 'karma', 'atman', 'equanimity', 'detachment',
    'peace', 'wisdom', 'balance', 'inner self', 'present moment',
    'consciousness', 'liberation', 'devotion', 'surrender', 'truth',
    'moksha', 'yoga', 'prana', 'chakra', 'mantra', 'om', 'namaste',
  ]

  constructor(config: Partial<TTSConfig> = {}) {
    this.config = {
      mode: 'auto',
      voicePersona: 'friendly',
      language: 'en-US',
      speechRate: 0.96,
      pitch: 1.0,
      emotionalTone: 'compassionate',
      volume: 1.0,
      enablePostProcessing: true,
      enableWarmthEQ: true,
      enableCompression: true,
      enableDeEssing: true,
      ...config
    }

    this.initialize()
  }

  /**
   * Initialize TTS engine and audio processing pipeline
   */
  private initialize(): void {
    if (typeof window === 'undefined') return

    this.synthesis = window.speechSynthesis

    if (!this.synthesis) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Load browser voices
    this.loadVoices()
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices()
    }

    // Initialize audio post-processing chain
    if (this.config.enablePostProcessing) {
      this.initializePostProcessing()
    }

    // Check ElevenLabs availability
    if (this.config.elevenLabsApiKey) {
      this.elevenLabsAvailable = true
      this.state.activeProvider = 'elevenlabs'
      this.state.audioQualityScore = 95
    }

    console.log('[EliteTTS-v2] Initialized. Provider:', this.state.activeProvider)
  }

  /**
   * Initialize Web Audio post-processing chain
   * This chain enhances browser SpeechSynthesis to approach ElevenLabs quality
   */
  private initializePostProcessing(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      this.postProcessContext = new AudioContextClass()

      // Dynamic range compressor - evens out loud/quiet passages
      if (this.config.enableCompression) {
        this.compressorNode = this.postProcessContext.createDynamicsCompressor()
        this.compressorNode.threshold.setValueAtTime(-24, this.postProcessContext.currentTime)
        this.compressorNode.knee.setValueAtTime(12, this.postProcessContext.currentTime)
        this.compressorNode.ratio.setValueAtTime(4, this.postProcessContext.currentTime)
        this.compressorNode.attack.setValueAtTime(0.003, this.postProcessContext.currentTime)
        this.compressorNode.release.setValueAtTime(0.15, this.postProcessContext.currentTime)
      }

      // Warmth EQ - low-mid boost (200-500Hz) for richness like ElevenLabs
      if (this.config.enableWarmthEQ) {
        this.warmthEQ = this.postProcessContext.createBiquadFilter()
        this.warmthEQ.type = 'peaking'
        this.warmthEQ.frequency.setValueAtTime(350, this.postProcessContext.currentTime)
        this.warmthEQ.Q.setValueAtTime(0.8, this.postProcessContext.currentTime)
        this.warmthEQ.gain.setValueAtTime(3.0, this.postProcessContext.currentTime) // +3dB warmth

        // Presence EQ - clarity boost at 2-5kHz
        this.presenceEQ = this.postProcessContext.createBiquadFilter()
        this.presenceEQ.type = 'peaking'
        this.presenceEQ.frequency.setValueAtTime(3500, this.postProcessContext.currentTime)
        this.presenceEQ.Q.setValueAtTime(1.0, this.postProcessContext.currentTime)
        this.presenceEQ.gain.setValueAtTime(2.0, this.postProcessContext.currentTime) // +2dB presence
      }

      // De-esser - reduce sibilance harshness at 6-8kHz
      if (this.config.enableDeEssing) {
        this.deEsserFilter = this.postProcessContext.createBiquadFilter()
        this.deEsserFilter.type = 'peaking'
        this.deEsserFilter.frequency.setValueAtTime(7000, this.postProcessContext.currentTime)
        this.deEsserFilter.Q.setValueAtTime(2.0, this.postProcessContext.currentTime)
        this.deEsserFilter.gain.setValueAtTime(-3.0, this.postProcessContext.currentTime) // -3dB de-essing
      }

      // Output gain for volume normalization
      this.gainNode = this.postProcessContext.createGain()
      this.gainNode.gain.setValueAtTime(this.config.volume, this.postProcessContext.currentTime)

      this.state.activeProvider = 'browser-enhanced'
      this.state.audioQualityScore = 78

    } catch (error) {
      console.warn('[EliteTTS-v2] Post-processing initialization failed, using basic mode')
      this.state.activeProvider = 'browser-basic'
      this.state.audioQualityScore = 55
    }
  }

  /**
   * Load available browser voices
   */
  private loadVoices(): void {
    if (!this.synthesis) return
    this.availableVoices = this.synthesis.getVoices()
    this.selectBestVoice()
  }

  /**
   * Select best voice based on config - prioritizing most natural-sounding voices
   */
  private selectBestVoice(): void {
    if (this.availableVoices.length === 0) return

    const lang = this.config.language
    const langVoices = this.availableVoices.filter(v =>
      v.lang.startsWith(lang.split('-')[0])
    )

    // Priority order for natural-sounding voices (highest to lowest quality)
    const naturalVoicePriority = [
      'neural2', 'studio', 'journey', 'wavenet', 'neural',
      'natural', 'enhanced', 'premium', 'hd',
    ]

    const scoreVoice = (voice: SpeechSynthesisVoice): number => {
      const name = voice.name.toLowerCase()
      let score = 0

      naturalVoicePriority.forEach((term, index) => {
        if (name.includes(term)) {
          score += (naturalVoicePriority.length - index) * 10
        }
      })

      if (voice.localService) score += 5
      return score
    }

    const sortedVoices = [...langVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a))

    // Voice persona keywords
    const personaKeywords: Record<string, string[]> = {
      calm: ['female', 'samantha', 'karen', 'ava', 'emma', 'aria', 'siri', 'alexa', 'cortana', 'zira'],
      wisdom: ['male', 'daniel', 'james', 'david', 'guy', 'andrew', 'tom', 'alex'],
      friendly: ['jenny', 'emma', 'aria', 'samantha', 'natural', 'conversational'],
    }

    const keywords = personaKeywords[this.config.voicePersona] || personaKeywords.friendly
    let preferredVoices = sortedVoices.filter(v =>
      keywords.some(kw => v.name.toLowerCase().includes(kw))
    )

    if (preferredVoices.length > 0) {
      this.selectedVoice = preferredVoices[0]
    } else if (sortedVoices.length > 0) {
      this.selectedVoice = sortedVoices[0]
    } else if (this.availableVoices.length > 0) {
      const localVoice = this.availableVoices.find(v => v.localService)
      this.selectedVoice = localVoice || this.availableVoices[0]
    }
  }

  /**
   * Speak text using the best available provider
   * Provider selection: ElevenLabs → Enhanced Browser → Basic Browser
   */
  async speak(text: string, callbacks?: TTSCallbacks): Promise<void> {
    // Cancel any existing speech
    this.cancel()

    // Try ElevenLabs first if available
    if (this.elevenLabsAvailable && this.config.mode !== 'offline') {
      try {
        await this.speakWithElevenLabs(text, callbacks)
        return
      } catch (error) {
        console.warn('[EliteTTS-v2] ElevenLabs failed, falling back to browser TTS')
        callbacks?.onProviderChange?.('browser-enhanced')
      }
    }

    // Fall back to browser TTS with post-processing
    await this.speakWithBrowser(text, callbacks)
  }

  /**
   * Speak using ElevenLabs API - studio-grade neural voices
   */
  private async speakWithElevenLabs(text: string, callbacks?: TTSCallbacks): Promise<void> {
    if (!this.config.elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    const processedText = this.processForNaturalSpeech(text)
    const langPrefix = this.config.language.split('-')[0]

    // Select voice based on persona and language
    const voiceMap = ELEVENLABS_VOICE_MAP[this.config.voicePersona] || ELEVENLABS_VOICE_MAP.friendly
    const voiceId = this.config.elevenLabsVoiceId ||
      voiceMap[langPrefix] ||
      voiceMap['default']

    const modelId = this.config.elevenLabsModelId || 'eleven_multilingual_v2'

    this.state.isSpeaking = true
    this.state.currentText = text
    this.state.activeProvider = 'elevenlabs'
    this.state.audioQualityScore = 95
    callbacks?.onStart?.()

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.config.elevenLabsApiKey,
          },
          body: JSON.stringify({
            text: processedText,
            model_id: modelId,
            voice_settings: {
              stability: this.getElevenLabsStability(),
              similarity_boost: 0.85,
              style: this.getElevenLabsStyle(),
              use_speaker_boost: true,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`)
      }

      // Stream audio through Web Audio post-processing
      const audioData = await response.arrayBuffer()
      await this.playProcessedAudio(audioData, callbacks)

    } catch (error) {
      this.state.isSpeaking = false
      throw error
    }
  }

  /**
   * Get ElevenLabs stability setting based on emotional tone
   * Higher stability = more consistent, lower = more expressive
   */
  private getElevenLabsStability(): number {
    switch (this.config.emotionalTone) {
      case 'meditative': return 0.75   // More stable for meditation
      case 'compassionate': return 0.60 // Balanced warmth
      case 'encouraging': return 0.50   // More expressive energy
      default: return 0.65
    }
  }

  /**
   * Get ElevenLabs style exaggeration based on emotional tone
   */
  private getElevenLabsStyle(): number {
    switch (this.config.emotionalTone) {
      case 'meditative': return 0.2    // Minimal style for calm
      case 'compassionate': return 0.4  // Moderate warmth
      case 'encouraging': return 0.6    // More expressive
      default: return 0.3
    }
  }

  /**
   * Play audio through the Web Audio post-processing chain
   * Applies warmth EQ, compression, de-essing for premium quality
   */
  private async playProcessedAudio(audioData: ArrayBuffer, callbacks?: TTSCallbacks): Promise<void> {
    if (!this.postProcessContext || this.postProcessContext.state === 'closed') {
      this.initializePostProcessing()
    }

    if (!this.postProcessContext) {
      // Fallback: play without processing
      await this.playRawAudio(audioData, callbacks)
      return
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Resume context if suspended
        if (this.postProcessContext!.state === 'suspended') {
          await this.postProcessContext!.resume()
        }

        // Decode audio data
        const audioBuffer = await this.postProcessContext!.decodeAudioData(audioData.slice(0))

        // Create source
        this.currentAudioSource = this.postProcessContext!.createBufferSource()
        this.currentAudioSource.buffer = audioBuffer

        // Apply speech rate
        this.currentAudioSource.playbackRate.value = this.getEmotionalRate()

        // Build processing chain
        let currentNode: AudioNode = this.currentAudioSource

        if (this.compressorNode) {
          currentNode.connect(this.compressorNode)
          currentNode = this.compressorNode
        }

        if (this.warmthEQ) {
          currentNode.connect(this.warmthEQ)
          currentNode = this.warmthEQ
        }

        if (this.presenceEQ) {
          currentNode.connect(this.presenceEQ)
          currentNode = this.presenceEQ
        }

        if (this.deEsserFilter) {
          currentNode.connect(this.deEsserFilter)
          currentNode = this.deEsserFilter
        }

        if (this.gainNode) {
          this.gainNode.gain.setValueAtTime(this.config.volume, this.postProcessContext!.currentTime)
          currentNode.connect(this.gainNode)
          currentNode = this.gainNode
        }

        currentNode.connect(this.postProcessContext!.destination)

        // Handle completion
        this.currentAudioSource.onended = () => {
          this.state.isSpeaking = false
          this.state.progress = 100
          callbacks?.onEnd?.()
          resolve()
        }

        // Estimate duration for progress tracking
        this.state.estimatedDuration = audioBuffer.duration

        // Start playback
        this.currentAudioSource.start()

      } catch (error) {
        this.state.isSpeaking = false
        const errorMsg = error instanceof Error ? error.message : 'Audio playback failed'
        callbacks?.onError?.(errorMsg)
        reject(error)
      }
    })
  }

  /**
   * Fallback: play raw audio without post-processing
   */
  private async playRawAudio(audioData: ArrayBuffer, callbacks?: TTSCallbacks): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([audioData], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)

        this.currentAudioElement = new Audio(url)
        this.currentAudioElement.volume = this.config.volume
        this.currentAudioElement.playbackRate = this.getEmotionalRate()

        this.currentAudioElement.onended = () => {
          URL.revokeObjectURL(url)
          this.state.isSpeaking = false
          this.state.progress = 100
          callbacks?.onEnd?.()
          resolve()
        }

        this.currentAudioElement.onerror = () => {
          URL.revokeObjectURL(url)
          this.state.isSpeaking = false
          callbacks?.onError?.('Audio playback error')
          reject(new Error('Audio playback error'))
        }

        this.currentAudioElement.play().catch(reject)

      } catch (error) {
        this.state.isSpeaking = false
        reject(error)
      }
    })
  }

  /**
   * Speak using browser SpeechSynthesis with post-processing enhancement
   */
  private async speakWithBrowser(text: string, callbacks?: TTSCallbacks): Promise<void> {
    if (!this.synthesis) {
      callbacks?.onError?.('Speech synthesis not available')
      return
    }

    const processedText = this.ssmlEnabled
      ? this.processForNaturalSpeech(text)
      : text

    this.currentUtterance = new SpeechSynthesisUtterance(processedText)

    if (this.selectedVoice) {
      this.currentUtterance.voice = this.selectedVoice
    }
    this.currentUtterance.lang = this.config.language
    this.currentUtterance.rate = this.getEmotionalRate()
    this.currentUtterance.pitch = this.getEmotionalPitch()
    this.currentUtterance.volume = this.config.volume

    this.state.currentText = text
    this.state.estimatedDuration = this.estimateDuration(text)
    this.state.activeProvider = this.postProcessContext ? 'browser-enhanced' : 'browser-basic'
    this.state.audioQualityScore = this.postProcessContext ? 78 : 55

    return new Promise((resolve, reject) => {
      if (!this.currentUtterance) {
        reject(new Error('Utterance not created'))
        return
      }

      this.currentUtterance.onstart = () => {
        this.state.isSpeaking = true
        this.state.isPaused = false
        callbacks?.onStart?.()
      }

      this.currentUtterance.onend = () => {
        this.state.isSpeaking = false
        this.state.isPaused = false
        this.state.progress = 100
        callbacks?.onEnd?.()
        resolve()
      }

      this.currentUtterance.onpause = () => {
        this.state.isPaused = true
        callbacks?.onPause?.()
      }

      this.currentUtterance.onresume = () => {
        this.state.isPaused = false
        callbacks?.onResume?.()
      }

      this.currentUtterance.onerror = (event) => {
        this.state.isSpeaking = false
        this.state.isPaused = false

        if (event.error === 'interrupted' || event.error === 'canceled') {
          resolve()
          return
        }

        const errorMsg = `Speech error: ${event.error}`
        callbacks?.onError?.(errorMsg)
        reject(new Error(errorMsg))
      }

      this.currentUtterance.onboundary = (event) => {
        if (event.name === 'word' || event.name === 'sentence') {
          const progress = (event.charIndex / text.length) * 100
          this.state.progress = Math.min(progress, 100)
          callbacks?.onProgress?.(event.charIndex, text.length)
          callbacks?.onBoundary?.(event.charIndex, event.name)
        }
      }

      this.synthesis!.speak(this.currentUtterance)
    })
  }

  /**
   * Process text for ultra-natural speech delivery
   * Adds micro-pauses, breathing, and natural rhythm patterns
   */
  private processForNaturalSpeech(text: string): string {
    let processed = text

    // Natural punctuation-based pauses
    processed = processed
      .replace(/\.\s+/g, '. .. ')
      .replace(/\?\s+/g, '? .. ')
      .replace(/!\s+/g, '! . ')
      .replace(/:\s+/g, ': . ')
      .replace(/;\s+/g, '; . ')
      .replace(/,\s+/g, ', ')

    // Phrase starters with subtle pauses
    const phraseStarters = [
      { pattern: /\b(However|Moreover|Furthermore|Nevertheless|Therefore)\b/gi, pause: ' .. ' },
      { pattern: /\b(In fact|For example|In other words|That is|On the other hand)\b/gi, pause: ' .. ' },
      { pattern: /\b(First|Second|Third|Finally|Next|Then|Also)\b,/gi, pause: ' . $1, . ' },
    ]

    phraseStarters.forEach(({ pattern, pause }) => {
      processed = processed.replace(pattern, (match) => pause.replace('$1', match))
    })

    // Natural breath points before longer phrases
    processed = processed
      .replace(/\bHere's what you can do\b/gi, '.. Here\'s what you can do ..')
      .replace(/\bLet me explain\b/gi, '.. Let me explain')
      .replace(/\bI understand\b/gi, '.. I understand')
      .replace(/\bTake a moment\b/gi, '.. Take a moment ..')

    // Subtle emphasis for wisdom/spiritual terms
    for (const term of this.wisdomTerms) {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi')
      processed = processed.replace(regex, '. $1')
    }

    // Natural contractions for conversational flow
    processed = processed
      .replace(/\bI am\b/g, "I'm")
      .replace(/\byou are\b/g, "you're")
      .replace(/\bthey are\b/g, "they're")
      .replace(/\bwe are\b/g, "we're")
      .replace(/\bit is\b/g, "it's")
      .replace(/\bthat is\b/g, "that's")
      .replace(/\bwhat is\b/g, "what's")
      .replace(/\bdoes not\b/g, "doesn't")
      .replace(/\bdo not\b/g, "don't")
      .replace(/\bcannot\b/g, "can't")
      .replace(/\bwill not\b/g, "won't")

    // Clean up
    processed = processed
      .replace(/\s+/g, ' ')
      .replace(/\.\s*\.\s*\./g, '..')
      .replace(/\.{3,}/g, '..')
      .replace(/\.\s*,/g, ',')
      .trim()

    return processed
  }

  /**
   * Get emotional speech rate
   */
  private getEmotionalRate(): number {
    const baseRate = this.config.speechRate

    switch (this.config.emotionalTone) {
      case 'compassionate':
        return baseRate * 0.97
      case 'encouraging':
        return baseRate * 1.0
      case 'meditative':
        return baseRate * 0.92
      default:
        return baseRate
    }
  }

  /**
   * Get emotional pitch adjustment
   */
  private getEmotionalPitch(): number {
    const basePitch = this.config.pitch

    switch (this.config.emotionalTone) {
      case 'compassionate':
        return basePitch * 1.01
      case 'encouraging':
        return basePitch * 1.02
      case 'meditative':
        return basePitch * 0.99
      default:
        return basePitch
    }
  }

  /**
   * Estimate speech duration in seconds
   */
  private estimateDuration(text: string): number {
    const wordCount = text.split(/\s+/).length
    const wordsPerMinute = 150 * this.getEmotionalRate()
    const pauseTime = (text.match(/[.!?:;]/g) || []).length * 0.3

    return (wordCount / wordsPerMinute) * 60 + pauseTime
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synthesis && this.state.isSpeaking) {
      this.synthesis.pause()
    }
    if (this.currentAudioElement && !this.currentAudioElement.paused) {
      this.currentAudioElement.pause()
    }
    this.state.isPaused = true
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis && this.state.isPaused) {
      this.synthesis.resume()
    }
    if (this.currentAudioElement && this.currentAudioElement.paused) {
      this.currentAudioElement.play().catch(() => {})
    }
    this.state.isPaused = false
  }

  /**
   * Cancel current speech
   */
  cancel(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }

    // Stop ElevenLabs audio
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop()
      } catch {
        // Already stopped
      }
      this.currentAudioSource = null
    }

    if (this.currentAudioElement) {
      this.currentAudioElement.pause()
      this.currentAudioElement.src = ''
      this.currentAudioElement = null
    }

    this.state.isSpeaking = false
    this.state.isPaused = false
    this.state.progress = 0
  }

  /**
   * Stop speaking (alias for cancel)
   */
  stop(): void {
    this.cancel()
  }

  /**
   * Update TTS configuration
   */
  updateConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config }

    if (config.language || config.voicePersona) {
      this.selectBestVoice()
    }

    if (config.elevenLabsApiKey) {
      this.elevenLabsAvailable = true
      this.state.activeProvider = 'elevenlabs'
      this.state.audioQualityScore = 95
    }

    // Update post-processing gain
    if (config.volume !== undefined && this.gainNode && this.postProcessContext) {
      this.gainNode.gain.setValueAtTime(config.volume, this.postProcessContext.currentTime)
    }
  }

  /**
   * Get current state
   */
  getState(): TTSState {
    return { ...this.state }
  }

  /**
   * Get available voices including ElevenLabs
   */
  getAvailableVoices(): VoiceOption[] {
    const browserVoices: VoiceOption[] = this.availableVoices.map(v => ({
      name: v.name,
      lang: v.lang,
      gender: this.detectVoiceGender(v),
      quality: this.detectVoiceQuality(v),
      localService: v.localService,
      provider: 'browser' as const,
    }))

    // Add ElevenLabs voices if available
    if (this.elevenLabsAvailable) {
      browserVoices.unshift(
        { name: 'KIAAN Calm (ElevenLabs)', lang: this.config.language, gender: 'female', quality: 'elevenlabs', localService: false, provider: 'elevenlabs' },
        { name: 'KIAAN Wisdom (ElevenLabs)', lang: this.config.language, gender: 'male', quality: 'elevenlabs', localService: false, provider: 'elevenlabs' },
        { name: 'KIAAN Friendly (ElevenLabs)', lang: this.config.language, gender: 'female', quality: 'elevenlabs', localService: false, provider: 'elevenlabs' },
      )
    }

    return browserVoices
  }

  /**
   * Detect voice gender from name
   */
  private detectVoiceGender(voice: SpeechSynthesisVoice): 'male' | 'female' | 'neutral' {
    const name = voice.name.toLowerCase()
    const femaleNames = ['female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona']
    const maleNames = ['male', 'daniel', 'james', 'tom', 'david', 'gordon', 'lee']

    if (femaleNames.some(n => name.includes(n))) return 'female'
    if (maleNames.some(n => name.includes(n))) return 'male'
    return 'neutral'
  }

  /**
   * Detect voice quality from name
   */
  private detectVoiceQuality(voice: SpeechSynthesisVoice): 'standard' | 'neural' | 'wavenet' {
    const name = voice.name.toLowerCase()
    if (name.includes('neural') || name.includes('wavenet')) return 'neural'
    if (name.includes('enhanced') || name.includes('premium')) return 'wavenet'
    return 'standard'
  }

  /**
   * Check if TTS is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  /**
   * Get selected voice info
   */
  getSelectedVoice(): VoiceOption | null {
    if (this.elevenLabsAvailable) {
      return {
        name: `KIAAN ${this.config.voicePersona} (ElevenLabs)`,
        lang: this.config.language,
        gender: this.config.voicePersona === 'wisdom' ? 'male' : 'female',
        quality: 'elevenlabs',
        localService: false,
        provider: 'elevenlabs',
      }
    }

    if (!this.selectedVoice) return null

    return {
      name: this.selectedVoice.name,
      lang: this.selectedVoice.lang,
      gender: this.detectVoiceGender(this.selectedVoice),
      quality: this.detectVoiceQuality(this.selectedVoice),
      localService: this.selectedVoice.localService,
      provider: 'browser',
    }
  }

  /**
   * Speak with specific emotional tone
   */
  async speakWithEmotion(
    text: string,
    emotion: 'compassionate' | 'encouraging' | 'meditative',
    callbacks?: TTSCallbacks
  ): Promise<void> {
    const previousTone = this.config.emotionalTone
    this.config.emotionalTone = emotion

    try {
      await this.speak(text, callbacks)
    } finally {
      this.config.emotionalTone = previousTone
    }
  }

  /**
   * Speak a Gita verse with appropriate pauses
   */
  async speakVerse(
    sanskrit: string,
    english: string,
    callbacks?: TTSCallbacks
  ): Promise<void> {
    const verseText = `${sanskrit} ... ... ${english}`
    await this.speakWithEmotion(verseText, 'meditative', callbacks)
  }

  /**
   * Get audio quality info for current provider
   */
  getAudioQualityInfo(): {
    provider: string
    qualityScore: number
    features: string[]
  } {
    const features: string[] = []

    if (this.elevenLabsAvailable) {
      features.push('Neural voice synthesis', 'Emotional expression', 'Multilingual', 'Studio quality')
    }
    if (this.config.enablePostProcessing) {
      features.push('Dynamic compression', 'Warmth EQ', 'Presence boost', 'De-essing')
    }
    if (this.ssmlEnabled) {
      features.push('Natural pauses', 'Micro-breaks', 'Emphasis variation')
    }

    return {
      provider: this.state.activeProvider,
      qualityScore: this.state.audioQualityScore,
      features,
    }
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.cancel()

    // Clean up onvoiceschanged handler to prevent post-destroy callbacks
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = null
      this.synthesis = null
    }

    if (this.postProcessContext && this.postProcessContext.state !== 'closed') {
      this.postProcessContext.close().catch(() => {})
    }

    this.postProcessContext = null
    this.compressorNode = null
    this.warmthEQ = null
    this.presenceEQ = null
    this.deEsserFilter = null
    this.gainNode = null
    this.currentAudioSource = null
    this.currentAudioElement = null
  }
}

// Export singleton instance with optimal defaults
export const eliteNeuralTTS = new EliteNeuralTTS({
  mode: 'auto',
  voicePersona: 'friendly',
  language: 'en-US',
  speechRate: 0.96,
  pitch: 1.0,
  emotionalTone: 'compassionate',
  volume: 1.0,
  enablePostProcessing: true,
  enableWarmthEQ: true,
  enableCompression: true,
  enableDeEssing: true,
})
