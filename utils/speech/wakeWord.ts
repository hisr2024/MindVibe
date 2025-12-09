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

export class WakeWordDetector {
  private recognition: SpeechRecognitionService | null = null
  private isActive = false
  private wakeWords: string[]
  private onWakeWordDetected?: () => void
  private onError?: (error: string) => void
  private retryCount = 0
  private readonly maxRetries = 3
  private restartTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(config: WakeWordConfig = {}) {
    this.wakeWords = config.wakeWords || [
      'hey kiaan',
      'hey kian',
      'hi kiaan',
      'hi kian',
      'ok kiaan',
      'okay kiaan',
    ]
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
   */
  private handleResult = (transcript: string, isFinal: boolean): void => {
    const normalizedTranscript = transcript.toLowerCase().trim()
    
    const hasWakeWord = this.wakeWords.some(wakeWord => 
      normalizedTranscript.includes(wakeWord)
    )

    if (hasWakeWord && isFinal) {
      this.onWakeWordDetected?.()
    }
  }

  /**
   * Callbacks for recognition
   */
  private getCallbacks() {
    return {
      onResult: this.handleResult,
      onError: (error: string) => {
        this.onError?.(error)
        // Auto-restart on error with exponential backoff (unless permission issue or max retries)
        if (!error.includes('permission') && this.retryCount < this.maxRetries) {
          this.retryCount++
          const backoffDelay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 8000)
          
          this.clearRestartTimeout()
          this.restartTimeout = setTimeout(() => {
            if (this.isActive) {
              this.restart()
            }
          }, backoffDelay)
        } else {
          this.isActive = false
          this.retryCount = 0
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
      if (this.isActive) {
        this.start()
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
