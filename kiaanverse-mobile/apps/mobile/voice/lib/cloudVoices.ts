/**
 * cloudVoices — fresh 6-voice catalog (rebuild, generation 3).
 *
 * Per founder directive: the previous 6 voices (Saraswati/Krishna/
 * Rishi/Meera/Nova/Lily) were "not properly functioning". This
 * commit deletes them and builds 6 entirely new voices from
 * speakers we haven't used before. Each voice is still bound to an
 * EXPLICIT (provider, speaker) tuple — the direct-routing contract
 * from PR #1730 is preserved.
 *
 * Provider priority (canonical chain):
 *   Tier 1 — Sarvam AI       (paid primary)
 *   Tier 2 — ElevenLabs      (paid fallback)
 *   Tier 3 — Microsoft Neural via Edge TTS (free fallback)
 *   Tier 4 — Bhashini AI     (future — pending approval)
 *
 * 6 fresh voices, balanced across providers + gender:
 *   • Anushka  → Sarvam Anushka     (expressive multilingual female)
 *   • Abhilash → Sarvam Abhilash    (scholarly Indic male)
 *   • Adam     → ElevenLabs Adam    (deep authoritative American male)
 *   • Sarah    → ElevenLabs Sarah   (warm nurturing American female)
 *   • Aria     → ElevenLabs Aria    (European multilingual female)
 *   • Charlotte → ElevenLabs Charlotte (Scandinavian serene female)
 *
 * Tempo (playback speed) is user-controllable via a slider on the
 * Voice Companion screen; the chosen tempo is passed as ``speed``
 * to the backend's SynthesizeRequest.
 */

export const CLOUD_VOICE_PREFIX = 'cloud:';

export type CloudProvider =
  | 'sarvam'
  | 'elevenlabs'
  | 'microsoft'
  | 'bhashini';

export interface CloudVoiceOption {
  /** Stored identifier with the ``cloud:`` prefix. */
  readonly id: string;
  /** Backend-recognized voice_id sent over the wire. Format:
   *  ``<provider>-<speaker>``, e.g. ``sarvam-anushka``. The backend
   *  splits on the first ``-`` to extract (provider, speaker) and
   *  routes directly — no persona lookup. */
  readonly backendVoiceId: string;
  /** Display name in the picker chip. */
  readonly name: string;
  /** Provider badge — colour-coded. */
  readonly provider: CloudProvider;
  /** Languages this voice handles natively (BCP-47 tags). */
  readonly supportedLanguages: readonly string[];
  /** Persona description shown below the picker. */
  readonly description: string;
  /** Gender hint for the picker accessibility label. */
  readonly gender: 'female' | 'male';
}

function makeId(backendId: string): string {
  return `${CLOUD_VOICE_PREFIX}${backendId}`;
}

export function parseCloudVoiceId(stored: string): string | null {
  if (!stored.startsWith(CLOUD_VOICE_PREFIX)) return null;
  return stored.slice(CLOUD_VOICE_PREFIX.length);
}

export function isCloudVoiceId(stored: string | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(CLOUD_VOICE_PREFIX);
}

// ── FRESH 6-VOICE CATALOG (generation 3) ─────────────────────────────
//
// Six speakers we have NEVER used before, each bound directly to its
// provider's API speaker name. No KIAAN persona indirection, no
// shared defaults, no collisions possible.

export const CLOUD_VOICES: readonly CloudVoiceOption[] = [
  // ── Sarvam Bulbul (paid Indic specialist) ──────────────────────
  {
    id: makeId('sarvam-anushka'),
    backendVoiceId: 'sarvam-anushka',
    name: 'Anushka',
    provider: 'sarvam',
    supportedLanguages: [
      'hi-IN',
      'mr-IN',
      'bn-IN',
      'ta-IN',
      'te-IN',
      'pa-IN',
      'gu-IN',
      'en-IN',
    ],
    description: 'Expressive multilingual Indic — warm storyteller',
    gender: 'female',
  },
  {
    id: makeId('sarvam-abhilash'),
    backendVoiceId: 'sarvam-abhilash',
    name: 'Abhilash',
    provider: 'sarvam',
    supportedLanguages: ['hi-IN', 'sa-IN', 'en-IN', 'mr-IN', 'bn-IN', 'ta-IN'],
    description: 'Scholarly Indic male — Sanskrit authority',
    gender: 'male',
  },

  // ── ElevenLabs (paid English / European premium) ──────────────
  {
    id: makeId('elevenlabs-adam'),
    backendVoiceId: 'elevenlabs-adam',
    name: 'Adam',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US'],
    description: 'Deep authoritative American — sage register',
    gender: 'male',
  },
  {
    id: makeId('elevenlabs-sarah'),
    backendVoiceId: 'elevenlabs-sarah',
    name: 'Sarah',
    provider: 'elevenlabs',
    supportedLanguages: ['en-IN', 'en-US'],
    description: 'Warm nurturing American — daily companion',
    gender: 'female',
  },
  {
    id: makeId('elevenlabs-aria'),
    backendVoiceId: 'elevenlabs-aria',
    name: 'Aria',
    provider: 'elevenlabs',
    supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'],
    description: 'European multilingual female — clear + serene',
    gender: 'female',
  },
  {
    id: makeId('elevenlabs-charlotte'),
    backendVoiceId: 'elevenlabs-charlotte',
    name: 'Charlotte',
    provider: 'elevenlabs',
    supportedLanguages: ['en-US', 'sv-SE', 'da-DK', 'no-NO'],
    description: 'Scandinavian serene — meditative female',
    gender: 'female',
  },
];

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

export function findCloudVoice(
  storedId: string | undefined,
): CloudVoiceOption | undefined {
  if (!storedId) return undefined;
  return CLOUD_VOICES.find((v) => v.id === storedId);
}

export function pickCloudVoices(
  ids: readonly string[],
): readonly CloudVoiceOption[] {
  return ids
    .map((id) => CLOUD_VOICES.find((v) => v.backendVoiceId === id))
    .filter((v): v is CloudVoiceOption => Boolean(v));
}

export const PROVIDER_COLORS: Record<CloudProvider, string> = {
  sarvam: '#22c55e',
  elevenlabs: '#8b5cf6',
  microsoft: '#0EA5E9',
  bhashini: '#f97316',
};

export const PROVIDER_LABELS: Record<CloudProvider, string> = {
  sarvam: 'Sarvam',
  elevenlabs: 'ElevenLabs',
  microsoft: 'Microsoft',
  bhashini: 'Bhashini',
};
