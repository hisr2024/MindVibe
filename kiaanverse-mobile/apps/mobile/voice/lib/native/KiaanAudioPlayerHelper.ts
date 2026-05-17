/**
 * KiaanAudioPlayerHelper — thin one-shot helpers around the existing
 * KiaanAudioPlayer TurboModule.
 *
 * Used by TapToListenButton (provider="sakha") and other "play this
 * single audio URL once and call back when done" flows. Wraps the
 * TurboModule's chunk/play/release lifecycle so callers don't need
 * to coordinate the event emitter directly.
 *
 * For the streaming voice companion path, prefer the existing
 * useStreamingPlayer hook — it manages chunk appends + RMS metering
 * over the WSS lifecycle. This file is for one-shot blob playback.
 */

import { KiaanAudioPlayer } from './KiaanAudioPlayer';

/**
 * Play a remote audio URL once. Resolves when playback ends (or is
 * stopped externally).
 *
 * @param audioUrl  fully-qualified URL of the audio asset
 * @param onEnd     optional callback fired when playback completes
 */
export async function playOnce(
  audioUrl: string,
  onEnd?: () => void,
): Promise<void> {
  // The TurboModule's appendChunk/play API expects base64 chunks. For
  // one-shot remote URLs we fetch the bytes and append them as one
  // chunk. Total memory is bounded by the file size; for safety audio
  // (≤ 200KB) this is well within bounds.
  const resp = await fetch(audioUrl);
  if (!resp.ok) {
    throw new Error(`fetch ${audioUrl} → ${resp.status}`);
  }
  const buf = await resp.arrayBuffer();
  const base64 = arrayBufferToBase64(buf);

  await KiaanAudioPlayer.appendChunk(base64, 0);
  await KiaanAudioPlayer.play();

  // Subscribe to the playback-state event and resolve on 'ended'.
  const sub = KiaanAudioPlayer.onPlaybackStateChanged?.(
    ({ state }: { state: string }) => {
      if (state === 'ended' || state === 'idle') {
        onEnd?.();
        sub?.remove?.();
      }
    },
  );
}

/**
 * Stop any currently-playing one-shot. Idempotent.
 */
export async function stopOnce(): Promise<void> {
  await KiaanAudioPlayer.stop();
}

// ─── ArrayBuffer → base64 helper ──────────────────────────────────────

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks to avoid call-stack limits
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)),
    );
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  // Node fallback (jest/test) — Buffer is available globally.
  return (globalThis as { Buffer?: { from: (s: string, e: string) => { toString: (e: string) => string } } })
    .Buffer?.from(binary, 'binary')
    .toString('base64') ?? '';
}
