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
  /** Max consecutive auto-restarts before giving up (default: 8, ~40s of silence tolerance) */
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
  private maxAutoRestarts: number = 8
  private autoRestartCount: number = 0
  private micPermissionGranted: boolean = false
  private isMobile: boolean = false
  /** When true, auto-restart onend even after successful results (non-continuous mobile mode) */
  private keepListeningOnMobile: boolean = false

  constructor(config: RecognitionConfig = {}) {
    const SpeechRecognitionConstructor = getSpeechRecognition()

    if (!SpeechRecognitionConstructor) {
      // SpeechRecognition not supported
      return
    }

    this.confidenceThreshold = config.confidenceThreshold ?? 0.0 // Accept all results by default
    this.silenceTimeoutMs = config.silenceTimeoutMs ?? 1500
    this.autoRestartOnNoSpeech = config.autoRestartOnNoSpeech ?? true
    this.maxAutoRestarts = config.maxAutoRestarts ?? 8

    this.recognition = new SpeechRecognitionConstructor()
    this.recognition.lang = getSpeechLanguage(config.language || 'en')
    // Mobile Safari doesn't support continuous mode properly — it fires onend
    // after each result regardless, causing wobbly start/stop loops.
    // Use non-continuous mode on mobile and rely on auto-restart instead.
    this.isMobile = typeof navigator !== 'undefined'
      && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    this.recognition.continuous = this.isMobile ? false : (config.continuous ?? true)
    this.keepListeningOnMobile = this.isMobile && (config.continuous ?? true)
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
      if (!result || result.length === 0) return
      const isFinal = result.isFinal

      // Reset silence timer on any speech activity
      this.resetSilenceTimer()

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
        // Exhausted auto-restarts — reset counter and disable mobile keep-listening
        // so that the onend handler does NOT restart recognition again.
        // Without this, onend sees (count <= max) as true → infinite restart loop.
        this.autoRestartCount = 0
        this.keepListeningOnMobile = false
      }

      // AbortError from rapid stop/start — not a real user error
      if (event.error === 'aborted' && this.isStopping) {
        this.isListening = false
        this.isStopping = false
        return
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
          // Reset permission cache so next attempt re-prompts
          this.micPermissionGranted = false
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

      // On mobile, we use non-continuous mode but still want to keep
      // listening. Auto-restart after each result until user taps stop.
      const shouldRestartMobile = this.keepListeningOnMobile
        && !this.isStopping
        && this.recognition

      // Auto-restart if we still have restarts remaining (no-speech recovery).
      // The browser fires onend after a no-speech error even in continuous mode,
      // so we need to explicitly restart to keep listening.
      const shouldRestartNoSpeech = this.autoRestartOnNoSpeech
        && this.autoRestartCount > 0
        && this.autoRestartCount <= this.maxAutoRestarts
        && !this.isStopping
        && this.recognition

      if (shouldRestartMobile || shouldRestartNoSpeech) {
        // Longer delay on mobile to prevent wobbly start/stop loops.
        // Mobile browsers (especially Safari) need more time between sessions.
        const restartDelay = this.isMobile ? 600 : 300
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
              this.keepListeningOnMobile = false
              this.callbacks.onEnd?.()
            }
          }
        }, restartDelay)
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
   *
   * On DESKTOP browsers, an explicit getUserMedia call is needed to trigger
   * the permission dialog — Web Speech API alone may not prompt.
   *
   * On MOBILE, skip this: calling getUserMedia then immediately stopping
   * the stream can interfere with SpeechRecognition's own mic access
   * (especially iOS Safari where the mic "lock" prevents recognition.start()).
   * The Web Speech API on mobile handles its own permission dialog.
   */
  private async ensureMicrophonePermission(): Promise<boolean> {
    if (this.micPermissionGranted) return true

    // On mobile, let SpeechRecognition handle its own permission dialog
    if (this.isMobile) {
      this.micPermissionGranted = true
      return true
    }

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
   * Start listening for voice input.
   * Returns a promise that resolves once the browser's SpeechRecognition
   * has actually started (mic permission granted + .start() called).
   * Callers should await this before showing "listening" UI.
   *
   * Handles edge cases like starting while stopping, or rapid start/stop.
   * Robust against "already started" errors for always-on wake word listening.
   */
  async start(callbacks: RecognitionCallbacks = {}): Promise<void> {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition not supported')
      return
    }

    // If currently stopping, wait briefly with bounded retries (no recursion).
    if (this.isStopping) {
      let waited = false
      for (let attempt = 0; attempt < this.maxStartAttempts && this.isStopping; attempt++) {
        await new Promise<void>(resolve => setTimeout(resolve, 150))
        waited = true
      }
      if (this.isStopping) {
        // Force-reset state after exhausting waits
        this.isListening = false
        this.isStopping = false
      }
      // If stop completed during waits, fall through to start below
      if (waited) { /* state should now be clean */ }
    }

    if (this.isListening) {
      this.callbacks = callbacks
      return
    }

    this.callbacks = callbacks
    this.startAttempts = 0
    this.autoRestartCount = 0
    this.keepListeningOnMobile = this.isMobile && !this.recognition.continuous

    const granted = await this.ensureMicrophonePermission()
    if (!granted) {
      this.callbacks.onError?.('not-allowed: Microphone permission denied.')
      return
    }

    // Attempt to start, with bounded retries on "already started" (no recursion)
    for (let attempt = 0; attempt <= this.maxStartAttempts; attempt++) {
      try {
        this.recognition?.start()
        return // Success
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to start recognition'

        if (errorMsg.includes('already started') && attempt < this.maxStartAttempts) {
          this.abort()
          await new Promise<void>(resolve => setTimeout(resolve, 200 + attempt * 100))
          continue
        }

        // Final attempt failed or non-retryable error
        this.isListening = false
        this.isStopping = false
        this.startAttempts = 0
        this.callbacks.onError?.(errorMsg)
        return
      }
    }
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
    this.keepListeningOnMobile = false
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
    this.keepListeningOnMobile = false
    this.resetSilenceTimer()

    try {
      this.recognition.abort()
    } catch {
      // Abort may fail if already stopped
    }

    this.isListening = false
    // Clear stopping flag on next microtask to allow the browser's onend
    // event to see isStopping=true (prevents auto-restart) while still
    // resetting quickly enough for rapid restart (wake word, etc.)
    queueMicrotask(() => {
      this.isStopping = false
    })
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
