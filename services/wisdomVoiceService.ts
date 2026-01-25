/**
 * Wisdom Voice Service
 *
 * Provides natural voice support for reading Gita verses
 * in multiple languages using Web Speech API.
 *
 * Supported languages:
 * - English (en-US, en-GB, en-IN)
 * - Hindi (hi-IN)
 * - Sanskrit (sa-IN, fallback to hi-IN)
 */

// ============================================================================
// Types
// ============================================================================

export interface VoiceConfig {
  language: string
  voiceName?: string
  rate: number // 0.1 to 10
  pitch: number // 0 to 2
  volume: number // 0 to 1
}

export interface VoiceOption {
  name: string
  lang: string
  voiceURI: string
  default: boolean
  localService: boolean
}

export type SupportedLanguage = 'en' | 'hi' | 'sa'

// ============================================================================
// Default Voice Configurations
// ============================================================================

const DEFAULT_CONFIGS: Record<SupportedLanguage, VoiceConfig> = {
  en: {
    language: 'en-US',
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
  },
  hi: {
    language: 'hi-IN',
    rate: 0.85,
    pitch: 1.0,
    volume: 1.0,
  },
  sa: {
    language: 'hi-IN', // Sanskrit fallback to Hindi
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0,
  },
}

// ============================================================================
// Voice Service Class
// ============================================================================

export class WisdomVoiceService {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private availableVoices: SpeechSynthesisVoice[] = []
  private isInitialized: boolean = false
  private onEndCallback: (() => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      this.initVoices()
    }
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  private initVoices(): void {
    if (!this.synthesis) return

    // Voices might not be immediately available
    this.availableVoices = this.synthesis.getVoices()

    if (this.availableVoices.length === 0) {
      // Wait for voices to load
      this.synthesis.addEventListener('voiceschanged', () => {
        this.availableVoices = this.synthesis!.getVoices()
        this.isInitialized = true
      })
    } else {
      this.isInitialized = true
    }
  }

  /**
   * Check if voice support is available
   */
  isSupported(): boolean {
    return this.synthesis !== null
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.availableVoices.length > 0
  }

  /**
   * Wait for voices to be loaded
   */
  async waitForReady(): Promise<boolean> {
    if (this.isReady()) return true
    if (!this.synthesis) return false

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isReady()) {
          clearInterval(checkInterval)
          resolve(true)
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve(this.isReady())
      }, 5000)
    })
  }

  // --------------------------------------------------------------------------
  // Voice Selection
  // --------------------------------------------------------------------------

  /**
   * Get all available voices
   */
  getAvailableVoices(): VoiceOption[] {
    return this.availableVoices.map((voice) => ({
      name: voice.name,
      lang: voice.lang,
      voiceURI: voice.voiceURI,
      default: voice.default,
      localService: voice.localService,
    }))
  }

  /**
   * Get voices for a specific language
   */
  getVoicesForLanguage(language: SupportedLanguage): VoiceOption[] {
    const langCodes: Record<SupportedLanguage, string[]> = {
      en: ['en-US', 'en-GB', 'en-IN', 'en-AU', 'en'],
      hi: ['hi-IN', 'hi'],
      sa: ['hi-IN', 'hi', 'sa'], // Sanskrit uses Hindi voices
    }

    const codes = langCodes[language] || ['en']

    return this.availableVoices
      .filter((voice) => codes.some((code) => voice.lang.startsWith(code)))
      .map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
        default: voice.default,
        localService: voice.localService,
      }))
  }

  /**
   * Find the best voice for a language
   */
  private findBestVoice(language: SupportedLanguage, preferredVoiceName?: string): SpeechSynthesisVoice | null {
    const voices = this.getVoicesForLanguage(language)

    // If preferred voice specified, try to find it
    if (preferredVoiceName) {
      const preferred = this.availableVoices.find((v) => v.name === preferredVoiceName)
      if (preferred) return preferred
    }

    // Priority order for natural-sounding voices
    const priorityNames = [
      // Google voices (high quality)
      'Google',
      // Microsoft voices
      'Microsoft',
      // Apple voices
      'Samantha',
      'Alex',
      'Daniel',
      // Natural sounding
      'Natural',
      'Premium',
    ]

    // Find best voice based on priority
    for (const priority of priorityNames) {
      const match = this.availableVoices.find(
        (v) => voices.some((vo) => vo.voiceURI === v.voiceURI) && v.name.includes(priority)
      )
      if (match) return match
    }

    // Fallback to first available voice for the language
    if (voices.length > 0) {
      return this.availableVoices.find((v) => v.voiceURI === voices[0].voiceURI) || null
    }

    return null
  }

  // --------------------------------------------------------------------------
  // Speech Control
  // --------------------------------------------------------------------------

  /**
   * Speak text in the specified language
   */
  speak(
    text: string,
    language: SupportedLanguage = 'en',
    config?: Partial<VoiceConfig>
  ): boolean {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported')
      return false
    }

    // Stop any current speech
    this.stop()

    // Merge with default config
    const defaultConfig = DEFAULT_CONFIGS[language]
    const finalConfig: VoiceConfig = {
      ...defaultConfig,
      ...config,
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = finalConfig.language
    utterance.rate = finalConfig.rate
    utterance.pitch = finalConfig.pitch
    utterance.volume = finalConfig.volume

    // Find and set voice
    const voice = this.findBestVoice(language, finalConfig.voiceName)
    if (voice) {
      utterance.voice = voice
    }

    // Set up event handlers
    utterance.onend = () => {
      this.currentUtterance = null
      this.onEndCallback?.()
    }

    utterance.onerror = (event) => {
      this.currentUtterance = null
      this.onErrorCallback?.(event.error)
    }

    // Store and speak
    this.currentUtterance = utterance
    this.synthesis.speak(utterance)

    return true
  }

  /**
   * Speak a verse with both Sanskrit and translation
   */
  async speakVerse(
    sanskritText: string,
    translationText: string,
    translationLanguage: SupportedLanguage = 'en',
    pauseDuration: number = 1500
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Speak Sanskrit first
      this.onEndCallback = () => {
        // Pause between Sanskrit and translation
        setTimeout(() => {
          // Then speak translation
          this.onEndCallback = () => {
            resolve()
          }
          this.onErrorCallback = (error) => {
            reject(new Error(error))
          }

          this.speak(translationText, translationLanguage)
        }, pauseDuration)
      }

      this.onErrorCallback = (error) => {
        reject(new Error(error))
      }

      // Start with Sanskrit (using Hindi voice)
      this.speak(sanskritText, 'sa')
    })
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.currentUtterance = null
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synthesis) {
      this.synthesis.pause()
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume()
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking || false
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synthesis?.paused || false
  }

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  /**
   * Set callback for when speech ends
   */
  onEnd(callback: () => void): void {
    this.onEndCallback = callback
  }

  /**
   * Set callback for errors
   */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Format verse for speaking (cleans up text)
   */
  formatForSpeech(text: string): string {
    return text
      .replace(/\|\|/g, '') // Remove double pipes
      .replace(/॥/g, '') // Remove devanagari end marks
      .replace(/।/g, ',') // Replace danda with comma for natural pause
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Get estimated speaking duration in milliseconds
   */
  estimateDuration(text: string, rate: number = 0.9): number {
    // Average speaking rate is about 150 words per minute
    // With speech synthesis, it's usually slower
    const words = text.split(/\s+/).length
    const wordsPerMinute = 120 * rate
    const minutes = words / wordsPerMinute
    return Math.ceil(minutes * 60 * 1000)
  }
}

// Export singleton instance
export const voiceService = new WisdomVoiceService()

// Export default
export default voiceService
