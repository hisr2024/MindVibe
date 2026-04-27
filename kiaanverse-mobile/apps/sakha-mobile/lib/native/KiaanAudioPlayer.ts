/**
 * KiaanAudioPlayer — TypeScript wrapper around the native TurboModule.
 *
 * Mirrors backend/services/voice/wss_frames.py + Part 8 Kotlin module.
 * Used by Part 9's `useStreamingPlayer` hook to consume WSS audio.chunk
 * frames and feed them to ExoPlayer with sub-200ms first-byte latency.
 *
 * Method contracts MUST match the @ReactMethod signatures in
 * KiaanAudioPlayerModule.kt — both files reference each other in their
 * doc comments so drift is caught at code-review time.
 */

import { NativeEventEmitter, NativeModules } from 'react-native';

// ─── Native module ────────────────────────────────────────────────────────

interface KiaanAudioPlayerNativeSpec {
  /** Queue one base64-encoded Opus chunk for playback. */
  appendChunk(seq: number, base64Opus: string): Promise<void>;
  /** Begin or resume playback. */
  play(): Promise<void>;
  /** Pause playback (without clearing the queue). */
  pause(): Promise<void>;
  /** Smooth volume fade-out. Default 120ms. */
  fadeOut(durationMs: number): Promise<void>;
  /** Stop playback and clear the queued chunks. */
  stop(): Promise<void>;
  /** Free the player + visualizer. After release, the next call
   *  re-creates the player lazily. */
  release(): Promise<void>;
  /** Synchronous getter — current smoothed RMS [0..1]. */
  getAudioLevel(): number;
  /** RN bridge stubs — required for event subscriptions. */
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const Native = NativeModules.KiaanAudioPlayer as
  | KiaanAudioPlayerNativeSpec
  | undefined;

if (Native == null && !__DEV__) {
  // Production builds must not boot without the native module — the
  // mobile UX has no fallback path. Dev builds fall through (Metro
  // re-attach in the simulator may briefly miss the module).
  // eslint-disable-next-line no-console
  console.error(
    'KiaanAudioPlayer: native module is undefined. Ensure ' +
      'apps/sakha-mobile/native/android/expo-module.config.json registers ' +
      'com.kiaanverse.sakha.audio.KiaanAudioPlayerPackage and re-run ' +
      'expo prebuild.',
  );
}

// ─── Event types ──────────────────────────────────────────────────────────

export type PlaybackState = 'idle' | 'buffering' | 'ready' | 'ended' | 'unknown';

export interface PlaybackStateChangedEvent {
  state: PlaybackState;
}

export interface AudioLevelEvent {
  rms: number; // 0..1
}

export interface CrossfadeEvent {
  from_seq: number;
  to_seq: number;
}

export interface AudioPlayerErrorEvent {
  code: string;
  message: string;
}

const EVENT_NAMES = {
  PLAYBACK_STATE: 'KiaanAudioPlayer:onPlaybackStateChanged',
  AUDIO_LEVEL: 'KiaanAudioPlayer:onAudioLevel',
  CROSSFADE: 'KiaanAudioPlayer:onCrossfade',
  ERROR: 'KiaanAudioPlayer:onError',
} as const;

const emitter = Native ? new NativeEventEmitter(Native as never) : null;

// ─── Public API ───────────────────────────────────────────────────────────

export const KiaanAudioPlayer = {
  /** Append a base64-encoded Opus chunk to the playback queue. */
  appendChunk(seq: number, base64Opus: string): Promise<void> {
    if (!Native) return Promise.reject(new Error('KiaanAudioPlayer not loaded'));
    return Native.appendChunk(seq, base64Opus);
  },

  play(): Promise<void> {
    if (!Native) return Promise.reject(new Error('KiaanAudioPlayer not loaded'));
    return Native.play();
  },

  pause(): Promise<void> {
    if (!Native) return Promise.reject(new Error('KiaanAudioPlayer not loaded'));
    return Native.pause();
  },

  fadeOut(durationMs = 120): Promise<void> {
    if (!Native) return Promise.reject(new Error('KiaanAudioPlayer not loaded'));
    return Native.fadeOut(durationMs);
  },

  stop(): Promise<void> {
    if (!Native) return Promise.reject(new Error('KiaanAudioPlayer not loaded'));
    return Native.stop();
  },

  release(): Promise<void> {
    if (!Native) return Promise.resolve();
    return Native.release();
  },

  /** Synchronous — used by the Reanimated worklet driving the Shankha
   *  sound-wave amplitude. Reading every frame is fine because the
   *  TurboModule isBlockingSynchronousMethod path skips the bridge. */
  getAudioLevel(): number {
    if (!Native) return 0;
    return Native.getAudioLevel();
  },

  // ─── Event subscriptions ────────────────────────────────────────────
  onPlaybackStateChanged(listener: (e: PlaybackStateChangedEvent) => void) {
    return emitter?.addListener(EVENT_NAMES.PLAYBACK_STATE, listener);
  },

  onAudioLevel(listener: (e: AudioLevelEvent) => void) {
    return emitter?.addListener(EVENT_NAMES.AUDIO_LEVEL, listener);
  },

  onCrossfade(listener: (e: CrossfadeEvent) => void) {
    return emitter?.addListener(EVENT_NAMES.CROSSFADE, listener);
  },

  onError(listener: (e: AudioPlayerErrorEvent) => void) {
    return emitter?.addListener(EVENT_NAMES.ERROR, listener);
  },
};

export default KiaanAudioPlayer;
