/**
 * Speech Synthesis wrapper for voice output (Text-to-Speech)
 * Provides a clean interface around browser's SpeechSynthesis API
 */

import { getSpeechLanguage } from './languageMapping'

export interface SynthesisConfig {
  language?: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface SynthesisCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onPause?: () => void
  onResume?: () => void
  onError?: (error: string) => void
}

export class SpeechSynthesisService {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private config: SynthesisConfig = {}
  private callbacks: SynthesisCallbacks = {}
  private preferredVoiceName: string | null = null

  constructor(config: SynthesisConfig = {}) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported in this browser')
      return
    }

    this.synthesis = window.speechSynthesis
    this.config = {
      language: config.language || 'en',
      rate: config.rate ?? 1.0,
      pitch: config.pitch ?? 1.0,
      volume: config.volume ?? 1.0,
    }
  }

  /**
   * Speak the given text
   */
  speak(text: string, callbacks: SynthesisCallbacks = {}): void {
    if (!this.synthesis) {
      callbacks.onError?.('Speech synthesis not supported')
      return
    }

    // Cancel any ongoing speech
    this.cancel()

    this.callbacks = callbacks

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = getSpeechLanguage(this.config.language || 'en')
    utterance.rate = this.config.rate ?? 1.0
    utterance.pitch = this.config.pitch ?? 1.0
    utterance.volume = this.config.volume ?? 1.0

    // Apply preferred voice if set
    if (this.preferredVoiceName && this.synthesis) {
      const voices = this.synthesis.getVoices()
      const voice = voices.find(v => v.name === this.preferredVoiceName)
      if (voice) {
        utterance.voice = voice
      }
    }

    utterance.onstart = () => {
      this.callbacks.onStart?.()
    }

    utterance.onend = () => {
      this.currentUtterance = null
      this.callbacks.onEnd?.()
    }

    utterance.onpause = () => {
      this.callbacks.onPause?.()
    }

    utterance.onresume = () => {
      this.callbacks.onResume?.()
    }

    utterance.onerror = (event) => {
      const errorMsg = event.error || 'Unknown synthesis error'
      this.callbacks.onError?.(errorMsg)
      this.currentUtterance = null
    }

    this.currentUtterance = utterance
    this.synthesis.speak(utterance)
  }

  /**
   * Pause the current speech
   */
  pause(): void {
    if (!this.synthesis || !this.isSpeaking()) return
    this.synthesis.pause()
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (!this.synthesis || !this.isPaused()) return
    this.synthesis.resume()
  }

  /**
   * Cancel/stop the current speech
   */
  cancel(): void {
    if (!this.synthesis) return
    this.synthesis.cancel()
    this.currentUtterance = null
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false
  }

  /**
   * Check if currently paused
   */
  isPaused(): boolean {
    return this.synthesis?.paused ?? false
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SynthesisConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get available voices for a specific language
   */
  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    
    const speechLang = getSpeechLanguage(language)
    const voices = this.synthesis.getVoices()
    
    return voices.filter(voice => voice.lang.startsWith(speechLang.split('-')[0]))
  }

  /**
   * Set a specific voice by name for future utterances
   */
  setVoice(voiceName: string): void {
    if (!this.synthesis) return
    
    const voices = this.synthesis.getVoices()
    const voice = voices.find(v => v.name === voiceName)
    
    if (voice) {
      this.preferredVoiceName = voiceName
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cancel()
    this.callbacks = {}
    this.synthesis = null
  }
}
