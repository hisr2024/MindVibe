/**
 * useSakhaStream — end-to-end proof that Sakha chat generates responses.
 *
 * The streaming hook uses XMLHttpRequest (not fetch) because RN's fetch
 * does not expose a reliable ReadableStream on Android. Tests mount a
 * jsdom-less XHR replacement that surfaces readyState / responseText /
 * status transitions synchronously, which lets us verify every branch
 * of the SSE parser without spinning up a network.
 *
 * Scenarios exercised:
 *   1. Happy path  — multiple { word } frames + { done: true } end frame
 *      produce the correct concatenated assistant message.
 *   2. Legacy plain-text frames followed by `[DONE]` still stream.
 *   3. session_id captured from the first frame is reused on next send.
 *   4. 401 triggers a silent refreshAccessToken + retry.
 *   5. 503 surfaces the "cold start" compassionate error copy.
 *   6. Network error (onerror) surfaces the "connection wavered" copy.
 *   7. abort() stops the stream silently — no error state set.
 *   8. Empty prompt is a no-op.
 */

import { act, renderHook } from '@testing-library/react-native';

// -- Mock the apiClient token surface ---------------------------------------
jest.mock('@kiaanverse/api', () => {
  const actual = jest.requireActual('@kiaanverse/api');
  return {
    ...actual,
    API_CONFIG: { baseURL: 'https://test.local' },
    getCurrentAccessToken: jest.fn(async () => 'tok-primary'),
    refreshAccessToken: jest.fn(async () => 'tok-refreshed'),
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

import { useSakhaStream } from '../components/chat/useSakhaStream';

// ---------------------------------------------------------------------------
// Minimal XHR test double — tracks sent body + feeds SSE frames on demand.
// ---------------------------------------------------------------------------

interface FakeXHR {
  method?: string;
  url?: string;
  readyState: number;
  status: number;
  statusText: string;
  responseText: string;
  headers: Record<string, string>;
  body?: string | null;
  aborted: boolean;
  onreadystatechange: (() => void) | null;
  onerror: (() => void) | null;
  ontimeout: (() => void) | null;
  onabort: (() => void) | null;
  open: (m: string, u: string, a: boolean) => void;
  setRequestHeader: (k: string, v: string) => void;
  send: (body?: string) => void;
  abort: () => void;
  /** Test helper: push an SSE chunk and fire readyState 3. */
  _emit: (chunk: string) => void;
  /** Test helper: finish with status + body. */
  _finish: (status: number, body?: string) => void;
}

const xhrQueue: FakeXHR[] = [];

function makeFakeXHR(): FakeXHR {
  const xhr: FakeXHR = {
    readyState: 0,
    status: 0,
    statusText: '',
    responseText: '',
    headers: {},
    aborted: false,
    onreadystatechange: null,
    onerror: null,
    ontimeout: null,
    onabort: null,
    open(method, url) {
      xhr.method = method;
      xhr.url = url;
      xhr.readyState = 1;
    },
    setRequestHeader(k, v) {
      xhr.headers[k] = v;
    },
    send(body) {
      xhr.body = body ?? null;
      xhr.readyState = 2;
    },
    abort() {
      xhr.aborted = true;
      xhr.readyState = 4;
      xhr.onabort?.();
    },
    _emit(chunk) {
      xhr.responseText += chunk;
      xhr.readyState = 3;
      xhr.status = 200;
      xhr.onreadystatechange?.();
    },
    _finish(status, body) {
      if (body) xhr.responseText += body;
      xhr.status = status;
      xhr.readyState = 4;
      xhr.onreadystatechange?.();
    },
  };
  return xhr;
}

beforeEach(() => {
  xhrQueue.length = 0;
  (global as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest =
    function FakeXHRCtor() {
      const x = makeFakeXHR();
      xhrQueue.push(x);
      return x as unknown as XMLHttpRequest;
    } as unknown as typeof XMLHttpRequest;
});

// ---------------------------------------------------------------------------

describe('useSakhaStream — response generation', () => {
  it('no-ops on empty prompt', async () => {
    const { result } = renderHook(() => useSakhaStream());
    await act(async () => {
      await result.current.send('   ');
    });
    expect(result.current.messages).toHaveLength(0);
    expect(xhrQueue).toHaveLength(0);
  });

  it('streams { word } frames into the assistant message and finishes on { done: true }', async () => {
    const { result } = renderHook(() =>
      useSakhaStream({ getAccessToken: () => 'tok-provided' })
    );

    await act(async () => {
      await result.current.send('Why do I feel stuck?');
    });

    expect(xhrQueue).toHaveLength(1);
    const x = xhrQueue[0]!;
    expect(x.method).toBe('POST');
    expect(x.url).toBe('https://test.local/api/chat/message/stream');
    expect(x.headers.Authorization).toBe('Bearer tok-provided');
    expect(x.headers.Accept).toBe('text/event-stream');
    const payload = JSON.parse(x.body ?? '{}');
    expect(payload.message).toBe('Why do I feel stuck?');

    // 1. Optimistic user msg + empty assistant shell.
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]!.role).toBe('user');
    expect(result.current.messages[0]!.text).toBe('Why do I feel stuck?');
    expect(result.current.messages[1]!.role).toBe('assistant');
    expect(result.current.messages[1]!.text).toBe('');
    expect(result.current.streaming).toBe(true);

    // 2. Stream word frames.
    await act(async () => {
      x._emit('data: {"word":"Dear "}\n\n');
      x._emit('data: {"word":"one, "}\n\n');
      x._emit('data: {"word":"Krishna ","session_id":"s1"}\n\n');
      x._emit('data: {"word":"speaks."}\n\n');
    });

    expect(result.current.messages[1]!.text).toBe('Dear one, Krishna speaks.');
    expect(result.current.sessionId).toBe('s1');

    // 3. Done frame ends the stream.
    await act(async () => {
      x._emit('data: {"done":true,"verseRefs":[]}\n\n');
      x._finish(200);
    });

    expect(result.current.streaming).toBe(false);
    expect(result.current.messages[1]!.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('accepts the legacy plain-text SSE format with a trailing [DONE]', async () => {
    const { result } = renderHook(() =>
      useSakhaStream({ getAccessToken: () => 'tok' })
    );

    await act(async () => {
      await result.current.send('Hello');
    });
    const x = xhrQueue[0]!;

    await act(async () => {
      x._emit('data: The\n\n');
      x._emit('data: divine\n\n');
      x._emit('data: listens.\n\n');
      x._emit('data: [DONE]\n\n');
      x._finish(200);
    });

    // Legacy parser space-pads multi-frame responses.
    expect(result.current.messages[1]!.text).toBe('The divine listens.');
    expect(result.current.streaming).toBe(false);
  });

  it('reuses captured session_id on subsequent sends', async () => {
    const { result } = renderHook(() =>
      useSakhaStream({ getAccessToken: () => 'tok' })
    );

    await act(async () => {
      await result.current.send('First');
    });
    const x1 = xhrQueue[0]!;
    await act(async () => {
      x1._emit('data: {"word":"Hi","session_id":"abc-123"}\n\n');
      x1._emit('data: {"done":true}\n\n');
      x1._finish(200);
    });

    expect(result.current.sessionId).toBe('abc-123');

    await act(async () => {
      await result.current.send('Second');
    });
    const x2 = xhrQueue[1]!;
    const body2 = JSON.parse(x2.body ?? '{}');
    expect(body2.session_id).toBe('abc-123');
  });

  it('on 401 silently refreshes the token and retries once', async () => {
    const apiMod = jest.requireMock('@kiaanverse/api') as {
      refreshAccessToken: jest.Mock;
    };
    apiMod.refreshAccessToken.mockResolvedValueOnce('tok-after-refresh');

    const { result } = renderHook(() =>
      useSakhaStream({ getAccessToken: () => 'tok-original' })
    );

    await act(async () => {
      await result.current.send('Who am I?');
    });
    expect(xhrQueue).toHaveLength(1);

    // First XHR — backend returns 401.
    await act(async () => {
      xhrQueue[0]!._finish(401);
    });

    // Wait a microtask for refresh + re-open.
    await act(async () => {
      await new Promise((r) => setImmediate(r));
    });

    expect(xhrQueue).toHaveLength(2);
    expect(xhrQueue[1]!.headers.Authorization).toBe('Bearer tok-after-refresh');

    // Second XHR succeeds.
    await act(async () => {
      xhrQueue[1]!._emit('data: {"word":"I am."}\n\n');
      xhrQueue[1]!._emit('data: {"done":true}\n\n');
      xhrQueue[1]!._finish(200);
    });

    expect(result.current.messages[1]!.text).toBe('I am.');
    expect(result.current.error).toBeNull();
  });

  it('surfaces the "cold start" copy on 503', async () => {
    const { result } = renderHook(() =>
      useSakhaStream({ getAccessToken: () => 'tok' })
    );

    await act(async () => {
      await result.current.send('Ask');
    });

    await act(async () => {
      xhrQueue[0]!._finish(503);
    });

    expect(result.current.streaming).toBe(false);
    expect(result.current.error).toMatch(/waking from deep meditation/);
    // The error copy also lands in the assistant message so the user sees it.
    expect(result.current.messages[1]!.text).toMatch(
      /waking from deep meditation/
    );
  });

  it('surfaces the "connection wavered" copy on network error', async () => {
    const { result } = renderHook(() =>
      useSakhaStream({ getAccessToken: () => 'tok' })
    );

    await act(async () => {
      await result.current.send('Ask');
    });

    await act(async () => {
      xhrQueue[0]!.onerror?.();
    });

    expect(result.current.error).toMatch(/cosmic network wavered/);
    expect(result.current.streaming).toBe(false);
  });

  it('abort() silently ends streaming with no error set', async () => {
    const { result } = renderHook(() =>
      useSakhaStream({ getAccessToken: () => 'tok' })
    );

    await act(async () => {
      await result.current.send('Ask');
    });

    await act(async () => {
      result.current.abort();
    });

    expect(result.current.streaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('reset() clears messages, session, error', async () => {
    const { result } = renderHook(() =>
      useSakhaStream({ getAccessToken: () => 'tok' })
    );

    await act(async () => {
      await result.current.send('Ask');
    });
    await act(async () => {
      xhrQueue[0]!._emit('data: {"word":"Hi","session_id":"s"}\n\n');
      xhrQueue[0]!._emit('data: {"done":true}\n\n');
      xhrQueue[0]!._finish(200);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.sessionId).toBe('s');

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.sessionId).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
