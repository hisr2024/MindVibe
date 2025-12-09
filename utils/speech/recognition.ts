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
  private silenceTimer: ReturnType<typeof setTimeout> | null = null
  private callbacks: RecognitionCallbacks = {}

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
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'audio-capture':
          errorMessage = 'Microphone not found or accessible.'
          break
        case 'not-allowed':
          errorMessage = 'Microphone permission denied.'
          break
        case 'network':
          errorMessage = 'Network error occurred.'
          break
        default:
          errorMessage = `Error: ${event.error}`
      }

      this.callbacks.onError?.(errorMessage)
      this.isListening = false
    }

    this.recognition.onend = () => {
      this.isListening = false
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
   */
  start(callbacks: RecognitionCallbacks = {}): void {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition not supported')
      return
    }

    if (this.isListening) {
      console.warn('Already listening')
      return
    }

    this.callbacks = callbacks

    try {
      this.recognition.start()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start recognition'
      this.callbacks.onError?.(errorMsg)
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (!this.recognition || !this.isListening) return

    this.resetSilenceTimer()
    
    try {
      this.recognition.stop()
    } catch (error) {
      console.error('Error stopping recognition:', error)
    }
  }

  /**
   * Abort listening immediately
   */
  abort(): void {
    if (!this.recognition) return

    this.resetSilenceTimer()
    
    try {
      this.recognition.abort()
    } catch (error) {
      console.error('Error aborting recognition:', error)
    }
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
