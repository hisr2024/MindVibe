/**
 * cloudTTS — fetch a cloud-synthesised audio clip from the backend
 * (``POST /api/voice/synthesize``) and play it through expo-av.
 *
 * Why a cloud TTS path at all?
 * ----------------------------
 * On-device Android TTS — even Google's Studio voices — does not
 * match ElevenLabs Lily, Sarvam Bulbul, or Bhashini's Indic neural
 * voices for naturalness. The user wants Sakha to sound divine,
 * soothing, calm — never robotic. Cloud providers cross that bar.
 *
 * The backend already wraps all three providers behind a single
 * ``/api/voice/synthesize`` endpoint (see ``backend/routes/voice.py``
 * + ``backend/services/tts_service.py``). We POST text + voice_id +
 * language, receive MP3 bytes, write them to a temp file, and play
 * with ``Audio.Sound``.
 *
 * Cache strategy
 * --------------
 * Per-(text, voice_id) cache in the document directory. Same text +
 * voice replayed = no network call. Cache is purgeable from
 * ``/settings/voice``'s clear-cache button (TODO).
 *
 * Lifecycle
 * ---------
 * Each ``cloudSpeak()`` call cancels and unloads any in-flight clip
 * before starting a new one. ``cloudStop()`` is the universal stop.
 * Callers should treat this exactly like ``Speech.speak`` — same
 * onDone / onError shape.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// ── CONFIG ───────────────────────────────────────────────────────────
/** Match SynthesizeRequest.text limit on the backend. */
const MAX_TEXT_LENGTH = 5000;

// ── MODULE STATE ─────────────────────────────────────────────────────
/** Currently-loaded sound, if any. Single-stream playback model. */
let currentSound: Audio.Sound | null = null;
/** Monotonic request counter — every cloudSpeak call increments this.
 *  Used to detect stale responses: if a call's local snapshot of
 *  ``activeRequestId`` no longer matches the module-level value when
 *  it tries to play, it knows a newer call has superseded it and
 *  silently aborts. Eliminates the "tap voice A, tap voice B before A
 *  finishes fetching, A's audio plays after B's" overlap bug. */
let activeRequestId = 0;
/** AbortController for the current in-flight fetch. ``cloudStop``
 *  aborts it so the network call doesn't continue + waste an audio
 *  pipeline slot after the user has cancelled. */
let activeAbortController: AbortController | null = null;
/** Cache: hash key → file uri. Persists in module memory; survives
 *  the document-directory cache between cold starts. */
const fileCache = new Map<string, string>();
/** In-flight fetch deduplication so two simultaneous taps on the same
 *  Listen button don't double-fetch. Maps cache key → promise. */
const inflight = new Map<string, Promise<string>>();

// ── PUBLIC TYPES ─────────────────────────────────────────────────────
export interface CloudSpeakOptions {
  /** Backend voice_id (e.g. ``elevenlabs-nova``, ``sarvam-meera``). */
  readonly voiceId: string;
  /** BCP-47 language tag — ``en-IN`` becomes ``en`` on the wire since
   *  the backend uses ISO-639 codes. */
  readonly language: string;
  /** Voice persona — passed through as ``voice_type``. Defaults to
   *  ``calm`` which the backend tunes for soothing wisdom delivery. */
  readonly voiceType?:
    | 'calm'
    | 'wisdom'
    | 'friendly'
    | 'energetic'
    | 'soothing'
    | 'storytelling'
    | 'chanting';
  /** Backend baseURL override. Defaults to ``API_CONFIG.baseURL``. */
  readonly baseUrl?: string;
  /** Async getter for the JWT — re-resolved per call so token rotation
   *  doesn't strand a stale value. */
  readonly getAccessToken?: () => Promise<string | null> | string | null;
  /** Fired when playback finishes (matches ``Speech.SpeechOptions``). */
  readonly onDone?: () => void;
  /** Fired on fetch / decode / playback failure. */
  readonly onError?: (err: Error) => void;
  /** Fired when playback first starts (audio pipeline ready). */
  readonly onStart?: () => void;
}

// ── HELPERS ──────────────────────────────────────────────────────────
/** Stable cache key for a (text, voice_id, language) triple. */
function cacheKey(text: string, voiceId: string, language: string): string {
  // Lightweight hash: not cryptographic, just collision-resistant
  // for the size of cache we keep (a few hundred entries max).
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  }
  return `tts-${voiceId}-${language}-${h.toString(36)}-${text.length}`;
}

/** Map BCP-47 (``en-IN``) to ISO-639 (``en``) for the backend payload. */
function backendLanguageCode(bcp47: string): string {
  return bcp47.split('-')[0] || 'en';
}

/** Resolve API_CONFIG.baseURL lazily so this module doesn't pull in
 *  the @kiaanverse/api package at import time (kept light for tests). */
async function resolveBaseUrl(override?: string): Promise<string> {
  if (override) return override;
  // Lazy import — only triggered when cloudSpeak() actually fires.
  const { API_CONFIG } = await import('@kiaanverse/api');
  return API_CONFIG.baseURL;
}

// ── CACHE I/O ────────────────────────────────────────────────────────
/** Path on disk for a cached clip. */
function cacheFilePath(key: string): string {
  // ``cacheDirectory`` is wiped by Android occasionally; that's fine —
  // we just refetch on the next play.
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  return `${base}${key}.mp3`;
}

async function readFromCache(key: string): Promise<string | null> {
  // Memory cache hit — fastest path.
  const memHit = fileCache.get(key);
  if (memHit) {
    try {
      const info = await FileSystem.getInfoAsync(memHit);
      if (info.exists) return memHit;
    } catch {
      // fall through
    }
    fileCache.delete(key);
  }
  // Disk cache hit — verify the file still exists.
  const path = cacheFilePath(key);
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      fileCache.set(key, path);
      return path;
    }
  } catch {
    // ignore
  }
  return null;
}

async function writeToCache(key: string, mp3Bytes: ArrayBuffer): Promise<string> {
  const path = cacheFilePath(key);
  // Convert ArrayBuffer → base64 for FileSystem.writeAsStringAsync.
  // Reasonable for clips < 1 MB (typical Sakha responses are ~50–300 KB).
  const base64 = arrayBufferToBase64(mp3Bytes);
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  fileCache.set(key, path);
  return path;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  // Process in 8 KB chunks to avoid stack-size issues on long clips.
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, Math.min(i + chunk, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  // global.btoa is available on Hermes / RN.
  return globalThis.btoa(binary);
}

// ── FETCH ────────────────────────────────────────────────────────────
/**
 * Fetch + cache a single audio clip. Returns the local file uri.
 * Dedupes concurrent fetches for the same key. Honours the abort
 * signal so cloudStop() actually cancels the network request.
 */
async function fetchClip(
  text: string,
  opts: CloudSpeakOptions,
  signal: AbortSignal,
): Promise<string> {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(
      `cloudTTS: text exceeds backend cap of ${MAX_TEXT_LENGTH} chars`,
    );
  }
  const key = cacheKey(text, opts.voiceId, opts.language);

  // Memory / disk cache — instant replay.
  const cached = await readFromCache(key);
  if (cached) return cached;

  // Dedupe in-flight fetches for this exact key. Note: dedup is keyed
  // on (text, voiceId, language) so two concurrent calls for the SAME
  // voice + text share one fetch. Different voices / texts always
  // run their own fetch.
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const baseUrl = await resolveBaseUrl(opts.baseUrl);
    const url = `${baseUrl}/api/voice/synthesize`;
    let token: string | null = null;
    if (opts.getAccessToken) {
      const resolved = await opts.getAccessToken();
      token = typeof resolved === 'string' ? resolved : null;
    }
    const body = JSON.stringify({
      text,
      language: backendLanguageCode(opts.language),
      voice_type: opts.voiceType ?? 'calm',
      voice_id: opts.voiceId,
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg, audio/*',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal,
    });
    if (!response.ok) {
      // Drain body so the error message is informative without
      // leaking sensitive payload contents.
      let detail = '';
      try {
        detail = (await response.text()).slice(0, 200);
      } catch {
        // ignore
      }
      throw new Error(
        `cloudTTS: backend ${response.status} ${response.statusText} — ${detail}`,
      );
    }
    const buf = await response.arrayBuffer();
    if (!buf || buf.byteLength === 0) {
      throw new Error('cloudTTS: backend returned empty audio body');
    }
    return writeToCache(key, buf);
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

// ── PLAYBACK ─────────────────────────────────────────────────────────
async function unloadCurrent(): Promise<void> {
  const s = currentSound;
  currentSound = null;
  if (s) {
    try {
      await s.stopAsync();
    } catch {
      // ignore
    }
    try {
      await s.unloadAsync();
    } catch {
      // ignore
    }
  }
}

/**
 * Force the audio session into playback mode. ``useDictation`` sets the
 * mode to ``allowsRecordingIOS: true`` when listening — if we attempt to
 * play audio while that mode is still active, the route is the mic
 * earpiece (very quiet) on iOS and the recording stream on Android,
 * which can result in NO audible output.
 *
 * Also crucial: ``playsInSilentModeIOS: true`` so iOS users on silent
 * mode still hear Sakha (this is a feature, not a notification).
 *
 * Idempotent — expo-av no-ops if the same mode is set twice. Errors are
 * silently swallowed so a permission edge case doesn't break playback;
 * the createAsync call below will surface any real failure.
 */
async function ensurePlaybackAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: 1, // DoNotMix — Sakha takes the channel
      interruptionModeAndroid: 1, // DoNotMix
    });
  } catch (e) {
    // Best-effort. Real audio failures will surface from createAsync.
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('cloudTTS: ensurePlaybackAudioMode failed:', e);
    }
  }
}

/**
 * Synthesize + play a single clip. Cancels any in-flight playback OR
 * in-flight fetch before starting. Cache hits play immediately; cache
 * misses fetch first (typical 200–600ms for a 200-character response).
 *
 * Mirror of Speech.speak shape so the call sites can swap between
 * on-device and cloud paths with a single conditional.
 *
 * Race-safety
 * -----------
 * Each call increments ``activeRequestId`` and snapshots its own ID.
 * Before each await checkpoint (after fetch, before createAsync,
 * after createAsync), the call compares its snapshot against the
 * module-level ``activeRequestId``. If they differ, a newer call has
 * superseded this one — we drop the result silently. This eliminates
 * the "tap voice A, tap voice B before A finishes, both play" overlap.
 *
 * The fetch itself is wired to an ``AbortController`` whose ``abort()``
 * is invoked by ``cloudStop()`` — so cancelling truly cancels the
 * network call, not just the playback.
 */
export async function cloudSpeak(
  text: string,
  options: CloudSpeakOptions,
): Promise<void> {
  // Cancel any prior in-flight call (network + playback). This MUST
  // run before incrementing activeRequestId so the prior call's
  // staleness check works correctly.
  await cloudStop();

  if (!text || !text.trim()) {
    options.onDone?.();
    return;
  }

  // Snapshot a unique ID for this call so subsequent staleness checks
  // can compare against the module-level activeRequestId.
  const myRequestId = ++activeRequestId;
  const abortController = new AbortController();
  activeAbortController = abortController;

  // Force the audio session into playback mode BEFORE doing anything
  // else. If useDictation just finished, the mode is still recording —
  // playing under recording mode produces no audible output.
  await ensurePlaybackAudioMode();
  if (myRequestId !== activeRequestId) return; // superseded — drop

  let uri: string;
  try {
    uri = await fetchClip(text, options, abortController.signal);
  } catch (e) {
    if (myRequestId !== activeRequestId) return; // superseded — drop
    const err = e instanceof Error ? e : new Error(String(e));
    // Treat AbortError as a normal cancellation — not a real error.
    // The user (or a newer cloudSpeak call) requested the abort.
    if (
      err.name === 'AbortError' ||
      (err.message && err.message.toLowerCase().includes('aborted'))
    ) {
      return;
    }
    // Log so silent failures are diagnosable from adb logcat. Without
    // this, a 401/403/timeout looks identical to "audio is fine, just
    // really quiet" to the user.
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('cloudTTS: fetch failed —', err.message);
    }
    options.onError?.(err);
    return;
  }

  // Post-fetch staleness re-check — the user may have tapped another
  // voice while we were waiting on the network.
  if (myRequestId !== activeRequestId) return;

  try {
    // Holder for the sound — referenced inside the status callback
    // BEFORE createAsync resolves. Passing the callback as the third
    // arg of createAsync (rather than via setOnPlaybackStatusUpdate
    // afterwards) eliminates a tiny race where very short clips can
    // fire didJustFinish before the late-bound listener attaches —
    // which would mean onDone never fires and the voice-companion
    // auto-listen loop hangs in the 'speaking' state forever.
    const holder: { sound: Audio.Sound | null } = { sound: null };
    const onStatus = (status: import('expo-av').AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        const s = holder.sound;
        if (s && currentSound === s) currentSound = null;
        if (s) s.unloadAsync().catch(() => undefined);
        options.onDone?.();
      }
    };
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 },
      onStatus,
    );
    // Final staleness check after the createAsync await — unload
    // immediately if we've been superseded.
    if (myRequestId !== activeRequestId) {
      sound.unloadAsync().catch(() => undefined);
      return;
    }
    holder.sound = sound;
    currentSound = sound;
    options.onStart?.();
  } catch (e) {
    if (myRequestId !== activeRequestId) return; // superseded — drop
    const err = e instanceof Error ? e : new Error(String(e));
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('cloudTTS: playback failed —', err.message);
    }
    options.onError?.(err);
  }
}

/**
 * Stop any in-flight playback OR fetch. Idempotent. Bumps the
 * ``activeRequestId`` so any pending cloudSpeak call sees its
 * snapshot is stale and drops silently.
 */
export async function cloudStop(): Promise<void> {
  // Bump the active request id so any pending cloudSpeak detects
  // staleness and drops silently — including ones still inside the
  // fetch await that didn't get aborted in time.
  activeRequestId++;
  // Abort any in-flight fetch. fetch() honours the abort signal and
  // throws AbortError, which cloudSpeak treats as a non-error.
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {
      // ignore
    }
    activeAbortController = null;
  }
  await unloadCurrent();
}

/** Whether a clip is currently playing — useful for ListenButton's
 *  Stop / Listen toggle state. */
export function cloudIsSpeaking(): boolean {
  return currentSound !== null;
}

/** Pre-fetch a clip without playing — useful for verse-of-the-day
 *  cards that want instant playback on first tap. Best-effort. */
export async function cloudPrefetch(
  text: string,
  options: CloudSpeakOptions,
): Promise<void> {
  try {
    await fetchClip(text, options);
  } catch {
    // Pre-fetch is opportunistic; failures are silently dropped.
  }
}
