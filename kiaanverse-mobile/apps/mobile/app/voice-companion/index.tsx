/**
 * VoiceCompanionScreen — Sakha's main canvas (Option-2 native-stack rewrite).
 *
 * History: this screen used to drive a custom WSS pipeline that
 * streamed Opus chunks to backend Sarvam STT, OpenAI gpt-4o-mini, and
 * ElevenLabs TTS — with a foreground service, Media3 audio chunking,
 * and 22 Kotlin files of supporting infrastructure. That stack worked
 * (commit 410220f5 finally landed it on Play Store after 20 EAS
 * builds), but it had two problems that mattered for scale:
 *
 *   1. Cost — Sarvam + ElevenLabs minimum $1.80/user/month at 5min
 *      daily voice usage. At 1M users that's $3M/month before LLM.
 *   2. Architectural fork — kiaanverse.com mobile (Chrome on Android)
 *      uses webkitSpeechRecognition + SpeechSynthesis, which are thin
 *      wrappers over the SAME android.speech.SpeechRecognizer +
 *      android.speech.tts.TextToSpeech engines this codebase already
 *      wraps as SakhaDictation + expo-speech. Two architectures for
 *      the same engine = 2× maintenance.
 *
 * This rewrite collapses the screen onto the same stack used by the
 * Sakha Chat tab + every Sacred Tool's Shankha voice input:
 *
 *   ─ Tap mic       → useDictation (= SakhaDictation = SpeechRecognizer)
 *   ─ Transcript    → useSakhaStream.send (POST /api/chat/message/stream)
 *   ─ Stream done   → expo-speech.speak (= TextToSpeech)
 *
 * Cost per voice user drops to LLM-only (~$0.30/mo). Server load
 * drops dramatically (no persistent WSS, no Sarvam round-trips).
 * Engineering surface drops to one path across the whole app.
 *
 * What got DELETED in this rewrite (compared to the prior shape):
 *   - useVoiceSession (WSS lifecycle)
 *   - useStreamingPlayer (Media3 chunk player)
 *   - useAudioFocus + useForegroundService (expo-speech handles its
 *     own audio routing; no FGS needed because turns are <30s)
 *   - useToolInvocation, useCrisisHandler (were wired to WSS frame
 *     types; need a chat-pattern equivalent if reintroduced —
 *     separate decision)
 *   - useSakhaWakeWord (will return when wake-word is rebuilt on top
 *     of the same dictation+chat pattern)
 *   - useVoiceStore (the entire Zustand voice state machine — local
 *     useState now)
 *
 * The 22 Kotlin files that powered the WSS path are still in the
 * native module. They're marked deprecated in this PR but NOT deleted
 * yet — kept as dormant infrastructure so a future "Premium Voice"
 * tier can re-enable them with Sarvam/ElevenLabs for paying users.
 *
 * Backend `/voice-companion/converse` WSS endpoint is similarly
 * preserved on the server side (Bhashini provider still registered
 * for when those credentials arrive). Both sides go dormant; neither
 * is removed.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@kiaanverse/store';

import { Shankha } from '../../voice/components/Shankha';
import { Color, Spacing, Type } from '../../voice/lib/theme';
import { useDictation } from '../../voice/hooks/useDictation';
import {
  previewVoice,
  speakDivinely,
  stopSpeaking,
} from '../../voice/lib/divineVoice';
import {
  CLOUD_VOICE_PREFIX,
  type CloudVoiceOption,
  PROVIDER_COLORS,
  PROVIDER_LABELS,
  pickCloudVoices,
} from '../../voice/lib/cloudVoices';
import { useSakhaStream } from '../../components/chat/useSakhaStream';

/** Match authStore's SecureStore key — used by Voice Companion's cloud
 *  TTS path (when the user has picked an ElevenLabs / Sarvam / Bhashini
 *  voice in /settings/voice). On-device path ignores the token. */
const ACCESS_TOKEN_KEY = 'kiaanverse_access_token';
async function readAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Voice Companion's curated voice list — a six-voice subset of the
 * shared ``CLOUD_VOICES`` catalog. Independent of the global
 * /settings/voice preference so users can have a different on-screen
 * voice for the verse pages, the chat tab, and the live conversation.
 *
 * Single source of truth for voice metadata is ``cloudVoices.ts``;
 * this screen just picks the 6 it wants by backend id and inherits
 * the description / provider / gender from there. Eliminates the
 * "same voice id, different description in two catalogs" drift bug.
 *
 * Persisted under ``voiceCompanion:cloudVoiceId`` (separate key from
 * the per-language ``divineVoice:override:*`` keys).
 */
const COMPANION_VOICE_IDS = [
  'elevenlabs-dorothy',   // Saraswati
  'elevenlabs-clyde',     // Krishna
  'sarvam-karun',         // Rishi
  'sarvam-manisha',       // Meera
  'elevenlabs-rachel',    // Nova
  'elevenlabs-bella',     // Lily
] as const;

const COMPANION_VOICES: readonly CloudVoiceOption[] = pickCloudVoices(
  COMPANION_VOICE_IDS,
);

const DEFAULT_COMPANION_VOICE = 'elevenlabs-dorothy';
const COMPANION_VOICE_KEY = 'voiceCompanion:cloudVoiceId';

async function loadCompanionVoice(): Promise<string> {
  try {
    const v = await AsyncStorage.getItem(COMPANION_VOICE_KEY);
    if (v && COMPANION_VOICES.some((opt) => opt.backendVoiceId === v)) {
      return v;
    }
  } catch {
    // ignore — fall through to default
  }
  return DEFAULT_COMPANION_VOICE;
}

async function saveCompanionVoice(backendVoiceId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(COMPANION_VOICE_KEY, backendVoiceId);
  } catch {
    // best-effort; in-memory state still updates
  }
}

/**
 * UI state machine for the voice-companion screen.
 *
 *   idle      — nothing active; "Tap to begin" button shown
 *   listening — mic open, SpeechRecognizer capturing utterance
 *   thinking  — LLM streaming response (no audio yet)
 *   speaking  — Speech.speak playing the response aloud
 *   error     — last action failed; error text shown beneath the CTA
 *
 * State transitions are driven by callbacks from useDictation +
 * useSakhaStream + Speech.speak's onDone/onError. There's no
 * background task; the user can interrupt at any point with the
 * "End session" button which calls Speech.stop + abort + back to idle.
 */
type ScreenState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export default function VoiceCompanionScreen() {
  const authUserId = useAuthStore((s) => s.user?.id ?? null);
  const userId = authUserId;

  const {
    send,
    messages,
    streaming,
    error: chatError,
    abort,
    onStreamCompleted,
  } = useSakhaStream();

  const [state, setState] = useState<ScreenState>('idle');
  const [startError, setStartError] = useState<string | null>(null);

  // ── Voice picker ───────────────────────────────────────────────────
  // The user's chosen Sakha voice for this Voice Companion session.
  // Default is Saraswati; persisted in AsyncStorage so the choice
  // survives app launches. Read live by sessionVoiceRef (callbacks
  // registered once at mount close over stale state otherwise).
  const [selectedVoiceId, setSelectedVoiceId] =
    useState<string>(DEFAULT_COMPANION_VOICE);
  const selectedVoiceRef = useRef<string>(DEFAULT_COMPANION_VOICE);

  // Which voice is currently being previewed (audible right now).
  // Used to drive the chip's "▶ Play" → "◼ Stop" toggle and to make
  // tap-same-chip stop instead of re-trigger.
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(
    null,
  );
  // Auto-clear the preview-state after the voice finishes. Each
  // greeting is < 3s; this is a UX guard in case the playback's onDone
  // doesn't fire (e.g. cloud failure → fallthrough to on-device which
  // doesn't go through cloudSpeak's status update).
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Provider-status diagnostic. Pinged from /api/voice/providers/status
  // on screen mount. Surfaces "Sarvam not configured" warnings so the
  // user can see WHY their paid voice isn't being used — without this,
  // a misconfigured Render env var produces silent on-device-fallback
  // playback that's indistinguishable from "voices sound weird".
  const [providerWarnings, setProviderWarnings] = useState<readonly string[]>(
    [],
  );

  // Hydrate the persisted pick on mount. Idempotent.
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const id = await loadCompanionVoice();
      if (!mounted) return;
      setSelectedVoiceId(id);
      selectedVoiceRef.current = id;
    })();
    // Best-effort fetch of provider status. Don't gate the screen on it.
    void (async () => {
      try {
        const { API_CONFIG } = await import('@kiaanverse/api');
        const r = await fetch(
          `${API_CONFIG.baseURL}/api/voice/providers/status`,
        );
        if (!r.ok) return;
        const data: { warnings?: readonly string[] } = await r.json();
        if (!mounted) return;
        if (Array.isArray(data.warnings)) {
          setProviderWarnings(data.warnings);
        }
      } catch {
        // Best-effort; absence of warnings is the silent-OK case.
      }
    })();
    return () => {
      mounted = false;
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  const handleStopPreview = useCallback(() => {
    void stopSpeaking();
    setPreviewingVoiceId(null);
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  const handleSelectVoice = useCallback(
    (backendVoiceId: string) => {
      // Tapping the chip that is CURRENTLY previewing → stop. This
      // gives the user a cancel affordance directly on the chip
      // without needing a separate stop button.
      if (previewingVoiceId === backendVoiceId) {
        handleStopPreview();
        return;
      }

      // Switching to a different voice — stop any in-flight playback
      // (network + audio) so the old voice doesn't bleed into the new
      // one mid-syllable. cloudStop now actually aborts the fetch +
      // bumps the request id so stale responses are dropped.
      void stopSpeaking();
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }

      setSelectedVoiceId(backendVoiceId);
      selectedVoiceRef.current = backendVoiceId;
      void saveCompanionVoice(backendVoiceId);
      setPreviewingVoiceId(backendVoiceId);

      // Speak a short greeting in the new voice so the user hears
      // what they picked. Routes through the same cloud TTS path
      // ``speakDivinely`` uses for live conversation, so this is a
      // genuine preview — what they'll actually hear during a turn.
      previewVoice(
        `${CLOUD_VOICE_PREFIX}${backendVoiceId}`,
        'en-IN',
        undefined,
        {
          getAccessToken: readAccessToken,
        },
      );

      // Auto-clear the previewing state after a generous ceiling so
      // the chip stops showing "Stop" even if playback callbacks
      // never fire. 5s is longer than any greeting we generate.
      previewTimerRef.current = setTimeout(() => {
        setPreviewingVoiceId((id) =>
          id === backendVoiceId ? null : id,
        );
        previewTimerRef.current = null;
      }, 5000);
    },
    [previewingVoiceId, handleStopPreview],
  );

  // Session-active flag — tracks whether the user has tapped "Tap to
  // begin" without yet tapping "End session". Determines whether we
  // auto-restart dictation after Sakha finishes speaking (the
  // "two friends talking" continuous flow).
  //
  // Stored as a ref because it's read inside callbacks registered ONCE
  // at mount (onStreamCompleted, dictation onError) — using state would
  // close over a stale value. Refs read live, always current.
  const sessionActiveRef = useRef<boolean>(false);

  // Track dictation.start as a stable ref so the onStreamCompleted
  // callback can call it without needing dictation in its dep array
  // (which would re-register the callback on every render and risk
  // missing stream completions).
  const dictationStartRef = useRef<(() => Promise<void>) | null>(null);

  // Track the latest assistant text in a ref so the onStreamCompleted
  // callback (registered once) can speak the freshest value without
  // closing over stale `messages`.
  const latestAssistantRef = useRef<string>('');
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant') {
        latestAssistantRef.current = m.text;
        break;
      }
    }
  }, [messages]);

  // ── STT: useDictation wraps android.speech.SpeechRecognizer ──
  const dictation = useDictation({
    language: 'en-IN',
    onTranscript: (transcript) => {
      // Recognizer returned final text → kick off the LLM stream.
      // No need to show the transcript on this screen — the user
      // just heard themselves say it. Going straight to "thinking"
      // keeps the UI calm.
      setState('thinking');
      void send(transcript);
    },
    onError: (code, message) => {
      // SOFT errors during a friends-talking session: NO_MATCH (mic
      // heard sound but couldn't transcribe) and SPEECH_TIMEOUT
      // (user paused longer than the recognizer's silence threshold)
      // are NORMAL parts of conversation. Don't kick the user out of
      // the session — silently auto-restart listening so the flow
      // stays continuous. This matches how kiaanverse.com mobile +
      // Sarvam-style real-time voice work.
      const isSoftError = code === 'NO_MATCH' || code === 'SPEECH_TIMEOUT';
      if (isSoftError && sessionActiveRef.current) {
        // eslint-disable-next-line no-console
        console.log('[VoiceCompanion] soft dictation timeout — re-listening', code);
        // Defer to next tick so the recognizer can fully tear down
        // before the next start() — Android SpeechRecognizer can
        // throw if you start a new session too quickly after error.
        setTimeout(() => {
          if (sessionActiveRef.current && dictationStartRef.current) {
            void dictationStartRef.current();
          }
        }, 100);
        return;
      }
      // HARD errors (network down, mic blocked, audio HW failure, etc.)
      // → break out of the session and surface the error to the user.
      // eslint-disable-next-line no-console
      console.warn('[VoiceCompanion] dictation hard error', code, message);
      sessionActiveRef.current = false;
      setStartError(`Could not hear you (${code}): ${message}`);
      setState('error');
    },
  });

  // Update the stable start ref whenever the dictation hook returns a
  // new start function (it's useCallback so this is rare, but ref
  // tracking is the safe pattern).
  useEffect(() => {
    dictationStartRef.current = dictation.start;
  }, [dictation.start]);

  // Mirror dictation lifecycle into the screen state machine. We only
  // listen for 'listening'/'resolving' here; 'idle'/'error' are
  // handled by the onTranscript / onError callbacks above.
  useEffect(() => {
    if (dictation.state.tag === 'listening') setState('listening');
    else if (dictation.state.tag === 'resolving') setState('thinking');
  }, [dictation.state.tag]);

  // ── TTS: expo-speech wraps android.speech.tts.TextToSpeech ──
  // Register a single onStreamCompleted handler at mount that speaks
  // whatever the latest assistant message is. Speech.stop() is called
  // before each new utterance to prevent overlap if the user fires
  // multiple turns rapidly (the chat tab uses the same pattern).
  //
  // FRIEND-TALKING FLOW: after Sakha finishes speaking, if the
  // session is still active (user hasn't tapped "End session"),
  // auto-restart dictation so the user can respond IMMEDIATELY
  // without tapping anything. This is the natural rhythm of a real
  // conversation — speak, listen, speak, listen — without any
  // manual handoff. End-session button breaks the loop.
  useEffect(() => {
    onStreamCompleted(() => {
      const text = latestAssistantRef.current;
      if (!text || !text.trim()) {
        // Empty stream (e.g., model returned nothing) — if session
        // is still active, jump straight back to listening rather
        // than dropping to idle and forcing a tap.
        if (sessionActiveRef.current && dictationStartRef.current) {
          void dictationStartRef.current();
        } else {
          setState('idle');
        }
        return;
      }
      setState('speaking');
      void stopSpeaking();
      // ``speakDivinely`` routes between cloud TTS (ElevenLabs / Sarvam
      // / Bhashini, when the user has picked one in /settings/voice)
      // and on-device Google TTS (Studio / Neural2 / WaveNet). Same
      // prosody + same onDone contract used by the chat tab's Listen
      // button → unified Sakha voice across the entire ecosystem.
      const onSpeechFinished = () => {
        // If session is still active, immediately resume listening
        // so the user can respond without tapping. The dictation
        // state machine then walks through 'listening' →
        // 'resolving' → onTranscript → send → onStreamCompleted →
        // back here. That's the friend-talking loop.
        if (sessionActiveRef.current && dictationStartRef.current) {
          void dictationStartRef.current();
        } else {
          setState('idle');
        }
      };
      void speakDivinely(text, 'en-IN', {
        // Force the user's picked Sakha voice for this Voice Companion
        // session. Read live from the ref so a switch mid-conversation
        // takes effect on the very next utterance. The voice picker
        // calls stopSpeaking() before changing the ref, so an
        // in-flight clip is cancelled before this cloudVoiceId would
        // route the next one.
        cloudVoiceId: selectedVoiceRef.current,
        getAccessToken: readAccessToken,
        onDone: onSpeechFinished,
        // A transient TTS hiccup (cloud fetch failure, decode error,
        // etc.) shouldn't break the session — fall through to the
        // listening loop the same way a normal completion does.
        onError: onSpeechFinished,
      });
    });
    return () => {
      onStreamCompleted(null);
      void stopSpeaking();
    };
  }, [onStreamCompleted]);

  // ── Permission gate (mic only — no FGS, no notifications) ──
  // The prior shape needed RECORD_AUDIO + POST_NOTIFICATIONS because
  // the FGS notification was load-bearing. Now we just need the mic.
  // expo-av's request is idempotent (returns 'granted' instantly if
  // already granted) so calling on every Tap-to-begin is fine.
  const ensureMicPermission = useCallback(async (): Promise<boolean> => {
    const audio = await Audio.requestPermissionsAsync();
    return audio.status === 'granted';
  }, []);

  const handleStart = useCallback(async () => {
    if (!userId) return;
    setStartError(null);

    const granted = await ensureMicPermission();
    if (!granted) {
      Alert.alert(
        'Microphone access needed',
        'Sakha needs microphone access to listen. Open Settings → ' +
          'Apps → Kiaanverse → Permissions to grant access, then ' +
          'tap "Tap to begin" again.',
      );
      setStartError('Microphone permission denied');
      setState('error');
      return;
    }

    // Mark the session as active — enables the auto-restart loop
    // that runs after Sakha finishes speaking. The loop only stops
    // when handleStop sets this back to false.
    sessionActiveRef.current = true;
    void dictation.start();
  }, [userId, dictation, ensureMicPermission]);

  const handleStop = useCallback(() => {
    // Universal "end session" button: stops whatever's currently
    // happening (mic capture / LLM stream / TTS playback) and
    // returns to idle. Each abort path swallows its own errors so
    // a partial-state cleanup doesn't crash.
    //
    // CRITICAL: clear the session-active flag BEFORE Speech.stop
    // so the onStopped callback doesn't kick off a fresh dictation
    // (the auto-restart guard reads sessionActiveRef.current).
    sessionActiveRef.current = false;
    void stopSpeaking();
    try {
      abort();
    } catch {
      /* useSakhaStream.abort is no-op when not streaming */
    }
    setState('idle');
    setStartError(null);
  }, [abort]);

  // Defense-in-depth: if the screen unmounts (user navigates away),
  // tear down the session so an in-flight dictation/TTS cycle stops
  // cleanly. Without this, navigating away mid-conversation could
  // leave a Speech.speak running in the background that auto-restarts
  // a dictation on done — which would then either crash (no native
  // module attached on Expo Go) or just play in the background.
  // Defense-in-depth: kill the session whenever the screen loses focus —
  // i.e. when the user switches tabs, navigates away, or the device goes
  // to background. The previous `useEffect` cleanup only fired on actual
  // unmount, which expo-router does NOT do for tab screens (they stay
  // mounted in memory), so navigating to another tab while Sakha was
  // mid-sentence left TTS playing in the background until the cloud
  // audio finished naturally. `useFocusEffect` runs the returned cleanup
  // every time the screen blurs, regardless of mount state.
  useFocusEffect(
    useCallback(() => {
      return () => {
        sessionActiveRef.current = false;
        // Fire-and-forget — Speech.stop is sync, cloudStop is async but
        // we don't need to await before the screen blurs.
        void stopSpeaking();
        try {
          abort();
        } catch {
          /* abort throws when no stream is in flight — harmless */
        }
      };
    }, [abort])
  );

  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      void stopSpeaking();
    };
  }, []);

  const isActive = state !== 'idle' && state !== 'error';
  const stateLabel = useMemo(() => stateToLabel(state), [state]);

  // Reflect chat hook's own error state in the UI (e.g., network drop
  // while streaming). startError covers the dictation/permission side.
  const displayedError = startError ?? chatError;

  return (
    <SafeAreaView style={styles.root}>
      {/* Floating Stop button — top-right of the canvas. Only visible when
          a voice session is in flight. Gives the user a clear, always-
          reachable kill switch even mid-sentence. (The bottom-bar "End
          session" pill does the same thing but lives below the wave
          visualizer; on long Sakha replies users were missing it.) */}
      {isActive ? (
        <Pressable
          onPress={handleStop}
          style={styles.floatingStopBtn}
          accessibilityRole="button"
          accessibilityLabel="Stop Sakha (silence the voice and end the session)"
          testID="voice-companion-stop-floating"
          hitSlop={12}
        >
          <View style={styles.floatingStopGlyph} />
          <Text style={styles.floatingStopLabel}>Stop</Text>
        </Pressable>
      ) : null}

      <View style={styles.canvas}>
        {/* The Shankha PNG asset includes its own mandala backdrop
            (see ``assets/shankha/shankha-mandala.png``), so we no
            longer need a separate SacredGeometry layer. One Image
            component renders the complete divine composition. */}
        <Shankha size={200} />
      </View>

      <View style={styles.bottomBar}>
        {/* Voice picker — six divine cloud voices.
            Visible when idle / errored so the user can choose before
            starting; hidden during an active session so the screen
            stays focused on the conversation. Tap to switch + preview;
            picked voice persists across launches. */}
        {!isActive ? (
          <View style={styles.voicePickerWrap}>
            {/* Provider-status warnings — surface backend
                misconfiguration so the user knows WHY a paid voice
                might be falling through to on-device fallback.
                Otherwise "voices sound weird" is opaque. */}
            {providerWarnings.length > 0 ? (
              <View style={styles.providerWarningWrap}>
                {providerWarnings.map((w, i) => (
                  <Text key={i} style={styles.providerWarningText}>
                    ⚠  {w}
                  </Text>
                ))}
              </View>
            ) : null}
            <Text style={styles.voicePickerLabel}>SAKHA VOICE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.voicePickerRow}
            >
              {COMPANION_VOICES.map((opt) => {
                const selected = opt.backendVoiceId === selectedVoiceId;
                const previewing =
                  opt.backendVoiceId === previewingVoiceId;
                const accent = PROVIDER_COLORS[opt.provider];
                return (
                  <Pressable
                    key={opt.backendVoiceId}
                    onPress={() => handleSelectVoice(opt.backendVoiceId)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      previewing
                        ? `Stop ${opt.name} preview`
                        : `Sakha voice: ${opt.name}, ${PROVIDER_LABELS[opt.provider]}`
                    }
                    accessibilityState={{ selected, busy: previewing }}
                    style={[
                      styles.voicePill,
                      selected
                        ? {
                            backgroundColor: `${accent}22`,
                            borderColor: `${accent}AA`,
                          }
                        : null,
                      previewing
                        ? {
                            backgroundColor: `${accent}33`,
                            borderColor: accent,
                          }
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.voicePillName,
                        selected ? { color: accent, fontWeight: '700' } : null,
                      ]}
                    >
                      {opt.name}
                    </Text>
                    <Text
                      style={[
                        styles.voicePillProvider,
                        { color: accent },
                      ]}
                    >
                      {previewing
                        ? '◼ TAP TO STOP'
                        : PROVIDER_LABELS[opt.provider]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.voicePickerDescription}>
              {COMPANION_VOICES.find(
                (v) => v.backendVoiceId === selectedVoiceId,
              )?.description ?? ''}
            </Text>
            {/* Universal stop affordance — visible whenever ANY voice
                is previewing. Cancels both the in-flight fetch and
                the playing audio (cloudStop now actually aborts). */}
            {previewingVoiceId ? (
              <Pressable
                onPress={handleStopPreview}
                accessibilityRole="button"
                accessibilityLabel="Stop voice preview"
                style={styles.stopPreviewBtn}
                hitSlop={8}
              >
                <Text style={styles.stopPreviewBtnText}>◼  Stop preview</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.stateLabel}>{stateLabel}</Text>
        {displayedError ? (
          <Text style={styles.errorText}>{displayedError}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isActive ? 'Stop voice session' : 'Start voice session'
          }
          onPress={isActive ? handleStop : handleStart}
          style={[styles.primaryBtn, isActive ? styles.primaryBtnActive : null]}
        >
          <Text style={styles.primaryBtnText}>
            {isActive ? 'End session' : 'Tap to begin'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function stateToLabel(s: ScreenState): string {
  // Streaming-flag was used by the prior implementation to distinguish
  // partial-LLM-arrived-but-still-streaming from done. The new state
  // machine collapses that into 'thinking' (LLM still streaming) →
  // 'speaking' (LLM done, TTS playing) → 'idle' (TTS done). One label
  // per state is enough.
  switch (s) {
    case 'idle':
      return 'Tap to begin';
    case 'listening':
      return 'I am here, listening';
    case 'thinking':
      return '…';
    case 'speaking':
      return 'Sakha speaks';
    case 'error':
      return 'Something went wrong';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Color.cosmicVoid,
    paddingHorizontal: Spacing.md,
  },
  // Floating Stop button — top-right kill switch shown only during an
  // active session so the user can silence Sakha mid-sentence without
  // hunting for the "End session" pill below the visualizer.
  floatingStopBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 30,
    elevation: 30,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.45)',
  },
  floatingStopGlyph: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FCA5A5',
  },
  floatingStopLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#FCA5A5',
  },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  stateLabel: {
    ...Type.caption,
    color: Color.textTertiary,
    marginBottom: Spacing.md,
  },
  primaryBtn: {
    backgroundColor: Color.divineGoldDim,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 999,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryBtnActive: {
    backgroundColor: Color.divineGold,
  },
  primaryBtnText: {
    ...Type.body,
    color: Color.cosmicVoid,
    fontWeight: '600',
  },
  errorText: {
    ...Type.caption,
    color: Color.errorRed,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },

  // Voice picker (idle-state only)
  voicePickerWrap: {
    width: '100%',
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  voicePickerLabel: {
    ...Type.caption,
    color: Color.textTertiary,
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: Spacing.sm,
  },
  voicePickerRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  voicePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.22)',
    alignItems: 'center',
    gap: 2,
    minWidth: 84,
  },
  voicePillName: {
    ...Type.caption,
    color: Color.textPrimary,
    fontWeight: '600',
  },
  voicePillProvider: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  voicePickerDescription: {
    ...Type.caption,
    color: Color.textTertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    fontSize: 12,
  },
  stopPreviewBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(220,80,80,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(220,80,80,0.40)',
  },
  stopPreviewBtnText: {
    ...Type.caption,
    color: '#E89292',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  // Provider-status warnings — amber/orange to read as "actionable
  // diagnostic", not as a hard error. One row per warning string.
  providerWarningWrap: {
    width: '100%',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  providerWarningText: {
    ...Type.caption,
    color: '#E8A547',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
});
