/**
 * Enhanced Speech Recognition Service (Speech-to-Text)
 *
 * Provides a robust, noise-resilient interface around the browser's SpeechRecognition API:
 * - Multi-alternative processing for higher accuracy
 * - Confidence-based transcript selection
 * - Automatic gain normalization awareness
 * - Graceful handling of edge cases (rapid start/stop, already-started, permission)
 * - Configurable silence timeout and continuous mode
 * - Enhanced error recovery with exponential backoff
 */

import { getSpeechRecognition, getSpeechLanguage } from './languageMapping'

export interface RecognitionConfig {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  // Enhanced options
  confidenceThreshold?: number
  silenceTimeoutMs?: number
  /** Auto-restart on no-speech error instead of stopping (default: true) */
  autoRestartOnNoSpeech?: boolean
  /** Max consecutive auto-restarts before giving up (default: 3) */
  maxAutoRestarts?: number
}

export interface RecognitionCallbacks {
  onStart?: () => void
  onResult?: (transcript: string, isFinal: boolean, confidence?: number) => void
  onEnd?: () => void
  onError?: (error: string) => void
  onSoundStart?: () => void
  onSoundEnd?: () => void
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private isStopping = false
  private silenceTimer: ReturnType<typeof setTimeout> | null = null
  private callbacks: RecognitionCallbacks = {}
  private startAttempts = 0
  private readonly maxStartAttempts = 5
  private confidenceThreshold: number = 0
  private silenceTimeoutMs: number = 1500
  private autoRestartOnNoSpeech: boolean = true
  private maxAutoRestarts: number = 3
  private autoRestartCount: number = 0
  private micPermissionGranted: boolean = false

  constructor(config: RecognitionConfig = {}) {
    const SpeechRecognitionConstructor = getSpeechRecognition()

    if (!SpeechRecognitionConstructor) {
      // SpeechRecognition not supported
      return
    }

    this.confidenceThreshold = config.confidenceThreshold ?? 0.0 // Accept all results by default
    this.silenceTimeoutMs = config.silenceTimeoutMs ?? 1500
    this.autoRestartOnNoSpeech = config.autoRestartOnNoSpeech ?? true
    this.maxAutoRestarts = config.maxAutoRestarts ?? 3

    this.recognition = new SpeechRecognitionConstructor()
    this.recognition.lang = getSpeechLanguage(config.language || 'en')
    this.recognition.continuous = config.continuous ?? true  // Default to continuous for better UX
    this.recognition.interimResults = config.interimResults ?? true
    // Request multiple alternatives for better accuracy
    this.recognition.maxAlternatives = config.maxAlternatives ?? 3

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      this.callbacks.onStart?.()
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!event.results || event.results.length === 0) return
      const result = event.results[event.results.length - 1]
      const isFinal = result.isFinal

      // Multi-alternative processing: select the best transcript
      let bestTranscript = ''
      let bestConfidence = 0

      for (let i = 0; i < result.length; i++) {
        const alternative = result[i]
        const confidence = alternative.confidence || 0

        // For interim results, use the first alternative (highest confidence)
        // For final results, select the one with highest confidence above threshold
        if (confidence > bestConfidence || i === 0) {
          bestTranscript = alternative.transcript
          bestConfidence = confidence
        }
      }

      // Skip low-confidence results if threshold is set
      if (isFinal && this.confidenceThreshold > 0 && bestConfidence < this.confidenceThreshold) {
        return
      }

      // Reset auto-restart counter on successful result — mic is working
      this.autoRestartCount = 0

      this.callbacks.onResult?.(bestTranscript, isFinal, bestConfidence)

      // Auto-stop after silence on final result (non-continuous mode)
      if (isFinal && !this.recognition?.continuous) {
        this.resetSilenceTimer()
        this.silenceTimer = setTimeout(() => {
          this.stop()
        }, this.silenceTimeoutMs)
      }
    }

    // Sound detection events for UI feedback
    this.recognition.onsoundstart = () => {
      this.callbacks.onSoundStart?.()
    }

    this.recognition.onsoundend = () => {
      this.callbacks.onSoundEnd?.()
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Auto-restart on no-speech instead of killing the session.
      // This is the most common "false failure" — the user simply hasn't
      // spoken yet or the mic needs a moment to warm up.
      if (event.error === 'no-speech' && this.autoRestartOnNoSpeech) {
        if (this.autoRestartCount < this.maxAutoRestarts) {
          this.autoRestartCount++
          // Recognition will fire onend after this error — we restart there
          return
        }
        // Exhausted auto-restarts, fall through to report error
      }

      let errorMessage = 'Speech recognition error'

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'no-speech: No speech detected. Please try again.'
          break
        case 'audio-capture':
          errorMessage = 'audio-capture: Microphone not found or accessible.'
          break
        case 'not-allowed':
          errorMessage = 'not-allowed: Microphone permission denied.'
          break
        case 'network':
          errorMessage = 'network: Network error occurred.'
          break
        case 'aborted':
          errorMessage = 'aborted: Recognition was aborted.'
          break
        case 'service-not-allowed':
          errorMessage = 'service-not-allowed: Speech recognition service not available.'
          break
        default:
          errorMessage = `Error: ${event.error}`
      }

      this.callbacks.onError?.(errorMessage)
      this.isListening = false
      this.isStopping = false
    }

    this.recognition.onend = () => {
      this.resetSilenceTimer()

      // Auto-restart if we still have restarts remaining (no-speech recovery).
      // The browser fires onend after a no-speech error even in continuous mode,
      // so we need to explicitly restart to keep listening.
      if (
        this.autoRestartOnNoSpeech &&
        this.autoRestartCount > 0 &&
        this.autoRestartCount <= this.maxAutoRestarts &&
        !this.isStopping &&
        this.recognition
      ) {
        // Small delay to avoid rapid restart loops
        setTimeout(() => {
          if (this.recognition && !this.isStopping) {
            try {
              this.recognition.start()
              // Keep isListening true — the session never visually ended
            } catch {
              // If restart fails, end normally
              this.isListening = false
              this.isStopping = false
              this.autoRestartCount = 0
              this.callbacks.onEnd?.()
            }
          }
        }, 300)
        return
      }

      this.isListening = false
      this.isStopping = false
      this.autoRestartCount = 0
      this.callbacks.onEnd?.()
    }
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  /**
   * Ensure microphone permission is granted before starting recognition.
   * Many browsers (especially mobile) require an explicit getUserMedia call
   * to trigger the permission dialog. The Web Speech API alone may not prompt.
   */
  private async ensureMicrophonePermission(): Promise<boolean> {
    if (this.micPermissionGranted) return true

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      // Can't check — assume permission will be handled by recognition.start()
      return true
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Release the stream immediately — we only needed the permission grant
      stream.getTracks().forEach(track => track.stop())
      this.micPermissionGranted = true
      return true
    } catch {
      return false
    }
  }

  /**
   * Start listening for voice input
   * Handles edge cases like starting while stopping, or rapid start/stop.
   * Robust against "already started" errors for always-on wake word listening.
   */
  start(callbacks: RecognitionCallbacks = {}): void {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition not supported')
      return
    }

    // If currently stopping, wait and retry
    if (this.isStopping) {
      setTimeout(() => {
        if (this.startAttempts < this.maxStartAttempts) {
          this.startAttempts++
          this.start(callbacks)
        } else {
          this.startAttempts = 0
          // Force-reset state and try one more time
          this.isListening = false
          this.isStopping = false
          this.start(callbacks)
        }
      }, 150)
      return
    }

    if (this.isListening) {
      // Still set callbacks so the existing session uses new callbacks
      this.callbacks = callbacks
      return
    }

    this.callbacks = callbacks
    this.startAttempts = 0
    this.autoRestartCount = 0

    // Request microphone permission first, then start recognition.
    // This is critical: on many browsers the Web Speech API does NOT trigger
    // the mic permission dialog on its own, causing silent failure.
    this.ensureMicrophonePermission().then((granted) => {
      if (!granted) {
        this.callbacks.onError?.('not-allowed: Microphone permission denied.')
        return
      }

      try {
        this.recognition?.start()
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to start recognition'

        // Handle "already started" error by aborting and retrying
        if (errorMsg.includes('already started')) {
          if (this.startAttempts < this.maxStartAttempts) {
            this.startAttempts++
            this.abort()
            setTimeout(() => this.start(callbacks), 200 + this.startAttempts * 50)
            return
          }
          // Last resort: force state reset
          this.isListening = false
          this.isStopping = false
          this.startAttempts = 0
        }

        this.callbacks.onError?.(errorMsg)
      }
    })
  }

  /**
   * Stop listening gracefully (waits for final result)
   */
  stop(): void {
    if (!this.recognition) return

    if (this.isStopping || !this.isListening) {
      return
    }

    this.isStopping = true
    this.autoRestartCount = 0
    this.resetSilenceTimer()

    try {
      this.recognition.stop()
    } catch {
      this.isListening = false
      this.isStopping = false
    }
  }

  /**
   * Abort listening immediately (no final result)
   */
  abort(): void {
    if (!this.recognition) return

    this.isStopping = true
    this.autoRestartCount = 0
    this.resetSilenceTimer()

    try {
      this.recognition.abort()
    } catch {
      // Abort may fail if already stopped
    }

    this.isListening = false
    // Clear stopping flag quickly to allow rapid restart for wake word
    setTimeout(() => {
      this.isStopping = false
    }, 150)
  }

  /**
   * Update the language
   */
  setLanguage(language: string): void {
    if (!this.recognition) return
    this.recognition.lang = getSpeechLanguage(language)
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.abort()
    this.callbacks = {}

    // Clear event handlers to prevent post-destroy callbacks and memory leaks
    if (this.recognition) {
      this.recognition.onstart = null
      this.recognition.onresult = null
      this.recognition.onerror = null
      this.recognition.onend = null
      this.recognition.onsoundstart = null
      this.recognition.onsoundend = null
      this.recognition = null
    }
  }
}
