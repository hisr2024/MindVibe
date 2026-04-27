/**
 * useWebSocket — manages the WSS connection to /voice-companion/converse.
 *
 * Owns:
 *   • connect() / disconnect() lifecycle
 *   • subprotocol negotiation (kiaan-voice-v1)
 *   • frame parsing + dispatch into the Zustand store
 *   • heartbeat (every 15s; close if no ack within 30s)
 *   • exponential-backoff reconnect (capped 30s) with jitter
 *
 * Per spec, the mobile client MUST NOT open the WSS until pre-flight
 * /api/voice/quota and /api/voice/persona-version both succeed. That
 * check lives in useVoiceSession; this hook just connects.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  SUBPROTOCOL,
  serializeFrame,
  type ClientFrame,
  type ServerFrame,
} from '../lib/wss-types';
import { useVoiceStore } from '../stores/voiceStore';

const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 30_000;
const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 30_000;

interface UseWebSocketOptions {
  baseUrl: string;
  userId: string;
  onConnected?: () => void;
  onDisconnected?: (code: number) => void;
}

export interface VoiceWebSocket {
  connect: () => void;
  disconnect: (code?: number) => void;
  send: (frame: ClientFrame) => boolean;
  isOpen: () => boolean;
}

export function useWebSocket({
  baseUrl,
  userId,
  onConnected,
  onDisconnected,
}: UseWebSocketOptions): VoiceWebSocket {
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatDeadlineRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionallyClosedRef = useRef(false);

  // Stable ref onto the store so dispatch doesn't re-create on every render
  const storeRef = useRef(useVoiceStore.getState);

  const httpBaseUrl = baseUrl.replace(/^ws/, 'http').replace(/\/+$/, '');

  const absolutizeAudioUrl = useCallback(
    (u: string): string => {
      if (/^https?:\/\//i.test(u)) return u;
      return httpBaseUrl + (u.startsWith('/') ? u : '/' + u);
    },
    [httpBaseUrl],
  );

  const dispatchFrame = useCallback((frame: ServerFrame) => {
    const store = storeRef.current();
    switch (frame.type) {
      case 'transcript.partial':
        store.applyTranscriptPartial(frame.text, !!frame.is_final);
        break;
      case 'engine':
        store.applyEngine(frame.selected);
        break;
      case 'mood':
        store.applyMood({
          label: frame.label,
          intensity: frame.intensity,
          trend: frame.trend,
        });
        break;
      case 'verse':
        store.applyVerse({
          chapter: frame.chapter,
          verse: frame.verse,
          text_sa: frame.text_sa,
          text_en: frame.text_en,
          text_hi: frame.text_hi,
          citation: frame.citation,
        });
        break;
      case 'text.delta':
        store.applyTextDelta(frame.content);
        break;
      case 'audio.chunk':
        // Audio chunks are forwarded by useStreamingPlayer (Part 9c) which
        // listens to the same socket. This dispatcher only updates store
        // state — the actual ExoPlayer.appendChunk happens in that hook.
        break;
      case 'crisis':
        store.applyCrisis({
          incidentId: frame.incident_id,
          helpline: frame.helpline,
          audioUrl: absolutizeAudioUrl(frame.audio_url),
          region: frame.region,
          language: frame.language,
        });
        break;
      case 'tool_invocation':
        store.applyToolInvocation({
          tool: frame.tool,
          action: frame.action,
          inputPayload: frame.input_payload ?? null,
          carryId: frame.carry_id ?? null,
          confidence: frame.confidence,
        });
        break;
      case 'suggested_next':
        store.applySuggestedNext(frame.items);
        break;
      case 'filter_failed':
        store.applyFilterFailed(frame.reason, frame.falling_back_to);
        break;
      case 'done':
        store.applyDone({
          conversationId: frame.conversation_id,
          cacheHit: frame.cache_hit ?? false,
          tierUsed: (frame.tier_used ?? 'openai') as
            | 'openai' | 'local_llm' | 'template' | 'verse_only',
          firstAudioByteMs: frame.first_audio_byte_ms ?? null,
          totalMs: frame.total_ms,
        });
        break;
      case 'error':
        store.applyError({
          code: frame.code,
          message: frame.message,
          recoverable: frame.recoverable !== false,
        });
        break;
      case 'heartbeat.ack':
        // Reset deadline — connection is live
        if (heartbeatDeadlineRef.current) clearTimeout(heartbeatDeadlineRef.current);
        heartbeatDeadlineRef.current = null;
        break;
      default:
        // Unknown server frame type — log + drop. Strict client never
        // crashes on a future server frame it doesn't understand yet.
        // eslint-disable-next-line no-console
        console.warn('[useWebSocket] unknown server frame type', (frame as { type?: string }).type);
    }
  }, [absolutizeAudioUrl]);

  const sendFrame = useCallback((frame: ClientFrame): boolean => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(serializeFrame(frame));
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[useWebSocket] send failed', e);
      return false;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setInterval(() => {
      if (!sendFrame({ type: 'heartbeat' })) return;
      // Arm a deadline — if no ack in 30s, force-close to trigger reconnect
      if (heartbeatDeadlineRef.current) clearTimeout(heartbeatDeadlineRef.current);
      heartbeatDeadlineRef.current = setTimeout(() => {
        const ws = socketRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) ws.close(4000, 'heartbeat timeout');
      }, HEARTBEAT_TIMEOUT_MS);
    }, HEARTBEAT_INTERVAL_MS);
  }, [sendFrame]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = null;
    if (heartbeatDeadlineRef.current) clearTimeout(heartbeatDeadlineRef.current);
    heartbeatDeadlineRef.current = null;
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (intentionallyClosedRef.current) return;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    const attempt = reconnectAttemptRef.current + 1;
    reconnectAttemptRef.current = attempt;
    const backoff = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
    const jitter = Math.random() * 0.3 * backoff;
    reconnectTimerRef.current = setTimeout(() => connect(), backoff + jitter);
  }, []);

  const connect = useCallback(() => {
    intentionallyClosedRef.current = false;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }
    const url = `${baseUrl.replace(/^http/, 'ws')}/voice-companion/converse?user_id=${encodeURIComponent(userId)}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url, [SUBPROTOCOL]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[useWebSocket] open failed', e);
      scheduleReconnect();
      return;
    }
    socketRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      startHeartbeat();
      onConnected?.();
    };

    ws.onmessage = (ev: MessageEvent) => {
      const raw = typeof ev.data === 'string' ? ev.data : '';
      if (!raw) return;
      try {
        const frame = JSON.parse(raw) as ServerFrame;
        dispatchFrame(frame);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[useWebSocket] bad server frame', e);
      }
    };

    ws.onerror = () => {
      // onerror is followed by onclose; let onclose do the reconnect
    };

    ws.onclose = (ev: CloseEvent) => {
      stopHeartbeat();
      socketRef.current = null;
      onDisconnected?.(ev.code);
      // Specific close codes never trigger reconnect:
      //   4001 PERSONA_MISMATCH — user must update the app
      //   4002 BAD_FIRST_FRAME  — programming error, never recover
      if (ev.code === 4001 || ev.code === 4002) {
        const store = storeRef.current();
        if (ev.code === 4001) store.setPersonaMismatch(true);
        return;
      }
      scheduleReconnect();
    };
  }, [
    baseUrl, userId, dispatchFrame, onConnected, onDisconnected,
    scheduleReconnect, startHeartbeat, stopHeartbeat,
  ]);

  const disconnect = useCallback((code = 1000) => {
    intentionallyClosedRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    stopHeartbeat();
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.close(code, 'client');
    socketRef.current = null;
  }, [stopHeartbeat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const isOpen = useCallback(
    () => socketRef.current?.readyState === WebSocket.OPEN,
    [],
  );

  return { connect, disconnect, send: sendFrame, isOpen };
}
