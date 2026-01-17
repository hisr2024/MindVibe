/**
 * MindVibe Voice Service
 *
 * Handles Text-to-Speech API calls, audio caching, and playback management.
 * Supports 17 languages with multiple voice personas.
 *
 * Quantum Coherence: Voice transforms written wisdom into auditory vibrations,
 * creating multi-sensory resonance that deepens understanding.
 */

import { apiFetch } from '@/lib/api'

export type VoiceType = 'calm' | 'wisdom' | 'friendly'
export type VoiceGender = 'male' | 'female' | 'neutral'
export type AudioQuality = 'low' | 'medium' | 'high'

export interface VoiceSettings {
  enabled: boolean
  autoPlay: boolean
  speed: number
  voiceGender: VoiceGender
  offlineDownload: boolean
  downloadQuality: AudioQuality
}

export interface SynthesizeOptions {
  text: string
  language?: string
  voiceType?: VoiceType
  speed?: number
  pitch?: number
}

export interface BatchDownloadResult {
  total: number
  success: number
  failed: number
  total_size_mb: number
  results: Array<{
    verse_id: string
    status: 'success' | 'error'
    size_bytes?: number
    url?: string
    error?: string
  }>
}

export interface SupportedLanguage {
  code: string
  name: string
}

class VoiceService {
  private audioCache: Map<string, Blob> = new Map()
  private maxCacheSize = 50 // Maximum number of cached audio files

  /**
   * Generate cache key for audio
   */
  private getCacheKey(options: SynthesizeOptions): string {
    const { text, language = 'en', voiceType = 'friendly', speed = 0.9 } = options
    return `${text.substring(0, 50)}:${language}:${voiceType}:${speed}`
  }

  /**
   * Get audio from cache
   */
  private getCachedAudio(key: string): Blob | null {
    return this.audioCache.get(key) || null
  }

  /**
   * Cache audio blob
   */
  private cacheAudio(key: string, blob: Blob): void {
    // Simple LRU: remove oldest if cache is full
    if (this.audioCache.size >= this.maxCacheSize) {
      const firstKey = this.audioCache.keys().next().value
      if (firstKey) {
        this.audioCache.delete(firstKey)
      }
    }

    this.audioCache.set(key, blob)
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(
    options: SynthesizeOptions,
    userId: string
  ): Promise<Blob> {
    const cacheKey = this.getCacheKey(options)

    // Check cache first
    const cached = this.getCachedAudio(cacheKey)
    if (cached) {
      console.log('[Voice] Using cached audio')
      return cached
    }

    // Call API
    const response = await apiFetch(
      '/api/voice/synthesize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: options.text,
          language: options.language || 'en',
          voice_type: options.voiceType || 'friendly',
          speed: options.speed !== undefined ? options.speed : 0.9,
          pitch: options.pitch !== undefined ? options.pitch : 0.0
        })
      },
      userId
    )

    if (!response.ok) {
      throw new Error(`Voice synthesis failed: ${response.statusText}`)
    }

    const blob = await response.blob()

    // Cache the audio
    this.cacheAudio(cacheKey, blob)

    return blob
  }

  /**
   * Get audio for a specific verse
   */
  async getVerseAudio(
    verseId: string,
    language: string = 'en',
    includeCommentary: boolean = false,
    userId: string
  ): Promise<Blob> {
    const cacheKey = `verse:${verseId}:${language}:${includeCommentary}`

    // Check cache
    const cached = this.getCachedAudio(cacheKey)
    if (cached) {
      return cached
    }

    // Call API
    const response = await apiFetch(
      `/api/voice/verse/${verseId}?language=${language}&include_commentary=${includeCommentary}`,
      {
        method: 'POST'
      },
      userId
    )

    if (!response.ok) {
      throw new Error(`Failed to get verse audio: ${response.statusText}`)
    }

    const blob = await response.blob()
    this.cacheAudio(cacheKey, blob)

    return blob
  }

  /**
   * Synthesize KIAAN message
   */
  async synthesizeKiaanMessage(
    message: string,
    language: string = 'en',
    userId: string
  ): Promise<Blob> {
    return this.synthesize(
      {
        text: message,
        language,
        voiceType: 'friendly',
        speed: 0.95
      },
      userId
    )
  }

  /**
   * Synthesize meditation guidance
   */
  async synthesizeMeditation(
    script: string,
    language: string = 'en',
    userId: string
  ): Promise<Blob> {
    return this.synthesize(
      {
        text: script,
        language,
        voiceType: 'calm',
        speed: 0.8
      },
      userId
    )
  }

  /**
   * Batch download verse audios
   */
  async batchDownload(
    verseIds: string[],
    language: string = 'en',
    userId: string
  ): Promise<BatchDownloadResult> {
    if (verseIds.length > 20) {
      throw new Error('Maximum 20 verses per batch')
    }

    const response = await apiFetch(
      '/api/voice/batch-download',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verse_ids: verseIds,
          language
        })
      },
      userId
    )

    if (!response.ok) {
      throw new Error(`Batch download failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get user voice settings
   */
  async getSettings(userId: string): Promise<VoiceSettings> {
    const response = await apiFetch('/api/voice/settings', {}, userId)

    if (!response.ok) {
      throw new Error(`Failed to get voice settings: ${response.statusText}`)
    }

    const data = await response.json()
    return data.settings
  }

  /**
   * Update user voice settings
   */
  async updateSettings(
    settings: VoiceSettings,
    userId: string
  ): Promise<void> {
    const response = await apiFetch(
      '/api/voice/settings',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      },
      userId
    )

    if (!response.ok) {
      throw new Error(`Failed to update voice settings: ${response.statusText}`)
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    const response = await fetch('/api/voice/supported-languages')

    if (!response.ok) {
      throw new Error(`Failed to get supported languages: ${response.statusText}`)
    }

    const data = await response.json()
    return data.languages
  }

  /**
   * Create audio URL from blob
   */
  createAudioUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
  }

  /**
   * Revoke audio URL
   */
  revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url)
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    this.audioCache.clear()
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.audioCache.size
  }
}

// Singleton instance
const voiceService = new VoiceService()
export default voiceService
