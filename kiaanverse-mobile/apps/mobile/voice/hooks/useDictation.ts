/**
 * useDictation — tap-to-dictate voice-to-text for tool text fields.
 *
 * Two-tier strategy so the Shankha works on every shipping device:
 *
 *   Tier 1 (preferred) — Native SakhaVoice.dictateOnce(languageTag)
 *   bridge (Android SpeechRecognizer). ~200ms setup, on-device, free.
 *   Used when the SakhaVoice native module is registered.
 *
 *   Tier 2 (fallback) — expo-av captures up to MAX_RECORD_SECONDS of
 *   audio, then ships it to /api/kiaan/transcribe. Works on every
 *   platform that has a microphone, including iOS, Expo Go, and
 *   Android builds where the native module hasn't been linked yet.
 *
 * Tap to start. Tap again to stop early. The hook auto-stops at
 * MAX_RECORD_SECONDS so the user is never silently recorded forever.
 *
 * Permission: caller is responsible for ensuring RECORD_AUDIO is
 * granted before invoking start(). The hook also requests via
 * expo-av's Audio.requestPermissionsAsync() in fallback mode and
 * surfaces PERMISSION_DENIED if the user refuses.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import { Audio } from 'expo-av';

import { api } from '@kiaanverse/api';

type DictationStateTag = 'idle' | 'listening' | 'resolving' | 'error';

export interface DictationState {
  tag: DictationStateTag;
  errorCode?: string;
  errorMessage?: string;
}

interface SakhaVoiceModuleShape {
  dictateOnce: (languageTag: string) => Promise<{
    transcript: string;
    language: string;
  }>;
}

const SakhaVoiceCandidate = NativeModules.SakhaVoice as
  | SakhaVoiceModuleShape
  | undefined;

/**
 * The native SakhaVoice module is Android-only and ships inside the
 * in-tree gradle subproject ':kiaan-voice-native'
 * (apps/mobile/native/android/), registered at app startup by the
 * withKiaanSakhaVoicePackages config plugin. It is considered
 * available only when the bridge actually exposes dictateOnce —
 * NativeModules surfaces empty proxies on Expo Go / iOS / web, so we
 * have to function-check.
 */
const SakhaVoice: SakhaVoiceModuleShape | undefined =
  Platform.OS === 'android' &&
  SakhaVoiceCandidate &&
  typeof SakhaVoiceCandidate.dictateOnce === 'function'
    ? SakhaVoiceCandidate
    : undefined;

/** Hard ceiling on a single dictation utterance — keeps the user safe
 *  from accidental long-tail recording and bounds the upload size. */
const MAX_RECORD_SECONDS = 30;

const FALLBACK_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};

export interface UseDictationOptions {
  /**
   * BCP-47 language tag — e.g. "en-IN", "hi-IN", "en-US". Defaults
   * to "en-IN" because the KIAANverse audience is primarily Indian
   * English; Hindi-leading users can pass "hi-IN" to match.
   */
  language?: string;
  /**
   * Called when dictation succeeds, with the captured transcript.
   * The screen typically appends/replaces the current TextInput
   * value with this string.
   */
  onTranscript: (transcript: string) => void;
  /** Optional error sink. */
  onError?: (code: string, message: string) => void;
}

export function useDictation(opts: UseDictationOptions): {
  start: () => Promise<void>;
  state: DictationState;
} {
  const { language = 'en-IN', onTranscript, onError } = opts;
  const [state, setState] = useState<DictationState>({ tag: 'idle' });
  // Guard against double-start if the user taps the Shankha twice quickly.
  const inFlight = useRef(false);
  // Tap-to-stop ref for the fallback recorder. Holding it on a ref lets
  // the second tap reach into a still-resolving recorder without rerunning
  // the whole start() callback.
  const recordingRef = useRef<Audio.Recording | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settleToIdle = useCallback(() => {
    // Brief settle so the Shankha has time to fade its waves before
    // returning to idle. A hard transition would visually pop.
    setTimeout(() => setState({ tag: 'idle' }), 120);
  }, []);

  const surfaceError = useCallback(
    (code: string, message: string) => {
      setState({ tag: 'error', errorCode: code, errorMessage: message });
      onError?.(code, message);
    },
    [onError],
  );

  /** Fallback path: record locally with expo-av, ship to backend. */
  const runFallback = useCallback(async (): Promise<void> => {
    // Second tap while already recording → stop early.
    if (recordingRef.current) {
      try {
        const recording = recordingRef.current;
        recordingRef.current = null;
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
          stopTimerRef.current = null;
        }
        setState({ tag: 'resolving' });
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (!uri) {
          throw new Error('Recording produced no audio file');
        }
        const formData = new FormData();
        // React-Native's FormData accepts the {uri,name,type} shape that
        // multer/Starlette expect — same shape used by useVoiceRecorder.
        formData.append('audio', {
          uri,
          name: 'dictation.m4a',
          type: 'audio/mp4',
        } as unknown as Blob);
        formData.append('language', language);
        const { data } = await api.voice.transcribe(formData);
        const transcript = (data?.transcript ?? '').trim();
        if (transcript) {
          onTranscript(transcript);
          settleToIdle();
        } else {
          surfaceError(
            'EMPTY_TRANSCRIPT',
            'I did not catch that. Try again, a little closer to the mic.',
          );
        }
      } catch (err) {
        const code = (err as { code?: string })?.code ?? 'TRANSCRIBE_FAILED';
        const message =
          (err as { message?: string })?.message ??
          'Could not transcribe right now.';
        surfaceError(code, message);
      } finally {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        }).catch(() => undefined);
      }
      return;
    }

    // First tap → request permission and start recording.
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      surfaceError(
        'PERMISSION_DENIED',
        'Microphone permission is required for voice dictation.',
      );
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const recording = new Audio.Recording();
    try {
      await recording.prepareToRecordAsync(FALLBACK_RECORDING_OPTIONS);
      await recording.startAsync();
      recordingRef.current = recording;
      setState({ tag: 'listening' });
      // Hard ceiling — auto-stop after MAX_RECORD_SECONDS.
      stopTimerRef.current = setTimeout(() => {
        // Re-entering runFallback with a recording in flight triggers the
        // stop branch above. We wrap in void since runFallback is async.
        void runFallback();
      }, MAX_RECORD_SECONDS * 1000);
    } catch (err) {
      recordingRef.current = null;
      const message =
        (err as { message?: string })?.message ??
        'Could not start recording.';
      surfaceError('RECORD_FAILED', message);
    }
  }, [language, onTranscript, settleToIdle, surfaceError]);

  const start = useCallback(async (): Promise<void> => {
    // The fallback path needs to be re-entrant (tap to start, tap to stop),
    // so it manages its own inFlight semantics via recordingRef.
    if (!SakhaVoice) {
      await runFallback();
      return;
    }

    if (inFlight.current) return;
    inFlight.current = true;
    setState({ tag: 'listening' });
    try {
      const result = await SakhaVoice.dictateOnce(language);
      setState({ tag: 'resolving' });
      onTranscript(result.transcript);
      settleToIdle();
    } catch (err) {
      const code = (err as { code?: string })?.code ?? 'DICTATION_FAILED';
      const message =
        (err as { message?: string })?.message ?? 'Dictation failed';
      surfaceError(code, message);
    } finally {
      inFlight.current = false;
    }
  }, [language, onTranscript, runFallback, settleToIdle, surfaceError]);

  // Cleanup any in-flight recording / timer on unmount so we never leak a
  // hot microphone past the screen lifetime.
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      const recording = recordingRef.current;
      recordingRef.current = null;
      if (recording) {
        void recording.stopAndUnloadAsync().catch(() => undefined);
      }
    };
  }, []);

  return { start, state };
}
