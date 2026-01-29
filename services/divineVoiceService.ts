/**
 * Divine Voice Service - World-Class TTS Client
 *
 * Frontend service for the Divine Voice Orchestrator.
 * Provides high-quality voice synthesis with:
 * - Sarvam AI for Sanskrit/Hindi (India's best)
 * - Google Neural2/Studio for English
 * - Automatic fallback chain
 * - Universal stop capability
 *
 * Quality Scores:
 * - Sanskrit/Hindi: 9.5/10 (Sarvam AI)
 * - English: 9.0/10 (Google Neural2)
 */

import { stopAllAudio, registerAudioElement } from '@/utils/audio/universalAudioStop'

export type VoiceStyle = 'divine' | 'calm' | 'wisdom' | 'friendly' | 'chanting'
export type ChandasType = 'anuṣṭubh' | 'triṣṭubh' | 'gāyatrī' | 'jagatī' | 'śārdūlavikrīḍita' | 'mandākrāntā' | 'vasantatilakā' | 'upajāti'

export interface SynthesisOptions {
  text: string
  language?: string
  style?: VoiceStyle
  isSanskrit?: boolean
  ssml?: string
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export interface ShlokaOptions {
  shloka: string
  chandas?: ChandasType
  withMeaning?: boolean
  meaningText?: string
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export interface SynthesisResult {
  success: boolean
  audio?: HTMLAudioElement
  provider?: string
  qualityScore?: number
  latencyMs?: number
  error?: string
}

export interface ProviderInfo {
  available: boolean
  qualityScore: number
  bestFor: string[]
  voices: string[]
}

export interface ProvidersResponse {
  providers: {
    sarvam_ai: ProviderInfo
    google_neural: ProviderInfo
  }
  recommendation: {
    sanskrit: string
    hindi: string
    english: string
  }
}

class DivineVoiceService {
  private currentAudio: HTMLAudioElement | null = null
  private unregisterAudio: (() => void) | null = null
  private baseUrl = '/api/voice/divine'

  /**
   * Synthesize speech with the Divine Voice Orchestrator.
   */
  async synthesize(options: SynthesisOptions): Promise<SynthesisResult> {
    const {
      text,
      language = 'en',
      style = 'friendly',
      isSanskrit = false,
      ssml,
      volume = 1.0,
      onStart,
      onEnd,
      onError,
    } = options

    // Stop any current playback
    this.stop()

    try {
      const response = await fetch(`${this.baseUrl}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          style,
          is_sanskrit: isSanskrit,
          ssml,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Synthesis failed: ${errorText}`)
      }

      // Get metadata from headers
      const provider = response.headers.get('X-Provider') || 'unknown'
      const qualityScore = parseFloat(response.headers.get('X-Quality-Score') || '0')
      const latencyMs = parseFloat(response.headers.get('X-Latency-Ms') || '0')

      // Create audio from blob
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      const audio = new Audio(audioUrl)
      audio.volume = volume

      // Register with universal audio stop
      this.unregisterAudio = registerAudioElement(audio)
      this.currentAudio = audio

      // Set up event handlers
      audio.onplay = () => {
        console.log(`[DivineVoice] Playing (provider: ${provider}, quality: ${qualityScore})`)
        onStart?.()
      }

      audio.onended = () => {
        console.log('[DivineVoice] Playback complete')
        URL.revokeObjectURL(audioUrl)
        this.cleanup()
        onEnd?.()
      }

      audio.onerror = () => {
        const error = new Error('Audio playback error')
        console.error('[DivineVoice] Playback error')
        URL.revokeObjectURL(audioUrl)
        this.cleanup()
        onError?.(error)
      }

      // Start playback
      await audio.play()

      return {
        success: true,
        audio,
        provider,
        qualityScore,
        latencyMs,
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[DivineVoice] Synthesis error:', err)
      onError?.(err)
      return {
        success: false,
        error: err.message,
      }
    }
  }

  /**
   * Synthesize a Sanskrit shloka with perfect pronunciation.
   */
  async synthesizeShloka(options: ShlokaOptions): Promise<SynthesisResult> {
    const {
      shloka,
      chandas = 'anuṣṭubh',
      withMeaning = false,
      meaningText,
      volume = 1.0,
      onStart,
      onEnd,
      onError,
    } = options

    // Stop any current playback
    this.stop()

    try {
      const response = await fetch(`${this.baseUrl}/shloka`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shloka,
          chandas,
          with_meaning: withMeaning,
          meaning_text: meaningText,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shloka synthesis failed: ${errorText}`)
      }

      // Get metadata
      const provider = response.headers.get('X-Provider') || 'unknown'
      const qualityScore = parseFloat(response.headers.get('X-Quality-Score') || '0')

      // Create audio
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      const audio = new Audio(audioUrl)
      audio.volume = volume

      this.unregisterAudio = registerAudioElement(audio)
      this.currentAudio = audio

      audio.onplay = () => {
        console.log(`[DivineVoice] Playing shloka (chandas: ${chandas}, provider: ${provider})`)
        onStart?.()
      }

      audio.onended = () => {
        console.log('[DivineVoice] Shloka complete')
        URL.revokeObjectURL(audioUrl)
        this.cleanup()
        onEnd?.()
      }

      audio.onerror = () => {
        const error = new Error('Shloka playback error')
        URL.revokeObjectURL(audioUrl)
        this.cleanup()
        onError?.(error)
      }

      await audio.play()

      return {
        success: true,
        audio,
        provider,
        qualityScore,
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[DivineVoice] Shloka error:', err)
      onError?.(err)
      return {
        success: false,
        error: err.message,
      }
    }
  }

  /**
   * Speak KIAAN response with automatic Sanskrit word detection.
   */
  async speakKiaanResponse(
    text: string,
    language: string = 'en',
    options: Partial<SynthesisOptions> = {}
  ): Promise<SynthesisResult> {
    // Detect if text contains Sanskrit words that need special pronunciation
    const sanskritIndicators = [
      'dharma', 'karma', 'yoga', 'namaste', 'krishna', 'arjuna',
      'bhagavad', 'gita', 'shloka', 'mantra', 'chakra', 'prana',
      'om', 'shanti', 'atman', 'brahman', 'moksha', 'samsara'
    ]

    const textLower = text.toLowerCase()
    const hasSanskrit = sanskritIndicators.some(word => textLower.includes(word))

    return this.synthesize({
      text,
      language,
      style: 'friendly',
      isSanskrit: hasSanskrit,
      ...options,
    })
  }

  /**
   * Stop all voice playback.
   */
  stop(): void {
    // Stop current audio
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
    }

    this.cleanup()

    // Also call universal stop
    stopAllAudio()

    // Call backend stop
    fetch(`${this.baseUrl}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ synthesis_id: null }),
    }).catch(() => {
      // Ignore errors
    })

    console.log('[DivineVoice] All voice stopped')
  }

  /**
   * Get available providers and their status.
   */
  async getProviders(): Promise<ProvidersResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/providers`)
      if (!response.ok) {
        throw new Error('Failed to get providers')
      }
      return response.json()
    } catch (error) {
      console.error('[DivineVoice] Failed to get providers:', error)
      return null
    }
  }

  /**
   * Check if voice is currently playing.
   */
  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused
  }

  /**
   * Get current playback progress (0-1).
   */
  getProgress(): number {
    if (!this.currentAudio || this.currentAudio.duration === 0) {
      return 0
    }
    return this.currentAudio.currentTime / this.currentAudio.duration
  }

  /**
   * Set playback volume (0-1).
   */
  setVolume(volume: number): void {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Pause current playback.
   */
  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
    }
  }

  /**
   * Resume paused playback.
   */
  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play()
    }
  }

  private cleanup(): void {
    if (this.unregisterAudio) {
      this.unregisterAudio()
      this.unregisterAudio = null
    }
    this.currentAudio = null
  }
}

// Export singleton instance
const divineVoiceService = new DivineVoiceService()
export default divineVoiceService

// Export convenience functions
export const synthesizeDivine = (options: SynthesisOptions) =>
  divineVoiceService.synthesize(options)

export const synthesizeShloka = (options: ShlokaOptions) =>
  divineVoiceService.synthesizeShloka(options)

export const speakKiaan = (text: string, language?: string) =>
  divineVoiceService.speakKiaanResponse(text, language)

export const stopDivineVoice = () =>
  divineVoiceService.stop()
