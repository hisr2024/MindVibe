/**
 * cloudVoices — curated 6-voice catalog with EXPLICIT (provider, speaker)
 * bindings.
 *
 * REBUILD from scratch: previous catalog used KIAAN-persona IDs
 * (``divine-krishna`` / ``sarvam-rishi`` / ``elevenlabs-nova``) that
 * the backend then double-resolved through persona→speaker maps. That
 * indirection caused collisions (two persona ids defaulting to the
 * same speaker → identical audio) and forced every voice through
 * the Sarvam-first chain (Krishna and Rishi both ended up as Sarvam
 * deep-male voices, indistinguishable to casual listening).
 *
 * New contract: ``voice_id = "<provider>-<speaker_id>"`` is THE
 * canonical wire format. Backend reads the prefix, calls that
 * provider's API with that exact speaker, no lookup table in between.
 * If the primary provider fails (rate limit / outage), the chain
 * falls through canonical order (Sarvam → ElevenLabs → Microsoft
 * Neural → Bhashini-deferred). Bhashini stays placeholder until
 * MeitY approval.
 *
 * Six voices, three primary providers, every voice EXPLICITLY routed
 * to a distinct (provider, speaker) pair:
 *
 *   • Saraswati  → ElevenLabs Dorothy (ethereal British female)
 *   • Krishna    → ElevenLabs Clyde   (American storyteller male)
 *   • Rishi      → Sarvam Karun       (deep Indic male, Sanskrit register)
 *   • Meera      → Sarvam Manisha     (warm Indic female)
 *   • Nova       → ElevenLabs Rachel  (clear American female)
 *   • Lily       → ElevenLabs Bella   (bright expressive female)
 *
 * Two voices on Sarvam (Rishi + Meera — the Indic register), four
 * on ElevenLabs (the divine + English register). Provider preference
 * matches each voice's intended character.
 */

/** Stable identifier prefix marking a voice as cloud-routed (vs the
 *  on-device device-voice path that uses ``Speech.speak``). */
export const CLOUD_VOICE_PREFIX = 'cloud:';

export type CloudProvider =
  | 'sarvam'
  | 'elevenlabs'
  | 'microsoft'
  | 'bhashini';

export interface CloudVoiceOption {
  /** Stored identifier with the ``cloud:`` prefix (what AsyncStorage
   *  holds). */
  readonly id: string;
  /** Backend-recognized voice_id sent over the wire. Format:
   *  ``<provider>-<speaker_id>``, e.g. ``sarvam-karun``. The backend
   *  splits on the first ``-`` to extract provider + speaker. */
  readonly backendVoiceId: string;
  /** Display name in the picker. */
  readonly name: string;
  /** Provider badge — colour-coded in the picker. */
  readonly provider: CloudProvider;
  /** Languages this voice handles natively (BCP-47 tags). */
  readonly supportedLanguages: readonly string[];
  /** Persona description shown under the voice name. */
  readonly description: string;
  /** Gender hint for the picker. */
  readonly gender: 'female' | 'male';
}

function makeId(backendId: string): string {
  return `${CLOUD_VOICE_PREFIX}${backendId}`;
}

/** Strip the ``cloud:`` prefix from a stored override to recover the
 *  backend voice_id. Returns null when the id is not a cloud voice. */
export function parseCloudVoiceId(stored: string): string | null {
  if (!stored.startsWith(CLOUD_VOICE_PREFIX)) return null;
  return stored.slice(CLOUD_VOICE_PREFIX.length);
}

export function isCloudVoiceId(stored: string | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(CLOUD_VOICE_PREFIX);
}

// ── CURATED 6-VOICE CATALOG ──────────────────────────────────────────
//
// Each voice is bound to a SPECIFIC speaker at its SPECIFIC primary
// provider. No KIAAN-persona indirection. No ambiguous defaults.
//
// The backendVoiceId values (``sarvam-karun``, ``elevenlabs-clyde``,
// etc.) match what ``backend/services/tts_service.py`` recognises in
// its new direct-routing path.

export const CLOUD_VOICES: readonly CloudVoiceOption[] = [
  // ── Sarvam (paid Indic specialist) ─────────────────────────────
  {
    id: makeId('sarvam-manisha'),
    backendVoiceId: 'sarvam-manisha',
    name: 'Meera',
    provider: 'sarvam',
    supportedLanguages: [
      'hi-IN',
      'mr-IN',
      'bn-IN',
      'ta-IN',
      'te-IN',
      'pa-IN',
      'gu-IN',
      'kn-IN',
      'ml-IN',
      'sa-IN',
      'en-IN',
    ],
    description: 'Warm Indic mother — 11 Indian languages',
    gender: 'female',
  },
  {
    id: makeId('sarvam-karun'),
    backendVoiceId: 'sarvam-karun',
    name: 'Rishi',
    provider: 'sarvam',
    supportedLanguages: ['hi-IN', 'sa-IN', 'en-IN', 'mr-IN', 'bn-IN'],
    description: 'Deep Indic male — Sanskrit chant register',
    gender: 'male',
  },

  // ── ElevenLabs (paid English / divine specialist) ──────────────
  {
    id: makeId('elevenlabs-dorothy'),
    backendVoiceId: 'elevenlabs-dorothy',
    name: 'Saraswati',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US', 'hi-IN'],
    description: 'Ethereal goddess — soft British female',
    gender: 'female',
  },
  {
    id: makeId('elevenlabs-clyde'),
    backendVoiceId: 'elevenlabs-clyde',
    name: 'Krishna',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US', 'hi-IN'],
    description: 'Divine storyteller — mature American male',
    gender: 'male',
  },
  {
    id: makeId('elevenlabs-rachel'),
    backendVoiceId: 'elevenlabs-rachel',
    name: 'Nova',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US'],
    description: 'Clear conversational — American female',
    gender: 'female',
  },
  {
    id: makeId('elevenlabs-bella'),
    backendVoiceId: 'elevenlabs-bella',
    name: 'Lily',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US'],
    description: 'Warm bright — soothing American female',
    gender: 'female',
  },
];

/** Return cloud voices that cover ``language`` (exact match or base
 *  language match like ``hi`` matching ``hi-IN``). */
export function listCloudVoicesForLanguage(
  language: string,
): CloudVoiceOption[] {
  const lang = language.toLowerCase();
  const base = lang.split('-')[0];
  return CLOUD_VOICES.filter((v) =>
    v.supportedLanguages.some((sl) => {
      const sLang = sl.toLowerCase();
      return sLang === lang || sLang.startsWith(base);
    }),
  );
}

/** Find a cloud voice by its stored id (with prefix). */
export function findCloudVoice(
  storedId: string | undefined,
): CloudVoiceOption | undefined {
  if (!storedId) return undefined;
  return CLOUD_VOICES.find((v) => v.id === storedId);
}

/** Filter ``CLOUD_VOICES`` to a curated subset by backend voice id —
 *  preserves order, silently drops ids not present in the catalog. */
export function pickCloudVoices(
  ids: readonly string[],
): readonly CloudVoiceOption[] {
  return ids
    .map((id) => CLOUD_VOICES.find((v) => v.backendVoiceId === id))
    .filter((v): v is CloudVoiceOption => Boolean(v));
}

/** Provider badge palette for the picker. */
export const PROVIDER_COLORS: Record<CloudProvider, string> = {
  sarvam: '#22c55e', // green — Indic specialist
  elevenlabs: '#8b5cf6', // purple — premium English
  microsoft: '#0EA5E9', // blue — fallback
  bhashini: '#f97316', // orange — future
};

export const PROVIDER_LABELS: Record<CloudProvider, string> = {
  sarvam: 'Sarvam',
  elevenlabs: 'ElevenLabs',
  microsoft: 'Microsoft',
  bhashini: 'Bhashini',
};
