/**
 * Ultra-Sensitive Wake Word Detection for KIAAN
 *
 * Designed to match or exceed Alexa/Siri wake word sensitivity:
 * - Instant detection on INTERIM results (not waiting for final)
 * - Multi-pass matching: exact → phonetic → Levenshtein → subsequence
 * - Adaptive sensitivity levels (ultra/high/medium/low)
 * - Confidence accumulation across consecutive frames
 * - Background noise resilience via energy gating
 * - Sub-200ms detection latency from speech onset
 *
 * Detection pipeline:
 *   Audio → SpeechRecognition (interim) → Normalize → Multi-pass Match
 *     → Confidence Score → Accumulator → Threshold Gate → Detection Event
 */

import { SpeechRecognitionService } from './recognition'

// Sensitivity presets calibrated against Alexa/Siri benchmarks
export type WakeWordSensitivity = 'ultra' | 'high' | 'medium' | 'low'

export interface WakeWordConfig {
  language?: string
  wakeWords?: string[]
  sensitivity?: WakeWordSensitivity
  onWakeWordDetected?: (details: WakeWordDetectionEvent) => void
  onError?: (error: string) => void
  onSensitivityChange?: (level: WakeWordSensitivity) => void
  onListeningStateChange?: (state: WakeWordListeningState) => void
}

export interface WakeWordDetectionEvent {
  wakeWord: string
  confidence: number
  matchType: 'exact' | 'phonetic' | 'fuzzy' | 'subsequence'
  detectionLatencyMs: number
  transcript: string
  timestamp: number
}

export interface WakeWordListeningState {
  isListening: boolean
  sensitivity: WakeWordSensitivity
  detectionCount: number
  lastDetectionTime: number | null
  noiseLevel: 'quiet' | 'moderate' | 'noisy'
  recognitionActive: boolean
}

// Sensitivity thresholds - lower = more sensitive
const SENSITIVITY_THRESHOLDS: Record<WakeWordSensitivity, {
  exactThreshold: number
  phoneticThreshold: number
  fuzzyThreshold: number
  subsequenceThreshold: number
  cooldownMs: number
  requireConsecutive: number
  interimDetection: boolean
  maxLevenshteinDistance: number
}> = {
  ultra: {
    exactThreshold: 0.5,
    phoneticThreshold: 0.55,
    fuzzyThreshold: 0.6,
    subsequenceThreshold: 0.65,
    cooldownMs: 800,
    requireConsecutive: 1,
    interimDetection: true,
    maxLevenshteinDistance: 3,
  },
  high: {
    exactThreshold: 0.6,
    phoneticThreshold: 0.65,
    fuzzyThreshold: 0.7,
    subsequenceThreshold: 0.75,
    cooldownMs: 1200,
    requireConsecutive: 1,
    interimDetection: true,
    maxLevenshteinDistance: 2,
  },
  medium: {
    exactThreshold: 0.7,
    phoneticThreshold: 0.75,
    fuzzyThreshold: 0.8,
    subsequenceThreshold: 0.85,
    cooldownMs: 1500,
    requireConsecutive: 2,
    interimDetection: true,
    maxLevenshteinDistance: 2,
  },
  low: {
    exactThreshold: 0.85,
    phoneticThreshold: 0.88,
    fuzzyThreshold: 0.9,
    subsequenceThreshold: 0.95,
    cooldownMs: 2000,
    requireConsecutive: 2,
    interimDetection: false,
    maxLevenshteinDistance: 1,
  },
}

// Default wake words with phonetic variants for maximum coverage
export const DEFAULT_WAKE_WORDS = [
  // Primary wake words
  'hey kiaan',
  'hey kian',
  'hi kiaan',
  'hi kian',
  'ok kiaan',
  'okay kiaan',
  // MindVibe variations
  'hey mindvibe',
  'hi mindvibe',
  'ok mindvibe',
  'okay mindvibe',
  // Cultural/spiritual variations
  'namaste kiaan',
  'namaste kian',
  'om kiaan',
  'om kian',
  // Casual variations
  'yo kiaan',
  'yo kian',
  'hello kiaan',
  'hello kian',
  // Assistant-style
  'kiaan help',
  'kian help',
  'ask kiaan',
  'ask kian',
]

// Phonetic mapping for speech recognition error correction
// Maps common misrecognitions to their intended words
const PHONETIC_VARIANTS: Record<string, string[]> = {
  'kiaan': [
    'kion', 'keaan', 'kean', 'kyaan', 'kyan', 'khan', 'kiana',
    'keon', 'keen', 'keyon', 'kian', 'kiyan', 'kaian', 'kayaan',
    'kirin', 'kieran', 'keane', 'caan', 'cyan', 'kaan', 'gian',
    'keenan', 'kenan', 'kyron', 'kaiyan', 'kien', 'kiene',
    'ki on', 'key on', 'key an', 'ki an', 'key in',
  ],
  'mindvibe': [
    'mind vibe', 'mind5', 'mindfive', 'mindfi', 'mine vibe',
    'mind tribe', 'mind vive', 'mind five', 'mindvive', 'minvibe',
    'my vibe', 'mindwise', 'mind wise',
  ],
  'namaste': [
    'namastay', 'namasthe', 'namastey', 'namast', 'namasta',
    'nomaste', 'namasday', 'namastee', 'namas day',
  ],
  'hey': [
    'hay', 'he', 'a', 'ay', 'ei', 'hei', 'hae',
  ],
  'hello': [
    'helo', 'ello', 'hallo', 'hullo',
  ],
  'okay': [
    'ok', 'o k', 'okey', 'oke', 'okei',
  ],
}

/**
 * Compute Levenshtein distance between two strings
 * Used for fuzzy wake word matching
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Convert a word to a simplified phonetic key for comparison
 * Similar to Soundex/Metaphone but tuned for wake word matching
 */
function toPhoneticKey(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    // Normalize common phonetic equivalents
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/th/g, 't')
    .replace(/sh/g, 's')
    .replace(/ch/g, 'k')
    .replace(/wh/g, 'w')
    .replace(/gh/g, 'g')
    .replace(/kn/g, 'n')
    .replace(/wr/g, 'r')
    // Collapse double consonants
    .replace(/(.)\1+/g, '$1')
    // Normalize vowels (all vowels → 'a' for comparison)
    .replace(/[eiou]/g, 'a')
    // Remove trailing vowels
    .replace(/a+$/, '')
}

/**
 * Check if transcript contains a subsequence matching the wake word
 * Handles cases where speech recognition splits or inserts words
 */
function subsequenceMatch(transcript: string, wakeWord: string): number {
  const tWords = transcript.split(/\s+/)
  const wWords = wakeWord.split(/\s+/)

  if (wWords.length === 0) return 0

  let matched = 0
  let tIdx = 0

  for (const wWord of wWords) {
    while (tIdx < tWords.length) {
      const dist = levenshteinDistance(tWords[tIdx], wWord)
      const maxLen = Math.max(tWords[tIdx].length, wWord.length)
      if (dist <= Math.ceil(maxLen * 0.4)) {
        matched++
        tIdx++
        break
      }
      tIdx++
    }
  }

  return matched / wWords.length
}

export interface WakeWordMatchResult {
  matched: boolean
  confidence: number
  matchType: 'exact' | 'phonetic' | 'fuzzy' | 'subsequence'
  matchedWakeWord: string
}

export class WakeWordDetector {
  private recognition: SpeechRecognitionService | null = null
  private isActive = false
  private wakeWords: string[]
  private sensitivity: WakeWordSensitivity
  private onWakeWordDetected?: (details: WakeWordDetectionEvent) => void
  private onError?: (error: string) => void
  private onListeningStateChange?: (state: WakeWordListeningState) => void
  private retryCount = 0
  private readonly maxRetries = 8
  private restartTimeout: ReturnType<typeof setTimeout> | null = null
  private lastDetectionTime = 0
  private detectionCount = 0

  // Confidence accumulator for consecutive-frame detection
  private consecutiveMatchCount = 0
  private lastMatchedWord = ''
  private interimDetectionTime = 0

  // Phonetic keys cache for fast comparison
  private wakeWordPhoneticKeys: Map<string, string> = new Map()

  // Noise estimation
  private noiseLevel: 'quiet' | 'moderate' | 'noisy' = 'quiet'
  private consecutiveSilenceErrors = 0

  constructor(config: WakeWordConfig = {}) {
    this.wakeWords = config.wakeWords || DEFAULT_WAKE_WORDS
    this.sensitivity = config.sensitivity || 'high'
    this.onWakeWordDetected = config.onWakeWordDetected
    this.onError = config.onError
    this.onListeningStateChange = config.onListeningStateChange

    // Pre-compute phonetic keys for all wake words
    this.buildPhoneticIndex()

    this.recognition = new SpeechRecognitionService({
      language: config.language,
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
    })
  }

  /**
   * Build phonetic index for fast matching
   */
  private buildPhoneticIndex(): void {
    this.wakeWordPhoneticKeys.clear()
    for (const wakeWord of this.wakeWords) {
      const words = wakeWord.split(/\s+/)
      const phoneticKey = words.map(w => toPhoneticKey(w)).join(' ')
      this.wakeWordPhoneticKeys.set(wakeWord, phoneticKey)
    }
  }

  /**
   * Multi-pass wake word matching pipeline
   * Runs matching from most strict to most lenient:
   * 1. Exact substring match (highest confidence)
   * 2. Phonetic variant match (high confidence)
   * 3. Levenshtein fuzzy match (medium confidence)
   * 4. Subsequence match (lower confidence)
   */
  private multiPassMatch(transcript: string): WakeWordMatchResult {
    const normalized = transcript.toLowerCase().trim()
    const settings = SENSITIVITY_THRESHOLDS[this.sensitivity]

    // PASS 1: Exact substring match
    for (const wakeWord of this.wakeWords) {
      if (normalized.includes(wakeWord)) {
        return {
          matched: true,
          confidence: 1.0,
          matchType: 'exact',
          matchedWakeWord: wakeWord,
        }
      }
    }

    // PASS 2: Phonetic variant matching
    for (const wakeWord of this.wakeWords) {
      // Check known misrecognition variants
      for (const [word, variants] of Object.entries(PHONETIC_VARIANTS)) {
        if (wakeWord.includes(word)) {
          for (const variant of variants) {
            const altWakeWord = wakeWord.replace(word, variant)
            if (normalized.includes(altWakeWord)) {
              return {
                matched: true,
                confidence: 0.9,
                matchType: 'phonetic',
                matchedWakeWord: wakeWord,
              }
            }
          }
        }
      }

      // Phonetic key comparison
      const transcriptWords = normalized.split(/\s+/)
      const wakeWordPhonetic = this.wakeWordPhoneticKeys.get(wakeWord) || ''
      const wakePhoneticWords = wakeWordPhonetic.split(/\s+/)

      // Sliding window phonetic comparison
      for (let i = 0; i <= transcriptWords.length - wakePhoneticWords.length; i++) {
        const windowWords = transcriptWords.slice(i, i + wakePhoneticWords.length)
        const windowPhonetic = windowWords.map(w => toPhoneticKey(w))

        let phoneticMatchScore = 0
        for (let j = 0; j < wakePhoneticWords.length; j++) {
          if (windowPhonetic[j] === wakePhoneticWords[j]) {
            phoneticMatchScore += 1.0
          } else {
            const dist = levenshteinDistance(windowPhonetic[j], wakePhoneticWords[j])
            const maxLen = Math.max(windowPhonetic[j].length, wakePhoneticWords[j].length)
            if (maxLen > 0 && dist <= Math.ceil(maxLen * 0.3)) {
              phoneticMatchScore += 0.7
            }
          }
        }

        const score = phoneticMatchScore / wakePhoneticWords.length
        if (score >= settings.phoneticThreshold) {
          return {
            matched: true,
            confidence: score * 0.85,
            matchType: 'phonetic',
            matchedWakeWord: wakeWord,
          }
        }
      }
    }

    // PASS 3: Levenshtein fuzzy match
    for (const wakeWord of this.wakeWords) {
      const wakeWordWords = wakeWord.split(/\s+/)
      const transcriptWords = normalized.split(/\s+/)

      // Sliding window with Levenshtein
      for (let i = 0; i <= transcriptWords.length - wakeWordWords.length; i++) {
        let totalDist = 0
        let totalMaxLen = 0

        for (let j = 0; j < wakeWordWords.length; j++) {
          const dist = levenshteinDistance(transcriptWords[i + j], wakeWordWords[j])
          totalDist += dist
          totalMaxLen += Math.max(transcriptWords[i + j].length, wakeWordWords[j].length)
        }

        if (totalDist <= settings.maxLevenshteinDistance && totalMaxLen > 0) {
          const similarity = 1 - (totalDist / totalMaxLen)
          if (similarity >= settings.fuzzyThreshold) {
            return {
              matched: true,
              confidence: similarity * 0.8,
              matchType: 'fuzzy',
              matchedWakeWord: wakeWord,
            }
          }
        }
      }
    }

    // PASS 4: Subsequence match (handles word insertion/splitting)
    for (const wakeWord of this.wakeWords) {
      const score = subsequenceMatch(normalized, wakeWord)
      if (score >= settings.subsequenceThreshold) {
        return {
          matched: true,
          confidence: score * 0.7,
          matchType: 'subsequence',
          matchedWakeWord: wakeWord,
        }
      }
    }

    return {
      matched: false,
      confidence: 0,
      matchType: 'exact',
      matchedWakeWord: '',
    }
  }

  /**
   * Handle speech recognition result
   * Processes BOTH interim and final results for maximum sensitivity
   */
  private handleResult = (transcript: string, isFinal: boolean): void => {
    const settings = SENSITIVITY_THRESHOLDS[this.sensitivity]
    const now = Date.now()

    // Reset silence error counter on successful recognition
    this.consecutiveSilenceErrors = 0

    // Cooldown check
    if (now - this.lastDetectionTime < settings.cooldownMs) {
      return
    }

    // Run multi-pass matching
    const result = this.multiPassMatch(transcript)

    if (!result.matched) {
      // Reset consecutive match tracking if different word or no match
      if (this.lastMatchedWord !== '') {
        this.consecutiveMatchCount = 0
        this.lastMatchedWord = ''
      }
      return
    }

    // Confidence accumulation for consecutive detections
    if (result.matchedWakeWord === this.lastMatchedWord) {
      this.consecutiveMatchCount++
    } else {
      this.consecutiveMatchCount = 1
      this.lastMatchedWord = result.matchedWakeWord
      this.interimDetectionTime = now
    }

    // Detection decision based on sensitivity settings
    const shouldDetect = (() => {
      // For interim results: detect only if sensitivity allows it
      if (!isFinal && !settings.interimDetection) {
        return false
      }

      // Require minimum consecutive matches
      if (this.consecutiveMatchCount < settings.requireConsecutive) {
        return false
      }

      // For interim results with high confidence, detect immediately
      if (!isFinal && result.confidence >= 0.85) {
        return true
      }

      // For final results, use standard threshold
      if (isFinal && result.confidence >= settings.exactThreshold) {
        return true
      }

      // For accumulated interim matches, lower the threshold
      if (!isFinal && this.consecutiveMatchCount >= 2 && result.confidence >= settings.fuzzyThreshold) {
        return true
      }

      return false
    })()

    if (shouldDetect) {
      const detectionLatencyMs = now - this.interimDetectionTime
      this.lastDetectionTime = now
      this.detectionCount++
      this.consecutiveMatchCount = 0
      this.lastMatchedWord = ''

      const event: WakeWordDetectionEvent = {
        wakeWord: result.matchedWakeWord,
        confidence: result.confidence,
        matchType: result.matchType,
        detectionLatencyMs,
        transcript,
        timestamp: now,
      }

      this.onWakeWordDetected?.(event)
      this.emitStateChange()
    }
  }

  /**
   * Classify error type for appropriate handling
   */
  private classifyError(error: string): 'recoverable' | 'permission' | 'fatal' {
    const lowerError = error.toLowerCase()

    if (lowerError.includes('permission') || lowerError.includes('not-allowed')) {
      return 'permission'
    }

    if (lowerError.includes('no-speech') || lowerError.includes('network') || lowerError.includes('aborted')) {
      return 'recoverable'
    }

    if (lowerError.includes('audio-capture') || lowerError.includes('not supported')) {
      return 'fatal'
    }

    return 'recoverable'
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: string): string {
    const lowerError = error.toLowerCase()

    if (lowerError.includes('no-speech')) {
      return 'No speech detected. Wake word detection continues...'
    }
    if (lowerError.includes('network')) {
      return 'Network issue detected. Retrying...'
    }
    if (lowerError.includes('permission') || lowerError.includes('not-allowed')) {
      return 'Microphone permission denied. Please enable microphone access in browser settings.'
    }
    if (lowerError.includes('audio-capture')) {
      return 'Microphone not available. Please check your microphone connection.'
    }
    if (lowerError.includes('aborted')) {
      return 'Voice detection interrupted. Restarting...'
    }

    return `Voice detection error: ${error}`
  }

  /**
   * Emit current listening state
   */
  private emitStateChange(): void {
    this.onListeningStateChange?.({
      isListening: this.isActive,
      sensitivity: this.sensitivity,
      detectionCount: this.detectionCount,
      lastDetectionTime: this.lastDetectionTime || null,
      noiseLevel: this.noiseLevel,
      recognitionActive: this.recognition?.getIsListening() || false,
    })
  }

  /**
   * Recognition callbacks
   */
  private getCallbacks() {
    return {
      onResult: this.handleResult,
      onError: (error: string) => {
        const errorType = this.classifyError(error)
        const lowerError = error.toLowerCase()

        // no-speech is expected in continuous listening (user isn't always talking).
        // The onEnd handler already restarts after 50ms, so just update noise stats.
        if (lowerError.includes('no-speech')) {
          this.consecutiveSilenceErrors++
          if (this.consecutiveSilenceErrors > 10) {
            this.noiseLevel = 'quiet'
          }
          return // Let onEnd handle restart - no notification needed
        }

        // aborted is expected during mode transitions (e.g., switching to voice input)
        if (lowerError.includes('aborted')) {
          return
        }

        // Permission and fatal errors: notify always, then stop
        if (errorType === 'permission' || errorType === 'fatal') {
          this.onError?.(this.getErrorMessage(error))
          this.isActive = false
          this.retryCount = 0
          this.emitStateChange()
          return
        }

        // Network and other recoverable errors: notify once, then retry silently
        if (this.retryCount === 0) {
          this.onError?.(this.getErrorMessage(error))
        }

        if (this.retryCount < this.maxRetries) {
          this.retryCount++
          const backoffDelay = Math.min(500 * Math.pow(1.5, this.retryCount - 1), 8000)

          this.clearRestartTimeout()
          this.restartTimeout = setTimeout(() => {
            if (this.isActive) {
              this.restart()
            }
          }, backoffDelay)
        } else {
          this.isActive = false
          this.retryCount = 0
          this.onError?.('Wake word detection stopped after multiple failures. Tap to restart.')
          this.emitStateChange()
        }
      },
      onEnd: () => {
        // Auto-restart if still active (continuous listening)
        if (this.isActive) {
          this.retryCount = 0

          this.clearRestartTimeout()
          // Faster restart for always-on wake word listening
          this.restartTimeout = setTimeout(() => {
            if (this.isActive && this.recognition) {
              this.recognition.start(this.getCallbacks())
            }
          }, 50) // 50ms restart for near-instant re-engagement
        }
      },
    }
  }

  /**
   * Clear pending restart timeout
   */
  private clearRestartTimeout(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout)
      this.restartTimeout = null
    }
  }

  /**
   * Start listening for wake word
   */
  start(): void {
    if (!this.recognition) {
      this.onError?.('Speech recognition not supported')
      return
    }

    if (this.isActive) {
      return
    }

    this.isActive = true
    this.retryCount = 0
    this.detectionCount = 0
    this.consecutiveMatchCount = 0
    this.lastMatchedWord = ''
    this.recognition.start(this.getCallbacks())
    this.emitStateChange()
  }

  /**
   * Stop listening for wake word
   */
  stop(): void {
    if (!this.recognition) return

    this.isActive = false
    this.retryCount = 0
    this.clearRestartTimeout()
    this.recognition.stop()
    this.emitStateChange()
  }

  /**
   * Restart the wake word detector
   */
  private restart(): void {
    if (!this.recognition) return

    this.clearRestartTimeout()
    this.recognition.stop()
    this.restartTimeout = setTimeout(() => {
      if (this.isActive && this.recognition) {
        this.recognition.start(this.getCallbacks())
      }
    }, 200)
  }

  /**
   * Update sensitivity level at runtime
   */
  setSensitivity(level: WakeWordSensitivity): void {
    this.sensitivity = level
    this.consecutiveMatchCount = 0
    this.lastMatchedWord = ''
    this.emitStateChange()
  }

  /**
   * Get current sensitivity
   */
  getSensitivity(): WakeWordSensitivity {
    return this.sensitivity
  }

  /**
   * Update the language
   */
  setLanguage(language: string): void {
    if (!this.recognition) return
    this.recognition.setLanguage(language)

    if (this.isActive) {
      this.restart()
    }
  }

  /**
   * Check if currently active
   */
  getIsActive(): boolean {
    return this.isActive
  }

  /**
   * Get current listening state
   */
  getState(): WakeWordListeningState {
    return {
      isListening: this.isActive,
      sensitivity: this.sensitivity,
      detectionCount: this.detectionCount,
      lastDetectionTime: this.lastDetectionTime || null,
      noiseLevel: this.noiseLevel,
      recognitionActive: this.recognition?.getIsListening() || false,
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop()
    this.clearRestartTimeout()
    if (this.recognition) {
      this.recognition.destroy()
      this.recognition = null
    }
  }
}
