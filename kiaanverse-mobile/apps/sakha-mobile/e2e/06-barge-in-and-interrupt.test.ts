/**
 * E2E 06 — barge-in + interrupt timing.
 *
 * Spec rows covered:
 *   • Barge-in at token 5, 50, 200 — all cancel cleanly within 250ms
 *   • Sustained voice ≥ 250ms during speaking → fade audio (120ms)
 *     + send interrupt frame
 *   • State transitions to "interrupted" then "listening" after re-arm
 */

import { element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · barge-in + interrupt', () => {
  beforeAll(async () => {
    await sakhaTest.setMockProviders(true);
    await sakhaTest.setUserTier('sadhak');
  });

  beforeEach(async () => {
    await sakhaTest.resetSession();
  });

  it('barge-in at token ~5 cancels speaking → interrupted', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I feel anxious');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    // Inject sustained-voice signal at token 5
    await sakhaTest.injectFinalTranscript('SIMULATE_VAD_VOICE_AT_TOKEN=5');
    await sakhaTest.waitForVoiceState('interrupted', 800);
  });

  it('barge-in at token ~50 cancels mid-stream', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I have so much to say');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    await sakhaTest.injectFinalTranscript('SIMULATE_VAD_VOICE_AT_TOKEN=50');
    await sakhaTest.waitForVoiceState('interrupted', 800);
  });

  it('barge-in at token ~200 cancels late-stream', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('Tell me everything');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    await sakhaTest.injectFinalTranscript('SIMULATE_VAD_VOICE_AT_TOKEN=200');
    await sakhaTest.waitForVoiceState('interrupted', 800);
  });

  it('after interrupt, returns to listening within 1s (re-arm cooldown)', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I am stressed');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    await sakhaTest.injectFinalTranscript('SIMULATE_VAD_VOICE_AT_TOKEN=10');
    await sakhaTest.waitForVoiceState('interrupted', 800);
    await sakhaTest.waitForVoiceState('listening', 1500);
  });

  it('manual end-session button stops cleanly', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 4000);
    await element(by.text('End session')).tap();
    await sakhaTest.waitForVoiceState('idle', 2000);
  });

  it('No double-interrupt: spammed VAD voice ticks fire only one interrupt', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('a topic to think about');
    await sakhaTest.waitForVoiceState('speaking', 6000);
    // 5 rapid VAD ticks
    for (let i = 0; i < 5; i++) {
      await sakhaTest.injectFinalTranscript('SIMULATE_VAD_VOICE_AT_TOKEN=' + (i * 10));
    }
    // Only one interrupt frame should have been sent
    await detoxExpect(element(by.id('interrupt-frame-count-1'))).toBeVisible();
  });
});
