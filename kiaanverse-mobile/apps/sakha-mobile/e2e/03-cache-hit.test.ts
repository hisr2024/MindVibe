/**
 * E2E 03 — cache hit (≤500ms first byte per spec).
 *
 * Spec rows covered:
 *   • Cache hit (repeated mood + verse): first audio byte ≤ 500ms
 *   • No text.delta frames on cache hit (LLM bypassed)
 */

import { element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · cache hit', () => {
  beforeAll(async () => {
    await sakhaTest.setMockProviders(true);
    await sakhaTest.setUserTier('sadhak');
  });

  it('warms cache then second turn fires from cache (<500ms first byte)', async () => {
    // First turn populates cache
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I feel anxious tonight');
    await sakhaTest.waitForVoiceState('listening', 12000);

    // Second turn with identical mood + verse → cache hit
    await sakhaTest.injectFinalTranscript('I feel anxious tonight');
    await sakhaTest.waitForVoiceState('speaking', 1500);

    // The done frame's cache_hit flag is exposed via testID
    await detoxExpect(element(by.id('done-cache-hit-true'))).toBeVisible();
  });

  it('cache hit on repeated mood — first_audio_byte_ms ≤ 500', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I am stressed at work today');
    await sakhaTest.waitForVoiceState('listening', 12000);

    await sakhaTest.injectFinalTranscript('I am stressed at work today');
    await sakhaTest.waitForVoiceState('speaking', 1500);

    // first_audio_byte_ms is exposed for assertion via testID-pattern.
    // The pattern is "first-byte-ms-{N}" where N is the rounded ms.
    // Detox can scan visible elements for this pattern; we assert the
    // value is below 500 by checking the bucket testID.
    await detoxExpect(element(by.id('first-byte-ms-under-500'))).toBeVisible();
  });

  it('cache hit emits NO text.delta frames (LLM skipped)', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I feel sad');
    await sakhaTest.waitForVoiceState('listening', 12000);

    // Second identical turn
    await sakhaTest.injectFinalTranscript('I feel sad');
    await sakhaTest.waitForVoiceState('speaking', 1500);

    // The transcript overlay would show no responseText accumulation
    // on a pure-cache-hit turn. Open the overlay and verify.
    await element(by.text('Sakha said')).tap();
    await detoxExpect(element(by.id('response-text-empty'))).toBeVisible();
  });
});
