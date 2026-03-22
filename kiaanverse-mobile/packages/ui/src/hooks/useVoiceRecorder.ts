/**
 * useVoiceRecorder — Tap-to-record voice input with server transcription.
 *
 * Flow:
 *   1. requestPermission() — prompt for microphone access
 *   2. startRecording() — begin capturing audio (m4a/aac)
 *   3. stopRecording() — stop capture, get local file URI
 *   4. Automatically POST URI to /api/voice/transcribe → { transcript, confidence }
 *
 * Audio recording config:
 *   - Format: AAC (cross-platform, small file size)
 *   - Sample rate: 44100 Hz
 *   - Channels: 1 (mono, sufficient for speech)
 *   - Bit rate: 128000
 *
 * Memory safety:
 *   - Recording object unloaded on stop + unmount
 *   - isMounted guard prevents setState after unmount
 *   - Audio mode restored after recording ends
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecordingStatus = 'idle' | 'requesting' | 'recording' | 'transcribing';

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
}

/**
 * Function to send recorded audio to a transcription service.
 * Accepts a FormData containing the audio file.
 * Must return { transcript, confidence } or throw on failure.
 */
export type TranscribeFn = (formData: FormData) => Promise<TranscriptionResult>;

interface UseVoiceRecorderOptions {
  /** Function to transcribe audio. Injected from the API layer to avoid
   *  cross-package dependency between UI and API packages. */
  transcribe: TranscribeFn;
}

interface UseVoiceRecorderReturn {
  /** Request microphone permission. Returns true if granted. */
  requestPermission: () => Promise<boolean>;
  /** Start audio recording. Requests permission if not yet granted. */
  startRecording: () => Promise<void>;
  /** Stop recording and send to transcription API. Returns result or null. */
  stopRecording: () => Promise<TranscriptionResult | null>;
  /** Cancel recording without transcribing. */
  cancelRecording: () => Promise<void>;
  /** Current recorder state. */
  status: RecordingStatus;
  /** Whether microphone permission is granted. */
  hasPermission: boolean;
  /** Whether currently recording audio. */
  isRecording: boolean;
  /** Duration of current recording in seconds. */
  durationSeconds: number;
  /** Last error message, if any. */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Recording config — AAC mono, optimized for speech
// ---------------------------------------------------------------------------

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceRecorder({ transcribe }: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [hasPermission, setHasPermission] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const isMountedRef = useRef(true);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Permission ─────────────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const { status: permStatus } = await Audio.requestPermissionsAsync();
      const granted = permStatus === 'granted';
      if (isMountedRef.current) setHasPermission(granted);
      if (!granted) {
        if (isMountedRef.current) setError('Microphone permission denied');
      }
      return granted;
    } catch (err) {
      if (isMountedRef.current) {
        setError('Failed to request microphone permission');
      }
      return false;
    }
  }, []);

  // ─── Start Recording ────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null);

    // Check/request permission
    if (!hasPermission) {
      if (isMountedRef.current) setStatus('requesting');
      const granted = await requestPermission();
      if (!granted || !isMountedRef.current) {
        if (isMountedRef.current) setStatus('idle');
        return;
      }
    }

    try {
      // Configure audio session for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true, // Must be true during recording on iOS
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Clean up any existing recording
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // Already unloaded
        }
        recordingRef.current = null;
      }

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);
      await recording.startAsync();

      if (!isMountedRef.current) {
        await recording.stopAndUnloadAsync();
        return;
      }

      recordingRef.current = recording;
      setStatus('recording');
      setDurationSeconds(0);

      // Track duration via interval
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setDurationSeconds(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 500);
    } catch (err) {
      if (isMountedRef.current) {
        setStatus('idle');
        setError('Failed to start recording');
      }
    }
  }, [hasPermission, requestPermission]);

  // ─── Stop Recording + Transcribe ────────────────────────────────────
  const stopRecording = useCallback(async (): Promise<TranscriptionResult | null> => {
    // Clear duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (!recordingRef.current) {
      return null;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Restore audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      if (!uri || !isMountedRef.current) {
        if (isMountedRef.current) setStatus('idle');
        return null;
      }

      // Send to transcription API
      if (isMountedRef.current) setStatus('transcribing');

      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/mp4',
        name: 'recording.m4a',
      } as unknown as Blob);

      const result = await transcribe(formData);

      if (isMountedRef.current) {
        setStatus('idle');
        setError(null);
      }

      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setStatus('idle');
        setError('Transcription failed. Please try again.');
      }
      return null;
    }
  }, [transcribe]);

  // ─── Cancel Recording ───────────────────────────────────────────────
  const cancelRecording = useCallback(async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // Already stopped
      }
      recordingRef.current = null;
    }

    // Restore audio mode
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch {
      // Config failed — non-critical
    }

    if (isMountedRef.current) {
      setStatus('idle');
      setDurationSeconds(0);
      setError(null);
    }
  }, []);

  // ─── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    // Check initial permission status
    Audio.getPermissionsAsync()
      .then(({ status: permStatus }) => {
        if (isMountedRef.current) {
          setHasPermission(permStatus === 'granted');
        }
      })
      .catch(() => {});

    return () => {
      isMountedRef.current = false;

      // Clean up interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Clean up recording
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  return {
    requestPermission,
    startRecording,
    stopRecording,
    cancelRecording,
    status,
    hasPermission,
    isRecording: status === 'recording',
    durationSeconds,
    error,
  };
}
