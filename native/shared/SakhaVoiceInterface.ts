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

  /**
   * Enable always-on wake-word detection ("Hey Sakha"). Default false.
   * Apps should toggle this on once RECORD_AUDIO permission is granted
   * and the user opts in.
   */
  enableWakeWord?: boolean;

  /**
   * Phrases the wake detector listens for. Order matters — earlier
   * phrases are preferred when multiple could match. Default:
   * ['hey sakha', 'namaste sakha', 'ok sakha', 'sakha', 'हे सखा', 'सखा'].
   */
  wakeWordPhrases?: string[];

  /**
   * Minimum gap (ms) between successive wake-word fires. Prevents
   * a single utterance like "hey Sakha, hey Sakha" from triggering
   * twice. Default 1500ms.
   */
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

/**
 * One spoken segment of a verse recitation. Mirrors the Kotlin
 * VerseSegment in SakhaTypes.kt. The native side routes
 * language === 'sa' to the reverent Sanskrit voice; everything else
 * uses the persona body voice.
 */
export interface SakhaVerseSegment {
  language: SakhaLanguage;
  text: string;
}

/**
 * A request to recite a Gita verse in N languages, in the order supplied.
 * Mirrors the Kotlin VerseRecitation in SakhaTypes.kt:
 *
 *   chapter:                 1..18 (validated native-side)
 *   verse:                   1..78 (validated native-side)
 *   segments:                non-empty list of (language, text)
 *   betweenSegmentsPauseMs:  optional inter-segment pause (default 700)
 *
 * Native-side validation rejects out-of-range chapter/verse, empty
 * segments, or blank text with a `read_verse_invalid` promise rejection.
 * Runtime conditions like "manager busy" surface via SakhaVoiceError
 * events instead.
 */
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
// Wake word
// ============================================================================

/**
 * Wake-word detection fired. The native manager has already auto-called
 * activate() — the UI should animate into LISTENING. The phrase is the
 * normalized matched phrase (e.g. "hey sakha"), never the raw user
 * transcript — privacy-preserving by construction.
 */
export interface SakhaWakeWordEvent {
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

  /**
   * Recite a Gita verse in the languages supplied. Resolves on
   * dispatch; per-segment progress arrives via the
   * SakhaVoiceVerseSegmentRead / SakhaVoiceVerseReadComplete events.
   * Rejects only on payload validation errors.
   */
  readVerse(recitation: SakhaVerseRecitation): Promise<void>;

  /**
   * Begin always-on wake-word detection ("Hey Sakha"). Resolves on
   * dispatch. Permission failures surface via SakhaVoiceError events.
   * On a successful match the native manager auto-fires SakhaVoiceWakeWord
   * and immediately starts a new turn (state → LISTENING).
   */
  enableWakeWord(): Promise<void>;

  /** Stop wake-word detection. Resolves on dispatch. Idempotent. */
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
  // Verse recitation (multi-language Gita reader, distinct from
  // VERSE_CITED which fires during a conversational turn).
  VERSE_READ_STARTED: 'SakhaVoiceVerseReadStarted',
  VERSE_SEGMENT_READ: 'SakhaVoiceVerseSegmentRead',
  VERSE_READ_COMPLETE: 'SakhaVoiceVerseReadComplete',
  // Wake-word activation (the user said "Hey Sakha" — manager
  // auto-activated a new turn).
  WAKE_WORD: 'SakhaVoiceWakeWord',
} as const;

export type SakhaVoiceEventName =
  (typeof SAKHA_VOICE_EVENTS)[keyof typeof SAKHA_VOICE_EVENTS];
