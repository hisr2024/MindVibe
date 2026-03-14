/**
 * On-Device STT Controller — Tiered Speech Recognition
 *
 * Manages on-device speech recognition using Moonshine (English) or
 * Whisper (Indian languages) via Web Workers + AudioWorklet.
 *
 * Device Tier Logic:
 * TIER 1 (8GB+, WebGPU):  English → Moonshine Tiny; Indian → Whisper Tiny
 * TIER 2 (4-7GB):         English → Moonshine Tiny; Indian → Web Speech API
 * TIER 3 (<4GB / no WebGPU): All → Web Speech API (0 extra RAM)
 *
 * Features:
 * - Lazy model loading (loads only when first voice interaction)
 * - 60s idle auto-unload (frees RAM)
 * - Cache API for model persistence (no re-download)
 * - Automatic fallback to Web Speech API on any failure
 * - Main thread stays completely unblocked (all ML on Web Worker)
 */

import { getDeviceTier, type DeviceTier } from '@/utils/browserSupport'

export type STTProvider = 'moonshine' | 'whisper' | 'web-speech-api' | 'none'
export type STTState = 'idle' | 'loading' | 'ready' | 'listening' | 'error'

export interface OnDeviceSTTCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void
  onStateChange?: (state: STTState) => void
  onProviderChange?: (provider: STTProvider) => void
  onLoadProgress?: (progress: number) => void
  onError?: (error: string) => void
}

/** Languages that can use Moonshine (English only) */
const MOONSHINE_LANGUAGES = new Set(['en'])

/** Languages Whisper Tiny supports well */
const WHISPER_LANGUAGES = new Set([
  'hi', 'sa', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa',
  'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko', 'ar', 'ru', 'it',
])

export class OnDeviceSTT {
  private worker: Worker | null = null
  private audioContext: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private mediaStream: MediaStream | null = null
  private state: STTState = 'idle'
  private provider: STTProvider = 'none'
  private deviceTier: DeviceTier = 'low'
  private language = 'en'
  private callbacks: OnDeviceSTTCallbacks | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private isWorkletRegistered = false

  /**
   * Detect device capabilities and determine optimal STT strategy
   */
  async detectCapabilities(): Promise<{
    tier: DeviceTier
    recommendedProvider: STTProvider
    canRunOnDevice: boolean
  }> {
    this.deviceTier = await getDeviceTier()

    const provider = this.selectProvider(this.language)
    return {
      tier: this.deviceTier,
      recommendedProvider: provider,
      canRunOnDevice: provider !== 'web-speech-api' && provider !== 'none',
    }
  }

  /**
   * Select the best STT provider based on tier + language
   */
  private selectProvider(language: string): STTProvider {
    if (this.deviceTier === 'low') return 'web-speech-api'

    if (MOONSHINE_LANGUAGES.has(language)) return 'moonshine'

    if (this.deviceTier === 'high' && WHISPER_LANGUAGES.has(language)) return 'whisper'

    // Tier 2 with non-English: Web Speech API (not enough RAM for Whisper + Moonshine)
    return 'web-speech-api'
  }

  /**
   * Initialize the STT system for a given language
   */
  async initialize(language: string, callbacks: OnDeviceSTTCallbacks): Promise<STTProvider> {
    this.language = language
    this.callbacks = callbacks

    // Detect tier if not already done
    if (this.deviceTier === 'low' && !this.provider) {
      await this.detectCapabilities()
    }

    this.provider = this.selectProvider(language)
    callbacks.onProviderChange?.(this.provider)

    // Tier 3 or Web Speech API: nothing to initialize
    if (this.provider === 'web-speech-api' || this.provider === 'none') {
      return this.provider
    }

    // Load ML model in background
    await this.loadModel()
    return this.provider
  }

  /**
   * Load the appropriate ML model via Web Worker
   */
  private async loadModel(): Promise<void> {
    this.setState('loading')
    this.clearIdleTimer()

    try {
      // Create the appropriate worker
      if (this.provider === 'moonshine') {
        this.worker = new Worker(
          new URL('./moonshine-worker.ts', import.meta.url),
          { type: 'module' }
        )
      } else if (this.provider === 'whisper') {
        this.worker = new Worker(
          new URL('./whisper-worker.ts', import.meta.url),
          { type: 'module' }
        )
      }

      if (!this.worker) {
        throw new Error('Failed to create worker')
      }

      // Set up worker message handling
      this.worker.onmessage = (event: MessageEvent) => {
        this.handleWorkerMessage(event.data)
      }

      this.worker.onerror = (err) => {
        this.handleError(`Worker error: ${err.message}`)
      }

      // Load model with device preference
      const device = this.deviceTier === 'high' ? 'webgpu' : 'wasm'

      if (this.provider === 'whisper') {
        this.worker.postMessage({ type: 'load', device, language: this.language })
      } else {
        this.worker.postMessage({ type: 'load', device })
      }
    } catch (err) {
      this.handleError(`Model load failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /**
   * Handle messages from the ML worker
   */
  private handleWorkerMessage(data: Record<string, unknown>) {
    switch (data.type) {
      case 'loading':
        this.callbacks?.onLoadProgress?.(data.progress as number)
        break

      case 'ready':
        this.setState('ready')
        break

      case 'transcript':
        this.callbacks?.onTranscript(
          data.text as string,
          (data.isFinal as boolean) ?? true
        )
        break

      case 'error':
        this.handleError(data.message as string)
        break

      case 'unloaded':
        this.setState('idle')
        break
    }
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    if (this.provider === 'web-speech-api' || this.provider === 'none') {
      // Caller should use Web Speech API directly
      return
    }

    if (this.state !== 'ready' && this.state !== 'idle') {
      // Model not loaded yet — load first
      if (!this.worker) {
        await this.loadModel()
        // Wait for ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Model load timeout')), 30000)
          const originalHandler = this.worker?.onmessage
          if (this.worker) {
            this.worker.onmessage = (event: MessageEvent) => {
              if (this.worker) originalHandler?.call(this.worker, event)
              if (event.data.type === 'ready') {
                clearTimeout(timeout)
                resolve()
              } else if (event.data.type === 'error') {
                clearTimeout(timeout)
                reject(new Error(event.data.message))
              }
            }
          }
        })
      }
    }

    this.clearIdleTimer()
    this.setState('listening')

    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      })

      // Create AudioContext
      this.audioContext = new AudioContext({ sampleRate: 16000 })

      // Register AudioWorklet processor
      if (!this.isWorkletRegistered) {
        await this.audioContext.audioWorklet.addModule('/workers/audio-capture-processor.js')
        this.isWorkletRegistered = true
      }

      // Create worklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-capture-processor')

      // Configure for moonshine or whisper mode
      this.workletNode.port.postMessage({
        type: 'configure',
        mode: this.provider === 'whisper' ? 'whisper' : 'moonshine',
      })

      // Route audio chunks from worklet to ML worker
      this.workletNode.port.onmessage = (event: MessageEvent) => {
        if (event.data.type === 'audio-chunk' && this.worker) {
          this.worker.postMessage(
            { type: 'transcribe', samples: event.data.samples },
            [event.data.samples.buffer]
          )
        }
      }

      // Connect microphone → worklet
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      source.connect(this.workletNode)

    } catch (err) {
      this.handleError(`Mic access failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    // Tell worklet to flush remaining audio
    this.workletNode?.port.postMessage({ type: 'stop' })

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop())
      this.mediaStream = null
    }

    // Disconnect worklet
    if (this.workletNode) {
      this.workletNode.disconnect()
      this.workletNode = null
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
      this.isWorkletRegistered = false
    }

    this.setState('ready')

    // Start idle timer — unload model after 60s of inactivity
    this.startIdleTimer()
  }

  /**
   * Change language (may require switching model)
   */
  async setLanguage(language: string): Promise<STTProvider> {
    const newProvider = this.selectProvider(language)
    this.language = language

    if (newProvider !== this.provider) {
      // Need to switch models
      this.unloadModel()
      this.provider = newProvider
      this.callbacks?.onProviderChange?.(this.provider)

      if (this.provider !== 'web-speech-api' && this.provider !== 'none') {
        await this.loadModel()
      }
    } else if (this.provider === 'whisper' && this.worker) {
      // Same model, just change language
      this.worker.postMessage({ type: 'set-language', language })
    }

    return this.provider
  }

  /**
   * Fully clean up all resources
   */
  destroy(): void {
    this.stopListening()
    this.unloadModel()
    this.callbacks = null
  }

  /**
   * Get current state
   */
  getState(): { state: STTState; provider: STTProvider; tier: DeviceTier } {
    return { state: this.state, provider: this.provider, tier: this.deviceTier }
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  private setState(state: STTState) {
    this.state = state
    this.callbacks?.onStateChange?.(state)
  }

  private handleError(message: string) {
    this.setState('error')
    this.callbacks?.onError?.(message)
    // Fallback: signal caller to use Web Speech API
    this.provider = 'web-speech-api'
    this.callbacks?.onProviderChange?.('web-speech-api')
  }

  private unloadModel() {
    this.clearIdleTimer()
    if (this.worker) {
      this.worker.postMessage({ type: 'unload' })
      this.worker.terminate()
      this.worker = null
    }
  }

  private startIdleTimer() {
    this.clearIdleTimer()
    this.idleTimer = setTimeout(() => {
      this.unloadModel()
    }, 60_000) // 60 seconds
  }

  private clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
  }
}
