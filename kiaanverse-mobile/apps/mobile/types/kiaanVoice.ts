/**
 * Kiaan Voice — TypeScript bridge types.
 *
 * Mirrors the canonical interface in `native/shared/KiaanVoiceInterface.ts`.
 * Keeping a copy inside the mobile workspace lets Metro resolve the import
 * cleanly without crossing workspace boundaries. If you change anything here,
 * change `native/shared/KiaanVoiceInterface.ts` as well — the native iOS and
 * Android bridges read from that one.
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
  | 'recovering';

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
  | 'reset';

// ============================================================================
// Errors
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
  | 'unknown';

export interface KiaanVoiceError {
  type: KiaanVoiceErrorType;
  message: string;
  isRecoverable: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

export interface KiaanVoiceConfig {
  language?: string;
  useOnDeviceRecognition?: boolean;
  enableWakeWord?: boolean;
  wakeWordPhrases?: string[];
  maxRetries?: number;
  retryBaseDelayMs?: number;
  silenceTimeoutMs?: number;
  enableHaptics?: boolean;
  enableSoundEffects?: boolean;
  debugMode?: boolean;
}

// ============================================================================
// Native event payloads
// ============================================================================

export interface KiaanVoiceStateEvent {
  state: KiaanVoiceState;
  previousState: KiaanVoiceState;
}

export interface KiaanVoiceTranscriptEvent {
  transcript: string;
  isFinal: boolean;
}

export interface KiaanVoiceWakeWordEvent {
  phrase: string;
}

export interface KiaanVoiceErrorEvent extends KiaanVoiceError {}

// ============================================================================
// Bridge module surface
// ============================================================================

export interface KiaanVoiceNativeModule {
  initialize(config: KiaanVoiceConfig): Promise<void>;
  requestPermissions(): Promise<boolean>;
  hasPermissions(): Promise<boolean>;

  enableWakeWord(): Promise<void>;
  disableWakeWord(): Promise<void>;
  activate(): Promise<void>;
  stopListening(): Promise<void>;
  reset(): Promise<void>;
  destroy(): Promise<void>;

  speak(text: string): Promise<void>;
  stopSpeaking(): Promise<void>;

  getCurrentState(): Promise<KiaanVoiceState>;
  getTranscript(): Promise<string>;
  getInterimTranscript(): Promise<string>;
  isListening(): Promise<boolean>;
  isSpeaking(): Promise<boolean>;

  // NativeEventEmitter contract
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// ============================================================================
// Native event names
// ============================================================================

export const KIAAN_VOICE_EVENTS = {
  STATE_CHANGE: 'KiaanVoiceStateChange',
  TRANSCRIPT: 'KiaanVoiceTranscript',
  WAKE_WORD_DETECTED: 'KiaanVoiceWakeWordDetected',
  ERROR: 'KiaanVoiceError',
  READY: 'KiaanVoiceReady',
  SPEAKING_START: 'KiaanVoiceSpeakingStart',
  SPEAKING_END: 'KiaanVoiceSpeakingEnd',
} as const;

export type KiaanVoiceEventName =
  (typeof KIAAN_VOICE_EVENTS)[keyof typeof KIAAN_VOICE_EVENTS];
