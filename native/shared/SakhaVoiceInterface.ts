/**
 * Sakha Voice — Cross-Platform TypeScript Interface
 *
 * Mirrors the Kotlin (Android) and Swift (iOS) bridge modules. Every change
 * here MUST land in all three places at once or the bridge will silently drop
 * fields. Run `pnpm typecheck` in apps/mobile after touching this file.
 *
 * Engine and persona vocabulary follow sakha.voice.openai.md verbatim.
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
// State machine — keep in sync with native enum names
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
  /** REST base URL of the MindVibe backend, no trailing slash. */
  backendBaseUrl: string;

  /** User-facing language for STT + TTS routing. */
  language?: SakhaLanguage;

  /** Path prefix to the voice-companion routes. */
  voiceCompanionPathPrefix?: string;

  /** Voice id for the persona body voice. */
  sakhaVoiceId?: string;

  /** Voice id for Sanskrit verse synthesis. */
  sanskritVoiceId?: string;

  /** Allow user to interrupt mid-utterance by tapping mic again. */
  allowBargeIn?: boolean;

  /** Silence (ms) after which the mic auto-closes. */
  silenceTimeoutMs?: number;

  /** Hard cap on a single Sakha utterance. */
  maxResponseSpokenMs?: number;

  /** Connect/read timeout for the SSE request. */
  requestTimeoutMs?: number;

  /** Retries on transient SSE failures. */
  maxRequestRetries?: number;

  /** Run the persona guard on every chunk. */
  enablePersonaGuard?: boolean;

  /** Speak a soft template instead of staying silent on FILTER_FAIL. */
  speakOnFilterFail?: boolean;

  /** Verbose native logcat. */
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
