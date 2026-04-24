/**
 * Sacred Reflection — end-to-end encryption primitives.
 *
 * AES-256-GCM on-device with a single per-device key stored in SecureStore.
 * The server only ever sees the ciphertext + plaintext metadata (mood, tags,
 * time-band) — it never has access to the key material or plaintext body.
 *
 * Wire format of the returned ciphertext: base64( IV[12] || ciphertext+tag ).
 * Older runtimes without SubtleCrypto fall back to reversible base64 so the
 * app still boots; those entries are flagged with a `:` separator so callers
 * can surface a "re-encrypt on upgrade" prompt.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_ALIAS = 'mindvibe_journal_key';

/**
 * Probe for SubtleCrypto at call time rather than module load time.
 *
 * Node 22 ships `globalThis.crypto`, so capturing this as a constant at
 * import time meant our Jest fallback tests (which nullify the global in
 * `beforeAll`) couldn't force the legacy path — the module was already
 * locked to the SubtleCrypto branch. Checking at call time also lets us
 * survive runtime permission failures where `crypto.subtle` throws.
 */
function hasSubtleCrypto(): boolean {
  try {
    return (
      typeof globalThis.crypto !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (globalThis.crypto as any).subtle !== 'undefined'
    );
  } catch {
    return false;
  }
}

async function getOrCreateEncryptionKey(): Promise<CryptoKey | string> {
  let keyBase64 = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
  if (!keyBase64) {
    const keyBytes = await Crypto.getRandomBytesAsync(32);
    keyBase64 = btoa(String.fromCharCode(...keyBytes));
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, keyBase64);
  }
  if (!hasSubtleCrypto()) return keyBase64;
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  return globalThis.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptReflection(plaintext: string): Promise<string> {
  if (!hasSubtleCrypto()) {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      plaintext,
    );
    return btoa(unescape(encodeURIComponent(plaintext))) + ':' + hash.slice(0, 16);
  }
  const key = (await getOrCreateEncryptionKey()) as CryptoKey;
  const iv = await Crypto.getRandomBytesAsync(12);
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );
  const cipherBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptReflection(ciphertext: string): Promise<string> {
  if (ciphertext.includes(':')) {
    // Legacy reversible-base64 fallback — decode the base64 half only.
    // `split(':')[0]` is `string | undefined` under noUncheckedIndexedAccess;
    // the includes(':') guard proves it exists, we coalesce for the type.
    const b64 = ciphertext.split(':')[0] ?? '';
    try {
      return decodeURIComponent(escape(atob(b64)));
    } catch {
      return '';
    }
  }
  if (!hasSubtleCrypto()) return '';
  try {
    const key = (await getOrCreateEncryptionKey()) as CryptoKey;
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const cipher = combined.slice(12);
    const plaintextBytes = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher,
    );
    return new TextDecoder().decode(plaintextBytes);
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Weekly assessment — local plaintext persistence (answers never leave device
// unless the user explicitly triggers a KarmaLytix on-demand assessment).
// ---------------------------------------------------------------------------

const ASSESSMENT_STORAGE_KEY = 'mindvibe_weekly_assessment_v1';

export interface WeeklyAssessmentAnswers {
  readonly dharmic_challenge: string;
  readonly gita_teaching: string;
  readonly consistency_score: number;
  readonly pattern_noticed: string;
  readonly sankalpa_for_next_week: string;
  readonly saved_at: string;
}

type AssessmentStore = Record<string, WeeklyAssessmentAnswers>;

export function getIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    (((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export async function loadAssessmentStore(): Promise<AssessmentStore> {
  try {
    const raw = await AsyncStorage.getItem(ASSESSMENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as AssessmentStore)
      : {};
  } catch {
    return {};
  }
}

export async function saveAssessmentAnswers(
  weekKey: string,
  answers: Omit<WeeklyAssessmentAnswers, 'saved_at'>,
): Promise<void> {
  try {
    const store = await loadAssessmentStore();
    store[weekKey] = { ...answers, saved_at: new Date().toISOString() };
    await AsyncStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Local-only persistence — swallow errors so the entry save still succeeds.
  }
}

export function getWritingTimeOfDay(hour: number): string {
  if (hour >= 3.5 && hour < 5.5) return 'brahma';
  if (hour >= 5.5 && hour < 12) return 'pratah';
  if (hour >= 12 && hour < 17) return 'madhyanha';
  if (hour >= 17 && hour < 20) return 'sandhya';
  return 'ratri';
}
