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
import { API_CONFIG } from '@kiaanverse/api';

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
  /** Signal that the caller has acknowledged an end-of-stream transition. */
  readonly onStreamCompleted: (handler: (() => void) | null) => void;
}

/** Parse accumulated SSE text into data frames + remaining buffer. */
function parseSSEFrames(raw: string, cursor: number): { frames: string[]; nextCursor: number } {
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

/** Compassionate error message used when the SSE pipe breaks. */
const CONNECTION_ERROR_TEXT =
  'My connection to the cosmic network wavered. Please ask again.';

export function useSakhaStream(
  options: UseSakhaStreamOptions = {},
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

  const appendAssistantText = useCallback((delta: string) => {
    const id = assistantIdRef.current;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: m.text + delta } : m)),
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

      // 3. Resolve bearer token, if any.
      let token: string | null = null;
      if (getAccessToken) {
        try {
          const resolved = await getAccessToken();
          token = resolved ?? null;
        } catch {
          token = null;
        }
      }

      // 4. Open the streaming XHR.
      const url = `${baseUrl ?? API_CONFIG.baseURL}/api/chat/message/stream`;
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      let cursor = 0;
      let fullText = '';

      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('X-Client', 'kiaanverse-mobile');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      const finishStreamingSuccess = (): void => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m,
          ),
        );
        setStreaming(false);
        xhrRef.current = null;
        streamCompleteCallbackRef.current?.();
      };

      const finishStreamingFailure = (): void => {
        const id = assistantIdRef.current;
        if (id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    text: m.text.length > 0 ? m.text : CONNECTION_ERROR_TEXT,
                    isStreaming: false,
                  }
                : m,
            ),
          );
        }
        setError(CONNECTION_ERROR_TEXT);
        setStreaming(false);
        xhrRef.current = null;
      };

      xhr.onreadystatechange = () => {
        // 3 = LOADING (incremental responseText is available).
        if (xhr.readyState !== 3 && xhr.readyState !== 4) return;
        if (xhr.readyState === 4 && xhr.status >= 400) {
          finishStreamingFailure();
          return;
        }

        const raw = xhr.responseText;
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
            };
            if (event.session_id && !sessionId) setSessionId(event.session_id);
            if (event.sessionId && !sessionId) setSessionId(event.sessionId);
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

        if (sawDone || xhr.readyState === 4) {
          finishStreamingSuccess();
        }
      };

      xhr.onerror = () => finishStreamingFailure();
      xhr.ontimeout = () => finishStreamingFailure();
      xhr.onabort = () => {
        // Aborts set isStreaming false silently — no error toast.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m,
          ),
        );
        setStreaming(false);
      };

      try {
        xhr.send(
          JSON.stringify({
            message: trimmed,
            session_id: sessionId ?? undefined,
          }),
        );
      } catch {
        finishStreamingFailure();
      }
    },
    [appendAssistantText, baseUrl, getAccessToken, sessionId, streaming],
  );

  const onStreamCompleted = useCallback(
    (handler: (() => void) | null) => {
      streamCompleteCallbackRef.current = handler;
    },
    [],
  );

  return {
    messages,
    streaming,
    error,
    sessionId,
    send,
    abort,
    reset,
    onStreamCompleted,
  };
}
