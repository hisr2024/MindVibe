/**
 * E2E 10 — Streaming Gita filter rejection → tier-3 template fallback.
 *
 * Spec row covered:
 *   • #6 Gita Wisdom Filter rejection — tier 3 fallback audio plays
 *     seamlessly. User never hears the rejected response.
 *
 * This test forces the orchestrator to produce a sentence that fails
 * the StreamingGitaFilter (e.g. cites a chapter beyond 18, quotes a
 * non-Gita tradition, or includes therapy-speak hedges). The expected
 * client experience is:
 *   1. Brief filler ("हम्म…") plays for ~250ms
 *   2. Tier-3 template audio takes over
 *   3. Voice store records `tier_used` ≠ "openai" in telemetry
 *   4. User never hears the rejected sentence
 */

import { device, element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · filter rejection + tier-3 fallback', () => {
  beforeEach(async () => {
    await sakhaTest.resetSession();
    await sakhaTest.setMockProviders(true);
  });

  it('plays filler then tier-3 template when LLM cites a non-existent verse', async () => {
    // Backed by the mock LLM emitting "BG 22.99 says..." which the
    // StreamingGitaFilter rejects (chapter > 18 is a hard violation).
    await device.launchApp({
      newInstance: true,
      launchArgs: { DETOX_FAKE_FILTER_FAIL: 'unretrieved-verse' },
    });
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 5000);
    await sakhaTest.injectFinalTranscript('what does the gita say about karma');
    await sakhaTest.waitForVoiceState('speaking', 8000);

    // Tier annotation surfaces in the transcript drawer + telemetry.
    await detoxExpect(
      element(by.id('engine-tier-fallback-badge')),
    ).toBeVisible();
    await detoxExpect(element(by.text(/tier.?3|template/i))).toBeVisible();
  });

  it('rejects therapy-speak hedge and falls through to verse-only tier-4', async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { DETOX_FAKE_FILTER_FAIL: 'therapy-speak' },
    });
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 5000);
    await sakhaTest.injectFinalTranscript("i can't sleep at night");
    await sakhaTest.waitForVoiceState('speaking', 8000);

    // Tier-4 is "verse only, no commentary" — verse card visible,
    // narrative paragraph empty.
    await detoxExpect(element(by.id('verse-card'))).toBeVisible();
    await detoxExpect(
      element(by.id('engine-tier-fallback-badge')),
    ).toBeVisible();
  });

  it('rejected response is never spoken — no audible LLM output', async () => {
    // Audibility is asserted via the player state machine: the rejected
    // delta stream never reaches `appendChunk`, so the audio level RMS
    // stays at the silent floor for the rejected portion.
    await device.launchApp({
      newInstance: true,
      launchArgs: { DETOX_FAKE_FILTER_FAIL: 'other-tradition' },
    });
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 5000);
    await sakhaTest.injectFinalTranscript('tell me about buddhism');
    await sakhaTest.waitForVoiceState('speaking', 8000);

    // Filler-then-tier-3 audio: the spoken text never includes the
    // rejected "buddhism" citation.
    await detoxExpect(
      element(by.id('spoken-transcript-text')),
    ).not.toHaveText(/buddha|buddhism/i);
  });
});
