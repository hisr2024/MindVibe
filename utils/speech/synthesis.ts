/**
 * Speech Synthesis wrapper for voice output (Text-to-Speech)
 *
 * Provides a clean interface around browser's SpeechSynthesis API
 * with automatic selection of the highest quality voice available.
 *
 * Voice Quality Ranking (auto-selected):
 * 1. Neural/Natural voices (Edge "Jenny Online", Chrome "Google US English")
 * 2. Enhanced voices (Safari "Samantha Enhanced")
 * 3. Online/Remote voices (localService: false)
 * 4. Default system voice (last resort)
 */

import { getSpeechLanguage } from './languageMapping'

export type VoiceGender = 'female' | 'male' | 'auto'

export interface SynthesisConfig {
  language?: string
  rate?: number
  pitch?: number
  volume?: number
  /** Preferred voice gender: female, male, or auto (best quality) */
  gender?: VoiceGender
}

export interface SynthesisCallbacks {
  onStart?: () => void
  onEnd?: () => void
  onPause?: () => void
  onResume?: () => void
  onError?: (error: string) => void
}

// Voice quality scoring - higher is better
const VOICE_QUALITY_PATTERNS: { pattern: RegExp; score: number }[] = [
  // Neural/Natural voices (Edge, modern browsers) - best quality
  { pattern: /Natural/i, score: 100 },
  { pattern: /Neural/i, score: 95 },
  // Google's cloud voices (Chrome) - excellent quality
  { pattern: /Google.*English/i, score: 90 },
  { pattern: /Google/i, score: 85 },
  // Microsoft Online voices (Edge) - excellent quality
  { pattern: /Online/i, score: 88 },
  { pattern: /Microsoft.*Jenny/i, score: 92 },
  { pattern: /Microsoft.*Aria/i, score: 91 },
  { pattern: /Microsoft.*Guy/i, score: 89 },
  { pattern: /Microsoft/i, score: 80 },
  // Enhanced voices (macOS/iOS) - good quality
  { pattern: /Enhanced/i, score: 75 },
  { pattern: /Premium/i, score: 78 },
  // Specific high-quality system voices
  { pattern: /Samantha/i, score: 70 },
  { pattern: /Karen/i, score: 68 },
  { pattern: /Daniel/i, score: 65 },
  { pattern: /Moira/i, score: 65 },
  // Female voices tend to sound warmer for companion use
  { pattern: /Female/i, score: 10 },
]

// Known female voice name patterns (for gender detection)
const FEMALE_VOICE_PATTERNS = [
  /Jenny/i, /Aria/i, /Samantha/i, /Karen/i, /Moira/i, /Zira/i,
  /Siri.*Female/i, /Google.*Female/i, /Female/i,
  /Heera/i, /Neerja/i, /Sara/i, /Libby/i, /Emily/i,
  /Hazel/i, /Susan/i, /Linda/i, /Catherine/i, /Fiona/i,
]

// Known male voice name patterns
const MALE_VOICE_PATTERNS = [
  /Guy/i, /Daniel/i, /David/i, /Mark/i, /James/i,
  /Siri.*Male/i, /Google.*Male/i, /Male/i,
  /Ravi/i, /Prabhat/i, /Ryan/i, /Christopher/i,
  /Thomas/i, /George/i, /Fred/i,
]

/**
 * Detect voice gender from voice name using known patterns
 */
function detectVoiceGender(voice: SpeechSynthesisVoice): VoiceGender {
  for (const p of FEMALE_VOICE_PATTERNS) {
    if (p.test(voice.name)) return 'female'
  }
  for (const p of MALE_VOICE_PATTERNS) {
    if (p.test(voice.name)) return 'male'
  }
  return 'auto'
}

function scoreVoice(voice: SpeechSynthesisVoice, preferredGender?: VoiceGender): number {
  let score = 0

  // Pattern-based scoring
  for (const { pattern, score: bonus } of VOICE_QUALITY_PATTERNS) {
    if (pattern.test(voice.name)) {
      score = Math.max(score, bonus)
    }
  }

  // Remote/cloud voices are generally higher quality than local
  if (!voice.localService) {
    score += 15
  }

  // Gender preference bonus: +30 for matching, -20 for non-matching
  if (preferredGender && preferredGender !== 'auto') {
    const voiceGender = detectVoiceGender(voice)
    if (voiceGender === preferredGender) {
      score += 30
    } else if (voiceGender !== 'auto') {
      score -= 20
    }
  }

  return score
}

export class SpeechSynthesisService {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private config: SynthesisConfig = {}
  private callbacks: SynthesisCallbacks = {}
  private bestVoice: SpeechSynthesisVoice | null = null
  private voicesLoaded = false

  constructor(config: SynthesisConfig = {}) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported in this browser')
      return
    }

    this.synthesis = window.speechSynthesis
    this.config = {
      language: config.language || 'en',
      rate: config.rate ?? 0.94,
      pitch: config.pitch ?? 1.03,
      volume: config.volume ?? 1.0,
      gender: config.gender || 'auto',
    }

    // Auto-select best voice (voices may load async)
    this.selectBestVoice()
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = () => this.selectBestVoice()
    }
  }

  /**
   * Automatically select the highest quality voice for the configured language.
   */
  private selectBestVoice(): void {
    if (!this.synthesis) return

    const voices = this.synthesis.getVoices()
    if (voices.length === 0) return

    const targetLang = getSpeechLanguage(this.config.language || 'en')
    const langPrefix = targetLang.split('-')[0]

    // Filter voices matching our language
    const matchingVoices = voices.filter(v =>
      v.lang.startsWith(langPrefix)
    )

    if (matchingVoices.length === 0) return

    // Score and sort - highest quality first, respecting gender preference
    const scored = matchingVoices
      .map(voice => ({ voice, score: scoreVoice(voice, this.config.gender) }))
      .sort((a, b) => b.score - a.score)

    this.bestVoice = scored[0].voice
    this.voicesLoaded = true

    if (scored[0].score > 0) {
      console.log(`[KIAAN TTS] Selected voice: "${this.bestVoice.name}" (score: ${scored[0].score}, remote: ${!this.bestVoice.localService})`)
    }
  }

  /**
   * Speak the given text with the best available voice
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
    utterance.rate = this.config.rate ?? 0.94
    utterance.pitch = this.config.pitch ?? 1.03
    utterance.volume = this.config.volume ?? 1.0

    // Use the best quality voice we found
    if (this.bestVoice) {
      utterance.voice = this.bestVoice
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
   * Update configuration. Re-selects voice if gender changes.
   */
  updateConfig(config: Partial<SynthesisConfig>): void {
    const genderChanged = config.gender !== undefined && config.gender !== this.config.gender
    this.config = { ...this.config, ...config }
    if (genderChanged) {
      this.selectBestVoice()
    }
  }

  /**
   * Set voice gender preference and re-select best voice
   */
  setGender(gender: VoiceGender): void {
    this.config.gender = gender
    this.selectBestVoice()
  }

  /**
   * Get available voice genders for the current language
   */
  getAvailableVoiceGenders(): VoiceGender[] {
    if (!this.synthesis) return ['auto']
    const voices = this.synthesis.getVoices()
    const langPrefix = getSpeechLanguage(this.config.language || 'en').split('-')[0]
    const matching = voices.filter(v => v.lang.startsWith(langPrefix))
    const genders = new Set<VoiceGender>(['auto'])
    for (const v of matching) {
      const g = detectVoiceGender(v)
      if (g !== 'auto') genders.add(g)
    }
    return Array.from(genders)
  }

  /**
   * Get the currently selected voice name
   */
  getSelectedVoiceName(): string | null {
    return this.bestVoice?.name || null
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
      this.bestVoice = voice
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
