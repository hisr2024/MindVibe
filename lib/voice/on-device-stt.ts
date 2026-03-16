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
  /** Guard against concurrent startListening calls */
  private isStartingListening = false
  /** Pending model-load timeout to clear on resolve/destroy */
  private modelLoadTimeout: ReturnType<typeof setTimeout> | null = null
  /** Guard against concurrent setLanguage calls racing with model loading */
  private isChangingLanguage = false
  /** Whether this instance has been destroyed */
  private destroyed = false
  /** Promise that resolves when model is fully loaded (for atomic loading) */
  private modelLoadPromise: Promise<void> | null = null

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
    if (this.deviceTier === 'low' && this.provider === 'none') {
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
   * Load the appropriate ML model via Web Worker.
   *
   * Returns a promise that resolves when the worker signals 'ready'.
   * Uses a shared modelLoadPromise so concurrent callers await the same load.
   */
  private async loadModel(): Promise<void> {
    // If already loading, return the existing promise (atomic load)
    if (this.modelLoadPromise) return this.modelLoadPromise

    this.setState('loading')
    this.clearIdleTimer()

    this.modelLoadPromise = (async () => {
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

        this.worker.onerror = (err: ErrorEvent) => {
          this.handleError(`Worker error: ${err?.message || 'Unknown worker error'}`)
        }

        // Wait for worker script to be ready before sending init message.
        // Post the load command and wait for 'ready' in startListening.
        const device = this.deviceTier === 'high' ? 'webgpu' : 'wasm'

        if (this.provider === 'whisper') {
          this.worker.postMessage({ type: 'load', device, language: this.language })
        } else {
          this.worker.postMessage({ type: 'load', device })
        }
      } catch (err) {
        this.modelLoadPromise = null
        this.handleError(`Model load failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    })()

    return this.modelLoadPromise
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
   * Start listening for voice input.
   * Throws if on-device STT is not available or model is not ready,
   * so the caller can fall back to Web Speech API.
   */
  async startListening(): Promise<void> {
    if (this.destroyed) {
      throw new Error('On-device STT instance has been destroyed')
    }

    if (this.provider === 'web-speech-api' || this.provider === 'none') {
      throw new Error('On-device STT not available — use Web Speech API')
    }

    if (this.state === 'error') {
      throw new Error('On-device STT model failed to load')
    }

    // Prevent concurrent startListening calls from opening multiple mic streams
    if (this.isStartingListening) {
      return
    }
    this.isStartingListening = true

    try {
      if (this.state === 'loading') {
        if (!this.worker) {
          throw new Error('On-device STT worker not initialized')
        }
        // Wait for model to finish loading. Use a single-shot listener pattern
        // to avoid replacing the worker's onmessage handler.
        await new Promise<void>((resolve, reject) => {
          let settled = false
          const timeout = setTimeout(() => {
            if (!settled) {
              settled = true
              reject(new Error('Model load timeout (30s)'))
            }
          }, 30000)
          this.modelLoadTimeout = timeout

          const originalHandler = this.worker?.onmessage
          if (this.worker) {
            this.worker.onmessage = (event: MessageEvent) => {
              // Always forward to the original handler first
              if (this.worker) originalHandler?.call(this.worker, event)
              if (settled) return
              if (event.data.type === 'ready') {
                settled = true
                clearTimeout(timeout)
                this.modelLoadTimeout = null
                resolve()
              } else if (event.data.type === 'error') {
                settled = true
                clearTimeout(timeout)
                this.modelLoadTimeout = null
                reject(new Error(event.data.message))
              }
            }
          }
        })
      }

      // Bail out if destroyed while waiting for model load
      if (this.destroyed) return

      if (this.state !== 'ready') {
        throw new Error(`On-device STT not ready (state: ${this.state})`)
      }

      this.clearIdleTimer()
      this.setState('listening')

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      })

      // Validate the stream actually has audio tracks
      if (!this.mediaStream.getAudioTracks().length) {
        throw new Error('No audio tracks in media stream')
      }

      // Create AudioContext and resume (browsers suspend by default)
      this.audioContext = new AudioContext({ sampleRate: 16000 })
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume()
        } catch {
          throw new Error('AudioContext could not be resumed — user gesture may be required')
        }
      }

      // Register AudioWorklet processor (with retry on 404)
      if (!this.isWorkletRegistered) {
        try {
          await this.audioContext.audioWorklet.addModule('/workers/audio-capture-processor.js')
          this.isWorkletRegistered = true
        } catch (workletErr) {
          throw new Error(`AudioWorklet registration failed: ${workletErr instanceof Error ? workletErr.message : String(workletErr)}`)
        }
      }

      // Create worklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-capture-processor')

      this.workletNode.port.postMessage({
        type: 'configure',
        mode: this.provider === 'whisper' ? 'whisper' : 'moonshine',
      })

      // Route audio chunks from worklet to ML worker
      this.workletNode.port.onmessage = (event: MessageEvent) => {
        if (event.data.type === 'audio-chunk' && this.worker && event.data.samples?.buffer) {
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
      // Clean up ALL resources on any failure during startup
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop())
        this.mediaStream = null
      }
      if (this.workletNode) {
        this.workletNode.disconnect()
        this.workletNode = null
      }
      if (this.audioContext) {
        this.audioContext.close().catch(() => {})
        this.audioContext = null
        this.isWorkletRegistered = false
      }
      // Reset state to ready (model is still loaded) rather than error
      // so the caller can retry or fall back to another tier
      if (this.state === 'listening') {
        this.setState('ready')
      }
      throw err // Re-throw so caller can handle fallback
    } finally {
      this.isStartingListening = false
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
   * Change language (may require switching model).
   * Serialized: concurrent calls are ignored while one is in progress.
   */
  async setLanguage(language: string): Promise<STTProvider> {
    if (this.destroyed) return this.provider

    // Prevent concurrent language changes from racing
    if (this.isChangingLanguage) return this.provider
    this.isChangingLanguage = true

    try {
      // If currently listening, stop first to avoid race with startListening
      if (this.state === 'listening') {
        this.stopListening()
      }

      const newProvider = this.selectProvider(language)
      this.language = language

      if (newProvider !== this.provider) {
        this.unloadModel()
        this.provider = newProvider
        this.callbacks?.onProviderChange?.(this.provider)

        if (this.provider !== 'web-speech-api' && this.provider !== 'none') {
          await this.loadModel()
        }
      } else if (this.provider === 'whisper' && this.worker) {
        this.worker.postMessage({ type: 'set-language', language })
      }

      return this.provider
    } finally {
      this.isChangingLanguage = false
    }
  }

  /**
   * Fully clean up all resources
   */
  destroy(): void {
    this.destroyed = true
    // Clear any pending model-load timeout to prevent dangling reject
    if (this.modelLoadTimeout) {
      clearTimeout(this.modelLoadTimeout)
      this.modelLoadTimeout = null
    }
    this.modelLoadPromise = null
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
    this.modelLoadPromise = null
    if (this.worker) {
      this.worker.postMessage({ type: 'unload' })
      this.worker.terminate()
      this.worker = null
    }
  }

  private startIdleTimer() {
    this.clearIdleTimer()
    // 120 seconds: long enough for user to read AI response and respond back
    // without triggering a costly model reload
    this.idleTimer = setTimeout(() => {
      this.unloadModel()
    }, 120_000)
  }

  private clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
  }
}
