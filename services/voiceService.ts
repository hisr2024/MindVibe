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

// Voice type settings aligned with backend for consistent natural speech
// These values are optimized for human-like delivery without robotic slowness
const VOICE_TYPE_DEFAULTS: Record<VoiceType, { speed: number; pitch: number }> = {
  calm: { speed: 0.92, pitch: -0.8 },      // Slower, soothing for meditation
  wisdom: { speed: 0.94, pitch: -0.3 },    // Measured, thoughtful for verses
  friendly: { speed: 0.97, pitch: 0.3 },   // Conversational, natural for KIAAN
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
   * Generate a simple hash for cache key to prevent collisions.
   * Uses a fast non-cryptographic hash for performance.
   */
  private hashText(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Generate cache key for audio using hash to prevent collisions.
   * Fixed: Previously used substring which could cause cache collisions
   * for similar texts. Now uses proper hashing.
   */
  private getCacheKey(options: SynthesizeOptions): string {
    const voiceType = options.voiceType || 'friendly'
    const defaults = VOICE_TYPE_DEFAULTS[voiceType]
    const {
      text,
      language = 'en',
      speed = defaults.speed,
      pitch = defaults.pitch
    } = options
    // Use hash of full text + parameters to prevent collisions
    const textHash = this.hashText(text)
    return `voice:${textHash}:${language}:${voiceType}:${speed}:${pitch}`
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
   * Synthesize text to speech with ULTRA-NATURAL voice settings.
   *
   * Uses voice type-specific defaults for speed and pitch that are
   * aligned with the backend TTS service for consistent natural delivery.
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

    // Get voice type-specific defaults for natural speech
    const voiceType = options.voiceType || 'friendly'
    const defaults = VOICE_TYPE_DEFAULTS[voiceType]

    // Call API with ULTRA-NATURAL voice settings aligned with backend
    const response = await apiFetch(
      '/api/voice/synthesize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: options.text,
          language: options.language || 'en',
          voice_type: voiceType,
          speed: options.speed !== undefined ? options.speed : defaults.speed,
          pitch: options.pitch !== undefined ? options.pitch : defaults.pitch
        })
      },
      userId
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Voice synthesis failed: ${errorText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('audio/') && !contentType.includes('application/octet-stream')) {
      const payload = await response.json().catch(() => null)
      const message =
        payload?.message ||
        payload?.error ||
        'Voice synthesis returned a non-audio response'
      throw new Error(message)
    }

    const blob = await response.blob()

    // Verify we got actual audio data
    if (blob.size === 0) {
      throw new Error('Voice synthesis returned empty audio')
    }

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
   * Synthesize KIAAN message with ULTRA-NATURAL voice.
   *
   * Uses 'friendly' voice type with optimal settings for:
   * - Human-like conversational delivery
   * - Natural pacing that feels like talking to a wise friend
   * - Subtle warmth without being artificially upbeat
   */
  async synthesizeKiaanMessage(
    message: string,
    language: string = 'en',
    userId: string
  ): Promise<Blob> {
    // Use voice type defaults for consistent natural speech
    const defaults = VOICE_TYPE_DEFAULTS.friendly
    return this.synthesize(
      {
        text: message,
        language,
        voiceType: 'friendly',
        speed: defaults.speed,  // 0.97 - Natural conversational pace
        pitch: defaults.pitch   // 0.3 - Subtle warmth
      },
      userId
    )
  }

  /**
   * Synthesize meditation guidance with ULTRA-NATURAL calming voice.
   *
   * Uses 'calm' voice type with optimal settings for:
   * - Soothing delivery without robotic slowness
   * - Grounded, peaceful tone that promotes relaxation
   * - Natural breathing rhythm pauses
   */
  async synthesizeMeditation(
    script: string,
    language: string = 'en',
    userId: string
  ): Promise<Blob> {
    // Use voice type defaults for consistent natural speech
    const defaults = VOICE_TYPE_DEFAULTS.calm
    return this.synthesize(
      {
        text: script,
        language,
        voiceType: 'calm',
        speed: defaults.speed,  // 0.92 - Calm but natural pace
        pitch: defaults.pitch   // -0.8 - Grounding warmth
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
