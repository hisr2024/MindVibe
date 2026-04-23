/**
 * Sacred Reflection encryption — unit tests.
 *
 * The real cipher runs inside `expo-crypto` + `expo-secure-store` which are
 * mocked by jest-expo; we therefore focus on the pure helpers (ISO-week
 * key, time-of-day bucketing, assessment persistence) plus the legacy
 * fallback path of `encryptReflection` / `decryptReflection` which does
 * not need SubtleCrypto.
 *
 * The fallback path is exactly what runs on older Hermes builds, so
 * validating its round-trip gives us a real safety net for low-spec
 * Android devices.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  decryptReflection,
  encryptReflection,
  getIsoWeekKey,
  getWritingTimeOfDay,
  loadAssessmentStore,
  saveAssessmentAnswers,
} from '../utils/sacredReflectionEncryption';

// Force the legacy base64 fallback branch for the round-trip test by
// ensuring SubtleCrypto looks absent. Jest-expo does not provide it.
const originalCrypto = globalThis.crypto;
beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: undefined,
    configurable: true,
  });
});
afterAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: originalCrypto,
    configurable: true,
  });
});

describe('encryptReflection / decryptReflection (legacy base64 fallback)', () => {
  it('round-trips an ASCII reflection', async () => {
    const plaintext = 'The mind is restless today, but the witness is steady.';
    const cipher = await encryptReflection(plaintext);
    expect(cipher).toContain(':'); // sentinel of legacy path
    const decoded = await decryptReflection(cipher);
    expect(decoded).toBe(plaintext);
  });

  it('round-trips a multilingual reflection', async () => {
    const plaintext = 'शान्ति · peace · 평화';
    const cipher = await encryptReflection(plaintext);
    const decoded = await decryptReflection(cipher);
    expect(decoded).toBe(plaintext);
  });

  it('returns empty string for malformed ciphertext without throwing', async () => {
    const decoded = await decryptReflection('not-a-real-cipher');
    expect(decoded).toBe('');
  });
});

describe('getWritingTimeOfDay', () => {
  it.each([
    [4, 'brahma'],
    [7, 'pratah'],
    [13, 'madhyanha'],
    [18, 'sandhya'],
    [23, 'ratri'],
    [1, 'ratri'],
  ])('hour %i → %s', (hour, expected) => {
    expect(getWritingTimeOfDay(hour)).toBe(expected);
  });
});

describe('getIsoWeekKey', () => {
  it('returns deterministic ISO-week identifiers', () => {
    // 2026-04-23 (Thursday) is ISO 2026-W17
    expect(getIsoWeekKey(new Date('2026-04-23T12:00:00Z'))).toBe('2026-W17');
    // New Year's Eve roll-over: 2025-12-29 (Monday) is ISO 2026-W01
    expect(getIsoWeekKey(new Date('2025-12-29T12:00:00Z'))).toBe('2026-W01');
  });
});

describe('saveAssessmentAnswers / loadAssessmentStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists and reads a weekly assessment round-trip', async () => {
    await saveAssessmentAnswers('2026-W17', {
      dharmic_challenge: 'Anger',
      gita_teaching: 'BG 2.62',
      consistency_score: 4,
      pattern_noticed: 'Evening overwhelm.',
      sankalpa_for_next_week: 'Breathe before replying.',
    });
    const store = await loadAssessmentStore();
    expect(store['2026-W17']).toMatchObject({
      dharmic_challenge: 'Anger',
      consistency_score: 4,
    });
    expect(typeof store['2026-W17'].saved_at).toBe('string');
  });

  it('returns empty object when nothing is stored', async () => {
    const store = await loadAssessmentStore();
    expect(store).toEqual({});
  });
});
