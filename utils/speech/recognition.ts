/**
 * Speech Recognition Service (Speech-to-Text)
 *
 * Clean, minimal wrapper around the browser Web Speech API.
 * Built from scratch for reliability over complexity.
 *
 * Supports:
 * - Chrome, Edge, Safari (via webkitSpeechRecognition)
 * - Multi-language recognition (29 languages)
 * - Interim + final transcript callbacks
 * - Graceful start/stop with edge-case handling
 * - Mobile Safari compatibility (non-continuous mode with manual restart)
 */

import { getSpeechRecognition, getSpeechLanguage } from './languageMapping'

export interface RecognitionConfig {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  /** Auto-stop recognition after silence following speech. Fallback for browsers without VAD. */
  autoStopOnSilence?: boolean
  /** Silence duration in ms before auto-stopping (default: 1500). Only used when autoStopOnSilence is true. */
  silenceTimeoutMs?: number
}

export interface RecognitionCallbacks {
  onStart?: () => void
  onResult?: (transcript: string, isFinal: boolean, confidence?: number) => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null
  private isActive = false
  private isStopping = false
  private callbacks: RecognitionCallbacks = {}
  private isMobile = false
  private shouldKeepListening = false
  private noSpeechRestarts = 0
  private readonly maxNoSpeechRestarts = 8
  private micPermissionGranted = false
  private autoStopOnSilence = false
  private silenceTimeoutMs = 1500
  private silenceTimer: ReturnType<typeof setTimeout> | null = null
  private hasReceivedSpeech = false

  constructor(config: RecognitionConfig = {}) {
    const SpeechRecognitionCtor = getSpeechRecognition()
    if (!SpeechRecognitionCtor) return

    this.isMobile = typeof navigator !== 'undefined'
      && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    this.recognition = new SpeechRecognitionCtor()
    this.recognition.lang = getSpeechLanguage(config.language || 'en')
    // Mobile Safari cannot do continuous mode — use single-shot + manual restart
    this.recognition.continuous = this.isMobile ? false : (config.continuous ?? true)
    this.recognition.interimResults = config.interimResults ?? true
    this.recognition.maxAlternatives = 3
    this.autoStopOnSilence = config.autoStopOnSilence ?? false
    this.silenceTimeoutMs = config.silenceTimeoutMs ?? 1500

    this.bindEvents()
  }

  private bindEvents(): void {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isActive = true
      this.callbacks.onStart?.()
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!event.results?.length) return
      const result = event.results[event.results.length - 1]
      if (!result?.length) return

      // Pick best alternative by confidence
      let bestText = ''
      let bestConf = 0
      for (let i = 0; i < result.length; i++) {
        const alt = result[i]
        if (alt.confidence > bestConf || i === 0) {
          bestText = alt.transcript
          bestConf = alt.confidence
        }
      }

      // Reset no-speech counter on real speech
      this.noSpeechRestarts = 0
      this.hasReceivedSpeech = true
      this.callbacks.onResult?.(bestText, result.isFinal, bestConf)

      // Auto-stop on silence: restart timer after each result
      if (this.autoStopOnSilence && result.isFinal) {
        this.resetSilenceTimer()
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // no-speech: user hasn't spoken yet — silently restart if under limit
      if (event.error === 'no-speech') {
        if (this.noSpeechRestarts < this.maxNoSpeechRestarts && !this.isStopping) {
          this.noSpeechRestarts++
          // onend will fire after this, restart happens there
          return
        }
        // Exhausted restarts — MUST reset counter to 0 so onend handler
        // does NOT restart recognition (it checks noSpeechRestarts > 0).
        // Without this reset → infinite restart loop → mic never captures audio.
        this.noSpeechRestarts = 0
        this.shouldKeepListening = false
      }

      // Aborted during intentional stop — not a real error
      if (event.error === 'aborted' && this.isStopping) {
        this.isActive = false
        this.isStopping = false
        return
      }

      const errorMessage = this.mapError(event.error)
      this.callbacks.onError?.(errorMessage)
      this.isActive = false
      this.isStopping = false
    }

    this.recognition.onend = () => {
      // Should we restart? (mobile single-shot mode or no-speech recovery)
      const shouldRestart = !this.isStopping
        && this.recognition
        && (this.shouldKeepListening || this.noSpeechRestarts > 0)

      if (shouldRestart) {
        const delay = this.isMobile ? 600 : 300
        setTimeout(() => {
          if (!this.recognition || this.isStopping) {
            this.finalize()
            return
          }
          try {
            this.recognition.start()
          } catch {
            this.finalize()
          }
        }, delay)
        return
      }

      this.finalize()
    }
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer()
    if (!this.autoStopOnSilence || !this.hasReceivedSpeech) return
    this.silenceTimer = setTimeout(() => {
      if (this.isActive && !this.isStopping && this.hasReceivedSpeech) {
        this.stop()
      }
    }, this.silenceTimeoutMs)
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  private finalize(): void {
    this.isActive = false
    this.isStopping = false
    this.noSpeechRestarts = 0
    this.shouldKeepListening = false
    this.hasReceivedSpeech = false
    this.clearSilenceTimer()
    this.callbacks.onEnd?.()
  }

  private mapError(error: string): string {
    switch (error) {
      case 'not-allowed':
        return 'not-allowed: Microphone permission denied.'
      case 'audio-capture':
        return 'audio-capture: Microphone not found or accessible.'
      case 'network':
        return 'network: Network error occurred.'
      case 'no-speech':
        return 'no-speech: No speech detected. Please try again.'
      case 'service-not-allowed':
        return 'service-not-allowed: Speech recognition service not available.'
      case 'aborted':
        return 'aborted: Recognition was aborted.'
      default:
        return `Error: ${error}`
    }
  }

  /**
   * Ensure microphone permission on desktop (mobile handles via recognition.start).
   *
   * On DESKTOP: first check via Permissions API (no mic acquisition).
   * If permission is 'prompt', use getUserMedia ONCE to trigger the dialog,
   * then cache the result so subsequent calls skip mic acquisition entirely.
   * This avoids the race condition where releasing a getUserMedia stream
   * starves the SpeechRecognition engine of audio data.
   *
   * On MOBILE: skip entirely — SpeechRecognition handles its own dialog,
   * and calling getUserMedia then stop() can lock the mic on iOS Safari.
   */
  private async ensureMicPermission(): Promise<boolean> {
    if (this.micPermissionGranted) return true
    if (this.isMobile) {
      this.micPermissionGranted = true
      return true
    }
    if (typeof navigator === 'undefined') return true

    // Try Permissions API first (no mic acquisition needed)
    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        if (status.state === 'granted') {
          this.micPermissionGranted = true
          return true
        }
        if (status.state === 'denied') return false
        // state === 'prompt': fall through to getUserMedia to trigger dialog
      } catch {
        // Permissions API not supported — fall through
      }
    }

    // Trigger permission dialog via getUserMedia (only once)
    if (!navigator.mediaDevices?.getUserMedia) return true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      this.micPermissionGranted = true
      return true
    } catch {
      return false
    }
  }

  /**
   * Start listening for voice input.
   */
  async start(callbacks: RecognitionCallbacks = {}): Promise<void> {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition not supported in this browser.')
      return
    }

    // If already stopping, wait for it to complete
    if (this.isStopping) {
      for (let i = 0; i < 5 && this.isStopping; i++) {
        await new Promise(r => setTimeout(r, 150))
      }
      this.isStopping = false
      this.isActive = false
    }

    if (this.isActive) {
      this.callbacks = callbacks
      return
    }

    this.callbacks = callbacks
    this.noSpeechRestarts = 0
    this.shouldKeepListening = this.isMobile && !this.recognition.continuous

    const granted = await this.ensureMicPermission()
    if (!granted) {
      callbacks.onError?.('not-allowed: Microphone permission denied.')
      return
    }

    try {
      this.recognition.start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start recognition'
      // Handle "already started" — abort then retry once
      if (msg.includes('already started')) {
        try {
          this.recognition.abort()
          await new Promise(r => setTimeout(r, 300))
          this.recognition.start()
        } catch {
          this.callbacks.onError?.(msg)
        }
        return
      }
      this.callbacks.onError?.(msg)
    }
  }

  /**
   * Stop listening gracefully (waits for final result)
   */
  stop(): void {
    if (!this.recognition || this.isStopping || !this.isActive) return
    this.isStopping = true
    this.noSpeechRestarts = 0
    this.shouldKeepListening = false
    try {
      this.recognition.stop()
    } catch {
      this.isActive = false
      this.isStopping = false
    }
  }

  /**
   * Abort listening immediately
   */
  abort(): void {
    if (!this.recognition) return
    this.isStopping = true
    this.noSpeechRestarts = 0
    this.shouldKeepListening = false
    try {
      this.recognition.abort()
    } catch {
      // Already stopped
    }
    this.isActive = false
    queueMicrotask(() => { this.isStopping = false })
  }

  /**
   * Update the recognition language
   */
  setLanguage(language: string): void {
    if (!this.recognition) return
    this.recognition.lang = getSpeechLanguage(language)
  }

  getIsListening(): boolean {
    return this.isActive
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    this.abort()
    this.clearSilenceTimer()
    this.callbacks = {}
    if (this.recognition) {
      this.recognition.onstart = null
      this.recognition.onresult = null
      this.recognition.onerror = null
      this.recognition.onend = null
      this.recognition = null
    }
  }
}
