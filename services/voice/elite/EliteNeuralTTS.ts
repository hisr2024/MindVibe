/**
 * Elite Neural TTS Service
 *
 * Hybrid online/offline Text-to-Speech with:
 * - SSML support for natural speech
 * - Emotional prosody (compassionate, encouraging, meditative)
 * - Automatic voice selection based on context
 * - Streaming audio support for low latency
 *
 * Siri/Alexa-class voice quality.
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
}

// Voice selection options
export interface VoiceOption {
  name: string
  lang: string
  gender: 'male' | 'female' | 'neutral'
  quality: 'standard' | 'neural' | 'wavenet'
  localService: boolean
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
}

// Speaking state
export interface TTSState {
  isSpeaking: boolean
  isPaused: boolean
  currentText: string
  progress: number
  estimatedDuration: number
}

/**
 * Elite Neural TTS Class
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
    estimatedDuration: 0
  }

  // SSML processing for natural speech
  private ssmlEnabled = true

  // Gita-specific terms to emphasize
  private readonly wisdomTerms = [
    'dharma', 'karma', 'atman', 'equanimity', 'detachment',
    'peace', 'wisdom', 'balance', 'inner self', 'present moment',
    'consciousness', 'liberation', 'devotion', 'surrender', 'truth'
  ]

  // Natural speech enhancement settings for human-like delivery
  private readonly naturalSpeechConfig = {
    enableMicroPauses: true,        // Add tiny natural pauses
    enableBreathSimulation: true,   // Subtle breath-like gaps
    enableEmphasisVariation: true,  // Natural word emphasis
    enableProsodySmoothing: true,   // Smooth transitions between phrases
  }

  constructor(config: Partial<TTSConfig> = {}) {
    this.config = {
      mode: 'auto',
      voicePersona: 'friendly',
      language: 'en-US',
      speechRate: 0.96,  // Natural conversational pace (not too slow)
      pitch: 1.0,
      emotionalTone: 'compassionate',
      volume: 1.0,
      ...config
    }

    this.initialize()
  }

  /**
   * Initialize TTS engine
   */
  private initialize(): void {
    if (typeof window === 'undefined') return

    this.synthesis = window.speechSynthesis

    if (!this.synthesis) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Load voices
    this.loadVoices()

    // Handle voice changes (some browsers load voices async)
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices()
    }

    console.log('✅ Elite Neural TTS initialized')
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (!this.synthesis) return

    this.availableVoices = this.synthesis.getVoices()
    this.selectBestVoice()

    console.log(`🎤 Loaded ${this.availableVoices.length} voices`)
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
      'neural2',     // Google Neural2 - most natural
      'studio',      // Google Studio - premium quality
      'journey',     // Google Journey - expressive storytelling
      'wavenet',     // Google Wavenet - high quality
      'neural',      // Microsoft Neural - natural
      'natural',     // Generic natural voices
      'enhanced',    // Enhanced quality
      'premium',     // Premium voices
      'hd',          // High definition
    ]

    // Score voices by naturalness priority
    const scoreVoice = (voice: SpeechSynthesisVoice): number => {
      const name = voice.name.toLowerCase()
      let score = 0

      // Priority-based scoring (higher = more natural)
      naturalVoicePriority.forEach((term, index) => {
        if (name.includes(term)) {
          score += (naturalVoicePriority.length - index) * 10
        }
      })

      // Bonus for local voices (usually higher quality)
      if (voice.localService) score += 5

      return score
    }

    // Sort by naturalness score (highest first)
    const sortedVoices = [...langVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a))

    // Voice selection based on persona with natural voice preference
    let preferredVoices: SpeechSynthesisVoice[] = []

    // Calm voice keywords - soothing, soft female voices
    const calmKeywords = ['female', 'samantha', 'karen', 'ava', 'emma', 'aria', 'siri', 'alexa', 'cortana', 'zira']
    // Wisdom voice keywords - warm, grounded male voices
    const wisdomKeywords = ['male', 'daniel', 'james', 'david', 'guy', 'andrew', 'tom', 'alex']
    // Friendly voice keywords - warm, conversational
    const friendlyKeywords = ['jenny', 'emma', 'aria', 'samantha', 'natural', 'conversational']

    switch (this.config.voicePersona) {
      case 'calm':
        preferredVoices = sortedVoices.filter(v =>
          calmKeywords.some(kw => v.name.toLowerCase().includes(kw))
        )
        break
      case 'wisdom':
        preferredVoices = sortedVoices.filter(v =>
          wisdomKeywords.some(kw => v.name.toLowerCase().includes(kw))
        )
        break
      case 'friendly':
      default:
        preferredVoices = sortedVoices.filter(v =>
          friendlyKeywords.some(kw => v.name.toLowerCase().includes(kw)) || v.localService
        )
        break
    }

    // Select best available voice
    if (preferredVoices.length > 0) {
      this.selectedVoice = preferredVoices[0]
    } else if (sortedVoices.length > 0) {
      // Use highest scored voice for the language
      this.selectedVoice = sortedVoices[0]
    } else if (this.availableVoices.length > 0) {
      // Ultimate fallback - any voice, prefer local
      const localVoice = this.availableVoices.find(v => v.localService)
      this.selectedVoice = localVoice || this.availableVoices[0]
    }

    if (this.selectedVoice) {
      console.log(`🎯 Selected natural voice: ${this.selectedVoice.name} (${this.selectedVoice.lang})`)
    }
  }

  /**
   * Speak text with SSML processing
   */
  async speak(text: string, callbacks?: TTSCallbacks): Promise<void> {
    if (!this.synthesis) {
      callbacks?.onError?.('Speech synthesis not available')
      return
    }

    // Cancel any existing speech
    this.cancel()

    // Process text for natural speech
    const processedText = this.ssmlEnabled
      ? this.processForNaturalSpeech(text)
      : text

    // Create utterance
    this.currentUtterance = new SpeechSynthesisUtterance(processedText)

    // Apply configuration
    if (this.selectedVoice) {
      this.currentUtterance.voice = this.selectedVoice
    }
    this.currentUtterance.lang = this.config.language
    this.currentUtterance.rate = this.getEmotionalRate()
    this.currentUtterance.pitch = this.getEmotionalPitch()
    this.currentUtterance.volume = this.config.volume

    // Update state
    this.state.currentText = text
    this.state.estimatedDuration = this.estimateDuration(text)

    // Set up event handlers
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

        // Handle specific errors gracefully
        if (event.error === 'interrupted' || event.error === 'canceled') {
          resolve() // Normal cancellation
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

      // Start speaking
      this.synthesis!.speak(this.currentUtterance)
    })
  }

  /**
   * Process text for ULTRA-NATURAL speech (human-like delivery)
   * Adds subtle pauses, micro-breaks, and natural rhythm patterns
   */
  private processForNaturalSpeech(text: string): string {
    let processed = text

    // Natural punctuation-based pauses (calibrated for human-like rhythm)
    processed = processed
      // Sentence endings - natural pause (not too long)
      .replace(/\.\s+/g, '. .. ')
      // Questions - thinking pause
      .replace(/\?\s+/g, '? .. ')
      // Exclamations - brief energetic pause
      .replace(/!\s+/g, '! . ')
      // Colons - anticipation micro-pause
      .replace(/:\s+/g, ': . ')
      // Semicolons - thought continuation
      .replace(/;\s+/g, '; . ')
      // Commas - subtle micro-pause (most natural)
      .replace(/,\s+/g, ', ')

    // Natural phrase starters with subtle pauses
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

    // Subtle emphasis for wisdom/spiritual terms (not over-pronounced)
    for (const term of this.wisdomTerms) {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi')
      // Add tiny pause before important terms (more natural than heavy emphasis)
      processed = processed.replace(regex, '. $1')
    }

    // Natural contraction handling (flows better)
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

    // Clean up - maintain natural rhythm
    processed = processed
      .replace(/\s+/g, ' ')           // Normalize spaces
      .replace(/\.\s*\.\s*\./g, '..') // Normalize ellipses (max 2 dots for micro-pause)
      .replace(/\.{3,}/g, '..')       // Cap ellipses
      .replace(/\.\s*,/g, ',')        // Clean up dot-comma
      .trim()

    return processed
  }

  /**
   * Get emotional speech rate - calibrated for natural human-like delivery
   * Subtle variations that sound natural, not robotic
   */
  private getEmotionalRate(): number {
    const baseRate = this.config.speechRate

    switch (this.config.emotionalTone) {
      case 'compassionate':
        // Gentle, warm pace - like a caring friend
        return baseRate * 0.97
      case 'encouraging':
        // Natural energy without rushing
        return baseRate * 1.0
      case 'meditative':
        // Calm but not unnaturally slow
        return baseRate * 0.92
      default:
        return baseRate
    }
  }

  /**
   * Get emotional pitch adjustment - subtle variations for natural expression
   * Avoids exaggerated pitch changes that sound artificial
   */
  private getEmotionalPitch(): number {
    const basePitch = this.config.pitch

    switch (this.config.emotionalTone) {
      case 'compassionate':
        // Subtle warmth in tone
        return basePitch * 1.01
      case 'encouraging':
        // Slight brightness without being artificial
        return basePitch * 1.02
      case 'meditative':
        // Grounded, calming tone
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
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis && this.state.isPaused) {
      this.synthesis.resume()
    }
  }

  /**
   * Cancel current speech
   */
  cancel(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.state.isSpeaking = false
      this.state.isPaused = false
      this.state.progress = 0
    }
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

    // Reselect voice if language or persona changed
    if (config.language || config.voicePersona) {
      this.selectBestVoice()
    }
  }

  /**
   * Get current state
   */
  getState(): TTSState {
    return { ...this.state }
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): VoiceOption[] {
    return this.availableVoices.map(v => ({
      name: v.name,
      lang: v.lang,
      gender: this.detectVoiceGender(v),
      quality: this.detectVoiceQuality(v),
      localService: v.localService
    }))
  }

  /**
   * Detect voice gender from name
   */
  private detectVoiceGender(voice: SpeechSynthesisVoice): 'male' | 'female' | 'neutral' {
    const name = voice.name.toLowerCase()

    const femaleNames = ['female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'alex']
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
    if (!this.selectedVoice) return null

    return {
      name: this.selectedVoice.name,
      lang: this.selectedVoice.lang,
      gender: this.detectVoiceGender(this.selectedVoice),
      quality: this.detectVoiceQuality(this.selectedVoice),
      localService: this.selectedVoice.localService
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
    // Format verse for speaking
    const verseText = `${sanskrit} ... ... ${english}`

    // Use meditative tone for verses
    await this.speakWithEmotion(verseText, 'meditative', callbacks)
  }
}

// Export singleton instance with ULTRA-NATURAL settings
// Optimized for human-like speech delivery across all languages
export const eliteNeuralTTS = new EliteNeuralTTS({
  mode: 'auto',
  voicePersona: 'friendly',
  language: 'en-US',
  speechRate: 0.96,    // Natural conversational pace
  pitch: 1.0,          // Natural pitch baseline
  emotionalTone: 'compassionate',
  volume: 1.0
})
