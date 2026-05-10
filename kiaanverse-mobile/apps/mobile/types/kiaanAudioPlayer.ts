/**
 * KiaanAudioPlayer — TypeScript bridge types.
 *
 * Mirrors:
 *  - Android Kotlin: apps/mobile/native/android/.../KiaanAudioPlayerModule.kt
 *  - iOS Swift:      apps/mobile/native/ios/Sources/Bridge/KiaanAudioPlayerBridge.swift
 *  - JS wrapper:     apps/mobile/voice/lib/native/KiaanAudioPlayer.ts
 *
 * The JS wrapper provides ergonomic Promise + event-emitter helpers; this
 * file is the canonical declaration of the bridge surface that both native
 * sides must implement. validate-ios-bridge.mjs cross-references this file
 * against KiaanAudioPlayerBridge.{m,swift} to catch contract drift.
 */

// ============================================================================
// Playback states
// ============================================================================

export type KiaanAudioPlayerPlaybackState =
  | 'idle'
  | 'buffering'
  | 'ready'
  | 'ended'
  | 'unknown';

// ============================================================================
// Native event payloads
// ============================================================================

export interface KiaanAudioPlayerPlaybackStateEvent {
  state: KiaanAudioPlayerPlaybackState;
}

export interface KiaanAudioPlayerAudioLevelEvent {
  /** Smoothed RMS, 0.0 — 1.0. Emitted at 60Hz during playback. */
  rms: number;
}

export interface KiaanAudioPlayerCrossfadeEvent {
  from_seq: number;
  to_seq: number;
}

export interface KiaanAudioPlayerErrorEvent {
  code: string;
  message: string;
}

// ============================================================================
// Bridge module surface
// ============================================================================

export interface KiaanAudioPlayerNativeModule {
  /** Queue one base64-encoded Opus chunk for playback. Resolves once
   *  queued, NOT once played. Sequence numbers must increase
   *  monotonically per turn. */
  appendChunk(seq: number, base64Opus: string): Promise<void>;

  /** Begin or resume playback. */
  play(): Promise<void>;

  /** Pause playback (queue retained). */
  pause(): Promise<void>;

  /** Smooth volume fade-out used for barge-in. Default 120ms. */
  fadeOut(durationMs: number): Promise<void>;

  /** Stop playback and clear the queued chunks. */
  stop(): Promise<void>;

  /** Free the player + audio session. After release, the next call
   *  re-creates the player lazily. */
  release(): Promise<void>;

  /** Synchronous getter — current smoothed RMS [0..1]. Used by the
   *  Reanimated worklet driving Shankha amplitude. */
  getAudioLevel(): number;

  // NativeEventEmitter contract
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// ============================================================================
// Native event names — MUST match supportedEvents() on iOS and the
// EVENT_* constants on Android.
// ============================================================================

export const KIAAN_AUDIO_PLAYER_EVENTS = {
  PLAYBACK_STATE: 'KiaanAudioPlayer:onPlaybackStateChanged',
  AUDIO_LEVEL: 'KiaanAudioPlayer:onAudioLevel',
  CROSSFADE: 'KiaanAudioPlayer:onCrossfade',
  ERROR: 'KiaanAudioPlayer:onError',
} as const;

export type KiaanAudioPlayerEventName =
  (typeof KIAAN_AUDIO_PLAYER_EVENTS)[keyof typeof KIAAN_AUDIO_PLAYER_EVENTS];
