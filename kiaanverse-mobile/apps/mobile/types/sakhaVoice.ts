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
  /** Wake-word activation ("Hey Sakha"). Default false. */
  enableWakeWord?: boolean;
  /** Phrases the wake detector listens for. Order matters. */
  wakeWordPhrases?: string[];
  /** Minimum gap (ms) between successive wake-word fires. Default 1500. */
  wakeWordCooldownMs?: number;
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
// Verse recitation (multi-language Bhagavad Gita reader)
// ============================================================================

export interface SakhaVerseSegment {
  language: SakhaLanguage;
  text: string;
}

export interface SakhaVerseRecitation {
  chapter: number;
  verse: number;
  segments: SakhaVerseSegment[];
  betweenSegmentsPauseMs?: number;
}

export interface SakhaVerseReadStartedEvent {
  citation: string;
}

export interface SakhaVerseSegmentReadEvent {
  citation: string;
  language: SakhaLanguage;
}

export interface SakhaVerseReadCompleteEvent {
  citation: string;
}

// ============================================================================
// Wake word ("Hey Sakha")
// ============================================================================

export interface SakhaWakeWordEvent {
  /** Normalized matched phrase (e.g. "hey sakha"). Never the raw transcript. */
  phrase: string;
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

  /** Recite a Gita verse. Resolves on dispatch; progress via verse events. */
  readVerse(recitation: SakhaVerseRecitation): Promise<void>;

  /** Begin always-on wake-word detection ("Hey Sakha"). */
  enableWakeWord(): Promise<void>;

  /** Stop wake-word detection. Idempotent. */
  disableWakeWord(): Promise<void>;

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
  VERSE_READ_STARTED: 'SakhaVoiceVerseReadStarted',
  VERSE_SEGMENT_READ: 'SakhaVoiceVerseSegmentRead',
  VERSE_READ_COMPLETE: 'SakhaVoiceVerseReadComplete',
  WAKE_WORD: 'SakhaVoiceWakeWord',
} as const;

export type SakhaVoiceEventName =
  (typeof SAKHA_VOICE_EVENTS)[keyof typeof SAKHA_VOICE_EVENTS];
