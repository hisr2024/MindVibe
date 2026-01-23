/**
 * Wake word detection logic for "Hey KIAAN"
 * Uses SpeechRecognition in continuous mode to listen for the wake word
 */

import { SpeechRecognitionService } from './recognition'

export interface WakeWordConfig {
  language?: string
  wakeWords?: string[]
  onWakeWordDetected?: () => void
  onError?: (error: string) => void
}

// Default wake words - extensive list for better recognition
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

export class WakeWordDetector {
  private recognition: SpeechRecognitionService | null = null
  private isActive = false
  private wakeWords: string[]
  private onWakeWordDetected?: () => void
  private onError?: (error: string) => void
  private retryCount = 0
  private readonly maxRetries = 5
  private restartTimeout: ReturnType<typeof setTimeout> | null = null
  private lastDetectionTime = 0
  private readonly detectionCooldown = 2000 // Prevent double-triggers

  constructor(config: WakeWordConfig = {}) {
    this.wakeWords = config.wakeWords || DEFAULT_WAKE_WORDS
    this.onWakeWordDetected = config.onWakeWordDetected
    this.onError = config.onError

    this.recognition = new SpeechRecognitionService({
      language: config.language,
      continuous: true,
      interimResults: true,
    })
  }

  /**
   * Handle speech result and check for wake word
   * Uses fuzzy matching for better recognition
   */
  private handleResult = (transcript: string, isFinal: boolean): void => {
    const normalizedTranscript = transcript.toLowerCase().trim()

    // Check for exact or fuzzy wake word match
    const hasWakeWord = this.wakeWords.some(wakeWord =>
      this.fuzzyMatch(normalizedTranscript, wakeWord)
    )

    if (hasWakeWord && isFinal) {
      // Prevent double-triggers with cooldown
      const now = Date.now()
      if (now - this.lastDetectionTime < this.detectionCooldown) {
        return
      }
      this.lastDetectionTime = now
      this.onWakeWordDetected?.()
    }
  }

  /**
   * Fuzzy matching for wake words to handle speech recognition variations
   */
  private fuzzyMatch(transcript: string, wakeWord: string): boolean {
    // Exact match
    if (transcript.includes(wakeWord)) {
      return true
    }

    // Handle common speech recognition errors
    const variations: Record<string, string[]> = {
      'kiaan': ['kion', 'keaan', 'kean', 'kyaan', 'kyan', 'khan', 'kiana'],
      'mindvibe': ['mind vibe', 'mind5', 'mindfive', 'mindfi'],
      'namaste': ['namastay', 'namasthe', 'namastey'],
    }

    // Check variations
    for (const [word, alts] of Object.entries(variations)) {
      if (wakeWord.includes(word)) {
        for (const alt of alts) {
          const altWakeWord = wakeWord.replace(word, alt)
          if (transcript.includes(altWakeWord)) {
            return true
          }
        }
      }
    }

    return false
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
   * Callbacks for recognition
   */
  private getCallbacks() {
    return {
      onResult: this.handleResult,
      onError: (error: string) => {
        const errorType = this.classifyError(error)
        const friendlyMessage = this.getErrorMessage(error)

        // Only notify user for non-recoverable or first-time errors
        if (errorType !== 'recoverable' || this.retryCount === 0) {
          this.onError?.(friendlyMessage)
        }

        // Handle based on error type
        if (errorType === 'permission' || errorType === 'fatal') {
          this.isActive = false
          this.retryCount = 0
          return
        }

        // Recoverable error - retry with exponential backoff
        if (this.retryCount < this.maxRetries) {
          this.retryCount++
          const backoffDelay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 16000)

          this.clearRestartTimeout()
          this.restartTimeout = setTimeout(() => {
            if (this.isActive) {
              this.restart()
            }
          }, backoffDelay)
        } else {
          // Max retries reached - stop and notify
          this.isActive = false
          this.retryCount = 0
          this.onError?.('Wake word detection stopped after multiple failures. Tap to restart.')
        }
      },
      onEnd: () => {
        // Auto-restart if still active (continuous listening)
        if (this.isActive) {
          // Reset retry count on successful end
          this.retryCount = 0

          this.clearRestartTimeout()
          this.restartTimeout = setTimeout(() => {
            if (this.isActive && this.recognition) {
              this.recognition.start(this.getCallbacks())
            }
          }, 100)
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
      console.warn('Wake word detector already active')
      return
    }

    this.isActive = true
    this.retryCount = 0
    this.recognition.start(this.getCallbacks())
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
  }

  /**
   * Restart the wake word detector
   */
  private restart(): void {
    if (!this.recognition) return

    // Clear any pending restart to prevent race conditions
    this.clearRestartTimeout()
    
    this.recognition.stop()
    this.restartTimeout = setTimeout(() => {
      if (this.isActive && this.recognition) {
        // Don't call start() to avoid resetting retry count
        // Directly restart recognition with existing callbacks
        this.recognition.start(this.getCallbacks())
      }
    }, 500)
  }

  /**
   * Update the language
   */
  setLanguage(language: string): void {
    if (!this.recognition) return
    this.recognition.setLanguage(language)
    
    // Restart if active to apply new language
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
