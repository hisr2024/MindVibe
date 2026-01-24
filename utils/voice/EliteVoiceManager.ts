/**
 * Elite Voice Manager - World-Class Voice AI System
 *
 * This is the brain of KIAAN Voice - handling all microphone access,
 * state transitions, error recovery, and self-healing capabilities.
 *
 * Features:
 * - Bulletproof state machine with transition guards
 * - Intelligent retry with exponential backoff
 * - Preemptive microphone warm-up for instant activation
 * - Self-healing error recovery
 * - Cross-browser compatibility
 * - Memory leak prevention
 * - Race condition protection
 *
 * @author KIAAN Voice Team
 * @version 2.0.0
 */

// Voice states
export type VoiceState =
  | 'uninitialized'
  | 'initializing'
  | 'idle'
  | 'wakeword'
  | 'warming_up'
  | 'listening'
  | 'processing'
  | 'thinking'
  | 'speaking'
  | 'error'
  | 'recovering'

// Transition types
export type VoiceTransition =
  | 'INITIALIZE'
  | 'READY'
  | 'ACTIVATE'
  | 'WARM_UP'
  | 'START_LISTENING'
  | 'STOP_LISTENING'
  | 'TRANSCRIPT_RECEIVED'
  | 'START_THINKING'
  | 'START_SPEAKING'
  | 'STOP_SPEAKING'
  | 'ENABLE_WAKEWORD'
  | 'DISABLE_WAKEWORD'
  | 'ERROR'
  | 'RECOVER'
  | 'RESET'

// Error types with recovery strategies
export type VoiceErrorType =
  | 'permission_denied'
  | 'permission_dismissed'
  | 'no_microphone'
  | 'microphone_busy'
  | 'network_error'
  | 'browser_unsupported'
  | 'speech_recognition_error'
  | 'timeout'
  | 'unknown'

// Error with metadata
export interface VoiceError {
  type: VoiceErrorType
  message: string
  recoverable: boolean
  retryCount: number
  timestamp: number
  originalError?: Error
}

// State machine configuration
interface StateConfig {
  allowedTransitions: VoiceTransition[]
  onEnter?: () => void | Promise<void>
  onExit?: () => void | Promise<void>
}

// Manager options
export interface EliteVoiceManagerOptions {
  language?: string
  maxRetries?: number
  retryBaseDelay?: number
  warmUpOnInit?: boolean
  enableSelfHealing?: boolean
  onStateChange?: (state: VoiceState, previousState: VoiceState) => void
  onError?: (error: VoiceError) => void
  onReady?: () => void
  onTranscript?: (text: string, isFinal: boolean) => void
  onSpeakingStart?: () => void
  onSpeakingEnd?: () => void
  debug?: boolean
}

// Manager state
interface ManagerState {
  currentState: VoiceState
  previousState: VoiceState
  isWakeWordEnabled: boolean
  isMicrophoneWarmed: boolean
  permissionStatus: 'unknown' | 'prompt' | 'granted' | 'denied'
  lastError: VoiceError | null
  retryCount: number
  transitionLock: boolean
  initializationComplete: boolean
}

/**
 * Elite Voice Manager Class
 *
 * Manages the entire voice pipeline with bulletproof state management.
 */
export class EliteVoiceManager {
  private state: ManagerState
  private options: Required<EliteVoiceManagerOptions>
  private recognition: SpeechRecognition | null = null
  private warmUpStream: MediaStream | null = null
  private transitionQueue: VoiceTransition[] = []
  private processingTransition = false
  private selfHealingTimer: ReturnType<typeof setTimeout> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null

  // State machine configuration
  private readonly stateConfig: Record<VoiceState, StateConfig> = {
    uninitialized: {
      allowedTransitions: ['INITIALIZE']
    },
    initializing: {
      allowedTransitions: ['READY', 'ERROR']
    },
    idle: {
      allowedTransitions: ['ACTIVATE', 'WARM_UP', 'ENABLE_WAKEWORD', 'ERROR', 'RESET']
    },
    wakeword: {
      allowedTransitions: ['ACTIVATE', 'DISABLE_WAKEWORD', 'ERROR', 'RESET']
    },
    warming_up: {
      allowedTransitions: ['START_LISTENING', 'ERROR', 'RESET']
    },
    listening: {
      allowedTransitions: ['TRANSCRIPT_RECEIVED', 'STOP_LISTENING', 'ERROR', 'RESET']
    },
    processing: {
      allowedTransitions: ['START_THINKING', 'ERROR', 'RESET']
    },
    thinking: {
      allowedTransitions: ['START_SPEAKING', 'ERROR', 'RESET']
    },
    speaking: {
      allowedTransitions: ['STOP_SPEAKING', 'ERROR', 'RESET']
    },
    error: {
      allowedTransitions: ['RECOVER', 'RESET']
    },
    recovering: {
      allowedTransitions: ['READY', 'ERROR', 'RESET']
    }
  }

  constructor(options: EliteVoiceManagerOptions = {}) {
    this.options = {
      language: options.language ?? 'en',
      maxRetries: options.maxRetries ?? 3,
      retryBaseDelay: options.retryBaseDelay ?? 500,
      warmUpOnInit: options.warmUpOnInit ?? true,
      enableSelfHealing: options.enableSelfHealing ?? true,
      onStateChange: options.onStateChange ?? (() => {}),
      onError: options.onError ?? (() => {}),
      onReady: options.onReady ?? (() => {}),
      onTranscript: options.onTranscript ?? (() => {}),
      onSpeakingStart: options.onSpeakingStart ?? (() => {}),
      onSpeakingEnd: options.onSpeakingEnd ?? (() => {}),
      debug: options.debug ?? false
    }

    this.state = {
      currentState: 'uninitialized',
      previousState: 'uninitialized',
      isWakeWordEnabled: false,
      isMicrophoneWarmed: false,
      permissionStatus: 'unknown',
      lastError: null,
      retryCount: 0,
      transitionLock: false,
      initializationComplete: false
    }
  }

  // ========== PUBLIC API ==========

  /**
   * Initialize the voice manager
   */
  async initialize(): Promise<boolean> {
    return this.transition('INITIALIZE')
  }

  /**
   * Activate voice input (tap to speak)
   */
  async activate(): Promise<boolean> {
    // If we have permission, warm up first for faster response
    if (this.state.permissionStatus === 'granted' && !this.state.isMicrophoneWarmed) {
      await this.transition('WARM_UP')
    }
    return this.transition('ACTIVATE')
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<boolean> {
    return this.transition('STOP_LISTENING')
  }

  /**
   * Enable wake word mode
   */
  async enableWakeWord(): Promise<boolean> {
    return this.transition('ENABLE_WAKEWORD')
  }

  /**
   * Disable wake word mode
   */
  async disableWakeWord(): Promise<boolean> {
    return this.transition('DISABLE_WAKEWORD')
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(): Promise<boolean> {
    return this.transition('STOP_SPEAKING')
  }

  /**
   * Reset to initial state
   */
  async reset(): Promise<boolean> {
    return this.transition('RESET')
  }

  /**
   * Get current state
   */
  getState(): VoiceState {
    return this.state.currentState
  }

  /**
   * Get full state info
   */
  getFullState(): Readonly<ManagerState> {
    return { ...this.state }
  }

  /**
   * Check if microphone permission is granted
   */
  hasPermission(): boolean {
    return this.state.permissionStatus === 'granted'
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.log('Destroying voice manager')
    this.cleanup()
  }

  // ========== STATE MACHINE ==========

  /**
   * Execute a state transition
   */
  private async transition(action: VoiceTransition): Promise<boolean> {
    // Queue transitions if one is in progress
    if (this.processingTransition) {
      this.log(`Queueing transition: ${action}`)
      this.transitionQueue.push(action)
      return true
    }

    this.processingTransition = true

    try {
      const currentConfig = this.stateConfig[this.state.currentState]

      // Check if transition is allowed
      if (!currentConfig.allowedTransitions.includes(action)) {
        this.log(`Transition ${action} not allowed from ${this.state.currentState}`)
        return false
      }

      // Execute transition
      const success = await this.executeTransition(action)

      // Process queued transitions
      if (this.transitionQueue.length > 0) {
        const nextAction = this.transitionQueue.shift()!
        this.processingTransition = false
        return this.transition(nextAction)
      }

      return success
    } finally {
      this.processingTransition = false
    }
  }

  /**
   * Execute the actual transition logic
   */
  private async executeTransition(action: VoiceTransition): Promise<boolean> {
    this.log(`Executing transition: ${action} from ${this.state.currentState}`)

    const previousState = this.state.currentState

    try {
      switch (action) {
        case 'INITIALIZE':
          return await this.handleInitialize()

        case 'READY':
          return this.handleReady()

        case 'WARM_UP':
          return await this.handleWarmUp()

        case 'ACTIVATE':
          return await this.handleActivate()

        case 'START_LISTENING':
          return await this.handleStartListening()

        case 'STOP_LISTENING':
          return this.handleStopListening()

        case 'TRANSCRIPT_RECEIVED':
          return this.handleTranscriptReceived()

        case 'START_THINKING':
          return this.handleStartThinking()

        case 'START_SPEAKING':
          return this.handleStartSpeaking()

        case 'STOP_SPEAKING':
          return this.handleStopSpeaking()

        case 'ENABLE_WAKEWORD':
          return await this.handleEnableWakeWord()

        case 'DISABLE_WAKEWORD':
          return this.handleDisableWakeWord()

        case 'ERROR':
          return this.handleError()

        case 'RECOVER':
          return await this.handleRecover()

        case 'RESET':
          return this.handleReset()

        default:
          this.log(`Unknown transition: ${action}`)
          return false
      }
    } catch (error) {
      this.log(`Transition error: ${error}`)
      this.setError('unknown', error instanceof Error ? error.message : 'Unknown error', error as Error)
      return false
    }
  }

  // ========== TRANSITION HANDLERS ==========

  private async handleInitialize(): Promise<boolean> {
    this.setState('initializing')

    // Check browser support
    if (!this.isBrowserSupported()) {
      this.setError('browser_unsupported', 'Voice features are not supported in this browser. Please use Chrome, Edge, or Safari.')
      return false
    }

    // Check secure context
    if (!this.isSecureContext()) {
      this.setError('browser_unsupported', 'Voice features require HTTPS. Please access this site securely.')
      return false
    }

    // Check permission status
    await this.checkPermissionStatus()

    // Warm up microphone if we have permission
    if (this.options.warmUpOnInit && this.state.permissionStatus === 'granted') {
      await this.warmUpMicrophone()
    }

    this.state.initializationComplete = true
    return this.transition('READY')
  }

  private handleReady(): boolean {
    this.setState('idle')
    this.options.onReady()
    return true
  }

  private async handleWarmUp(): Promise<boolean> {
    this.setState('warming_up')

    const success = await this.warmUpMicrophone()
    if (!success) {
      this.setState('idle')
      return false
    }

    return true
  }

  private async handleActivate(): Promise<boolean> {
    // Request permission if needed
    if (this.state.permissionStatus !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) {
        return false
      }
    }

    // Warm up if not already
    if (!this.state.isMicrophoneWarmed) {
      const warmed = await this.warmUpMicrophone()
      if (!warmed) {
        return false
      }
    }

    return this.transition('START_LISTENING')
  }

  private async handleStartListening(): Promise<boolean> {
    this.setState('listening')

    try {
      await this.startSpeechRecognition()
      return true
    } catch (error) {
      this.setError('speech_recognition_error', 'Failed to start voice input', error as Error)
      return false
    }
  }

  private handleStopListening(): boolean {
    this.stopSpeechRecognition()
    this.setState(this.state.isWakeWordEnabled ? 'wakeword' : 'idle')
    return true
  }

  private handleTranscriptReceived(): boolean {
    this.setState('processing')
    return true
  }

  private handleStartThinking(): boolean {
    this.setState('thinking')
    return true
  }

  private handleStartSpeaking(): boolean {
    this.setState('speaking')
    this.options.onSpeakingStart()
    return true
  }

  private handleStopSpeaking(): boolean {
    this.options.onSpeakingEnd()
    this.setState(this.state.isWakeWordEnabled ? 'wakeword' : 'idle')
    return true
  }

  private async handleEnableWakeWord(): Promise<boolean> {
    // Request permission if needed
    if (this.state.permissionStatus !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) {
        return false
      }
    }

    this.state.isWakeWordEnabled = true
    this.setState('wakeword')
    return true
  }

  private handleDisableWakeWord(): boolean {
    this.state.isWakeWordEnabled = false
    this.setState('idle')
    return true
  }

  private handleError(): boolean {
    this.setState('error')

    // Start self-healing if enabled
    if (this.options.enableSelfHealing && this.state.lastError?.recoverable) {
      this.scheduleSelfHealing()
    }

    return true
  }

  private async handleRecover(): Promise<boolean> {
    this.setState('recovering')

    // Clear error
    this.state.lastError = null
    this.state.retryCount = 0

    // Re-initialize
    await this.checkPermissionStatus()

    if (this.state.permissionStatus === 'granted') {
      return this.transition('READY')
    }

    return this.transition('READY')
  }

  private handleReset(): boolean {
    this.cleanup()
    this.state = {
      currentState: 'idle',
      previousState: this.state.currentState,
      isWakeWordEnabled: false,
      isMicrophoneWarmed: false,
      permissionStatus: this.state.permissionStatus,
      lastError: null,
      retryCount: 0,
      transitionLock: false,
      initializationComplete: this.state.initializationComplete
    }
    return true
  }

  // ========== HELPER METHODS ==========

  private setState(newState: VoiceState): void {
    const previousState = this.state.currentState
    this.state.previousState = previousState
    this.state.currentState = newState

    this.log(`State: ${previousState} -> ${newState}`)
    this.options.onStateChange(newState, previousState)
  }

  private setError(type: VoiceErrorType, message: string, originalError?: Error): void {
    const recoverable = this.isRecoverableError(type)

    this.state.lastError = {
      type,
      message,
      recoverable,
      retryCount: this.state.retryCount,
      timestamp: Date.now(),
      originalError
    }

    this.options.onError(this.state.lastError)
    this.transition('ERROR')
  }

  private isRecoverableError(type: VoiceErrorType): boolean {
    const nonRecoverable: VoiceErrorType[] = [
      'permission_denied',
      'browser_unsupported',
      'no_microphone'
    ]
    return !nonRecoverable.includes(type)
  }

  private isBrowserSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  private isSecureContext(): boolean {
    if (typeof window === 'undefined') return false
    const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
    return window.location.protocol === 'https:' || isLocalhost
  }

  private async checkPermissionStatus(): Promise<void> {
    try {
      if (navigator.permissions?.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        this.state.permissionStatus = result.state as 'granted' | 'denied' | 'prompt'
      } else {
        // Try enumerating devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasLabels = devices.some(d => d.kind === 'audioinput' && d.label)
        this.state.permissionStatus = hasLabels ? 'granted' : 'prompt'
      }
    } catch {
      this.state.permissionStatus = 'prompt'
    }
  }

  private async requestPermission(): Promise<boolean> {
    try {
      this.log('Requesting microphone permission...')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // Store for warm-up
      this.warmUpStream = stream
      this.state.isMicrophoneWarmed = true
      this.state.permissionStatus = 'granted'

      this.log('Permission granted!')
      return true

    } catch (error: any) {
      this.log('Permission request failed:', error)

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.state.permissionStatus = 'denied'
        this.setError('permission_denied', 'Microphone permission denied. Please allow access in your browser settings.')
      } else if (error.name === 'NotFoundError') {
        this.setError('no_microphone', 'No microphone found. Please connect a microphone.')
      } else if (error.name === 'NotReadableError') {
        this.setError('microphone_busy', 'Microphone is being used by another application.')
      } else {
        this.setError('unknown', `Failed to access microphone: ${error.message}`, error)
      }

      return false
    }
  }

  private async warmUpMicrophone(): Promise<boolean> {
    if (this.state.isMicrophoneWarmed && this.warmUpStream) {
      return true
    }

    try {
      this.log('Warming up microphone...')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      this.warmUpStream = stream
      this.state.isMicrophoneWarmed = true
      this.state.permissionStatus = 'granted'

      this.log('Microphone warmed up!')
      return true

    } catch (error) {
      this.log('Warm-up failed:', error)
      return false
    }
  }

  private async startSpeechRecognition(): Promise<void> {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      throw new Error('SpeechRecognition not supported')
    }

    // Stop any existing recognition
    if (this.recognition) {
      try {
        this.recognition.abort()
      } catch {}
    }

    // Release warm-up stream (SpeechRecognition manages its own)
    this.releaseWarmUpStream()

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = this.options.language
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      const isFinal = result.isFinal

      this.options.onTranscript(transcript, isFinal)

      if (isFinal) {
        this.transition('TRANSCRIPT_RECEIVED')
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.log('Recognition error:', event.error)

      // Handle specific errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Recoverable - just return to previous state
        this.setState(this.state.isWakeWordEnabled ? 'wakeword' : 'idle')
        return
      }

      if (event.error === 'not-allowed') {
        this.setError('permission_denied', 'Microphone permission denied')
      } else if (event.error === 'audio-capture') {
        this.setError('no_microphone', 'Microphone not accessible')
      } else if (event.error === 'network') {
        this.setError('network_error', 'Network error occurred')
      } else {
        this.setError('speech_recognition_error', `Speech recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      this.log('Recognition ended')
      if (this.state.currentState === 'listening') {
        this.setState(this.state.isWakeWordEnabled ? 'wakeword' : 'idle')
      }
    }

    // Assign to instance before starting
    this.recognition = recognition
    recognition.start()
    this.log('Recognition started')
  }

  private stopSpeechRecognition(): void {
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {}
      this.recognition = null
    }
  }

  private releaseWarmUpStream(): void {
    if (this.warmUpStream) {
      this.warmUpStream.getTracks().forEach(track => track.stop())
      this.warmUpStream = null
    }
  }

  private scheduleSelfHealing(): void {
    if (this.selfHealingTimer) {
      clearTimeout(this.selfHealingTimer)
    }

    const delay = this.calculateRetryDelay()
    this.log(`Scheduling self-healing in ${delay}ms`)

    this.selfHealingTimer = setTimeout(async () => {
      if (this.state.currentState === 'error' && this.state.retryCount < this.options.maxRetries) {
        this.state.retryCount++
        this.log(`Self-healing attempt ${this.state.retryCount}/${this.options.maxRetries}`)
        await this.transition('RECOVER')
      }
    }, delay)
  }

  private calculateRetryDelay(): number {
    // Exponential backoff: 500ms, 1s, 2s, 4s...
    return this.options.retryBaseDelay * Math.pow(2, this.state.retryCount)
  }

  private cleanup(): void {
    this.stopSpeechRecognition()
    this.releaseWarmUpStream()

    if (this.selfHealingTimer) {
      clearTimeout(this.selfHealingTimer)
      this.selfHealingTimer = null
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }

    this.transitionQueue = []
  }

  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[EliteVoiceManager]', ...args)
    }
  }
}

// Factory function
export function createEliteVoiceManager(options?: EliteVoiceManagerOptions): EliteVoiceManager {
  return new EliteVoiceManager(options)
}

// Export singleton for convenience
let instance: EliteVoiceManager | null = null

export function getEliteVoiceManager(options?: EliteVoiceManagerOptions): EliteVoiceManager {
  if (!instance) {
    instance = new EliteVoiceManager(options)
  }
  return instance
}

export function destroyEliteVoiceManager(): void {
  if (instance) {
    instance.destroy()
    instance = null
  }
}
