/**
 * useStreamingPlayer — listens to server `audio.chunk` frames over the
 * raw WebSocket and forwards each chunk to KiaanAudioPlayer.appendChunk.
 *
 * Why not just listen via the Zustand-store dispatcher in useWebSocket?
 *   Audio.chunk frames are high-frequency (30–60+ per turn) and we DON'T
 *   want every chunk to mutate Zustand state — that would re-render
 *   subscribed components 60×/sec. The dispatcher in useWebSocket
 *   intentionally drops audio.chunk frames for store consumption; this
 *   hook re-listens to the socket directly so the audio path is
 *   side-effect-only.
 *
 * The hook also subscribes to KiaanAudioPlayer's `onAudioLevel` event
 * and pumps the RMS into the store at 60Hz — that single field IS the
 * thing the Shankha animation worklet reads.
 */

import { useEffect, useRef } from 'react';
import { KiaanAudioPlayer } from '../lib/native/KiaanAudioPlayer';
import { useVoiceStore } from '../stores/voiceStore';

interface UseStreamingPlayerOptions {
  /** Provide the WebSocket so the hook can attach a low-level message
   *  listener for audio.chunk frames in addition to the dispatcher. */
  socket: WebSocket | null;
  /** Auto-start playback when the first chunk arrives. */
  autoplay?: boolean;
}

export interface StreamingPlayerAPI {
  fadeOut: (durationMs?: number) => Promise<void>;
  stop: () => Promise<void>;
  release: () => Promise<void>;
}

export function useStreamingPlayer({
  socket,
  autoplay = true,
}: UseStreamingPlayerOptions): StreamingPlayerAPI {
  const playStartedRef = useRef<boolean>(false);
  const applyAudioLevel = useVoiceStore((s) => s.applyAudioLevel);

  // Audio chunks → ExoPlayer
  useEffect(() => {
    if (!socket) return;
    const onMessage = (ev: MessageEvent) => {
      const raw = typeof ev.data === 'string' ? ev.data : '';
      if (!raw) return;
      try {
        const f = JSON.parse(raw) as { type?: string; seq?: number; data?: string };
        if (f.type !== 'audio.chunk') return;
        if (typeof f.seq !== 'number' || typeof f.data !== 'string') return;
        KiaanAudioPlayer.appendChunk(f.seq, f.data).catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('[useStreamingPlayer] appendChunk failed', e);
        });
        if (autoplay && !playStartedRef.current) {
          playStartedRef.current = true;
          KiaanAudioPlayer.play().catch(() => {});
        }
      } catch {
        /* ignore */
      }
    };
    socket.addEventListener('message', onMessage);
    return () => {
      socket.removeEventListener('message', onMessage);
    };
  }, [socket, autoplay]);

  // RMS → Zustand store (drives Shankha amplitude)
  useEffect(() => {
    const sub = KiaanAudioPlayer.onAudioLevel(({ rms }) => {
      applyAudioLevel(rms);
    });
    return () => {
      sub?.remove?.();
    };
  }, [applyAudioLevel]);

  // Reset playStartedRef when the new turn begins (state goes from
  // listening → thinking → speaking). Hooking on `state === 'thinking'`
  // signals "next audio.chunk we see is for a fresh response."
  const state = useVoiceStore((s) => s.state);
  useEffect(() => {
    if (state === 'thinking' || state === 'idle') {
      playStartedRef.current = false;
    }
  }, [state]);

  return {
    fadeOut: (durationMs = 120) => KiaanAudioPlayer.fadeOut(durationMs),
    stop: () => KiaanAudioPlayer.stop(),
    release: () => KiaanAudioPlayer.release(),
  };
}
