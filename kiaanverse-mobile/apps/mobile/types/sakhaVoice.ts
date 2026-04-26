/**
 * Sakha Voice — TypeScript bridge types.
 *
 * Mirrors the canonical interface in `native/shared/SakhaVoiceInterface.ts`.
 * Keeping a copy inside the mobile workspace lets Metro resolve the import
 * cleanly without crossing workspace boundaries. If you change anything here,
 * change `native/shared/SakhaVoiceInterface.ts` as well — the native iOS and
 * Android bridges read from that one.
 */

// ============================================================================
// Engines, moods, languages
// ============================================================================

export type SakhaEngine = 'GUIDANCE' | 'FRIEND' | 'ASSISTANT' | 'VOICE_GUIDE';

export type SakhaMood =
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'lonely'
  | 'confused'
  | 'grieving'
  | 'joyful'
  | 'seeking'
  | 'guilty'
  | 'numb'
  | 'neutral';

export type SakhaMoodTrend = 'stable' | 'rising' | 'falling' | 'masked';

export type SakhaLanguage =
  | 'en'
  | 'hi'
  | 'hinglish'
  | 'ta'
  | 'te'
  | 'bn'
  | 'mr'
  | 'sa';

// ============================================================================
// State machine
// ============================================================================

export type SakhaVoiceState =
  | 'UNINITIALIZED'
  | 'IDLE'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'REQUESTING'
  | 'SPEAKING'
  | 'PAUSING'
  | 'INTERRUPTED'
  | 'ERROR'
  | 'SHUTDOWN';

// ============================================================================
// Configuration
// ============================================================================

export interface SakhaVoiceConfig {
  backendBaseUrl: string;
  language?: SakhaLanguage;
  voiceCompanionPathPrefix?: string;
  sakhaVoiceId?: string;
  sanskritVoiceId?: string;
  allowBargeIn?: boolean;
  silenceTimeoutMs?: number;
  maxResponseSpokenMs?: number;
  requestTimeoutMs?: number;
  maxRequestRetries?: number;
  enablePersonaGuard?: boolean;
  speakOnFilterFail?: boolean;
  debugMode?: boolean;
}

// ============================================================================
// Native event payloads
// ============================================================================

export interface SakhaVoiceStateEvent {
  state: SakhaVoiceState;
  previousState: SakhaVoiceState;
}

export interface SakhaTranscriptEvent {
  text: string;
}

export interface SakhaEngineSelectedEvent {
  engine: SakhaEngine;
  mood: SakhaMood;
  intensity: number;
}

export interface SakhaTextEvent {
  delta: string;
  isFinal: boolean;
}

export interface SakhaSpokenEvent {
  text: string;
  isSanskrit: boolean;
}

export interface SakhaPauseEvent {
  durationMs: number;
}

export interface SakhaVerseCitedEvent {
  reference: string;
  sanskrit?: string;
}

export interface SakhaTurnCompleteEvent {
  sessionId?: string;
  engine: SakhaEngine;
  mood: SakhaMood;
  moodIntensity: number;
  language: SakhaLanguage;
  transcriptChars: number;
  responseChars: number;
  sttDurationMs: number;
  firstByteMs: number;
  firstAudioMs: number;
  totalSpokenMs: number;
  pauseCount: number;
  verseCited?: string;
  filterFail: boolean;
  personaGuardTriggered: boolean;
  barged: boolean;
}

export interface SakhaErrorEvent {
  code: string;
  message: string;
  recoverable: boolean;
}

// ============================================================================
// Bridge module surface
// ============================================================================

export interface SakhaVoiceNativeModule {
  initialize(config: SakhaVoiceConfig): Promise<void>;
  setAuthToken(token: string | null): void;
  hasRecordPermission(): Promise<boolean>;
  activate(): Promise<void>;
  stopListening(): Promise<void>;
  cancelTurn(): Promise<void>;
  resetSession(): Promise<void>;
  shutdown(): Promise<void>;

  // NativeEventEmitter contract
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export const SAKHA_VOICE_EVENTS = {
  STATE: 'SakhaVoiceState',
  PARTIAL_TRANSCRIPT: 'SakhaVoicePartialTranscript',
  FINAL_TRANSCRIPT: 'SakhaVoiceFinalTranscript',
  ENGINE_SELECTED: 'SakhaVoiceEngineSelected',
  TEXT: 'SakhaVoiceText',
  SPOKEN: 'SakhaVoiceSpoken',
  PAUSE: 'SakhaVoicePause',
  VERSE_CITED: 'SakhaVoiceVerseCited',
  FILTER_FAIL: 'SakhaVoiceFilterFail',
  TURN_COMPLETE: 'SakhaVoiceTurnComplete',
  ERROR: 'SakhaVoiceError',
} as const;

export type SakhaVoiceEventName =
  (typeof SAKHA_VOICE_EVENTS)[keyof typeof SAKHA_VOICE_EVENTS];
