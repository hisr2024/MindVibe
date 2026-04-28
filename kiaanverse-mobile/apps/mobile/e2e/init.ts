/**
 * Detox per-test bootstrap.
 *
 * Provides shared helpers the 9 spec files use:
 *   • beforeAll / afterAll hooks that grant the RECORD_AUDIO
 *     permission via adb so the onboarding mic prompt doesn't block
 *     every run
 *   • setMockProvider() to flip the app between dev (real backend)
 *     and mock-everything mode for cache-hit + crisis tests
 *   • waitForVoiceState / fakeAudioBuffer / pumpInterrupt helpers
 *     so the spec files stay declarative
 */

import { device } from 'detox';

declare global {
  // eslint-disable-next-line no-var
  var sakhaTest: SakhaTestHelpers;
}

interface SakhaTestHelpers {
  grantMicPermission: () => Promise<void>;
  setMockProviders: (enabled: boolean) => Promise<void>;
  setUserTier: (tier: 'free' | 'bhakta' | 'sadhak' | 'siddha') => Promise<void>;
  setLanguage: (lang: 'en' | 'hi' | 'mr' | 'bn' | 'ta') => Promise<void>;
  setRegion: (region: 'US' | 'IN' | 'UK' | 'GLOBAL') => Promise<void>;
  /** Force a specific transcript on the next end_of_speech — used by
   *  crisis + filter-fail probes. Reads via process.env.DETOX_FAKE_FINAL_TRANSCRIPT
   *  on the app side (the dev / mock builds honor it). */
  injectFinalTranscript: (transcript: string) => Promise<void>;
  /** Wait for the voice store's state field to match — the canvas
   *  exposes its current state via testID="voice-state-{name}" so
   *  matchers can poll for it. */
  waitForVoiceState: (
    state:
      | 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted'
      | 'offline' | 'error' | 'crisis',
    timeoutMs?: number,
  ) => Promise<void>;
  resetSession: () => Promise<void>;
}

beforeAll(async () => {
  await device.launchApp({
    permissions: { microphone: 'YES' },
    newInstance: true,
    launchArgs: {
      detoxEnableSynchronization: 1,
      KIAAN_VOICE_MOCK_PROVIDERS: '1',
      KIAAN_PROMPT_LOADER_TEST: '1',
    },
  });
});

afterAll(async () => {
  await device.terminateApp();
});

const helpers: SakhaTestHelpers = {
  async grantMicPermission() {
    await device.launchApp({
      permissions: { microphone: 'YES' },
      newInstance: false,
    });
  },
  async setMockProviders(enabled) {
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'detox.sakha.config',
      body: JSON.stringify({ mock: enabled }),
    });
  },
  async setUserTier(tier) {
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'detox.sakha.tier',
      body: tier,
    });
  },
  async setLanguage(lang) {
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'detox.sakha.lang',
      body: lang,
    });
  },
  async setRegion(region) {
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'detox.sakha.region',
      body: region,
    });
  },
  async injectFinalTranscript(transcript) {
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'detox.sakha.fake_final',
      body: transcript,
    });
  },
  async waitForVoiceState(state, timeoutMs = 8_000) {
    const { waitFor, by, element } = await import('detox');
    await waitFor(element(by.id(`voice-state-${state}`)))
      .toBeVisible()
      .withTimeout(timeoutMs);
  },
  async resetSession() {
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title: 'detox.sakha.reset',
      body: 'true',
    });
  },
};

(globalThis as { sakhaTest?: SakhaTestHelpers }).sakhaTest = helpers;

export {};
