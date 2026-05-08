/**
 * useSakhaStream — React hook that drives the Sakha SSE streaming lifecycle.
 *
 * Why XMLHttpRequest and not fetch?
 *   React Native's fetch implementation does not expose a reliable
 *   ReadableStream on Android. XHR's `onreadystatechange` / `onprogress`
 *   events surface `responseText` incrementally, which is exactly what we
 *   need for server-sent events over HTTP POST.
 *
 * The FastAPI endpoint emits one of two line formats per SSE frame:
 *
 *   data: {"word": " Krishna", "done": false}
 *   data: {"done": true, "verseRefs": [...]}
 *
 * Legacy plain-text frames (no JSON) are still supported for backward
 * compatibility with the web client.
 *
 * Usage:
 *   const { messages, streaming, send, abort, error, reset } = useSakhaStream();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  API_CONFIG,
  getCurrentAccessToken,
  refreshAccessToken,
} from '@kiaanverse/api';

/**
 * SecureStore key under which the authStore persists the access JWT.
 * Duplicated here (rather than imported) because the chat components belong
 * to the mobile app, which should not depend on the store package for a
 * single constant. If the key ever changes in authStore.ts, update here too.
 *
 * Used as a last-resort fallback when the apiClient's TokenManager has not
 * yet been wired (e.g. during very early app startup). Normal reads go
 * through `getCurrentAccessToken` so the stream shares the exact same
 * token source — and refresh cadence — as regular authenticated requests.
 */
const ACCESS_TOKEN_STORAGE_KEY = 'kiaanverse_access_token';

/** Best-effort token read. Order:
 *  1. apiClient's TokenManager (authoritative; kept fresh by the 401 interceptor).
 *  2. Direct SecureStore read (fallback for the tiny window before the
 *     TokenManager is registered on app startup).
 */
async function readAuthToken(): Promise<string | null> {
  try {
    const fromClient = await getCurrentAccessToken();
    if (fromClient) return fromClient;
  } catch {
    /* fall through */
  }
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Message record kept in component state. */
export interface SakhaStreamMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  text: string;
  readonly timestamp: number;
  /** True while the assistant response is actively streaming. */
  isStreaming?: boolean;
}

export interface UseSakhaStreamOptions {
  /** Token getter — called once per request to attach the JWT. */
  readonly getAccessToken?: () => Promise<string | null> | string | null;
  /** Optional base URL override (defaults to API_CONFIG.baseURL). */
  readonly baseUrl?: string;
}

export interface UseSakhaStreamResult {
  readonly messages: SakhaStreamMessage[];
  readonly streaming: boolean;
  readonly error: string | null;
  readonly sessionId: string | null;
  readonly send: (prompt: string) => Promise<void>;
  readonly abort: () => void;
  readonly reset: () => void;
  /** Re-inject a cached conversation. Used to restore from AsyncStorage
   *  on cold start so the chat doesn't appear empty after force-quit. */
  readonly restore: (cached: SakhaStreamMessage[]) => void;
  /** Signal that the caller has acknowledged an end-of-stream transition. */
  readonly onStreamCompleted: (handler: (() => void) | null) => void;
}

/** Parse accumulated SSE text into data frames + remaining buffer. */
function parseSSEFrames(
  raw: string,
  cursor: number
): { frames: string[]; nextCursor: number } {
  const frames: string[] = [];
  let nextCursor = cursor;
  const slice = raw.slice(cursor);
  const parts = slice.split('\n');

  // Keep the final (possibly partial) line in the buffer for the next pass.
  const complete = parts.slice(0, -1);
  const trailing = parts[parts.length - 1] ?? '';
  nextCursor += slice.length - trailing.length;

  for (const line of complete) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data: ')) {
      frames.push(trimmed.slice(6));
    }
  }

  return { frames, nextCursor };
}

function createMessageId(prefix: 'user' | 'assistant'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Compassionate error copy used when the SSE pipe breaks. We differentiate
 * by transport failure mode so the user can take the right next step (sign
 * in, retry after cold-start, check network) instead of every failure
 * looking like a generic "please try again".
 */
const CONNECTION_ERROR_TEXT =
  'My connection to the cosmic network wavered. Please ask again.';
const AUTH_ERROR_TEXT =
  'Your session has expired. Please sign in again to continue our dialogue.';
const COLD_START_TEXT =
  'I am waking from deep meditation (server cold start). Please ask again in a moment.';
const NO_CREDENTIALS_TEXT =
  'To speak with Sakha, please sign in with your email. (Developer Login skips the server session and cannot start a dialogue.)';

export function useSakhaStream(
  options: UseSakhaStreamOptions = {}
): UseSakhaStreamResult {
  const { getAccessToken, baseUrl } = options;

  const [messages, setMessages] = useState<SakhaStreamMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const assistantIdRef = useRef<string | null>(null);
  const streamCompleteCallbackRef = useRef<(() => void) | null>(null);

  // Cleanup any in-flight request on unmount.
  useEffect(() => {
    return () => {
      xhrRef.current?.abort();
      xhrRef.current = null;
    };
  }, []);

  const abort = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    abort();
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, [abort]);

  /**
   * Re-inject a previously-cached conversation into the in-memory
   * messages list. Called by the chat tab on cold start to restore
   * a conversation persisted to AsyncStorage so the user doesn't
   * see an empty chat after force-quitting and relaunching.
   *
   * No-ops if a stream is currently in flight (we don't want to
   * clobber a live conversation), if the input is empty, or if
   * messages are already present (we never overwrite a live
   * session — restoration only happens once on initial mount).
   *
   * Does NOT trigger any network request — the messages are
   * displayed as-is. The next user message starts a fresh stream
   * (the LLM doesn't see the restored history; this is purely a
   * UI continuity affordance).
   */
  const restore = useCallback(
    (cached: SakhaStreamMessage[]) => {
      if (streaming) return;
      if (!Array.isArray(cached) || cached.length === 0) return;
      setMessages((prev) => (prev.length > 0 ? prev : cached));
    },
    [streaming],
  );

  const appendAssistantText = useCallback((delta: string) => {
    const id = assistantIdRef.current;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: m.text + delta } : m))
    );
  }, []);

  const send = useCallback(
    async (prompt: string): Promise<void> => {
      const trimmed = prompt.trim();
      if (!trimmed || streaming) return;

      setError(null);

      // 1. Optimistic user message.
      const userMsg: SakhaStreamMessage = {
        id: createMessageId('user'),
        role: 'user',
        text: trimmed,
        timestamp: Date.now(),
      };

      // 2. Empty assistant shell that tokens stream into.
      const assistantId = createMessageId('assistant');
      assistantIdRef.current = assistantId;
      const assistantMsg: SakhaStreamMessage = {
        id: assistantId,
        role: 'assistant',
        text: '',
        timestamp: Date.now(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      // 3. Resolve bearer token. Prefer the caller-supplied getter (tests,
      // custom flows); otherwise go through the apiClient's TokenManager so
      // we share the same token source — and refresh cadence — as regular
      // authenticated requests. A last-resort SecureStore read covers the
      // narrow window before the TokenManager has been registered on boot.
      let token: string | null = null;
      try {
        if (getAccessToken) {
          const resolved = await getAccessToken();
          token = resolved ?? null;
        } else {
          token = await readAuthToken();
        }
      } catch {
        token = null;
      }

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.log(
          `[SakhaStream] POST ${baseUrl ?? API_CONFIG.baseURL}/api/chat/message/stream  auth=${
            token ? 'Bearer ***' : 'NONE'
          }`
        );
      }

      // 4. Open the streaming XHR. Wrapped in a local function so we can
      // retry once with a refreshed token if the server returns 401/403.
      let hasRetriedAfterRefresh = false;
      let cursor = 0;
      let fullText = '';

      const finishStreamingSuccess = (): void => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
        setStreaming(false);
        xhrRef.current = null;
        streamCompleteCallbackRef.current?.();
      };

      const finishStreamingFailure = (
        reason: 'network' | 'auth' | 'server' | 'cold_start' | 'no_credentials',
        activeXhr: XMLHttpRequest
      ): void => {
        const errorText =
          reason === 'no_credentials'
            ? NO_CREDENTIALS_TEXT
            : reason === 'auth'
              ? AUTH_ERROR_TEXT
              : reason === 'cold_start'
                ? COLD_START_TEXT
                : CONNECTION_ERROR_TEXT;
        const id = assistantIdRef.current;
        if (id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    text: m.text.length > 0 ? m.text : errorText,
                    isStreaming: false,
                  }
                : m
            )
          );
        }
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          // eslint-disable-next-line no-console
          console.error(
            `[SakhaStream] failed (${reason}) status=${activeXhr.status} response=${activeXhr.responseText?.slice(0, 200) ?? ''}`
          );
        }
        setError(errorText);
        setStreaming(false);
        xhrRef.current = null;
      };

      const openAndSend = (authToken: string | null): void => {
        const url = `${baseUrl ?? API_CONFIG.baseURL}/api/chat/message/stream`;
        const x = new XMLHttpRequest();
        xhrRef.current = x;
        // Reset the SSE parse state every time we (re)open so the retry
        // path never double-emits tokens that the failed attempt already
        // surfaced to the UI.
        cursor = 0;
        fullText = '';

        x.open('POST', url, true);
        x.setRequestHeader('Content-Type', 'application/json');
        x.setRequestHeader('Accept', 'text/event-stream');
        x.setRequestHeader('X-Client', 'kiaanverse-mobile');
        if (authToken)
          x.setRequestHeader('Authorization', `Bearer ${authToken}`);

        x.onreadystatechange = () => {
          // 3 = LOADING (incremental responseText is available).
          if (x.readyState !== 3 && x.readyState !== 4) return;
          if (x.readyState === 4 && x.status >= 400) {
            const status = x.status;

            // On 401/403, try exactly one silent refresh before surfacing
            // the "Your session has expired" copy. This mirrors the
            // apiClient's axios interceptor so SSE has the same resilience
            // as regular authenticated POSTs.
            //
            // Special case: if we attempted the request without any token to
            // begin with, a refresh will also fail (there's nothing to
            // refresh from). In that case we show the clearer "please sign
            // in with your email" copy — this is the devLogin path, where
            // the app has `status: authenticated` locally but no backend
            // session exists.
            if ((status === 401 || status === 403) && !hasRetriedAfterRefresh) {
              hasRetriedAfterRefresh = true;
              const hadInitialToken =
                authToken !== null && authToken.length > 0;
              void (async () => {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                  openAndSend(refreshed);
                } else if (hadInitialToken) {
                  finishStreamingFailure('auth', x);
                } else {
                  finishStreamingFailure('no_credentials', x);
                }
              })();
              return;
            }

            if (status === 401 || status === 403) {
              finishStreamingFailure('auth', x);
            } else if (status === 502 || status === 503 || status === 504) {
              finishStreamingFailure('cold_start', x);
            } else {
              finishStreamingFailure('server', x);
            }
            return;
          }

          const raw = x.responseText;
          const { frames, nextCursor } = parseSSEFrames(raw, cursor);
          cursor = nextCursor;

          let sawDone = false;

          for (const frame of frames) {
            try {
              const event = JSON.parse(frame) as {
                word?: string;
                done?: boolean;
                session_id?: string;
                sessionId?: string;
                verseRefs?: unknown;
                error?: string;
                message?: string;
              };
              if (event.session_id && !sessionId)
                setSessionId(event.session_id);
              if (event.sessionId && !sessionId) setSessionId(event.sessionId);
              // Quota / service-unavailable frames the backend emits
              // occasionally carry an `error` field and a human message.
              if (event.error && typeof event.message === 'string') {
                appendAssistantText(event.message);
                fullText += event.message;
              }
              if (event.done) {
                sawDone = true;
                break;
              }
              if (event.word) {
                fullText += event.word;
                appendAssistantText(event.word);
              }
            } catch {
              // Legacy plain-text format.
              if (frame === '[DONE]') {
                sawDone = true;
                break;
              }
              const space =
                fullText.length > 0 && !frame.startsWith(' ') ? ' ' : '';
              fullText += space + frame;
              appendAssistantText(space + frame);
            }
          }

          if (sawDone || x.readyState === 4) {
            finishStreamingSuccess();
          }
        };

        x.onerror = () => finishStreamingFailure('network', x);
        x.ontimeout = () => finishStreamingFailure('cold_start', x);
        x.onabort = () => {
          // Aborts set isStreaming false silently — no error toast.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            )
          );
          setStreaming(false);
        };

        try {
          x.send(
            JSON.stringify({
              message: trimmed,
              session_id: sessionId ?? undefined,
            })
          );
        } catch {
          finishStreamingFailure('network', x);
        }
      };

      openAndSend(token);
    },
    [appendAssistantText, baseUrl, getAccessToken, sessionId, streaming]
  );

  const onStreamCompleted = useCallback((handler: (() => void) | null) => {
    streamCompleteCallbackRef.current = handler;
  }, []);

  return {
    messages,
    streaming,
    error,
    sessionId,
    send,
    abort,
    reset,
    restore,
    onStreamCompleted,
  };
}
