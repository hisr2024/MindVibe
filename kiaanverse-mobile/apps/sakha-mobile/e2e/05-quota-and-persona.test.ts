/**
 * E2E 05 — quota gating + persona-version preflight.
 *
 * Spec rows covered:
 *   • Free tier voice attempt: pre-rendered upgrade message, no recording
 *   • Bhakta hits 30-min quota mid-session: gentle close, no mid-utterance cut
 *   • Persona-version mismatch: PERSONA_VERSION_MISMATCH error before any audio
 *   • VoiceQuotaSheet has NO countdown timers (per spec)
 */

import { element, by, expect as detoxExpect } from 'detox';

declare const sakhaTest: import('./init').SakhaTestHelpers extends Record<string, unknown>
  ? import('./init').SakhaTestHelpers
  : never;

describe('Sakha · quota gating + persona-version', () => {
  beforeAll(async () => {
    await sakhaTest.setMockProviders(true);
  });

  it('free tier: tap-to-begin shows VoiceQuotaSheet, no recording starts', async () => {
    await sakhaTest.setUserTier('free');
    await sakhaTest.resetSession();
    await element(by.text('Tap to begin')).tap();
    await detoxExpect(element(by.id('quota-sheet'))).toBeVisible();
    await detoxExpect(element(by.text('Walk further'))).toBeVisible();
    // No countdown timers per spec — assert no time-formatted text
    await detoxExpect(element(by.text(/\d+:\d{2}/))).not.toBeVisible();
  });

  it('quota sheet shows full tier matrix with current "you" badge', async () => {
    await sakhaTest.setUserTier('free');
    await sakhaTest.resetSession();
    await element(by.text('Tap to begin')).tap();
    await detoxExpect(element(by.text('Free'))).toBeVisible();
    await detoxExpect(element(by.text('Bhakta'))).toBeVisible();
    await detoxExpect(element(by.text('Sadhak'))).toBeVisible();
    await detoxExpect(element(by.text('Siddha'))).toBeVisible();
    await detoxExpect(element(by.id('tier-current-free'))).toBeVisible();
  });

  it('bhakta tier under cap: WSS opens normally', async () => {
    await sakhaTest.setUserTier('bhakta');
    await sakhaTest.resetSession();
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 4000);
  });

  it('bhakta tier exhausted: shows quota sheet on next attempt', async () => {
    await sakhaTest.setUserTier('bhakta');
    await sakhaTest.resetSession();
    // Simulate 30+ minutes already used today via dev backdoor
    await sakhaTest.injectFinalTranscript('SET_BHAKTA_USED_MINUTES=30');
    await element(by.text('Tap to begin')).tap();
    await detoxExpect(element(by.id('quota-sheet'))).toBeVisible();
    await detoxExpect(
      element(by.text(/quota reached|We have reached the rest/i)),
    ).toBeVisible();
  });

  it('persona-version mismatch surfaces onboarding panel, no WSS', async () => {
    await sakhaTest.setUserTier('sadhak');
    await sakhaTest.injectFinalTranscript('SET_SERVER_PERSONA_VERSION=9.9.9');
    await sakhaTest.resetSession();
    await element(by.text('Tap to begin')).tap();
    await detoxExpect(element(by.id('persona-mismatch-panel'))).toBeVisible();
    // Voice state must NOT advance to listening
    await detoxExpect(element(by.id('voice-state-listening'))).not.toBeVisible();
  });

  it('mid-session quota cutoff is gentle (current turn completes)', async () => {
    await sakhaTest.setUserTier('bhakta');
    await sakhaTest.resetSession();
    // 29 min used — one more turn allowed
    await sakhaTest.injectFinalTranscript('SET_BHAKTA_USED_MINUTES=29');
    await element(by.text('Tap to begin')).tap();
    await sakhaTest.waitForVoiceState('listening', 4000);
    await sakhaTest.injectFinalTranscript('I am stressed');
    // Current turn must finish (no mid-utterance cut per spec)
    await sakhaTest.waitForVoiceState('listening', 12000);
    // Next attempt: now over cap, should show quota sheet
    await sakhaTest.injectFinalTranscript('I want to talk again');
    await detoxExpect(element(by.id('quota-sheet'))).toBeVisible();
  });
});
