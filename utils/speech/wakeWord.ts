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
        // Auto-restart on error (unless it's a permission issue)
        if (!error.includes('permission')) {
          setTimeout(() => {
            if (this.isActive) {
              this.restart()
            }
          }, 2000)
        } else {
          this.isActive = false
        }
      },
      onEnd: () => {
        // Auto-restart if still active (continuous listening)
        if (this.isActive) {
          setTimeout(() => {
            if (this.isActive && this.recognition) {
              this.recognition.start(this.getCallbacks())
            }
          }, 100)
        }
      },
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
    this.recognition.start(this.getCallbacks())
  }

  /**
   * Stop listening for wake word
   */
  stop(): void {
    if (!this.recognition) return

    this.isActive = false
    this.recognition.stop()
  }

  /**
   * Restart the wake word detector
   */
  private restart(): void {
    if (!this.recognition) return

    this.recognition.stop()
    setTimeout(() => {
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
    if (this.recognition) {
      this.recognition.destroy()
      this.recognition = null
    }
  }
}
