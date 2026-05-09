/**
 * divineVoice — pick the most natural-sounding voice the device offers,
 * apply contemplative prosody, and let the user override the default.
 *
 * The Android system TTS engine (which expo-speech wraps) ships
 * multiple quality tiers per locale. From most-natural to least:
 *
 *   1. **Studio**  (Google Cloud Studio voices, near-human prosody)
 *      ids look like ``en-US-Studio-O``, ``en-IN-Studio-A``
 *   2. **Neural2** (Google's current best on-device neural)
 *      ids look like ``en-IN-Neural2-A``
 *   3. **WaveNet** (older neural, still much better than Standard)
 *      ids look like ``en-IN-Wavenet-A``, ``en-in-x-ahp-NETWORK``
 *   4. **Local**   (bundled voice model — same quality as Network for
 *      most modern voices, just downloaded vs streamed)
 *      ids look like ``en-in-x-ahp-LOCAL``
 *   5. **Standard** (legacy text-to-speech engine; robotic)
 *
 * For Sakha — divine, soothing, calm — we want Studio first, then
 * Neural2, then WaveNet/Local (which on most modern Android devices
 * are the same quality), and Standard only as a last resort.
 *
 * Female voices fit the Sakha persona (Devi / Mother / Friend).
 *
 * USER OVERRIDE
 * -------------
 * The picker in ``app/settings/voice.tsx`` lets users browse all
 * available voices for a language and lock in a specific one. That
 * choice is persisted in AsyncStorage and takes priority over
 * automatic scoring. Selecting "Auto" clears the override and
 * returns to the scored default.
 *
 * PROSODY PRESETS
 * ---------------
 * Three personas are available; the persisted choice is loaded once
 * and applied across every Speech.speak() call in the app:
 *
 *   • **divine**       (default) — rate 0.88, pitch 0.98 — contemplative
 *                      cadence, slightly lower for gravitas. Best for
 *                      verse readings and Voice Companion.
 *   • **friend**       — rate 0.95, pitch 1.00 — warm, conversational.
 *                      Best for chat Listen.
 *   • **storyteller**  — rate 0.85, pitch 0.96 — slow, grave. Best for
 *                      verse-by-verse readings of the Gita.
 *
 * Sanskrit (sa-IN) gets a touch slower across all presets so
 * Devanagari syllables land cleanly.
 *
 * CACHE BEHAVIOUR
 * ---------------
 * Voice list + user override are read once at app boot via
 * ``warmDivineVoiceCache()`` and held in module memory for the rest
 * of the session. Voice list never changes at runtime; user override
 * changes go through ``setPreferredVoice()`` which both persists to
 * AsyncStorage and updates the in-memory cache so the next
 * Speech.speak picks up the change instantly.
 *
 * If the device has NO voices for a language the selector returns
 * undefined and Speech.speak falls back to the engine default.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

import {
  CLOUD_VOICE_PREFIX,
  findCloudVoice,
  isCloudVoiceId,
  parseCloudVoiceId,
} from './cloudVoices';
import {
  cloudIsSpeaking,
  cloudSpeak,
  cloudStop,
} from './cloudTTS';

// ── TARGET LANGUAGES ─────────────────────────────────────────────────
/** Languages we explicitly select voices for. Keep in sync with the
 *  set of locales used by ListenButton callers. */
const TARGET_LANGUAGES = [
  'en-IN',
  'hi-IN',
  'sa-IN',
  'mr-IN',
  'ta-IN',
  'bn-IN',
] as const;

// ── PROSODY PRESETS ──────────────────────────────────────────────────
export type DivinePersona = 'divine' | 'friend' | 'storyteller';

const PERSONA_PRESETS: Record<
  DivinePersona,
  { rate: number; pitch: number; rateBoostSanskrit: number }
> = {
  divine: { rate: 0.88, pitch: 0.98, rateBoostSanskrit: -0.03 },
  friend: { rate: 0.95, pitch: 1.0, rateBoostSanskrit: -0.05 },
  storyteller: { rate: 0.85, pitch: 0.96, rateBoostSanskrit: -0.03 },
};

// ── PERSISTENCE KEYS ─────────────────────────────────────────────────
/** AsyncStorage key prefix for per-language voice overrides. */
const VOICE_OVERRIDE_KEY = (lang: string) =>
  `divineVoice:override:${lang}`;
/** AsyncStorage key for selected persona. */
const PERSONA_KEY = 'divineVoice:persona';

// ── MODULE STATE ─────────────────────────────────────────────────────
type VoiceCache = Record<string, string | undefined>;
type VoiceListCache = Record<string, Speech.Voice[]>;

let voiceCache: VoiceCache | null = null;
let voiceListCache: VoiceListCache | null = null;
let userOverrideCache: VoiceCache = {};
let personaCache: DivinePersona = 'divine';
let warmupPromise: Promise<VoiceCache> | null = null;

// ── SCORING ──────────────────────────────────────────────────────────
/**
 * Score a candidate voice. Higher = more natural for Sakha.
 *
 * Tier weights are gapped so a Studio voice always beats a Neural2 +
 * exact-language match, but a Neural2 in the wrong language still
 * loses to a Studio in the right one (we add the language match
 * weight on top).
 */
function scoreVoice(voice: Speech.Voice, targetLang: string): number {
  let score = 0;
  const id = voice.identifier?.toLowerCase() ?? '';
  const name = voice.name?.toLowerCase() ?? '';

  // ── Language match (gate) ──
  const voiceLang = voice.language.toLowerCase();
  const wanted = targetLang.toLowerCase();
  if (voiceLang === wanted) {
    score += 100;
  } else if (voiceLang.startsWith(wanted.split('-')[0])) {
    // Same base language but different region (e.g., en-US vs en-IN).
    // Worse than exact match, better than nothing.
    score += 40;
  } else {
    // Wrong language entirely — disqualify.
    return -1;
  }

  // ── Quality tier (the natural-sounding axis) ──
  // Studio > Neural2 > WaveNet > Local/Network > Standard
  // Gap > language-match weight so tier dominates.
  if (id.includes('studio') || name.includes('studio')) {
    score += 200;
  } else if (id.includes('neural2') || name.includes('neural2')) {
    score += 160;
  } else if (id.includes('neural') || name.includes('neural')) {
    score += 130;
  } else if (id.includes('wavenet') || name.includes('wavenet')) {
    score += 110;
  } else if (id.includes('local')) {
    // Same quality as network on modern Android — instant playback.
    score += 90;
  } else if (id.includes('network')) {
    // Equivalent quality to local but downloaded on demand.
    score += 70;
  }

  // iOS quality flag — Apple's neural voices are 'Enhanced'.
  if (voice.quality === 'Enhanced') score += 50;

  // ── Female bias for Sakha persona ──
  // Indian English female ids: 'ahp', 'cxx', 'female'.
  // Hindi female: 'hia', 'female'.
  // Sanskrit voices are rare; female by convention when present.
  if (
    id.includes('female') ||
    name.includes('female') ||
    /\bahp\b|\bcxx\b|\bhia\b/.test(id) ||
    /-[acef]-?$/i.test(id) // Google convention: -A, -C, -E, -F = female
  ) {
    score += 30;
  }

  // Slight bonus for non-default voices — engine default is usually
  // the lowest-quality option kept for backward compat.
  if (id.length > 0) score += 5;

  return score;
}

function pickBestVoice(
  voices: readonly Speech.Voice[],
  targetLang: string,
): string | undefined {
  let best: Speech.Voice | null = null;
  let bestScore = -1;
  for (const v of voices) {
    const score = scoreVoice(v, targetLang);
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best?.identifier;
}

// ── PUBLIC API: VOICE LIST FOR PICKER ────────────────────────────────
/**
 * One row in the voice picker. Exposes everything the picker UI needs
 * to render a friendly label + a quality badge.
 */
export interface VoiceOption {
  /** Stable identifier — pass to Speech.speak via `voice` option. */
  readonly identifier: string;
  /** Human-readable name from the engine. */
  readonly name: string;
  /** BCP-47 language tag, e.g. ``en-IN``. */
  readonly language: string;
  /** Quality badge for the picker — derived from id/name patterns. */
  readonly quality: 'studio' | 'neural2' | 'neural' | 'wavenet' | 'local' | 'standard';
  /** Best guess at gender. ``female`` is preferred for Sakha. */
  readonly gender: 'female' | 'male' | 'unknown';
  /** Score from the auto-pick algorithm — descending = more natural. */
  readonly score: number;
}

function inferGender(voice: Speech.Voice): VoiceOption['gender'] {
  const id = voice.identifier?.toLowerCase() ?? '';
  const name = voice.name?.toLowerCase() ?? '';
  if (id.includes('female') || name.includes('female')) return 'female';
  if (id.includes('male') || name.includes('male')) return 'male';
  if (/\bahp\b|\bcxx\b|\bhia\b/.test(id)) return 'female';
  // Google convention: -A/-C/-E/-F female; -B/-D male.
  if (/-[acef]-?$/i.test(id)) return 'female';
  if (/-[bd]-?$/i.test(id)) return 'male';
  return 'unknown';
}

function inferQuality(voice: Speech.Voice): VoiceOption['quality'] {
  const id = voice.identifier?.toLowerCase() ?? '';
  const name = voice.name?.toLowerCase() ?? '';
  if (id.includes('studio') || name.includes('studio')) return 'studio';
  if (id.includes('neural2') || name.includes('neural2')) return 'neural2';
  if (id.includes('neural') || name.includes('neural')) return 'neural';
  if (id.includes('wavenet') || name.includes('wavenet')) return 'wavenet';
  if (id.includes('local') || id.includes('network')) return 'local';
  return 'standard';
}

/**
 * List all voices available on the device for ``language``, sorted by
 * scored quality (most natural first). Caller wires this into the
 * voice picker UI.
 */
export async function listVoicesForLanguage(
  language: string,
): Promise<VoiceOption[]> {
  // Ensure the cache is warm so we know the engine has been
  // enumerated at least once.
  if (!voiceListCache) {
    await warmDivineVoiceCache();
  }
  const all = voiceListCache?.['__all__'] ?? [];
  const lang = language.toLowerCase();
  const matched = all.filter((v) => {
    const vl = v.language.toLowerCase();
    return vl === lang || vl.startsWith(lang.split('-')[0]);
  });
  return matched
    .map((v) => ({
      identifier: v.identifier,
      name: v.name,
      language: v.language,
      quality: inferQuality(v),
      gender: inferGender(v),
      score: scoreVoice(v, language),
    }))
    .sort((a, b) => b.score - a.score);
}

// ── USER OVERRIDE PERSISTENCE ────────────────────────────────────────
/**
 * Read the persisted user override for one language. Returns undefined
 * when the user is on Auto (no override), or AsyncStorage is empty,
 * or storage threw.
 */
async function loadOverride(language: string): Promise<string | undefined> {
  try {
    const v = await AsyncStorage.getItem(VOICE_OVERRIDE_KEY(language));
    return v ?? undefined;
  } catch {
    return undefined;
  }
}

async function loadPersona(): Promise<DivinePersona> {
  try {
    const v = await AsyncStorage.getItem(PERSONA_KEY);
    if (v === 'friend' || v === 'storyteller' || v === 'divine') return v;
    return 'divine';
  } catch {
    return 'divine';
  }
}

/**
 * Persist the user's pick for one language. Pass undefined to clear
 * the override and return to Auto.
 */
export async function setPreferredVoice(
  language: string,
  identifier: string | undefined,
): Promise<void> {
  if (identifier) {
    userOverrideCache[language] = identifier;
    try {
      await AsyncStorage.setItem(VOICE_OVERRIDE_KEY(language), identifier);
    } catch {
      // Best-effort persistence; cache update is what matters
      // immediately for the running session.
    }
  } else {
    delete userOverrideCache[language];
    try {
      await AsyncStorage.removeItem(VOICE_OVERRIDE_KEY(language));
    } catch {
      // ignore
    }
  }
}

/**
 * Read the current user override (memory cache only — no IO). Returns
 * undefined when on Auto.
 */
export function getPreferredVoiceSync(language: string): string | undefined {
  return userOverrideCache[language];
}

/** Persist the persona pick + update in-memory cache. */
export async function setPreferredPersona(persona: DivinePersona): Promise<void> {
  personaCache = persona;
  try {
    await AsyncStorage.setItem(PERSONA_KEY, persona);
  } catch {
    // ignore
  }
}

/** Read the in-memory persona (no IO). */
export function getPreferredPersonaSync(): DivinePersona {
  return personaCache;
}

// ── WARMUP ───────────────────────────────────────────────────────────
/**
 * Enumerate device voices, score them, load the user's persisted
 * overrides + persona pick, and pre-warm the TTS audio pipeline so
 * the first real Speech.speak() is genuinely instant.
 *
 * Idempotent — second call returns the cached promise.
 */
export function warmDivineVoiceCache(): Promise<VoiceCache> {
  if (warmupPromise) return warmupPromise;
  warmupPromise = (async () => {
    let voices: Speech.Voice[] = [];
    try {
      voices = await Speech.getAvailableVoicesAsync();
    } catch {
      voices = [];
    }
    const cache: VoiceCache = {};
    for (const lang of TARGET_LANGUAGES) {
      cache[lang] = pickBestVoice(voices, lang);
    }
    voiceCache = cache;
    voiceListCache = { __all__: voices };

    // Load every persisted override + persona in parallel. AsyncStorage
    // is fast (~5-10ms each) but issuing 6 reads in parallel keeps the
    // app-boot pre-warm under one frame.
    try {
      const [overrideEntries, persona] = await Promise.all([
        Promise.all(
          TARGET_LANGUAGES.map(async (lang) => {
            const id = await loadOverride(lang);
            return [lang, id] as const;
          }),
        ),
        loadPersona(),
      ]);
      const overrides: VoiceCache = {};
      for (const [lang, id] of overrideEntries) {
        if (id) overrides[lang] = id;
      }
      userOverrideCache = overrides;
      personaCache = persona;
    } catch {
      // Persistence failure → defaults. Auto-pick still works.
    }

    // Pre-warm the audio pipeline. First Speech.speak() after launch
    // pays a one-time ~50–200ms engine init (AudioTrack alloc, engine
    // init). Calling Speech.isSpeakingAsync() forces those allocations
    // now, before the user ever taps Listen.
    try {
      await Speech.isSpeakingAsync();
    } catch {
      // ignore
    }

    return cache;
  })();
  return warmupPromise;
}

// ── ACCESSORS ────────────────────────────────────────────────────────
/**
 * Return the best voice ID for ``language``. Resolution order:
 *
 *   1. Persisted user override (if any).
 *   2. Auto-scored best from the device voice list.
 *   3. Sanskrit-specific fallback to Hindi (most devices don't ship
 *      Sanskrit voices but Hindi pronounces Devanagari correctly).
 *   4. ``undefined`` — let Speech.speak use the engine default.
 *
 * Synchronous — caller must have already awaited
 * ``warmDivineVoiceCache()`` once at app start.
 */
export function getDivineVoiceSync(language: string): string | undefined {
  if (userOverrideCache[language]) return userOverrideCache[language];
  if (!voiceCache) return undefined;
  if (voiceCache[language]) return voiceCache[language];
  if (language === 'sa-IN') return voiceCache['hi-IN'];
  return undefined;
}

/**
 * Async one-shot helper — warms the cache if needed, then returns
 * the resolved voice ID.
 */
export async function getDivineVoice(
  language: string,
): Promise<string | undefined> {
  if (!voiceCache) await warmDivineVoiceCache();
  return getDivineVoiceSync(language);
}

// ── PROSODY ──────────────────────────────────────────────────────────
export interface DivineProsody {
  language: string;
  rate: number;
  pitch: number;
  voice?: string;
}

/**
 * Compose the full speak-options spread for a Speech.speak call.
 * Reads the user's persisted persona pick + voice override.
 *
 *   Speech.speak(text, {
 *     ...divineProsody('en-IN'),
 *     onDone: ...,
 *   });
 *
 * ``personaOverride`` (optional) lets a specific surface ignore the
 * user's saved persona — e.g. a verse-reading screen always uses
 * 'storyteller' regardless of preference.
 */
export function divineProsody(
  language: string,
  personaOverride?: DivinePersona,
): DivineProsody {
  const voice = getDivineVoiceSync(language);
  const persona = personaOverride ?? personaCache;
  const preset = PERSONA_PRESETS[persona];
  const isSanskrit = language === 'sa-IN';
  const rate = isSanskrit
    ? preset.rate + preset.rateBoostSanskrit
    : preset.rate;
  // Sanskrit drops a touch in pitch (0.97 vs 0.98) for the ritualistic
  // register Vedic chant traditionally uses.
  const pitch = isSanskrit ? preset.pitch - 0.01 : preset.pitch;
  return { language, rate, pitch, voice };
}

// ── UNIFIED SPEAK API ────────────────────────────────────────────────
/**
 * Options for ``speakDivinely`` — mirror the relevant subset of
 * ``Speech.SpeechOptions`` so call sites can swap with one line.
 */
export interface SpeakDivinelyOptions {
  /** Persona override — surface-specific (e.g. verse readings always
   *  use 'storyteller' regardless of user pick). */
  readonly personaOverride?: DivinePersona;
  /** Explicit cloud voice ID — pass ``divine-krishna``,
   *  ``divine-saraswati``, ``sarvam-rishi``, ``elevenlabs-nova``, etc.
   *  to bypass the user's persisted preference and force a specific
   *  cloud voice for this one utterance. Used by the verse-detail
   *  screen's 4-voice pill picker (Krishna / Saraswati / Rishi / Nova)
   *  so each button truly speaks in its named voice via cloud TTS,
   *  not in the user's globally-chosen voice. */
  readonly cloudVoiceId?: string;
  /** Fired when playback completes. Cloud and on-device paths both
   *  honour this. */
  readonly onDone?: () => void;
  /** Fired on any error. For on-device, this is Speech.SpeechOptions
   *  onError (passes a SpeechError); for cloud, an Error wrapper from
   *  the fetch / decode path. We coerce both into a plain ``Error``. */
  readonly onError?: (err: Error) => void;
  /** Cloud only — getter for the JWT, re-resolved per call. Required
   *  when the user has picked a cloud voice; ignored on-device. */
  readonly getAccessToken?: () => Promise<string | null> | string | null;
  /** Cloud only — backend baseURL override for tests. */
  readonly baseUrl?: string;
}

/**
 * Speak ``text`` in ``language`` using whichever path the caller or
 * user has selected.
 *
 * Routing precedence:
 *
 *   1. ``options.cloudVoiceId`` — explicit caller override. Always
 *      goes through cloud TTS regardless of user pref.
 *   2. User's persisted voice id starts with ``cloud:`` → ``cloudSpeak``.
 *   3. Otherwise → ``Speech.speak`` with the divine prosody.
 *
 * All paths converge on the same ``onDone`` / ``onError`` contract so
 * call sites (ListenButton, voice-companion, verse readings) can use
 * the same auto-listen loop / error handling regardless of provider.
 *
 * The active TTS path can be cancelled at any time with ``stopSpeaking()``.
 */
export async function speakDivinely(
  text: string,
  language: string,
  options: SpeakDivinelyOptions = {},
): Promise<void> {
  // Cancel anything already playing on either path.
  Speech.stop();
  await cloudStop();

  if (!text || !text.trim()) {
    options.onDone?.();
    return;
  }

  const persona = options.personaOverride ?? personaCache;
  const preset = PERSONA_PRESETS[persona];
  const voiceType =
    persona === 'friend'
      ? 'friendly'
      : persona === 'storyteller'
        ? 'storytelling'
        : 'calm';

  // ── Tier 1: explicit cloud override ──
  // The verse-detail screen's per-pill picker hands us ``divine-krishna``
  // etc. directly. Skip the persisted-preference lookup entirely so
  // the chosen voice plays exactly as labelled.
  if (options.cloudVoiceId) {
    await cloudSpeak(text, {
      voiceId: options.cloudVoiceId,
      language,
      voiceType,
      baseUrl: options.baseUrl,
      getAccessToken: options.getAccessToken,
      onDone: options.onDone,
      onError: options.onError,
    });
    return;
  }

  const resolvedVoice = getDivineVoiceSync(language);

  // ── Tier 2: user-persisted cloud voice ──
  if (isCloudVoiceId(resolvedVoice)) {
    const backendId = parseCloudVoiceId(resolvedVoice as string);
    const meta = findCloudVoice(resolvedVoice as string);
    if (!backendId || !meta) {
      // Stale persisted id — fall through to on-device.
    } else {
      await cloudSpeak(text, {
        voiceId: backendId,
        language,
        voiceType,
        baseUrl: options.baseUrl,
        getAccessToken: options.getAccessToken,
        onDone: options.onDone,
        onError: options.onError,
      });
      return;
    }
  }

  // ── Tier 3: on-device path ──
  const isSanskrit = language === 'sa-IN';
  const rate = isSanskrit
    ? preset.rate + preset.rateBoostSanskrit
    : preset.rate;
  const pitch = isSanskrit ? preset.pitch - 0.01 : preset.pitch;
  Speech.speak(text, {
    language,
    voice: resolvedVoice && !isCloudVoiceId(resolvedVoice) ? resolvedVoice : undefined,
    rate,
    pitch,
    onDone: options.onDone,
    onError: (err) => {
      const e =
        err instanceof Error
          ? err
          : new Error(
              typeof err === 'string'
                ? err
                : err
                  ? JSON.stringify(err)
                  : 'Speech.speak error',
            );
      options.onError?.(e);
    },
  });
}

/** Stop whichever path is currently speaking. Idempotent. */
export async function stopSpeaking(): Promise<void> {
  Speech.stop();
  await cloudStop();
}

/** True when either path has audio in flight. */
export async function isSpeaking(): Promise<boolean> {
  if (cloudIsSpeaking()) return true;
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}

// Re-export so call sites only need one import.
export {
  CLOUD_VOICE_PREFIX,
  isCloudVoiceId,
  parseCloudVoiceId,
} from './cloudVoices';

// ── PREVIEW ──────────────────────────────────────────────────────────
/**
 * Speak a short sample for the picker UI so users can hear a voice
 * before locking it in. Routes through the cloud path when the
 * supplied ``identifier`` is a cloud voice id, otherwise through
 * Speech.speak with the divine prosody.
 */
export function previewVoice(
  identifier: string,
  language: string,
  sampleText?: string,
  preview?: {
    readonly getAccessToken?: () => Promise<string | null> | string | null;
    readonly baseUrl?: string;
  },
): void {
  const text =
    sampleText ??
    (language.startsWith('hi') || language === 'sa-IN'
      ? 'नमस्ते। मैं सखा हूँ।'
      : language.startsWith('mr')
        ? 'नमस्कार. मी सखा आहे.'
        : language.startsWith('ta')
          ? 'வணக்கம். நான் சக்கா.'
          : language.startsWith('bn')
            ? 'নমস্কার। আমি সখা।'
            : 'Hello. I am Sakha — your friend in stillness.');

  // Stop both paths before previewing.
  Speech.stop();
  void cloudStop();

  if (isCloudVoiceId(identifier)) {
    const backendId = parseCloudVoiceId(identifier);
    if (!backendId) return;
    const persona = personaCache;
    const voiceType =
      persona === 'friend'
        ? 'friendly'
        : persona === 'storyteller'
          ? 'storytelling'
          : 'calm';
    void cloudSpeak(text, {
      voiceId: backendId,
      language,
      voiceType,
      baseUrl: preview?.baseUrl,
      getAccessToken: preview?.getAccessToken,
    });
    return;
  }

  const persona = personaCache;
  const preset = PERSONA_PRESETS[persona];
  Speech.speak(text, {
    language,
    voice: identifier,
    rate: preset.rate,
    pitch: preset.pitch,
  });
}
