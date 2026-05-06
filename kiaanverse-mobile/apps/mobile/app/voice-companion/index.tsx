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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useAuthStore } from '@kiaanverse/store';

import { Shankha } from '../../voice/components/Shankha';
import { SacredGeometry } from '../../voice/components/SacredGeometry';
import { Color, Spacing, Type } from '../../voice/lib/theme';
import { useDictation } from '../../voice/hooks/useDictation';
import { useSakhaStream } from '../../components/chat/useSakhaStream';

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
      // eslint-disable-next-line no-console
      console.warn('[VoiceCompanion] dictation error', code, message);
      setStartError(`Could not hear you (${code}): ${message}`);
      setState('error');
    },
  });

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
  useEffect(() => {
    onStreamCompleted(() => {
      const text = latestAssistantRef.current;
      if (!text || !text.trim()) {
        setState('idle');
        return;
      }
      setState('speaking');
      Speech.stop();
      Speech.speak(text, {
        language: 'en-IN',
        // 0.95 matches the contemplative cadence the web's
        // useVoiceOutput uses for spiritual content. 1.0 is too fast
        // for the kind of dialogue Sakha produces.
        rate: 0.95,
        pitch: 1.0,
        onDone: () => setState('idle'),
        onStopped: () => setState('idle'),
        onError: () => setState('idle'),
      });
    });
    return () => {
      onStreamCompleted(null);
      Speech.stop();
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

    void dictation.start();
  }, [userId, dictation, ensureMicPermission]);

  const handleStop = useCallback(() => {
    // Universal "end session" button: stops whatever's currently
    // happening (mic capture / LLM stream / TTS playback) and
    // returns to idle. Each abort path swallows its own errors so
    // a partial-state cleanup doesn't crash.
    Speech.stop();
    try {
      abort();
    } catch {
      /* useSakhaStream.abort is no-op when not streaming */
    }
    setState('idle');
    setStartError(null);
  }, [abort]);

  const isActive = state !== 'idle' && state !== 'error';
  const stateLabel = useMemo(() => stateToLabel(state), [state]);

  // Reflect chat hook's own error state in the UI (e.g., network drop
  // while streaming). startError covers the dictation/permission side.
  const displayedError = startError ?? chatError;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.canvas}>
        <SacredGeometry size={360} />
        <Shankha size={170} />
      </View>

      <View style={styles.bottomBar}>
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
});
