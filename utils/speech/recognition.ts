/**
 * Speech Recognition wrapper for voice input (Speech-to-Text)
 * Provides a clean interface around browser's SpeechRecognition API
 */

import { getSpeechRecognition, getSpeechLanguage } from './languageMapping'

export interface RecognitionConfig {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

export interface RecognitionCallbacks {
  onStart?: () => void
  onResult?: (transcript: string, isFinal: boolean) => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private isStopping = false // Track if we're in the process of stopping
  private silenceTimer: ReturnType<typeof setTimeout> | null = null
  private callbacks: RecognitionCallbacks = {}
  private startAttempts = 0
  private readonly maxStartAttempts = 3

  constructor(config: RecognitionConfig = {}) {
    const SpeechRecognitionConstructor = getSpeechRecognition()

    if (!SpeechRecognitionConstructor) {
      console.warn('SpeechRecognition not supported in this browser')
      return
    }

    this.recognition = new SpeechRecognitionConstructor()
    this.recognition.lang = getSpeechLanguage(config.language || 'en')
    this.recognition.continuous = config.continuous ?? false
    this.recognition.interimResults = config.interimResults ?? true
    this.recognition.maxAlternatives = config.maxAlternatives ?? 1

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      this.callbacks.onStart?.()
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      const isFinal = result.isFinal

      this.callbacks.onResult?.(transcript, isFinal)

      // Auto-stop after 1.5s of silence on final result
      if (isFinal && !this.recognition?.continuous) {
        this.resetSilenceTimer()
        this.silenceTimer = setTimeout(() => {
          this.stop()
        }, 1500)
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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

      console.log('[SpeechRecognition] Error:', event.error, errorMessage)
      this.callbacks.onError?.(errorMessage)
      this.isListening = false
      this.isStopping = false
    }

    this.recognition.onend = () => {
      console.log('[SpeechRecognition] Recognition ended')
      this.isListening = false
      this.isStopping = false
      this.resetSilenceTimer()
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
   * Start listening for voice input
   * Handles edge cases like starting while stopping, or rapid start/stop
   */
  start(callbacks: RecognitionCallbacks = {}): void {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition not supported')
      return
    }

    // If currently stopping, wait and retry
    if (this.isStopping) {
      console.log('[SpeechRecognition] Currently stopping, will retry in 200ms')
      setTimeout(() => {
        if (this.startAttempts < this.maxStartAttempts) {
          this.startAttempts++
          this.start(callbacks)
        } else {
          this.startAttempts = 0
          callbacks.onError?.('Failed to start recognition - microphone may be in use')
        }
      }, 200)
      return
    }

    if (this.isListening) {
      console.warn('[SpeechRecognition] Already listening, ignoring start request')
      // Still set callbacks so the existing session uses new callbacks
      this.callbacks = callbacks
      return
    }

    this.callbacks = callbacks
    this.startAttempts = 0

    try {
      this.recognition.start()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start recognition'

      // Handle "already started" error by stopping and retrying
      if (errorMsg.includes('already started') && this.startAttempts < this.maxStartAttempts) {
        console.log('[SpeechRecognition] Recognition already started, stopping and retrying...')
        this.startAttempts++
        this.abort()
        setTimeout(() => this.start(callbacks), 200)
        return
      }

      this.callbacks.onError?.(errorMsg)
    }
  }

  /**
   * Stop listening gracefully (waits for final result)
   */
  stop(): void {
    if (!this.recognition) return

    // Don't stop if already stopping or not listening
    if (this.isStopping || !this.isListening) {
      console.log('[SpeechRecognition] Stop called but not listening or already stopping')
      return
    }

    this.isStopping = true
    this.resetSilenceTimer()

    try {
      this.recognition.stop()
    } catch (error) {
      console.error('[SpeechRecognition] Error stopping recognition:', error)
      // Reset state if stop fails
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
    this.resetSilenceTimer()

    try {
      this.recognition.abort()
    } catch (error) {
      console.error('[SpeechRecognition] Error aborting recognition:', error)
    }

    // Force reset state after abort
    this.isListening = false
    // isStopping will be reset by onend handler, but set a timeout as fallback
    setTimeout(() => {
      this.isStopping = false
    }, 500)
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
    this.recognition = null
  }
}
