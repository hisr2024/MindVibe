/**
 * useSakhaVoice — React hook over the native SakhaVoice bridge module.
 *
 * Encapsulates the Sakha Voice mode lifecycle (initialise once, then
 * activate / stopListening / cancelTurn). Surfaces a typed view of the
 * native event stream so screens never poke `NativeModules` directly.
 *
 * Why a hook and not a context? The voice surface is screen-local — only the
 * Voice tab needs it. Wrapping the whole app in a provider would keep the
 * native event emitter alive when the user is nowhere near the mic, which
 * burns battery and risks accidental audio capture.
 *
 * Lifecycle:
 *   - mount    → initialise() with config, attach listeners
 *   - unmount  → shutdown() to release mic + TTS
 *
 * Auth token: re-read on every value change of [getAccessToken]. The native
 * side caches it and re-injects on each request.
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  type EmitterSubscription,
} from 'react-native';

import {
  SAKHA_VOICE_EVENTS,
  type SakhaEngine,
  type SakhaEngineSelectedEvent,
  type SakhaErrorEvent,
  type SakhaLanguage,
  type SakhaMood,
  type SakhaPauseEvent,
  type SakhaSpokenEvent,
  type SakhaTextEvent,
  type SakhaTranscriptEvent,
  type SakhaTurnCompleteEvent,
  type SakhaVerseCitedEvent,
  type SakhaVoiceConfig,
  type SakhaVoiceNativeModule,
  type SakhaVoiceState,
  type SakhaVoiceStateEvent,
} from '../types/sakhaVoice';

const NativeSakhaVoice: SakhaVoiceNativeModule | undefined =
  NativeModules.SakhaVoice;

const isAndroid = Platform.OS === 'android';

export interface SpokenSegment {
  readonly text: string;
  readonly isSanskrit: boolean;
  readonly at: number;
}

export interface UseSakhaVoiceOptions {
  /** Backend base URL (no trailing slash). Required. */
  readonly backendBaseUrl: string;
  /** User-facing language. Defaults to 'en'. */
  readonly language?: SakhaLanguage;
  /** Async access-token getter. Re-read on every config-relevant change. */
  readonly getAccessToken?: () => Promise<string | null>;
  /** Override any subset of the native config defaults. */
  readonly nativeConfigOverrides?: Partial<SakhaVoiceConfig>;
  /** Verbose native logging. */
  readonly debug?: boolean;
}

export interface SakhaVoiceSnapshot {
  readonly state: SakhaVoiceState;
  readonly initialised: boolean;
  readonly partialTranscript: string;
  readonly finalTranscript: string;
  readonly streamedText: string;
  readonly spokenSegments: readonly SpokenSegment[];
  readonly engine: SakhaEngine;
  readonly mood: SakhaMood;
  readonly moodIntensity: number;
  readonly verseCited: { reference: string; sanskrit?: string } | null;
  readonly filterFail: boolean;
  readonly lastTurn: SakhaTurnCompleteEvent | null;
  readonly lastError: SakhaErrorEvent | null;
}

export interface UseSakhaVoiceResult extends SakhaVoiceSnapshot {
  readonly available: boolean;
  readonly activate: () => Promise<void>;
  readonly stopListening: () => Promise<void>;
  readonly cancelTurn: () => Promise<void>;
  readonly resetSession: () => Promise<void>;
}

type Action =
  | { kind: 'state'; payload: SakhaVoiceStateEvent }
  | { kind: 'partial'; text: string }
  | { kind: 'final'; text: string }
  | { kind: 'engine'; payload: SakhaEngineSelectedEvent }
  | { kind: 'text'; payload: SakhaTextEvent }
  | { kind: 'spoken'; payload: SakhaSpokenEvent }
  | { kind: 'pause'; payload: SakhaPauseEvent }
  | { kind: 'verse'; payload: SakhaVerseCitedEvent }
  | { kind: 'filter-fail' }
  | { kind: 'turn-complete'; payload: SakhaTurnCompleteEvent }
  | { kind: 'error'; payload: SakhaErrorEvent }
  | { kind: 'initialised' }
  | { kind: 'reset-turn' };

const INITIAL: SakhaVoiceSnapshot = {
  state: 'UNINITIALIZED',
  initialised: false,
  partialTranscript: '',
  finalTranscript: '',
  streamedText: '',
  spokenSegments: [],
  engine: 'FRIEND',
  mood: 'neutral',
  moodIntensity: 5,
  verseCited: null,
  filterFail: false,
  lastTurn: null,
  lastError: null,
};

function reducer(prev: SakhaVoiceSnapshot, action: Action): SakhaVoiceSnapshot {
  switch (action.kind) {
    case 'initialised':
      return { ...prev, initialised: true, state: 'IDLE' };
    case 'state':
      return { ...prev, state: action.payload.state };
    case 'partial':
      return { ...prev, partialTranscript: action.text };
    case 'final':
      return { ...prev, finalTranscript: action.text, partialTranscript: '' };
    case 'engine':
      return {
        ...prev,
        engine: action.payload.engine,
        mood: action.payload.mood,
        moodIntensity: action.payload.intensity,
      };
    case 'text':
      return { ...prev, streamedText: prev.streamedText + action.payload.delta };
    case 'spoken':
      return {
        ...prev,
        spokenSegments: [
          ...prev.spokenSegments,
          { text: action.payload.text, isSanskrit: action.payload.isSanskrit, at: Date.now() },
        ],
      };
    case 'pause':
      return prev; // metadata only
    case 'verse':
      return {
        ...prev,
        verseCited: {
          reference: action.payload.reference,
          sanskrit: action.payload.sanskrit,
        },
      };
    case 'filter-fail':
      return { ...prev, filterFail: true };
    case 'turn-complete':
      return { ...prev, lastTurn: action.payload };
    case 'error':
      return { ...prev, lastError: action.payload };
    case 'reset-turn':
      return {
        ...prev,
        partialTranscript: '',
        finalTranscript: '',
        streamedText: '',
        spokenSegments: [],
        verseCited: null,
        filterFail: false,
      };
  }
}

export function useSakhaVoice(options: UseSakhaVoiceOptions): UseSakhaVoiceResult {
  const { backendBaseUrl, language = 'en', getAccessToken, nativeConfigOverrides, debug } = options;
  const [snapshot, dispatch] = useReducer(reducer, INITIAL);
  const subsRef = useRef<EmitterSubscription[]>([]);
  const initialisedRef = useRef(false);

  // ---- Native availability check ----
  const available = isAndroid && !!NativeSakhaVoice;

  // ---- Initialise once + attach listeners ----
  useEffect(() => {
    if (!available || !NativeSakhaVoice) return;

    const emitter = new NativeEventEmitter(NativeSakhaVoice as never);

    const subs: EmitterSubscription[] = [
      emitter.addListener(SAKHA_VOICE_EVENTS.STATE, (e: SakhaVoiceStateEvent) =>
        dispatch({ kind: 'state', payload: e })
      ),
      emitter.addListener(SAKHA_VOICE_EVENTS.PARTIAL_TRANSCRIPT, (e: SakhaTranscriptEvent) =>
        dispatch({ kind: 'partial', text: e.text })
      ),
      emitter.addListener(SAKHA_VOICE_EVENTS.FINAL_TRANSCRIPT, (e: SakhaTranscriptEvent) => {
        dispatch({ kind: 'reset-turn' });
        dispatch({ kind: 'final', text: e.text });
      }),
      emitter.addListener(SAKHA_VOICE_EVENTS.ENGINE_SELECTED, (e: SakhaEngineSelectedEvent) =>
        dispatch({ kind: 'engine', payload: e })
      ),
      emitter.addListener(SAKHA_VOICE_EVENTS.TEXT, (e: SakhaTextEvent) =>
        dispatch({ kind: 'text', payload: e })
      ),
      emitter.addListener(SAKHA_VOICE_EVENTS.SPOKEN, (e: SakhaSpokenEvent) =>
        dispatch({ kind: 'spoken', payload: e })
      ),
      emitter.addListener(SAKHA_VOICE_EVENTS.PAUSE, (e: SakhaPauseEvent) =>
        dispatch({ kind: 'pause', payload: e })
      ),
      emitter.addListener(SAKHA_VOICE_EVENTS.VERSE_CITED, (e: SakhaVerseCitedEvent) =>
        dispatch({ kind: 'verse', payload: e })
      ),
      emitter.addListener(SAKHA_VOICE_EVENTS.FILTER_FAIL, () => dispatch({ kind: 'filter-fail' })),
      emitter.addListener(SAKHA_VOICE_EVENTS.TURN_COMPLETE, (e: SakhaTurnCompleteEvent) =>
        dispatch({ kind: 'turn-complete', payload: e })
      ),
      emitter.addListener(SAKHA_VOICE_EVENTS.ERROR, (e: SakhaErrorEvent) =>
        dispatch({ kind: 'error', payload: e })
      ),
    ];
    subsRef.current = subs;

    const config: SakhaVoiceConfig = {
      backendBaseUrl,
      language,
      debugMode: debug ?? false,
      ...nativeConfigOverrides,
    };

    let cancelled = false;
    void NativeSakhaVoice.initialize(config)
      .then(() => {
        if (cancelled) return;
        initialisedRef.current = true;
        dispatch({ kind: 'initialised' });
      })
      .catch((err: unknown) => {
        // Surface init failures via the reducer so the UI can react.
        const message = err instanceof Error ? err.message : String(err);
        dispatch({
          kind: 'error',
          payload: { code: 'init_failed', message, recoverable: false },
        });
      });

    return () => {
      cancelled = true;
      subs.forEach((s) => s.remove());
      subsRef.current = [];
      void NativeSakhaVoice.shutdown().catch(() => undefined);
      initialisedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendBaseUrl, language]);

  // ---- Push fresh access token whenever it might have changed ----
  useEffect(() => {
    if (!available || !NativeSakhaVoice || !getAccessToken) return;
    let cancelled = false;
    void (async () => {
      const token = await getAccessToken();
      if (!cancelled) NativeSakhaVoice.setAuthToken(token);
    })();
    return () => {
      cancelled = true;
    };
  }, [available, getAccessToken]);

  // ---- Imperative API ----
  const activate = useCallback(async () => {
    if (!available || !NativeSakhaVoice) return;
    if (getAccessToken) {
      const token = await getAccessToken();
      NativeSakhaVoice.setAuthToken(token);
    }
    dispatch({ kind: 'reset-turn' });
    await NativeSakhaVoice.activate();
  }, [available, getAccessToken]);

  const stopListening = useCallback(async () => {
    if (!available || !NativeSakhaVoice) return;
    await NativeSakhaVoice.stopListening();
  }, [available]);

  const cancelTurn = useCallback(async () => {
    if (!available || !NativeSakhaVoice) return;
    await NativeSakhaVoice.cancelTurn();
  }, [available]);

  const resetSession = useCallback(async () => {
    if (!available || !NativeSakhaVoice) return;
    await NativeSakhaVoice.resetSession();
  }, [available]);

  return {
    ...snapshot,
    available,
    activate,
    stopListening,
    cancelTurn,
    resetSession,
  };
}
