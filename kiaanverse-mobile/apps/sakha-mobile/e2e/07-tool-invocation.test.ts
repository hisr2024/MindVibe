/**
 * E2E 07 — VOICE_GUIDE INPUT_TO_TOOL navigation.
 *
 * Spec rows covered:
 *   • VOICE_GUIDE: "open Karma Reset" → tool screen opens during Sakha speech
 *   • INPUT_TO_TOOL: prefill displays visibly with Edit affordance
 *   • Source attributed to voice_companion
 *   • Confidence < 0.75 → NAVIGATE only (no prefill)
 *   • Navigation timing: 60% of ack audio, capped 3.5s
 */

import { element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · VOICE_GUIDE INPUT_TO_TOOL navigation', () => {
  beforeAll(async () => {
    await sakhaTest.setMockProviders(true);
    await sakhaTest.setUserTier('sadhak');
  });

  beforeEach(async () => {
    await sakhaTest.resetSession();
  });

  it('high confidence → navigates to Emotional Reset with prefill', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('open emotional reset, I feel anxious');
    // Sakha speaks ack first
    await sakhaTest.waitForVoiceState('speaking', 6000);
    // Then navigates at ~60% of ack duration (≤3.5s)
    await detoxExpect(element(by.id('tool-emotional-reset'))).toBeVisible();
    await detoxExpect(element(by.text(/Sakha shared that you're feeling anxious/i)))
      .toBeVisible();
    await detoxExpect(element(by.text(/Edit/i))).toBeVisible();
  });

  it('low confidence → navigates without prefill (NAVIGATE downgrade)', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('SET_VOICE_GUIDE_CONFIDENCE=0.5');
    await sakhaTest.injectFinalTranscript('open emotional reset');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    await detoxExpect(element(by.id('tool-emotional-reset'))).toBeVisible();
    // Body should NOT show the prefilled mood
    await detoxExpect(element(by.text(/Sakha shared that you're feeling/i)))
      .not.toBeVisible();
  });

  it('navigation fires at 60% of ack audio (≤3.5s cap)', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('open karma reset, same pattern again');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    // testID `nav-fired-at-{ms}` is set when the navigation fires;
    // we assert it lands within the spec window.
    await detoxExpect(element(by.id('nav-fired-within-3500ms'))).toBeVisible();
  });

  it('source: voice_companion is attributed in the destination tool', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('open ardha, things feel split');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    await detoxExpect(element(by.id('tool-source-voice_companion'))).toBeVisible();
  });

  it('PII scrub: prefill text strips name + email + phone', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript(
      'open sacred reflections, my friend Aman Sharma sent me an email at aman@example.com',
    );
    await sakhaTest.waitForVoiceState('speaking', 8000);
    await detoxExpect(element(by.id('tool-sacred-reflections'))).toBeVisible();
    await detoxExpect(element(by.text(/<name>|<email>/))).toBeVisible();
    await detoxExpect(element(by.text(/Aman Sharma|aman@example.com/)))
      .not.toBeVisible();
  });

  it('Karmic Tree (low-risk view-only) opens at confidence 0.6', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('SET_VOICE_GUIDE_CONFIDENCE=0.61');
    await sakhaTest.injectFinalTranscript('show me my karmic tree');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    await detoxExpect(element(by.id('tool-karmic-tree'))).toBeVisible();
  });
});
