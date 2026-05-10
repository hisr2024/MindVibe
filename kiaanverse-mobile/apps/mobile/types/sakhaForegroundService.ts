/**
 * SakhaForegroundService — TypeScript bridge types.
 *
 * Cross-platform contract for the "keep voice session alive when app is
 * backgrounded" facility:
 *
 *   • Android (apps/mobile/native/android/.../SakhaForegroundServiceModule.kt):
 *     starts/stops a typed foreground service (FOREGROUND_SERVICE_MICROPHONE +
 *     FOREGROUND_SERVICE_MEDIA_PLAYBACK on Android 14+) with a persistent
 *     notification.
 *
 *   • iOS (apps/mobile/native/ios/Sources/Bridge/SakhaForegroundServiceBridge.swift):
 *     iOS has no foreground services. The bridge wraps a
 *     SakhaBackgroundAudioCoordinator that activates an AVAudioSession
 *     (.playAndRecord, .duckOthers + .allowBluetooth + .defaultToSpeaker),
 *     disables the idle timer, and registers MPNowPlayingInfoCenter +
 *     interruption/route-change observers. Background audio is gated by
 *     UIBackgroundModes: ['audio'] in app.config.ts.
 *
 * The JS hook (voice/hooks/useForegroundService.ts) doesn't care which
 * implementation is behind the bridge — it just calls start()/stop() and
 * trusts the platform to keep the voice session alive.
 */

export interface SakhaForegroundServiceNativeModule {
  /** Begin keeping the voice session alive while backgrounded.
   *  Idempotent — repeat calls are a no-op. */
  start(): Promise<void>;

  /** Stop keeping the voice session alive. Idempotent. The hook
   *  calls this on unmount unconditionally to guarantee no leak. */
  stop(): Promise<void>;
}

// SakhaForegroundService emits no events today on either platform. If we
// later need to surface lifecycle (e.g., interruption events on iOS), add
// the event here AND in the iOS bridge's supportedEvents() AND the
// Android module's emitter — validate-ios-bridge.mjs will enforce parity.
export const SAKHA_FOREGROUND_SERVICE_EVENTS = {} as const;
