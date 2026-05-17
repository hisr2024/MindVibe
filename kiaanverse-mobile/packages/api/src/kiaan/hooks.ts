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
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
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

// ── useVerseModernExample — daily-fresh modern application of a verse ────

/**
 * Generated grounding for the Nitya Sadhana "Application / Vyavahara"
 * phase. Asks Sakha for a vivid, single-paragraph modern-day scenario
 * that shows the day's verse landing in an ordinary life — the kind of
 * everyday situation a working person, parent or student would
 * recognise. The verse rotates daily (see gitaStore.pickDailyVerse), so
 * a fresh example is generated once per day per verse and persisted via
 * the React Query AsyncStorage cache for the next 24 hours.
 *
 * Why a dedicated hook (not just a generic ask-Sakha mutation):
 *  - the prompt template is fixed (single paragraph, modern-day, no
 *    sermon) so callers don't accidentally reword it and drift the tone
 *  - the query key is verse-scoped, so the same verse always returns
 *    the same cached example for the rest of the day, even across
 *    cold starts of the app
 *  - cache settings match the existing 24h Gita-content pattern
 *    (see `useGitaVerse` / `useGitaTranslations` in hooks.ts)
 */
const MODERN_EXAMPLE_PROMPT =
  "Give one short, vivid modern-day scenario (3-4 sentences, present " +
  "tense) of an ordinary person — a working professional, parent, " +
  "student or commuter — living this verse without naming it. No " +
  "Sanskrit, no scripture references, no 'imagine that' framing. Open " +
  "directly in the scene. End with a single line in italics that names " +
  "the inner shift the verse is asking for.";

export interface VerseModernExampleInput {
  readonly chapter: number;
  readonly verse: number;
  readonly sanskrit: string;
  readonly transliteration?: string;
  readonly translation: string;
}

/** Stable YYYY-MM-DD bucket so the cache key changes at local midnight. */
function todayBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fetch (and cache for 24 h) a Sakha-generated modern application of a
 * Gita verse. The hook is a no-op until `verse` is provided so callers
 * can wire it before today's verse has resolved without firing a wasted
 * request.
 */
export function useVerseModernExample(
  verse: VerseModernExampleInput | null | undefined,
): UseQueryResult<string> {
  const day = todayBucket();
  return useQuery({
    queryKey: [
      'kiaan',
      'modern-example',
      'v1',
      verse?.chapter ?? null,
      verse?.verse ?? null,
      day,
    ] as const,
    enabled: verse != null,
    queryFn: async (): Promise<string> => {
      if (!verse) throw new Error('verse missing');
      const gita_verse: KiaanGitaVerse = {
        chapter: verse.chapter,
        verse: verse.verse,
        sanskrit: verse.sanskrit,
        translation: verse.translation,
      };
      if (verse.transliteration) {
        // KiaanGitaVerse allows extra string fields; safe to attach.
        (gita_verse as Record<string, string>).transliteration =
          verse.transliteration;
      }
      const res = await kiaan.chat({
        message: MODERN_EXAMPLE_PROMPT,
        gita_verse,
        context: 'sadhana:vyavahara',
      });
      return res.response.trim();
    },
    // Match the immutable-Gita-content pattern used by useGitaVerse /
    // useGitaTranslations: one call per verse per day, persisted via
    // the AsyncStorage query cache so cold-starting tomorrow shows
    // yesterday's example for today's verse if the user revisits it.
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
