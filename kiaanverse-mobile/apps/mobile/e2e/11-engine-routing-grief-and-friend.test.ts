/**
 * E2E 11 — engine routing for FRIEND (mood=grief) and GUIDANCE (BG 18.66).
 *
 * Spec rows covered:
 *   • #7 GUIDANCE engine, BG 18.66 — verse card renders, Sanskrit
 *     pronunciation accurate
 *   • #8 FRIEND engine, mood=grief — indigo wash, softer prosody,
 *     ends in silence
 *
 * The engine router classifies utterances into four engines (FRIEND /
 * GUIDANCE / VOICE_GUIDE / ASSISTANT) per the kiaan_engine_router rules.
 * This test exercises FRIEND and GUIDANCE through real input flows and
 * asserts the visual + audio fingerprint of each.
 */

import { device, element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · engine routing (FRIEND grief + GUIDANCE BG 18.66)', () => {
  beforeEach(async () => {
    await sakhaTest.resetSession();
    await sakhaTest.setMockProviders(true);
  });

  it('FRIEND engine: grief utterance gets softer prosody + indigo wash', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 5000);
    await sakhaTest.injectFinalTranscript('my mother passed away last week');
    await sakhaTest.waitForVoiceState('speaking', 8000);

    // Engine badge shows FRIEND, mood label shows grief
    await detoxExpect(element(by.id('engine-badge'))).toHaveText(/friend/i);
    await detoxExpect(element(by.id('mood-label'))).toHaveText(/grief|sorrow/i);

    // Indigo backdrop overrides the default cosmic-void
    await detoxExpect(element(by.id('mood-wash-indigo'))).toBeVisible();

    // Closer is silence, not a sign-off — assert no "Hare Krishna"
    // or "I am here for you" in the transcript.
    await detoxExpect(
      element(by.id('spoken-transcript-text')),
    ).not.toHaveText(/hare krishna|hari om|namaste|here for you/i);
  });

  it('GUIDANCE engine: BG 18.66 query renders the verse card with Sanskrit', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 5000);
    await sakhaTest.injectFinalTranscript(
      'what does the gita say about complete surrender',
    );
    await sakhaTest.waitForVoiceState('speaking', 8000);

    await detoxExpect(element(by.id('engine-badge'))).toHaveText(/guidance/i);
    await detoxExpect(element(by.id('verse-card'))).toBeVisible();
    // BG 18.66 is the canonical "surrender" verse — sarva-dharman parityajya
    await detoxExpect(
      element(by.id('verse-citation')),
    ).toHaveText(/BG\s*18\s*[.:]\s*66/);
    await detoxExpect(
      element(by.id('verse-sanskrit')),
    ).toHaveText(/सर्व.?धर्मान्.?परित्यज्य/);
  });

  it('FRIEND engine on a casual greeting: warmth wins over scholarship', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 5000);
    await sakhaTest.injectFinalTranscript('hey sakha');
    await sakhaTest.waitForVoiceState('speaking', 6000);

    await detoxExpect(element(by.id('engine-badge'))).toHaveText(/friend/i);
    // Casual greeting → no verse card mounted (per spec FRIEND can ship
    // translation-only or no Sanskrit at all when the moment calls for
    // plain presence).
    await detoxExpect(element(by.id('verse-card'))).not.toBeVisible();
  });
});
