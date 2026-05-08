/**
 * cloudVoices — curated catalog of cloud TTS voices, taking inspiration
 * from Bhashini AI, Sarvam AI, and ElevenLabs AI.
 *
 * Each entry maps a user-friendly voice option to the backend
 * ``voice_id`` that ``POST /api/voice/synthesize`` understands. The
 * backend's tts_router routes by voice_id prefix:
 *
 *   • ``elevenlabs-*``  → ElevenLabs (most natural English; expressive,
 *                         studio-grade; supports Hindi / Sanskrit
 *                         pronunciation via Devanagari rendering through
 *                         Eleven Multilingual v2)
 *   • ``sarvam-*``      → Sarvam Bulbul (Indian-accented English +
 *                         11 Indic languages; the most natural Hindi
 *                         and accent-aware English you can get today)
 *   • ``bhashini-*``    → Bhashini (Government of India Indic neural
 *                         voices; sovereign, free, optimized for
 *                         Marathi / Tamil / Bengali / Sanskrit)
 *   • ``divine-*``      → Curated KIAAN persona voices wired in
 *                         tts_service.py (route to the best provider
 *                         per language internally)
 *
 * Why a curated catalog vs. exhaustive lists?
 * ------------------------------------------
 * Each provider exposes hundreds of voices. The user wants
 * "super natural and divine, soothing and calm" — not a wall of
 * choices. So we curate ~10 voices that fit the Sakha persona
 * (warm, grounded, female-leaning, multilingual-capable) and
 * label each clearly with its strengths.
 *
 * The persisted user override stores the cloud voice id with a
 * ``cloud:<id>`` prefix so ``divineVoice.getDivineVoiceSync()``
 * can route between cloud and on-device by checking the prefix.
 */

/** Stable identifier prefix for cloud voices — used by the routing
 *  logic in ``divineVoice.ts`` / ``unifiedSpeak.ts`` to decide whether
 *  to call ``Speech.speak`` (on-device) or ``cloudTTS.speak`` (HTTP). */
export const CLOUD_VOICE_PREFIX = 'cloud:';

export type CloudProvider = 'elevenlabs' | 'sarvam' | 'bhashini' | 'kiaan';

export interface CloudVoiceOption {
  /** Human-readable identifier with the cloud: prefix.
   *  Stored in AsyncStorage when the user picks this voice. */
  readonly id: string;
  /** Backend voice_id passed to /api/voice/synthesize. */
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

/**
 * Build a cloud voice id by combining the prefix + backend id. Used
 * when the picker writes the user's pick to AsyncStorage so the rest
 * of the app can detect it.
 */
function makeId(backendId: string): string {
  return `${CLOUD_VOICE_PREFIX}${backendId}`;
}

/**
 * Strip the ``cloud:`` prefix from a stored override to recover the
 * backend voice_id. Returns null when the id is not a cloud voice.
 */
export function parseCloudVoiceId(stored: string): string | null {
  if (!stored.startsWith(CLOUD_VOICE_PREFIX)) return null;
  return stored.slice(CLOUD_VOICE_PREFIX.length);
}

export function isCloudVoiceId(stored: string | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(CLOUD_VOICE_PREFIX);
}

// ── CURATED CATALOG ──────────────────────────────────────────────────
// Voices ordered by (a) language coverage, (b) naturalness for Sakha's
// register, (c) provider variety so the picker shows all three brands.
//
// The exact backendVoiceId values must match what tts_service.py +
// tts_router.py recognise. The current backend accepts the IDs below
// (per /api/voice/synthesize SynthesizeRequest docs).
export const CLOUD_VOICES: readonly CloudVoiceOption[] = [
  // ── ElevenLabs — divine, near-human English ──────────────────────
  {
    id: makeId('elevenlabs-nova'),
    backendVoiceId: 'elevenlabs-nova',
    name: 'Nova',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US', 'hi-IN', 'sa-IN'],
    description: 'Soft, soothing, divine — the closest to a human friend.',
    gender: 'female',
  },
  {
    id: makeId('elevenlabs-lily'),
    backendVoiceId: 'elevenlabs-lily',
    name: 'Lily',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US'],
    description: 'Warm, calm, grounded English. Best for chat Listen.',
    gender: 'female',
  },
  {
    id: makeId('elevenlabs-bella'),
    backendVoiceId: 'elevenlabs-bella',
    name: 'Bella',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US'],
    description: 'Bright, expressive, hopeful. Best for affirmations.',
    gender: 'female',
  },
  {
    id: makeId('elevenlabs-adam'),
    backendVoiceId: 'elevenlabs-adam',
    name: 'Adam',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US'],
    description: 'Steady, grave, masculine — Krishna-as-friend register.',
    gender: 'male',
  },

  // ── Sarvam Bulbul — most natural Indic ───────────────────────────
  {
    id: makeId('sarvam-meera'),
    backendVoiceId: 'sarvam-meera',
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
    ],
    description: 'Multilingual Indic — Hindi, Marathi, Tamil, Bengali, more.',
    gender: 'female',
  },
  {
    id: makeId('sarvam-anushka'),
    backendVoiceId: 'sarvam-anushka',
    name: 'Anushka',
    provider: 'sarvam',
    supportedLanguages: ['hi-IN', 'en-IN'],
    description: 'Indian-accented English + Hindi. Code-mixed friendly.',
    gender: 'female',
  },
  {
    id: makeId('sarvam-rishi'),
    backendVoiceId: 'sarvam-rishi',
    name: 'Rishi',
    provider: 'sarvam',
    supportedLanguages: ['hi-IN', 'sa-IN', 'en-IN'],
    description: 'Indian male voice — Sanskrit chant register.',
    gender: 'male',
  },

  // ── Bhashini — sovereign Indic neural ────────────────────────────
  {
    id: makeId('bhashini-female-indic'),
    backendVoiceId: 'bhashini-female-indic',
    name: 'Bhashini Devi',
    provider: 'bhashini',
    supportedLanguages: ['hi-IN', 'mr-IN', 'bn-IN', 'ta-IN', 'sa-IN'],
    description: 'Government of India sovereign Indic neural — free, fast.',
    gender: 'female',
  },
  {
    id: makeId('bhashini-male-indic'),
    backendVoiceId: 'bhashini-male-indic',
    name: 'Bhashini Acharya',
    provider: 'bhashini',
    supportedLanguages: ['hi-IN', 'sa-IN'],
    description: 'Sovereign Indic male — measured, grave, ritualistic.',
    gender: 'male',
  },

  // ── Curated KIAAN personas (route via tts_service internally) ────
  {
    id: makeId('divine-saraswati'),
    backendVoiceId: 'divine-saraswati',
    name: 'Saraswati',
    provider: 'kiaan',
    supportedLanguages: ['en-IN', 'hi-IN', 'sa-IN'],
    description: 'KIAAN curated divine female — Sarvam + ElevenLabs blend.',
    gender: 'female',
  },
  {
    id: makeId('divine-krishna'),
    backendVoiceId: 'divine-krishna',
    name: 'Krishna',
    provider: 'kiaan',
    supportedLanguages: ['en-IN', 'hi-IN', 'sa-IN'],
    description: 'KIAAN curated divine male — friend-of-the-soul register.',
    gender: 'male',
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

/** Find a cloud voice by its stored id (with prefix). Returns
 *  undefined when not a known voice. */
export function findCloudVoice(
  storedId: string | undefined,
): CloudVoiceOption | undefined {
  if (!storedId) return undefined;
  return CLOUD_VOICES.find((v) => v.id === storedId);
}

/** Provider badge palette for the picker. */
export const PROVIDER_COLORS: Record<CloudProvider, string> = {
  elevenlabs: '#8b5cf6', // purple — premium expressive
  sarvam: '#22c55e', // green — Indic-first
  bhashini: '#f97316', // orange — sovereign
  kiaan: '#FFD700', // gold — KIAAN curated
};

export const PROVIDER_LABELS: Record<CloudProvider, string> = {
  elevenlabs: 'ElevenLabs',
  sarvam: 'Sarvam',
  bhashini: 'Bhashini',
  kiaan: 'KIAAN',
};
