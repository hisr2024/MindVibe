/**
 * KIAAN Voice Interface - Cross-Platform TypeScript Interface
 *
 * Unified interface for native iOS/Android voice managers
 * Used by React Native bridge to ensure type safety
 */

// ============================================================================
// Voice States
// ============================================================================

export type KiaanVoiceState =
  | 'uninitialized'
  | 'initializing'
  | 'idle'
  | 'wakeWordListening'
  | 'warmingUp'
  | 'listening'
  | 'processing'
  | 'thinking'
  | 'speaking'
  | 'error'
  | 'recovering'

export type KiaanVoiceTransition =
  | 'initialize'
  | 'ready'
  | 'enableWakeWord'
  | 'disableWakeWord'
  | 'wakeWordDetected'
  | 'activate'
  | 'startListening'
  | 'stopListening'
  | 'transcriptReceived'
  | 'startThinking'
  | 'startSpeaking'
  | 'stopSpeaking'
  | 'error'
  | 'recover'
  | 'reset'

// ============================================================================
// Error Types
// ============================================================================

export type KiaanVoiceErrorType =
  | 'permission_denied'
  | 'permission_not_determined'
  | 'microphone_unavailable'
  | 'speech_recognition_unavailable'
  | 'on_device_recognition_unavailable'
  | 'audio_error'
  | 'recognition_error'
  | 'network_error'
  | 'timeout'
  | 'unknown'

export interface KiaanVoiceError {
  type: KiaanVoiceErrorType
  message: string
  isRecoverable: boolean
  originalError?: Error
}

// ============================================================================
// Configuration
// ============================================================================

export interface KiaanVoiceConfig {
  /** Language/locale for speech recognition (default: 'en-US') */
  language?: string

  /** Use on-device recognition when available (default: true) */
  useOnDeviceRecognition?: boolean

  /** Enable wake word detection (default: true) */
  enableWakeWord?: boolean

  /** Wake word phrases to listen for (default: ['hey kiaan', 'hi kiaan', 'namaste kiaan', 'ok kiaan', 'kiaan']) */
  wakeWordPhrases?: string[]

  /** Maximum retry attempts for self-healing (default: 3) */
  maxRetries?: number

  /** Base delay for exponential backoff in ms (default: 500) */
  retryBaseDelayMs?: number

  /** Silence timeout before stopping listening in ms (default: 2000) */
  silenceTimeoutMs?: number

  /** Enable haptic feedback (default: true) */
  enableHaptics?: boolean

  /** Enable sound effects (default: true) */
  enableSoundEffects?: boolean

  /** Enable debug logging (default: false) */
  debugMode?: boolean
}

export const DEFAULT_CONFIG: Required<KiaanVoiceConfig> = {
  language: 'en-US',
  useOnDeviceRecognition: true,
  enableWakeWord: true,
  wakeWordPhrases: ['hey kiaan', 'hi kiaan', 'namaste kiaan', 'ok kiaan', 'kiaan'],
  maxRetries: 3,
  retryBaseDelayMs: 500,
  silenceTimeoutMs: 2000,
  enableHaptics: true,
  enableSoundEffects: true,
  debugMode: false,
}

// ============================================================================
// Event Types
// ============================================================================

export interface KiaanVoiceEvents {
  onStateChange: (state: KiaanVoiceState, previousState: KiaanVoiceState) => void
  onTranscript: (transcript: string, isFinal: boolean) => void
  onWakeWordDetected: (phrase: string) => void
  onError: (error: KiaanVoiceError) => void
  onReady: () => void
  onSpeakingStart: () => void
  onSpeakingEnd: () => void
}

// ============================================================================
// Native Module Interface
// ============================================================================

export interface KiaanVoiceNativeModule {
  // Initialization
  initialize(config: KiaanVoiceConfig): Promise<void>
  requestPermissions(): Promise<boolean>
  hasPermissions(): Promise<boolean>

  // Voice control
  enableWakeWord(): Promise<void>
  disableWakeWord(): Promise<void>
  activate(): Promise<void>
  stopListening(): Promise<void>
  reset(): Promise<void>
  destroy(): Promise<void>

  // Text-to-speech
  speak(text: string): Promise<void>
  stopSpeaking(): Promise<void>

  // State queries
  getCurrentState(): Promise<KiaanVoiceState>
  getTranscript(): Promise<string>
  getInterimTranscript(): Promise<string>
  isListening(): Promise<boolean>
  isSpeaking(): Promise<boolean>

  // Event registration (via NativeEventEmitter)
  addListener(eventName: string): void
  removeListeners(count: number): void
}

// ============================================================================
// Native Event Names
// ============================================================================

export const KIAAN_VOICE_EVENTS = {
  STATE_CHANGE: 'KiaanVoiceStateChange',
  TRANSCRIPT: 'KiaanVoiceTranscript',
  WAKE_WORD_DETECTED: 'KiaanVoiceWakeWordDetected',
  ERROR: 'KiaanVoiceError',
  READY: 'KiaanVoiceReady',
  SPEAKING_START: 'KiaanVoiceSpeakingStart',
  SPEAKING_END: 'KiaanVoiceSpeakingEnd',
} as const

// ============================================================================
// Performance Metrics
// ============================================================================

export interface KiaanVoiceMetrics {
  /** Time from activation to first audio received (ms) */
  activationLatency: number

  /** Time from end of speech to final transcript (ms) */
  recognitionLatency: number

  /** Whether on-device recognition was used */
  usedOnDeviceRecognition: boolean

  /** Total audio duration processed (ms) */
  audioDuration: number

  /** Number of retry attempts */
  retryCount: number
}

// ============================================================================
// Utility Types
// ============================================================================

export type StateTransitionMap = {
  [K in KiaanVoiceState]: KiaanVoiceTransition[]
}

export const ALLOWED_TRANSITIONS: StateTransitionMap = {
  uninitialized: ['initialize'],
  initializing: ['ready', 'error'],
  idle: ['activate', 'enableWakeWord', 'error', 'reset'],
  wakeWordListening: ['wakeWordDetected', 'disableWakeWord', 'error', 'reset'],
  warmingUp: ['startListening', 'error', 'reset'],
  listening: ['transcriptReceived', 'stopListening', 'error', 'reset'],
  processing: ['startThinking', 'error', 'reset'],
  thinking: ['startSpeaking', 'error', 'reset'],
  speaking: ['stopSpeaking', 'error', 'reset'],
  error: ['recover', 'reset'],
  recovering: ['ready', 'error', 'reset'],
}

// ============================================================================
// Helper Functions
// ============================================================================

export function isTransitionAllowed(
  currentState: KiaanVoiceState,
  transition: KiaanVoiceTransition
): boolean {
  return ALLOWED_TRANSITIONS[currentState].includes(transition)
}

export function isRecoverableError(type: KiaanVoiceErrorType): boolean {
  const nonRecoverable: KiaanVoiceErrorType[] = [
    'permission_denied',
    'microphone_unavailable',
    'speech_recognition_unavailable',
  ]
  return !nonRecoverable.includes(type)
}

export function calculateBackoffDelay(
  baseDelayMs: number,
  retryCount: number,
  maxDelayMs: number = 8000
): number {
  const delay = baseDelayMs * Math.pow(2, retryCount)
  return Math.min(delay, maxDelayMs)
}
