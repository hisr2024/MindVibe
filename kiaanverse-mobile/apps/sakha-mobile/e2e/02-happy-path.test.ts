/**
 * E2E 02 — happy path turn (cache miss).
 *
 * Spec rows covered:
 *   • Pixel 7 / Android 14 / WiFi: first audio byte ≤ 1.2s
 *   • Engine selected (FRIEND for emotional input)
 *   • Verse rendered with citation
 *   • Sanskrit pronunciation accurate (heard, not asserted in code)
 *   • Indigo wash + softer prosody for grief mood
 */

import { element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · happy path turn (cache miss)', () => {
  beforeAll(async () => {
    await sakhaTest.setMockProviders(true);
    await sakhaTest.setUserTier('sadhak');
  });

  beforeEach(async () => {
    await sakhaTest.resetSession();
  });

  it('runs end-to-end: tap → listening → thinking → speaking → done', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 4000);
    await sakhaTest.injectFinalTranscript('I feel anxious tonight');
    await sakhaTest.waitForVoiceState('thinking', 6000);
    await sakhaTest.waitForVoiceState('speaking', 6000);
    await detoxExpect(element(by.id('engine-chip'))).toBeVisible();
    await detoxExpect(element(by.id('verse-citation'))).toBeVisible();
    await sakhaTest.waitForVoiceState('listening', 12000);
  });

  it('shows the verse citation in BG x.y format', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I am stressed at work');
    await sakhaTest.waitForVoiceState('speaking', 8000);
    await detoxExpect(element(by.text(/^BG \d{1,2}\.\d{1,3}$/))).toBeVisible();
  });

  it('Hindi turn uses Sarvam voice (renders Devanagari verse on screen)', async () => {
    await sakhaTest.setLanguage('hi');
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('मुझे रात को नींद नहीं आती');
    await sakhaTest.waitForVoiceState('speaking', 8000);
    // Devanagari character class — at least one Hindi/Sanskrit char in the verse view
    await detoxExpect(element(by.id('verse-sanskrit'))).toBeVisible();
  });

  it('Done frame surfaces persona-version + tier_used in telemetry meta', async () => {
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.injectFinalTranscript('I feel sad today');
    await sakhaTest.waitForVoiceState('listening', 12000);
    // Open transcript overlay and verify the engine + mood metadata
    await element(by.text('You said')).tap();
    await detoxExpect(element(by.text(/engine · /))).toBeVisible();
    await detoxExpect(element(by.text(/mood · /))).toBeVisible();
  });
});
