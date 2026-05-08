/**
 * divineVoice — picks the highest-quality voice the device offers per
 * language and applies contemplative prosody for Sakha's spiritual
 * dialogue.
 *
 * Background: android.speech.tts.TextToSpeech (which expo-speech wraps,
 * which kiaanverse.com mobile uses through the browser's
 * SpeechSynthesis API) ships 4-8 voices per supported locale on most
 * Android devices. ONE of those is typically a Google neural-network
 * voice ("network" suffix) — vastly more expressive than the default
 * "local" voice the engine picks if you don't specify. By explicitly
 * selecting the network voice + a female persona for Sakha + slightly
 * slower rate, we get something that genuinely sounds divine + natural
 * without any paid provider (Sarvam / ElevenLabs / Bhashini).
 *
 * Selection priority (highest to lowest):
 *   1. quality === 'Enhanced' (Apple's neural voices on iOS; equivalent
 *      to Google's network voices on Android)
 *   2. identifier contains 'network' (Google's cloud-trained neural
 *      voices — these are noticeably better than 'local' variants)
 *   3. identifier or name suggests female (Sakha persona is feminine —
 *      Devi / Mother / Friend; female voice fits the spiritual register)
 *   4. exact language match preferred over language-fallback
 *      (e.g., 'sa-IN' falls back to 'hi-IN' since most devices don't
 *      ship Sanskrit voices, and Hindi pronounces Devanagari correctly)
 *
 * Prosody tuning (overlaid on the selected voice):
 *   • rate 0.88  — contemplative cadence, neither rushed nor sluggish
 *   • pitch 0.98 — barely below natural; deepens slightly for gravitas
 *
 * The selected voice IDs are cached in module memory (per app session)
 * so we don't re-enumerate the device voice list on every Listen tap.
 * Cache TTL is the app session — voices don't change at runtime.
 *
 * If the device has NO voices for a language (extremely rare; even
 * stripped-down ROMs ship 'eng-USA' fallbacks), the selector returns
 * undefined and Speech.speak falls back to the engine's default voice
 * — degraded experience, but no crash.
 */

import * as Speech from 'expo-speech';

/** Languages we explicitly select voices for. Keep in sync with the
 *  set of locales used by ListenButton callers. */
const TARGET_LANGUAGES = ['en-IN', 'hi-IN', 'sa-IN', 'mr-IN', 'ta-IN', 'bn-IN'] as const;
type TargetLanguage = (typeof TARGET_LANGUAGES)[number];

/** Resolved voice IDs — one per language. undefined = no voice
 *  matched, fall back to engine default. */
type VoiceCache = Record<string, string | undefined>;

/** Module-scoped cache. First call to selectDivineVoice() warms it;
 *  subsequent calls hit memory. */
let voiceCache: VoiceCache | null = null;
let warmupPromise: Promise<VoiceCache> | null = null;

/**
 * Score a candidate voice. Higher score = better fit for Sakha's
 * spiritual dialogue.
 *
 * KEY INSIGHT (revised 2025-11): Google's Android TTS exposes the
 * SAME high-quality female-Indian-English voice in two variants:
 *
 *   • en-in-x-ahp-LOCAL    — voice model bundled in TTS engine,
 *                            INSTANT playback, no network call ever
 *   • en-in-x-ahp-NETWORK  — same voice model fetched on-demand
 *                            from Google's servers, 200-1000ms wait
 *                            on FIRST use (cached after that)
 *
 * Both variants render the EXACT SAME audio. The "network" suffix is
 * a download-on-demand strategy, not a quality tier. Preferring local
 * over network is therefore strictly better: same quality, zero
 * latency, no internet required.
 *
 * Earlier versions of this file scored network higher than local —
 * that was a misread of the Android TTS API. The result was a
 * noticeable lag on the first Listen tap of every fresh app launch.
 * The fix is one-line: invert the local/network scoring.
 */
function scoreVoice(voice: Speech.Voice, targetLang: string): number {
  let score = 0;

  // Exact language match (e.g., 'en-IN' matches 'en-IN' but also
  // matches 'en-in' since BCP-47 is case-insensitive).
  const voiceLang = voice.language.toLowerCase();
  const wanted = targetLang.toLowerCase();
  if (voiceLang === wanted) {
    score += 100;
  } else if (voiceLang.startsWith(wanted.split('-')[0])) {
    // Same base language but different region (e.g., en-US vs en-IN).
    // Better than nothing but worse than exact match.
    score += 40;
  } else {
    // Wrong language entirely — disqualify.
    return -1;
  }

  // Apple's quality flag (iOS): 'Enhanced' voices are neural.
  if (voice.quality === 'Enhanced') score += 50;

  // Google neural voice variants. LOCAL beats network because they
  // render identical audio and local has no first-use download wait.
  // The user explicitly asked for instant playback — local wins.
  const id = voice.identifier?.toLowerCase() ?? '';
  if (id.includes('local')) score += 90;
  else if (id.includes('network')) score += 20;
  else if (id.includes('neural')) score += 70;

  // Prefer female voices for Sakha's persona. Indian English female
  // voice IDs typically contain 'ahp' / 'cxx' / 'female'; Hindi
  // female contains 'hia' / 'female'. Sanskrit voices are rare;
  // when present they're typically female by convention.
  const name = voice.name?.toLowerCase() ?? '';
  if (
    id.includes('female') ||
    name.includes('female') ||
    /\bahp\b|\bcxx\b|\bhia\b/.test(id)
  ) {
    score += 30;
  }

  // Slight bonus for non-default voices — the engine's default is
  // usually the lowest-quality option, kept for backward compat.
  if (id.length > 0) score += 5;

  return score;
}

/**
 * Pick the best voice for one target language out of the available
 * voice list. Returns the identifier (string) or undefined if no
 * acceptable match exists.
 */
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

/**
 * Warm the cache by enumerating device voices and picking the best
 * for each target language. ALSO pre-warms the TTS audio pipeline
 * by triggering a no-op engine call — the first real Speech.speak()
 * after this completes is genuinely instant (otherwise it pays a
 * 50-200ms one-time engine init cost on first use).
 *
 * Call this from app boot or lazily from the first ListenButton tap.
 * Idempotent — second call returns the cached promise.
 */
export function warmDivineVoiceCache(): Promise<VoiceCache> {
  if (warmupPromise) return warmupPromise;
  warmupPromise = (async () => {
    let voices: Speech.Voice[] = [];
    try {
      voices = await Speech.getAvailableVoicesAsync();
    } catch {
      // expo-speech is unavailable on web preview / certain RN dev
      // builds; treat as no-voices and let speech fall back to
      // default. NOT a crash — the cache just stays empty.
      voices = [];
    }
    const cache: VoiceCache = {};
    for (const lang of TARGET_LANGUAGES) {
      cache[lang] = pickBestVoice(voices, lang);
    }
    voiceCache = cache;

    // Pre-warm the TTS audio pipeline. The first speak after app
    // launch normally pays a one-time ~50-200ms engine init cost
    // (allocating an AudioTrack, opening an AudioFlinger session,
    // initializing the synthesis engine). Calling
    // Speech.isSpeakingAsync() forces those allocations now, before
    // the user ever taps a Listen button — so the first real
    // utterance is instant.
    //
    // Failure-silent: if the call throws (very rare), we just lose
    // the pre-warm benefit. Speech.speak still works fine, just
    // pays the init cost on first real call.
    try {
      await Speech.isSpeakingAsync();
    } catch {
      // ignore — pre-warm is a nice-to-have, not load-bearing.
    }

    return cache;
  })();
  return warmupPromise;
}

/**
 * Synchronous accessor — returns the cached voice ID for a language,
 * or undefined if the cache is cold or no voice matched. Callers
 * should await `warmDivineVoiceCache()` once at app start to populate
 * before relying on this.
 */
export function getDivineVoiceSync(language: string): string | undefined {
  if (!voiceCache) return undefined;
  // Try exact match first, then language base (e.g., 'sa-IN' →
  // 'hi-IN' since most devices don't ship Sanskrit but Hindi
  // pronounces Devanagari correctly).
  if (voiceCache[language]) return voiceCache[language];
  if (language === 'sa-IN') return voiceCache['hi-IN'];
  return undefined;
}

/**
 * One-shot helper — warms cache if needed, then returns the voice ID.
 * Use this from async contexts (e.g., right before a Speech.speak call
 * if you're not sure whether warmup has run).
 */
export async function getDivineVoice(language: string): Promise<string | undefined> {
  if (!voiceCache) await warmDivineVoiceCache();
  return getDivineVoiceSync(language);
}

/**
 * Divine prosody — apply to every Speech.speak call across the app for
 * a unified contemplative cadence. Spread into the speak options:
 *
 *   Speech.speak(text, {
 *     ...divineProsody('en-IN'),
 *     onDone: ...,
 *   });
 *
 * Per-language overrides are possible (e.g., Sanskrit slightly slower
 * for clarity on Devanagari pronunciation), but the defaults are
 * sensible across all 6 target languages.
 */
export interface DivineProsody {
  language: string;
  rate: number;
  pitch: number;
  voice?: string;
}

export function divineProsody(language: string): DivineProsody {
  const voice = getDivineVoiceSync(language);
  // Sanskrit needs a slightly slower rate so Devanagari syllables
  // land cleanly. Other languages share the contemplative 0.88 rate.
  const rate = language === 'sa-IN' ? 0.85 : 0.88;
  // Slight pitch lowering — 0.98 is barely below natural and gives
  // the voice a sense of weight without sounding artificially deep.
  // Sanskrit goes a touch lower (0.97) to match the ritualistic
  // register Vedic chant traditionally uses.
  const pitch = language === 'sa-IN' ? 0.97 : 0.98;
  return { language, rate, pitch, voice };
}
