/**
 * React hooks that wrap the unified KIAAN client for common UI patterns.
 *
 * Each hook is standalone (no TanStack Query dependency) — they're
 * intended for imperative flows (voice recording, wisdom-room turns)
 * where a caller triggers a single request and renders the response.
 * For cache-aware data fetching (history, list endpoints) use
 * `@tanstack/react-query` directly against `kiaan.chat(...)`.
 */

import { useCallback, useRef, useState } from 'react';
import {
  kiaan,
  type KiaanChatResponse,
  type KiaanGitaVerse,
  type KiaanMessage,
} from './client';
import { isApiError, isAuthError, isOfflineError } from '../errors';

// ── Shared error mapper ───────────────────────────────────────────────────

/** Compassionate copy matching the rest of the app's error taxonomy. */
function formatError(err: unknown): string {
  if (isAuthError(err)) return 'AUTH_EXPIRED';
  if (isOfflineError(err))
    return "Saved. Sakha will reply when you're online.";
  if (isApiError(err)) {
    if (err.statusCode === 429)
      return 'Pause, breathe — too many requests. Try in a minute.';
    if (err.statusCode === 502 || err.statusCode === 503 || err.statusCode === 504)
      return 'Sakha is collecting herself. Please try again.';
    if (err.statusCode >= 500) return 'Something went wrong. Your words are safe.';
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message.length > 0) return err.message;
  return 'The connection wavered. Please try again.';
}

// ── useKiaanRoomChat — themed Sakha dialogue for Wisdom Rooms ─────────────

export interface KiaanRoomChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: number;
}

export interface UseKiaanRoomChatResult {
  readonly messages: readonly KiaanRoomChatMessage[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly send: (prompt: string) => Promise<void>;
  readonly reset: () => void;
}

/**
 * Single-session themed chat that posts to `/api/kiaan/chat` with a
 * `room_context` hint. The hook keeps the last 6 turns in its request
 * so the backend can ground follow-ups.
 *
 * Intended for the "themed Sakha" reinterpretation of Wisdom Rooms — a
 * lightweight alternative to the WebSocket group-chat room. If the
 * product keeps group chat in the room, this hook can still power a
 * private "ask Sakha" affordance inside it.
 */
export function useKiaanRoomChat(
  roomContext: string,
  options?: { readonly initialVerse?: KiaanGitaVerse | null },
): UseKiaanRoomChatResult {
  const [messages, setMessages] = useState<KiaanRoomChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // History ref mirrors `messages` without triggering renders during send.
  const historyRef = useRef<KiaanMessage[]>([]);

  const send = useCallback(
    async (prompt: string): Promise<void> => {
      const trimmed = prompt.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setIsLoading(true);

      const userMsg: KiaanRoomChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: trimmed },
      ];

      try {
        const res: KiaanChatResponse = await kiaan.chat({
          message: trimmed,
          conversation_history: historyRef.current.slice(-6),
          room_context: roomContext,
          gita_verse: options?.initialVerse ?? null,
        });

        const assistantMsg: KiaanRoomChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        historyRef.current = [
          ...historyRef.current,
          { role: 'assistant', content: res.response },
        ];
      } catch (err) {
        setError(formatError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, options?.initialVerse, roomContext],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    historyRef.current = [];
  }, []);

  return { messages, isLoading, error, send, reset };
}

// ── useKiaanVoice — record → transcribe → chat bridge ─────────────────────

export interface UseKiaanVoiceResult {
  readonly isTranscribing: boolean;
  readonly isAwaiting: boolean;
  readonly lastTranscript: string | null;
  readonly lastResponse: string | null;
  readonly error: string | null;
  /** Submit a recorded audio file URI. Returns the assistant text, or
   *  null on failure (see `error`). */
  readonly submit: (recordingUri: string, mimeType?: string) => Promise<string | null>;
  readonly reset: () => void;
}

/**
 * Voice companion: transcribe an audio file, then feed the transcript
 * to `kiaan.chat`. The caller is responsible for recording (expo-av)
 * and passing the resulting file URI.
 */
export function useKiaanVoice(
  options?: {
    readonly conversationHistory?: readonly KiaanMessage[];
    readonly gitaVerse?: KiaanGitaVerse | null;
  },
): UseKiaanVoiceResult {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAwaiting, setIsAwaiting] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (recordingUri: string, mimeType = 'audio/m4a'): Promise<string | null> => {
      setError(null);
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        // React Native FormData accepts the `{ uri, name, type }` shape;
        // the typing is intentionally loose because FormData on RN is
        // not identical to the DOM one.
        formData.append('audio', {
          uri: recordingUri,
          name: 'voice.m4a',
          type: mimeType,
        } as unknown as Blob);

        const { transcript } = await kiaan.transcribeVoice(formData);
        setLastTranscript(transcript);

        if (!transcript.trim()) {
          setIsTranscribing(false);
          return null;
        }

        setIsTranscribing(false);
        setIsAwaiting(true);

        const res = await kiaan.chat({
          message: transcript,
          conversation_history: options?.conversationHistory ?? [],
          gita_verse: options?.gitaVerse ?? null,
          context: 'voice',
        });
        setLastResponse(res.response);
        return res.response;
      } catch (err) {
        setError(formatError(err));
        return null;
      } finally {
        setIsTranscribing(false);
        setIsAwaiting(false);
      }
    },
    [options?.conversationHistory, options?.gitaVerse],
  );

  const reset = useCallback(() => {
    setLastTranscript(null);
    setLastResponse(null);
    setError(null);
  }, []);

  return {
    isTranscribing,
    isAwaiting,
    lastTranscript,
    lastResponse,
    error,
    submit,
    reset,
  };
}
